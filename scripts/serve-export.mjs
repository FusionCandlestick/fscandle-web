/** Local preview for Next's output: export. Production stays on GitHub Pages. */
import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, relative, isAbsolute, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};
const inside = (root, path) => {
  const rel = relative(root, path);
  return rel !== '..' && !rel.startsWith('../') && !isAbsolute(rel);
};

export function createExportServer(directory, basePath = '') {
  const rootPath = resolve(directory);
  const base = basePath.replace(/\/$/, '');
  return createServer(async (request, response) => {
    try {
      const root = await realpath(rootPath);
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { Allow: 'GET, HEAD' }).end();
        return;
      }
      let pathname;
      try {
        pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      } catch {
        response.writeHead(400).end();
        return;
      }
      if (base && pathname !== base && !pathname.startsWith(base + '/')) {
        response.writeHead(404).end();
        return;
      }
      pathname = pathname.slice(base.length);
      const target = resolve(root, '.' + (pathname || '/'));
      if (!inside(root, target)) {
        response.writeHead(404).end();
        return;
      }
      for (const candidate of [target, join(target, 'index.html'), target + '.html']) {
        try {
          const actual = await realpath(candidate);
          if (!inside(root, actual) || !(await stat(actual)).isFile()) continue;
          const content = await readFile(actual);
          response.writeHead(200, {
            'Content-Type': types[extname(actual)] || 'application/octet-stream',
            'Content-Length': content.length,
            'X-Content-Type-Options': 'nosniff',
          });
          response.end(request.method === 'HEAD' ? undefined : content);
          return;
        } catch (error) {
          if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
        }
      }
      response.writeHead(404).end();
    } catch {
      response.writeHead(500).end();
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: {
    port: { type: 'string', default: process.env.PORT || '3000' },
    hostname: { type: 'string', default: '127.0.0.1' },
  } });
  await stat(resolve('out/index.html'));
  const server = createExportServer('out', process.env.NEXT_PUBLIC_BASE_PATH || '');
  server.listen(Number(values.port), values.hostname, () => {
    console.log(`Static preview: http://${values.hostname}:${values.port}`);
  });
}
