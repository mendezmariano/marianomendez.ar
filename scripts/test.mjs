import { readdir } from 'node:fs/promises';
const directory = new URL('../tests/',import.meta.url);
for (const filename of await readdir(directory)) {
  if(filename.endsWith('.test.js')) await import(new URL(filename,directory));
}
