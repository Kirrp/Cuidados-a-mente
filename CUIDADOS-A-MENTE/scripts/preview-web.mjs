// Servidor local para conferir a exportação web, sem publicar o projeto.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(import.meta.dirname, '..', process.env.PREVIEW_DIRECTORY || 'work/web-preview');
const port = Number(process.env.PREVIEW_PORT || 8081);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = resolve(root, '.' + pathname);
    if (target !== root && !target.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    let found;
    for (const file of [target, target + '.html', resolve(target, 'index.html')]) {
      if ((await stat(file).catch(() => null))?.isFile()) { found = file; break; }
    }
    if (!found) { res.writeHead(404).end('Página não encontrada. Gere a versão web primeiro.'); return; }
    res.writeHead(200, { 'Content-Type': types[extname(found)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(found));
  } catch { res.writeHead(400).end('Solicitação inválida.'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Prévia local: http://localhost:${port}`));
