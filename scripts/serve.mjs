import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';

const root = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.webp':'image/webp', '.avif':'image/avif' };
export async function handleRequest(request,response) {
  try {
    const pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    let path = resolve(root, `.${pathname}`);
    if (path !== root && !path.startsWith(`${root}${sep}`)) { response.writeHead(403);response.end('Forbidden');return; }
    if ((await stat(path)).isDirectory()) path = resolve(path,'index.html');
    const content = await readFile(path);
    response.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    response.end(content);
  } catch(error) {
    response.writeHead(error.code==='ENOENT'?404:400);response.end('Not found');
  }
}
export function startServer() {
  const server = createServer(handleRequest);
  server.on('error',error=>{console.error(`No se pudo iniciar el servidor: ${error.code} ${error.message}`);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) startServer();
