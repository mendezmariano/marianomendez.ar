// Build an isolated copy of the real app with a rich article for manual QA.
import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parsePost } from './posts.mjs';

const root = await mkdtemp(join(tmpdir(), 'mendez-reader-'));
await cp(new URL('../dist/', import.meta.url), join(root, 'dist'), { recursive: true });
await mkdir(join(root, 'scripts'));
await cp(new URL('./serve.mjs', import.meta.url), join(root, 'scripts/serve.mjs'));
// The copied server uses native ESM; no dependencies or original CV are copied.
await writeFile(join(root, 'package.json'), '{"type":"module"}\n');
const source = await readFile(new URL('../tests/fixtures/reader-article.md', import.meta.url), 'utf8');
const post = parsePost(source, 'reader-article.md');
await writeFile(join(root, 'dist/posts.js'), `export const posts = ${JSON.stringify([post], null, 2)};\n`);
console.log(`Vista de prueba preparada en ${root}`);
console.log(`PORT=4174 node ${join(root, 'scripts/serve.mjs')}`);
console.log('Abrí http://127.0.0.1:4174 y seleccioná Bitácora para leer la entrada de prueba.');
