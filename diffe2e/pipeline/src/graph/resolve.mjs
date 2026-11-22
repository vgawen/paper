// Global resolution pass: turn raw `call::name` edges into resolved function nodes.
//
// Pure function of the RAW graph (per-file extraction): re-runnable on every
// incremental change without re-parsing files (just index lookups), so
// `resolve(incremental_raw) === resolve(full_raw)` whenever the raw graphs agree.
//
// A call `f → n` resolves to a node iff exactly ONE candidate symbol named `n` is
// visible from f's file: a same-file symbol, or an exported symbol of a file that
// f imports. Zero/multiple candidates leave it unresolved (heuristic).
import { nodeId } from './extract.mjs';

export function resolve(raw) {
  // name -> [{id, file, isExported}]
  const byName = new Map();
  for (const n of raw.nodes) {
    if (n.kind === 'file' || n.kind === 'variable' || n.kind === 'constant') continue;
    if (!byName.has(n.name)) byName.set(n.name, []);
    byName.get(n.name).push({ id: n.id, file: n.file, isExported: !!n.isExported });
  }

  // file path -> Set(imported path)  (imports edges: source=file node, target=path)
  const imports = new Map();
  const fileNodeOf = new Map(); // path -> file node id
  for (const n of raw.nodes) if (n.kind === 'file') fileNodeOf.set(n.file, n.id);
  for (const e of raw.edges) {
    if (e.kind !== 'imports') continue;
    const src = raw.nodes.find((x) => x.id === e.source);
    if (!src || src.kind !== 'file') continue;
    if (!imports.has(src.file)) imports.set(src.file, new Set());
    imports.get(src.file).add(e.target);
  }

  const edges = [];
  for (const e of raw.edges) {
    if (e.kind !== 'calls') { edges.push({ ...e }); continue; }
    const owner = raw.nodes.find((x) => x.id === e.source);
    const ownerFile = owner ? owner.file : null;
    const imps = (ownerFile && imports.get(ownerFile)) || new Set();
    const cands = (byName.get(e.callee) || []).filter((c) =>
      c.file === ownerFile ||
      (c.isExported && [...imps].some((t) => c.file === t || c.file.startsWith(t + '.')))
    );
    if (cands.length === 1) {
      edges.push({ ...e, target: cands[0].id, resolved: true, provenance: 'symbolic' });
    } else {
      edges.push({ ...e, target: `call::${e.callee}`, resolved: false, provenance: 'heuristic' });
    }
  }

  return { nodes: raw.nodes, edges };
}
