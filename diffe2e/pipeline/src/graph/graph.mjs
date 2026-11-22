// Graph store: full build + incremental update, with per-file diff/merge.
//
// The store treats each file's contribution as a replaceable unit: re-extracting
// a changed file first removes that file's previous nodes + out-edges, then
// inserts the fresh extraction. Because extraction is per-file pure (see
// extract.mjs), this is exactly equivalent to a full rebuild.
import { extractFile } from './extract.mjs';

export class Graph {
  constructor() {
    this.nodes = new Map(); // id -> node
    this.edges = [];        // {source, target, kind, provenance, line, ...}
    this.fileVersions = new Map(); // file -> code
  }

  static build(files) {
    const g = new Graph();
    for (const { path, code } of files) g.addFile(path, code);
    return g;
  }

  addFile(file, code) {
    this._dropFile(file);
    const { nodes, edges } = extractFile(file, code);
    for (const n of nodes) this.nodes.set(n.id, n);
    this.edges.push(...edges);
    this.fileVersions.set(file, code);
  }

  removeFile(file) {
    this._dropFile(file);
    this.fileVersions.delete(file);
  }

  // Remove a file's nodes and every edge whose SOURCE is one of its nodes.
  // (Every edge this file emitted has a source inside it; cross-file edges
  // pointing INTO a renamed/deleted symbol are handled by the caller via the
  // "re-extract importers" rule — see design doc §6.3 point 4.)
  _dropFile(file) {
    const ids = new Set();
    for (const [id, n] of this.nodes) if (n.file === file) ids.add(id);
    for (const id of ids) this.nodes.delete(id);
    this.edges = this.edges.filter((e) => !ids.has(e.source));
  }

  nodeCount() { return this.nodes.size; }
  edgeCount() { return this.edges.length; }

  toJSON() {
    return {
      nodes: [...this.nodes.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
      edges: this.edges
        .slice()
        .sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)),
    };
  }

  equals(other) {
    return JSON.stringify(this.toJSON()) === JSON.stringify(other.toJSON());
  }
}
