// Locator helpers for RQ3 repair: candidate extraction + semantic equivalence.
//
// Two problems this solves:
//  1. Blind-generation: instead of asking the LLM to invent a locator string, we
//     extract the legal candidate locators from the V_new application source and
//     let it pick (a rerank task, far easier than free generation).
//  2. Exact-match false negatives: `getByTestId('x')` and `[data-testid="x"]` are
//     the same locator, but string equality says otherwise. We canonicalise both
//     to `kind:value` and compare those.

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

// ---- locator -> canonical {kind, value} ----
// Handles Playwright (getByTestId/getByText/getByRole/getByLabel/getByPlaceholder,
// locator('css')) and Cypress (cy.get('css'), cy.contains('text')).
export function canonicalLocator(s) {
  const t = norm(s).replace(/^['"`]|['"`]$/g, '');
  let m;
  // getByTestId('x') / getByTestId("x")
  if ((m = t.match(/getByTestId\(\s*['"`]([^'"`]+)['"`]/))) return { kind: 'testid', value: m[1] };
  if ((m = t.match(/getByText\(\s*['"`]([^'"`]+)['"`]/))) return { kind: 'text', value: m[1] };
  if ((m = t.match(/getByRole\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*\{\s*name:\s*['"`]([^'"`]+)['"`])?/)))
    return { kind: 'role', value: m[2] ? `${m[1]}:${m[2]}` : m[1] };
  if ((m = t.match(/getByLabel\(\s*['"`]([^'"`]+)['"`]/))) return { kind: 'label', value: m[1] };
  if ((m = t.match(/getByPlaceholder\(\s*['"`]([^'"`]+)['"`]/))) return { kind: 'placeholder', value: m[1] };
  if ((m = t.match(/getByAltText\(\s*['"`]([^'"`]+)['"`]/))) return { kind: 'alt', value: m[1] };
  if ((m = t.match(/getByTitle\(\s*['"`]([^'"`]+)['"`]/))) return { kind: 'title', value: m[1] };
  if ((m = t.match(/cy\.contains\(\s*['"`]([^'"`]+)['"`]/))) return { kind: 'text', value: m[1] };
  // css attribute selectors inside locator('...') / cy.get('...') / raw
  // (the css string may itself contain the OTHER quote type, e.g. '[data-testid="x"]')
  const q = t.match(/(?:locator|get)\(\s*(['"`])([\s\S]*?)\1/);
  const css = (q && q[2]) || (/[[.#]/.test(t) ? t : null);
  if (css) {
    let a;
    if ((a = css.match(/\[data-testid\s*=\s*['"]?([^'"\]]+)['"]?\]/))) return { kind: 'testid', value: a[1] };
    if ((a = css.match(/\[data-test\s*=\s*['"]?([^'"\]]+)['"]?\]/))) return { kind: 'testid', value: a[1] };
    if ((a = css.match(/\[aria-label\s*=\s*['"]?([^'"\]]+)['"]?\]/))) return { kind: 'label', value: a[1] };
    if ((a = css.match(/\[name\s*=\s*['"]?([^'"\]]+)['"]?\]/))) return { kind: 'name', value: a[1] };
    if ((a = css.match(/\[placeholder\s*=\s*['"]?([^'"\]]+)['"]?\]/))) return { kind: 'placeholder', value: a[1] };
    if ((a = css.match(/\[title\s*=\s*['"]?([^'"\]]+)['"]?\]/))) return { kind: 'title', value: a[1] };
    if ((a = css.match(/#([A-Za-z_][\w-]*)/))) return { kind: 'id', value: a[1] };
    if ((a = css.match(/\.([A-Za-z_][\w-]*)/))) return { kind: 'class', value: a[1] };
  }
  return null;
}

// Semantic equivalence: same canonical kind+value, OR both canonicalise to null
// but normalise to the same string (fallback keeps exact behaviour).
export function locatorEquivalent(a, b) {
  const ca = canonicalLocator(a), cb = canonicalLocator(b);
  if (ca && cb) return ca.kind === cb.kind && ca.value === cb.value;
  return norm(a) === norm(b);
}

// Every distinct locator expression in a text (spec body, or a single answer).
const LOC_RE = /(?:getBy[A-Za-z]+|locator|cy\.get|cy\.contains)\(\s*(['"`])(?:(?!\1).)*\1[^)]*\)/gs;
export function extractLocators(text) {
  const out = [];
  const t = String(text || '');
  let m;
  LOC_RE.lastIndex = 0;
  while ((m = LOC_RE.exec(t))) out.push(m[0]);
  return out;
}

// Is this locator anchor DISTINCTIVE enough for a semantic-equivalence claim?
// CSS class / bare id in a component library repeat dozens of times (`.slick-cell`
// appears all over a grid test), so "an equivalent locator exists in the text"
// carries no information there. Only testId / label / placeholder / alt / title /
// role / a reasonably long text label identify a unique target.
export function isDistinctive(locator) {
  const c = canonicalLocator(locator);
  if (!c) return false;
  if (c.kind === 'class' || c.kind === 'id') return false;
  if (c.kind === 'text' || c.kind === 'label' || c.kind === 'placeholder' || c.kind === 'title' || c.kind === 'alt') return c.value.length >= 4;
  return true; // testid / role / name
}

// Does `text` contain a locator that is semantically the same as `target`?
// (Correct for whole-spec bodies: we compare EVERY locator, not just the first.)
export function textHasEquivalentLocator(text, target) {
  const ct = canonicalLocator(target);
  if (!ct) return norm(text).includes(norm(target));
  const all = extractLocators(text);
  if (all.length === 0) return norm(text).includes(norm(target)); // no locator syntax found -> exact fallback
  return all.some((loc) => {
    const c = canonicalLocator(loc);
    return c && c.kind === ct.kind && c.value === ct.value;
  });
}

// ---- candidate locators from application source (V_new) ----
// Everything a test could legally point at, as {kind, value} — the rerank pool.
export function extractCandidates(source) {
  const out = new Map(); // `kind:value` -> {kind, value}
  const add = (kind, value) => { const v = norm(value); if (v) out.set(`${kind}:${v}`, { kind, value: v }); };
  let m;

  // JSX / HTML attributes  (regexes MUST be hoisted: a literal inside `while`
  // is recreated each iteration and never advances lastIndex -> infinite loop)
  const attrRes = [
    [/data-testid\s*=\s*["'{`]?\s*([\w.:-]+)/g, 'testid'],
    [/data-test\s*=\s*["'{`]?\s*([\w.:-]+)/g, 'testid'],
    [/aria-label\s*=\s*["'{`]?\s*([^"'`}]+)/g, 'label'],
    [/\bname\s*=\s*["'{`]\s*([\w.:-]+)/g, 'name'],
    [/placeholder\s*=\s*["'{`]\s*([^"'`}]+)/g, 'placeholder'],
    [/\btitle\s*=\s*["'{`]\s*([^"'`}]+)/g, 'title'],
    [/\bid\s*=\s*["'{`]\s*([\w.:-]+)/g, 'id'],
    [/\brole\s*=\s*["'{`]\s*([\w-]+)/g, 'role'],
  ];
  for (const [re, kind] of attrRes) {
    re.lastIndex = 0;
    while ((m = re.exec(source))) add(kind, m[1]);
  }
  // className="a b c"
  const classRe = /className\s*=\s*["'{`]([^"'`}]+)/g;
  while ((m = classRe.exec(source))) {
    for (const cls of m[1].split(/\s+/)) if (/^[\w-]+$/.test(cls)) add('class', cls);
  }
  // visible text between tags: >Some text<
  const textRe = />([^<>{}]{2,60})</g;
  while ((m = textRe.exec(source))) {
    const t = norm(m[1]);
    if (t && !/^[\s]*$/.test(t)) add('text', t);
  }
  return [...out.values()];
}

export const _internals = { norm };
