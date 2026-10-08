import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// This local verification server deliberately has no SPA fallback or root-level assets.
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const mount = '/collections/card-things/';
const port = 4175;
const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

const server = createServer(async (request, response) => {
  const fail = (status: number) => {
    response.writeHead(status);
    response.end();
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    fail(405);
    return;
  }
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  if (url.pathname === mount.slice(0, -1)) {
    response.writeHead(308, { Location: `${mount}${url.search}`, 'Cache-Control': 'no-store' });
    response.end();
    return;
  }
  if (!url.pathname.startsWith(mount)) {
    fail(404);
    return;
  }
  try {
    const relative = decodeURIComponent(url.pathname.slice(mount.length)) || 'index.html';
    const file = resolve(root, relative);
    if (!file.startsWith(resolve(root) + sep) || !(await stat(file)).isFile()) {
      fail(404);
      return;
    }
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') response.end();
    else
      createReadStream(file)
        .on('error', () => response.destroy())
        .pipe(response);
  } catch {
    fail(404);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Static subpath preview: http://127.0.0.1:${port}${mount}`);
});
