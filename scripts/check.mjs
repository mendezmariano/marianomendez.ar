import { readFile, access, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { SourceTextModule } from 'node:vm';

const root = fileURLToPath(new URL('../',import.meta.url));
const dist = resolve(root,'dist');
const html = await readFile(resolve(dist,'index.html'),'utf8');
const css = await readFile(resolve(dist,'style.css'),'utf8');
const references = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match=>match[1]);
references.push(...[...css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)].map(match=>match[1]));
for (const ref of references) await access(resolve(dist,ref));
for (const file of await readdir(dist)) if(file.endsWith('.js')) new SourceTextModule(await readFile(resolve(dist,file),'utf8'),{identifier:file});
for (const file of await readdir(resolve(root,'tests'))) if(file.endsWith('.test.js')) await import(new URL(`../tests/${file}`,import.meta.url));
console.log(`OK: ${references.length} local references exist; JavaScript syntax validated. Test results follow.`);
