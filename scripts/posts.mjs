import { readFile, readdir, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { watch } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import matter from 'gray-matter';
import { load, JSON_SCHEMA } from 'js-yaml';
import MarkdownIt from 'markdown-it';

export const postsDirectory = fileURLToPath(new URL('../content/posts/', import.meta.url));
export const postsOutput = fileURLToPath(new URL('../dist/posts.js', import.meta.url));
const markdown = new MarkdownIt({ html: false });
markdown.validateLink = url => !/[\u0000-\u0020\u007f]/.test(url)
  && (!/^[a-z][a-z\d+.-]*:/i.test(url) || /^(https?:|mailto:)/i.test(url));

// Article headings sit below the title of the terminal reader.
for (const type of ['heading_open', 'heading_close']) {
  markdown.renderer.rules[type] = (tokens, index) => {
    const level = Math.min(6, Number(tokens[index].tag.slice(1)) + 2);
    return type === 'heading_open' ? `<h${level}>` : `</h${level}>\n`;
  };
}

function textField(data, key, fallback) {
  const value = data[key] === undefined ? fallback : data[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${key} debe ser un texto no vacío.`);
  return value.trim();
}

export function parsePost(source, filename) {
  try {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(filename)) {
      throw new Error('Usá un nombre como mi-articulo.md, con minúsculas, números y guiones.');
    }
    source = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    if (!/^---\n[\s\S]*?\n---(?:\n|$)/.test(source)) {
      throw new Error('Los metadatos YAML deben estar entre dos líneas --- al inicio.');
    }
    // Only YAML is accepted. gray-matter also has executable engines we never use.
    const { data, content } = matter(source, { engines: {
      yaml: value => load(value, { schema: JSON_SCHEMA }),
    } });
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Los metadatos deben ser campos YAML.');
    for (const key of Object.keys(data)) {
      if (!['title', 'category', 'date', 'example'].includes(key)) throw new Error(`Campo desconocido: ${key}.`);
    }
    const title = textField(data, 'title');
    const category = textField(data, 'category', 'Notas');
    const date = data.date ?? null;
    if (date !== null && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
      || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) {
      throw new Error('date debe ser una fecha válida con formato AAAA-MM-DD.');
    }
    if (data.example !== undefined && typeof data.example !== 'boolean') throw new Error('example debe ser true o false.');
    if (!content.trim()) throw new Error('El artículo debe tener contenido.');
    const tokens = markdown.parse(content, {});
    const words = tokens.flatMap(token => token.type === 'inline'
      ? token.children.filter(child => ['text', 'code_inline', 'image'].includes(child.type)).map(child => child.content)
      : ['fence', 'code_block'].includes(token.type) ? [token.content] : [])
      .join(' ').match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu) ?? [];
    return { id: filename.slice(0, -3), title, category, date, example: data.example ?? false,
      minutes: Math.max(1, Math.ceil(words.length / 200)), html: markdown.renderer.render(tokens, markdown.options, {}) };
  } catch (error) {
    throw new Error(`${filename}: ${error.message}`, { cause: error });
  }
}

export async function buildPosts({ source = postsDirectory, output = postsOutput } = {}) {
  const entries = await readdir(source, { withFileTypes: true });
  const posts = await Promise.all(entries.filter(entry => entry.isFile() && /\.md$/i.test(entry.name))
    .map(async entry => parsePost(await readFile(resolve(source, entry.name), 'utf8'), entry.name)));
  posts.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.id.localeCompare(b.id, 'en'));
  const module = `// Generado por npm run build. Editá content/posts/*.md.\nexport const posts = ${JSON.stringify(posts, null, 2)};\n`;
  // Validate everything before replacing the last working module, in one rename.
  await mkdir(dirname(output), { recursive: true });
  const temporary = `${output}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, module);
    await rename(temporary, output);
  } finally {
    await rm(temporary, { force: true });
  }
  return posts;
}

export function watchPosts({ source = postsDirectory, output = postsOutput, onBuild = () => {}, onError = console.error } = {}) {
  let timer;
  let queue = Promise.resolve();
  let closed = false;
  const watcher = watch(source, (_event, filename) => {
    if (filename && !/\.md$/i.test(String(filename))) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      queue = queue.then(async () => {
        if (!closed) onBuild(await buildPosts({ source, output }));
      }).catch(onError);
    }, 100);
  });
  watcher.on('error', onError);
  return async () => {
    closed = true;
    clearTimeout(timer);
    watcher.close();
    await queue;
  };
}
