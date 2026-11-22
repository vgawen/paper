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
  const tree = parserFor(path.extname(filePath).toLowerCase()).parse(code);
  const root = tree.rootNode;
  const nodes = [];
  const edges = [];
  const lineOf = (n) => n.startPosition.row + 1;
  const fileId = nodeId(filePath, '<file>');
  nodes.push({
    id: fileId, kind: 'file', name: path.basename(filePath), qualifiedName: '<file>',
    file: filePath, startLine: 1, endLine: root.endPosition.row + 1, startByte: 0, endByte: code.length,
  });

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

  const visitRoutes = (node) => {
    if (node.type === 'variable_declarator') {
      const val = node.childForFieldName('value');
      if (val && val.type === 'object') {
        for (const pair of val.children) {
          if (pair.type !== 'pair') continue;
          const key = pair.childForFieldName('key');
          const pv = pair.childForFieldName('value');
          if (!key || key.type !== 'string' || !pv) continue;
          const routePath = key.text.slice(1, -1);
          const imp = findDynamicImport(pv);
          if (!imp) continue;
          const routeQn = `route:${routePath}`;
          const routeId = nodeId(filePath, routeQn);
          const componentFile = path.posix.normalize(path.posix.join(path.posix.dirname(filePath), imp));
          if (!nodes.some((n) => n.id === routeId)) {
            nodes.push({ id: routeId, kind: 'route', name: routePath, qualifiedName: routeQn, file: filePath, startLine: lineOf(pair), endLine: pair.endPosition.row + 1, startByte: pair.startIndex, endByte: pair.endIndex, isExported: false });
            edges.push({ source: fileId, target: routeId, kind: 'contains', provenance: 'symbolic', line: lineOf(pair) });
          }
          edges.push({ source: routeId, target: nodeId(componentFile, '<file>'), kind: 'renders', provenance: 'symbolic', line: lineOf(pair) });
        }
      }
    }
    for (const c of node.children) visitRoutes(c);
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

  return { nodes, edges };
}
