// TypeScript typeChecker-based call resolution — our differentiator over
// name-based matching (and over codegraph's tree-sitter + name resolution).
//
// Writes the in-memory files to a temp dir and builds a ts.Program there, then
// uses `checker.getSymbolAtLocation` on every call expression so it resolves
// through imports, aliased imports (`import { X as Y }`), re-exports and
// shadowing — cases name-based matching gets wrong. Falls back gracefully: if a
// program can't be built (missing deps / broken code), it returns nothing and the
// caller keeps the name-based result.
//
// Output mirrors resolve.mjs's resolved-call edges: {source, target, callee, resolved, provenance}.
import ts from 'typescript';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { nodeId } from './extract.mjs';

function buildProgram(files) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tcgraph-'));
  const reverse = new Map(); // tmp abs path -> original graph path
  const rootNames = [];
  for (const f of files) {
    const tp = path.join(tmp, f.path);
    fs.mkdirSync(path.dirname(tp), { recursive: true });
    fs.writeFileSync(tp, f.code);
    reverse.set(tp, f.path);
    rootNames.push(tp);
  }
  const options = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowJs: true,
    checkJs: true,
    noEmit: true,
    skipLibCheck: true,
  };
  const program = ts.createProgram(rootNames, options);
  return { program, reverse, tmp };
}

function nameOf(n) {
  return n.name && ts.isIdentifier(n.name) ? n.name.text : null;
}
const isFnLike = (n) =>
  ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n) || ts.isMethodDeclaration(n);

// qualified name of a declaration node (top-level fn, class method, arrow-bound const)
function qualifiedNameOf(node) {
  const nm = nameOf(node);
  if (!nm) return null;
  if (ts.isMethodDeclaration(node)) {
    let p = node.parent;
    while (p && !ts.isSourceFile(p)) { if (ts.isClassDeclaration(p) && p.name) return `${p.name.text}::${nm}`; p = p.parent; }
    return nm;
  }
  return nm; // top-level function / arrow-bound const
}

export function semanticResolveCalls(files) {
  let program, checker, reverse, tmp;
  try {
    ({ program, reverse, tmp } = buildProgram(files));
    checker = program.getTypeChecker();
  } catch {
    return { resolved: [], errors: ['program-build-failed'] };
  }

  const resolved = [];
  const errors = [];

  for (const { path: file } of files) {
    // find the source file in the program by its original path
    const sf = [...reverse.entries()].find(([, g]) => g === file)?.[0];
    if (!sf) continue;
    const src = program.getSourceFile(sf);
    if (!src) continue;

    const visit = (node, parentQn, ownerId) => {
      if (ts.isCallExpression(node) && ownerId) {
        const sym = checker.getSymbolAtLocation(node.expression);
        const realSym = sym && (sym.flags & ts.SymbolFlags.Alias) ? checker.getAliasedSymbol(sym) : sym;
        const decl = realSym && (realSym.valueDeclaration || realSym.declarations?.[0]);
        if (decl && (ts.isFunctionLike(decl) || (ts.isVariableDeclaration(decl) && decl.initializer && ts.isFunctionLike(decl.initializer)))) {
          const tq = qualifiedNameOf(decl);
          const tf = decl.getSourceFile().fileName;
          const graphFile = reverse.get(tf) || tf;
          if (tq) {
            resolved.push({ source: ownerId, target: nodeId(graphFile, tq), callee: node.expression.getText(), resolved: true, provenance: 'symbolic' });
          }
        } else {
          resolved.push({ source: ownerId, target: `call::${node.expression.getText()}`, callee: node.expression.getText(), resolved: false, provenance: 'heuristic' });
        }
      }

      const nm = nameOf(node);
      const isDecl = isFnLike(node) || ts.isClassDeclaration(node);
      if (nm && isDecl) {
        const qn = parentQn ? `${parentQn}::${nm}` : nm;
        const id = nodeId(file, qn);
        const newOwner = (isFnLike(node) || ts.isClassDeclaration(node)) ? id : ownerId;
        ts.forEachChild(node, (c) => visit(c, qn, newOwner));
      } else {
        ts.forEachChild(node, (c) => visit(c, parentQn, ownerId));
      }
    };
    ts.forEachChild(src, (n) => visit(n, null, null));
  }

  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best-effort cleanup */ }
  return { resolved, errors };
}
