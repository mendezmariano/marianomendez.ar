import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { relative, resolve, sep } from 'node:path';

const address = process.argv[2];
if (!address) throw new Error('Indicá la URL: npm run verify:deployment -- https://www.marianomendez.ar/');
const base = new URL(address.endsWith('/') ? address : `${address}/`);
if (!['http:', 'https:'].includes(base.protocol)) throw new Error('La URL debe usar HTTP o HTTPS.');
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const digest = content => createHash('sha256').update(content).digest('hex');

async function filesIn(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'CNAME') continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

let checked = 0;
for (const path of await filesIn(root)) {
  const name = relative(root, path).split(sep).join('/');
  const expected = digest(await readFile(path));
  const url = new URL(name === 'index.html' ? './' : name, base);
  url.searchParams.set('verify', expected.slice(0, 12));
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status} en ${response.url}`);
  const actual = digest(Buffer.from(await response.arrayBuffer()));
  if (actual !== expected) throw new Error(`${name}: el archivo publicado difiere del local.`);
  checked += 1;
}
console.log(`OK: ${checked} archivos publicados coinciden con dist/ en ${base.href}`);
