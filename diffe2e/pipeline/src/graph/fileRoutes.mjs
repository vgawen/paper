// File-based framework routes (SvelteKit): routes are implied by directory
// structure, not code — `src/routes/<seg>/+page.svelte` -> `/<seg>`.
// Dynamic segments `[slug]` -> `:slug`. Returns route nodes + `renders` edges
// (route -> component file), matching extract.mjs's route output shape.
import { nodeId } from './extract.mjs';

const PAGE_RE = /routes\/(.*\/)?\+page\.(svelte|js|ts|jsx|tsx)$/;

export function svelteKitRoutes(files) {
  const nodes = [];
  const edges = [];
  for (const f of files) {
    const m = f.path.match(PAGE_RE);
    if (!m) continue;
    const seg = (m[1] || '').replace(/\/+$/, '');
    const routePath = seg === ''
      ? '/'
      : '/' + seg.split('/')
        .filter((s) => !(s.startsWith('(') && s.endsWith(')'))) // drop route groups `(app)`
        .map((s) => (s.startsWith('[') && s.endsWith(']') ? ':' + s.slice(1, -1) : s)) // [slug] -> :slug
        .join('/');
    const routeId = `sveltekit::route:${routePath}`;
    if (!nodes.some((n) => n.id === routeId)) {
      nodes.push({ id: routeId, kind: 'route', name: routePath, qualifiedName: `route:${routePath}`, file: '<sveltekit-routes>', startLine: 0, endLine: 0, isExported: false });
    }
    edges.push({ source: routeId, target: nodeId(f.path, '<file>'), kind: 'renders', provenance: 'symbolic', line: 0 });
  }
  return { nodes, edges };
}
