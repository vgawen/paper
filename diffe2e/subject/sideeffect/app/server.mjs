import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, 'public');
const PORT = 5182;

// SHARED, PERSISTENT backend state. Survives across tests within one run
// (Playwright isolates per-test browser storage, but NOT this server). Resets
// to 0 only when the server restarts (i.e., each `playwright test` invocation).
let visits = 0;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  const u = (req.url || '/').split('?')[0];
  // Shared-state resource: POST writes (side effect), GET reads.
  if (u === '/api/visits') {
    if (req.method === 'POST') visits += 1;
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ visits }));
    return;
  }
  try {
    let urlPath = decodeURIComponent(u);
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
    const filePath = path.join(ROOT, urlPath);
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

server.listen(PORT, () => console.log(`sideeffect-app on http://localhost:${PORT}`));
