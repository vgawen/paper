// Per-file extractor: source file -> {nodes, edges} for the static K + route layer.
//
// Parser: tree-sitter (typescript/tsx grammars) — LOSSESS and error-tolerant, so
// nodes carry byte-exact spans and broken files still parse (this is the part
// aligned with codegraph). Semantic resolution (which call binds to which symbol)
// is deliberately NOT here — that lives in resolve.mjs and, going forward, in a
// TypeScript typeChecker pass (our differentiator over name-based matching).
//
// Deterministic and cross-file-independent (no symbol resolution), so the graph
// store can re-extract only changed files and "incremental == full" holds.
import Parser from 'tree-sitter';
import TS from 'tree-sitter-typescript';
import path from 'node:path';

const TS_LANG = TS.typescript;
const TSX_LANG = TS.tsx;

let _parserTs = null;
let _parserTsx = null;
function parserFor(ext) {
  const tsx = ext === '.tsx' || ext === '.jsx';
  if (tsx) { if (!_parserTsx) { _parserTsx = new Parser(); _parserTsx.setLanguage(TSX_LANG); } return _parserTsx; }
  if (!_parserTs) { _parserTs = new Parser(); _parserTs.setLanguage(TS_LANG); }
  return _parserTs;
}

// Stable node id: file + qualified name (unchanged symbols keep their id).
export const nodeId = (file, qn) => `${file}::${qn}`;

const NAME_TYPES = new Set(['identifier', 'type_identifier', 'property_identifier']);

function declName(node) {
  const c = node.childForFieldName('name');
  if (c) return c.text;
  for (const ch of node.children) if (NAME_TYPES.has(ch.type)) return ch.text;
  return null;
}

function kindOf(node) {
  switch (node.type) {
    case 'function_declaration': return 'function';
    case 'method_definition': return 'method';
    case 'class_declaration': return 'class';
    case 'interface_declaration': return 'interface';
    case 'type_alias_declaration': return 'type_alias';
    case 'enum_declaration': return 'enum';
    case 'variable_declarator': {
      const val = node.childForFieldName('value');
      return val && (val.type === 'arrow_function' || val.type === 'function') ? 'function' : 'variable';
    }
    default: return null;
  }
}

function isExported(node) {
  let p = node;
  while (p && p.type !== 'program') {
    if (p.type === 'export_statement') return true;
    p = p.parent;
  }
  return false;
}

export function extractFile(filePath, code) {
  let root;
  try {
    root = parserFor(path.extname(filePath).toLowerCase()).parse(code).rootNode;
  } catch {
    // parse failed (e.g. an oversized single token the grammar can't handle) —
    // fall back to a file-only node so the file stays tracked, no symbols lost elsewhere
    return {
      nodes: [{ id: nodeId(filePath, '<file>'), kind: 'file', name: path.basename(filePath), qualifiedName: '<file>', file: filePath, startLine: 1, endLine: (code.match(/\n/g) || []).length + 1, startByte: 0, endByte: code.length }],
      edges: [],
    };
  }
  const nodes = [];
  const edges = [];
  const lineOf = (n) => n.startPosition.row + 1;
  const fileId = nodeId(filePath, '<file>');
  nodes.push({
    id: fileId, kind: 'file', name: path.basename(filePath), qualifiedName: '<file>',
    file: filePath, startLine: 1, endLine: root.endPosition.row + 1, startByte: 0, endByte: code.length,
  });

  // module-level variable names (for value-reference edges)
  const moduleVarNames = new Set();
  const routeTableVars = new Set();
  const refSeen = new Set();
  let dynAccess = false;
  const collectModuleVars = (node) => {
    if (node.type === 'lexical_declaration' || node.type === 'variable_declaration') {
      const p = node.parent;
      if (p && (p.type === 'program' || p.type === 'export_statement')) {
        for (const c of node.children) if (c.type === 'variable_declarator') {
          const name = c.childForFieldName('name');
          if (name) moduleVarNames.add(name.text);
        }
      }
    }
    for (const c of node.children) collectModuleVars(c);
  };
  collectModuleVars(root);

  function calleeName(callNode) {
    const callee = callNode.childForFieldName('function');
    if (!callee) return null;
    if (callee.type === 'identifier') return callee.text;
    if (callee.type === 'member_expression') { const p = callee.childForFieldName('property'); return p ? p.text : null; }
    return null;
  }

  function visit(node, parentQn, ownerId) {
    if (node.type === 'call_expression' && ownerId) {
      const c = calleeName(node);
      if (c && c !== 'import') edges.push({ source: ownerId, target: `call::${c}`, kind: 'calls', provenance: 'heuristic', line: lineOf(node), callee: c });
    }
    // dynamic property access (`obj[name]`, `window[k]`) can read a module variable
    // without a syntactic identifier reference -> narrowing by static references is
    // no longer provably complete for this file.
    if (node.type === 'subscript_expression') dynAccess = true;
    // value-reference: identifier that names a module-level variable, read inside a function
    if (node.type === 'identifier' && ownerId && moduleVarNames.has(node.text)) {
      const varId = nodeId(filePath, node.text);
      const key = `${ownerId}\u0000${varId}`;
      if (!refSeen.has(key)) {
        refSeen.add(key);
        edges.push({ source: ownerId, target: varId, kind: 'references', provenance: 'symbolic', line: lineOf(node) });
      }
    }
    const nm = declName(node);
    const k = kindOf(node);
    if (nm && k) {
      const qn = parentQn ? `${parentQn}::${nm}` : nm;
      const id = nodeId(filePath, qn);
      const parentId = parentQn ? nodeId(filePath, parentQn) : fileId;
      nodes.push({ id, kind: k, name: nm, qualifiedName: qn, file: filePath, startLine: lineOf(node), endLine: node.endPosition.row + 1, startByte: node.startIndex, endByte: node.endIndex, isExported: isExported(node) });
      edges.push({ source: parentId, target: id, kind: 'contains', provenance: 'symbolic', line: lineOf(node) });
      const newOwner = (k === 'function' || k === 'method' || k === 'class') ? id : ownerId;
      for (const c of node.children) visit(c, qn, newOwner);
    } else {
      for (const c of node.children) visit(c, parentQn, ownerId);
    }
  }

  function findDynamicImport(node) {
    let imp = null;
    const walk = (n) => {
      if (imp) return;
      if (n.type === 'call_expression' && n.childForFieldName('function')?.type === 'import') {
        const args = n.childForFieldName('arguments');
        const str = args ? args.children.find((c) => c.type === 'string') : null;
        if (str) imp = str.text.slice(1, -1);
        return;
      }
      for (const c of n.children) walk(c);
    };
    walk(node);
    return imp;
  }

  // component reference for a route's element/Component/component value
  const componentTarget = (pv) => {
    const imp = findDynamicImport(pv);
    if (imp) return { kind: 'file', target: imp };
    if (pv.type === 'jsx_element' || pv.type === 'jsx_self_closing_element') {
      const tag = pv.childForFieldName('name');
      if (tag && (tag.type === 'identifier' || tag.type === 'member_expression' || tag.type === 'nested_identifier')) return { kind: 'component', name: tag.text };
    }
    if (pv.type === 'identifier') return { kind: 'component', name: pv.text };
    return null;
  };

  const emitRoute = (routePath, ct, pair) => {
    const routeQn = `route:${routePath}`;
    const routeId = nodeId(filePath, routeQn);
    if (!nodes.some((n) => n.id === routeId)) {
      nodes.push({ id: routeId, kind: 'route', name: routePath, qualifiedName: routeQn, file: filePath, startLine: lineOf(pair), endLine: pair.endPosition.row + 1, startByte: pair.startIndex, endByte: pair.endIndex, isExported: false });
      edges.push({ source: fileId, target: routeId, kind: 'contains', provenance: 'symbolic', line: lineOf(pair) });
    }
    const target = ct.kind === 'file'
      ? nodeId(path.posix.normalize(path.posix.join(path.posix.dirname(filePath), ct.target)), '<file>')
      : `component:${ct.name}`;
    edges.push({ source: routeId, target, kind: 'renders', provenance: 'symbolic', line: lineOf(pair) });
  };

  // two route-config shapes:
  //  (a) React Router style: { path: '/x', element: <X/> | Component: X | component: X }
  //  (b) controlled-subject style: { '/x': () => import('./y.js') }
  const extractRouteObject = (obj, varName) => {
    let extracted = false;
    const pairs = obj.children.filter((c) => c.type === 'pair');
    const getPair = (key) => pairs.find((p) => {
      const k = p.childForFieldName('key');
      if (!k) return false;
      if (k.type === 'string') return k.text.slice(1, -1) === key;
      if (k.type === 'property_identifier') return k.text === key;
      return false;
    });
    const pathPair = getPair('path');
    if (pathPair) {
      const pathVal = pathPair.childForFieldName('value');
      if (pathVal && pathVal.type === 'string') {
        const compPair = getPair('element') || getPair('Component') || getPair('component');
        if (compPair) {
          const ct = componentTarget(compPair.childForFieldName('value'));
          if (ct) { emitRoute(pathVal.text.slice(1, -1), ct, pathPair); extracted = true; }
        }
      }
      if (extracted && varName) routeTableVars.add(varName);
      return extracted;
    }
    for (const pair of pairs) {
      const key = pair.childForFieldName('key');
      const pv = pair.childForFieldName('value');
      if (!key || key.type !== 'string' || !pv) continue;
      const imp = findDynamicImport(pv);
      if (imp) { emitRoute(key.text.slice(1, -1), { kind: 'file', target: imp }, pair); extracted = true; }
    }
    if (extracted && varName) routeTableVars.add(varName);
    return extracted;
  };

  const visitRoutes = (node) => {
    if (node.type === 'variable_declarator') {
      const val = node.childForFieldName('value');
      if (val && val.type === 'object') {
        const name = node.childForFieldName('name');
        extractRouteObject(val, name ? name.text : null);
      }
    } else if (node.type === 'object' && node.parent && node.parent.type === 'array') {
      extractRouteObject(node, null); // React Router [{ path, element }]
    }
    for (const c of node.children) visitRoutes(c);
  };

  // React Router JSX form: <Route path="..." element={<X/>} /> (or <Route ...>...</Route>)
  const jsxComponentOf = (val) => {
    if (!val || val.type !== 'jsx_expression') return null;
    const el = val.children.find((c) => c.type === 'jsx_element' || c.type === 'jsx_self_closing_element');
    if (!el) return null;
    // non-self-closing <X>...</X> has its tag name on the jsx_opening_element child
    const tag = el.type === 'jsx_element'
      ? el.children.find((c) => c.type === 'jsx_opening_element')?.childForFieldName('name')
      : el.childForFieldName('name');
    return tag ? tag.text : null;
  };

  const visitJsxRoutes = (node) => {
    if (node.type === 'jsx_opening_element' || node.type === 'jsx_self_closing_element') {
      const tag = node.childForFieldName('name');
      if (tag && tag.text === 'Route') {
        let path = null, component = null, isIndex = false;
        for (const attr of node.children) {
          if (attr.type !== 'jsx_attribute') continue;
          const name = attr.children.find((c) => c.type === 'property_identifier');
          const val = attr.children.find((c) => c.type === 'string' || c.type === 'jsx_expression');
          if (!name) continue;
          const key = name.text;
          if (key === 'path' && val && val.type === 'string') path = val.text.slice(1, -1);
          else if (key === 'element') component = jsxComponentOf(val);
          else if (key === 'index') isIndex = true;
        }
        if (component && (path !== null || isIndex)) {
          emitRoute(isIndex && path === null ? '' : (path ?? ''), { kind: 'component', name: component }, node);
        }
      }
    }
    for (const c of node.children) visitJsxRoutes(c);
  };

  // imports (module specifier = the string source)
  const visitImports = (node) => {
    if (node.type === 'import_statement') {
      const str = node.childForFieldName('source') || node.children.find((c) => c.type === 'string');
      if (str) {
        const spec = str.text.slice(1, -1);
        if (spec.startsWith('.')) {
          const target = path.posix.normalize(path.posix.join(path.posix.dirname(filePath), spec));
          edges.push({ source: fileId, target, kind: 'imports', provenance: 'symbolic', line: lineOf(node) });
        }
      }
    }
    for (const c of node.children) visitImports(c);
  };

  visitImports(root);
  for (const c of root.children) visit(c, null, null);
  visitRoutes(root);
  visitJsxRoutes(root);

  // mark route-table variables (handled by route-level, not value-reference)
  for (const n of nodes) if (n.kind === 'variable' && routeTableVars.has(n.name)) n.isRouteTable = true;

  // record a dynamic-access marker so the selector knows narrowing is unsafe here
  if (dynAccess) nodes.push({ id: `dynaccess::${filePath}`, kind: 'marker', name: 'dynaccess', qualifiedName: '<dynaccess>', file: filePath, startLine: 0, endLine: 0 });

  return { nodes, edges };
}
