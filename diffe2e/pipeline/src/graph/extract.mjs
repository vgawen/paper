// Per-file pure extractor: source file -> {nodes, edges} for the static K layer.
//
// Deterministic and cross-file-independent (no symbol resolution): the graph
// store can re-extract only changed files and merge (see graph.mjs), and
// "incremental == full rebuild" is verifiable.
//
// Nodes: file / function / method / class / variable / interface / enum / type_alias.
// Edges: contains (parent→child), imports (file→imported path), calls (caller→callee name, heuristic).
import ts from 'typescript';
import path from 'node:path';

const SK = {
  '.js': ts.ScriptKind.JS,
  '.jsx': ts.ScriptKind.JSX,
  '.ts': ts.ScriptKind.TS,
  '.tsx': ts.ScriptKind.TSX,
  '.mjs': ts.ScriptKind.JS,
  '.cjs': ts.ScriptKind.JS,
};

// Stable node id: file + qualified name. Unchanged symbols keep their id across
// edits, which is what lets the store diff by id instead of rebuilding.
export const nodeId = (file, qn) => `${file}::${qn}`;

const isFnLike = (n) =>
  ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n) || ts.isMethodDeclaration(n);

function kindOf(n) {
  if (ts.isClassDeclaration(n)) return 'class';
  if (ts.isInterfaceDeclaration(n)) return 'interface';
  if (ts.isEnumDeclaration(n)) return 'enum';
  if (ts.isTypeAliasDeclaration(n)) return 'type_alias';
  if (ts.isMethodDeclaration(n)) return 'method';
  if (ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n)) return 'function';
  if (ts.isVariableDeclaration(n)) {
    // arrow/function-bound const behaves as a callable
    return n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer))
      ? 'function'
      : 'variable';
  }
  return null;
}

function nameOf(n) {
  return n.name && ts.isIdentifier(n.name) ? n.name.text : null;
}

// `export function f` / `export const x = 1`: the modifier sits on the function/
// class node, or on the parent VariableStatement for variables.
function isExported(n) {
  const hasExport = (x) => (x.modifiers || []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  if (hasExport(n)) return true;
  if (ts.isVariableDeclaration(n)) {
    let p = n.parent;
    while (p && !ts.isSourceFile(p)) {
      if (ts.isVariableStatement(p) && hasExport(p)) return true;
      p = p.parent;
    }
  }
  return false;
}

function calleeOf(expr) {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  return null;
}

export function extractFile(filePath, code) {
  const sk = SK[path.extname(filePath).toLowerCase()] ?? ts.ScriptKind.TS;
  const sf = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true, sk);
  const nodes = [];
  const edges = [];
  const lineOf = (pos) => sf.getLineAndCharacterOfPosition(pos).line + 1;
  const fileId = nodeId(filePath, '<file>');

  nodes.push({
    id: fileId, kind: 'file', name: path.basename(filePath), qualifiedName: '<file>',
    file: filePath, startLine: 1, endLine: lineOf(sf.getEnd()),
  });

  function visit(node, parentQn, ownerId) {
    // record call edges under the nearest enclosing callable
    if (ts.isCallExpression(node) && ownerId) {
      const c = calleeOf(node.expression);
      if (c) edges.push({ source: ownerId, target: `call::${c}`, kind: 'calls', provenance: 'heuristic', line: lineOf(node.getStart()), callee: c });
    }
    const nm = nameOf(node);
    const k = kindOf(node);
    if (nm && k) {
      const qn = parentQn ? `${parentQn}::${nm}` : nm;
      const id = nodeId(filePath, qn);
      const parentId = parentQn ? nodeId(filePath, parentQn) : fileId;
      nodes.push({ id, kind: k, name: nm, qualifiedName: qn, file: filePath, startLine: lineOf(node.getStart()), endLine: lineOf(node.getEnd()), isExported: isExported(node) });
      edges.push({ source: parentId, target: id, kind: 'contains', provenance: 'symbolic', line: lineOf(node.getStart()) });
      const newOwner = (k === 'function' || k === 'method' || k === 'class') ? id : ownerId;
      ts.forEachChild(node, (c) => visit(c, qn, newOwner));
    } else {
      ts.forEachChild(node, (c) => visit(c, parentQn, ownerId));
    }
  }

  ts.forEachChild(sf, (n) => {
    if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
      const spec = n.moduleSpecifier.text;
      if (spec.startsWith('.')) {
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(filePath), spec));
        edges.push({ source: fileId, target: target, kind: 'imports', provenance: 'symbolic', line: lineOf(n.getStart()) });
      }
    }
    visit(n, null, null);
  });

  // Route table: `const routes = { '/path': () => import('./file.js'), ... }`.
  // Emits route nodes + `renders` edges (route -> component file node). Per-file
  // pure (the table lives in this file), so incremental update re-emits cleanly.
  const findDynamicImport = (node) => {
    let imp = null;
    const walk = (n) => {
      if (imp) return;
      if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword &&
          n.arguments && n.arguments[0] && ts.isStringLiteral(n.arguments[0])) {
        imp = n.arguments[0].text;
        return;
      }
      ts.forEachChild(n, walk);
    };
    walk(node);
    return imp;
  };

  const visitRoutes = (node) => {
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      for (const prop of node.initializer.properties) {
        if (!ts.isPropertyAssignment(prop) || !ts.isStringLiteral(prop.name)) continue;
        const routePath = prop.name.text;
        const imp = findDynamicImport(prop.initializer);
        if (!imp) continue;
        const routeQn = `route:${routePath}`;
        const routeId = nodeId(filePath, routeQn);
        const componentFile = path.posix.normalize(path.posix.join(path.posix.dirname(filePath), imp));
        if (!nodes.some((n) => n.id === routeId)) {
          nodes.push({ id: routeId, kind: 'route', name: routePath, qualifiedName: routeQn, file: filePath, startLine: lineOf(prop.getStart()), endLine: lineOf(prop.getEnd()), isExported: false });
          edges.push({ source: fileId, target: routeId, kind: 'contains', provenance: 'symbolic', line: lineOf(prop.getStart()) });
        }
        edges.push({ source: routeId, target: nodeId(componentFile, '<file>'), kind: 'renders', provenance: 'symbolic', line: lineOf(prop.getStart()) });
      }
    }
    ts.forEachChild(node, visitRoutes);
  };
  ts.forEachChild(sf, (n) => visitRoutes(n));

  return { nodes, edges };
}
