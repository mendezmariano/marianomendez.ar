import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parsePost, buildPosts, watchPosts } from '../scripts/posts.mjs';

const article = (body = 'Texto del artículo.', fields = '') => `---\ntitle: "Un artículo"\n${fields}---\n\n${body}\n`;
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'mendez-posts-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, 'posts'), output = join(root, 'dist/posts.mjs');
  await mkdir(source);
  return { source, output };
}

test('Markdown produces readable headings, lists, quotes, links, images and escaped code', () => {
  const post = parsePost(article('# Inicio\n\n## Detalle\n\n**Árbol** y *café*.\n\n- Uno\n- Dos\n\n1. Paso\n\n> Una cita\n\n[Enlace](https://example.com)\n\n![Diagrama](assets/posts/diagrama.png)\n\n```js\nconst mensaje = "<hola>";\n```'), 'prueba.md');
  for (const fragment of ['<h3>Inicio</h3>', '<h4>Detalle</h4>', '<strong>Árbol</strong>', '<em>café</em>', '<ul>', '<ol>', '<blockquote>', 'href="https://example.com"', 'src="assets/posts/diagrama.png" alt="Diagrama"', '<pre><code class="language-js">', '&lt;hola&gt;']) {
    assert.ok(post.html.includes(fragment), fragment);
  }
  assert.equal(post.id, 'prueba');
  assert.equal(post.category, 'Notas');
  assert.equal(post.date, null);
  assert.equal(post.example, false);
});

test('reading time counts article words rather than metadata and URL lengths', () => {
  assert.equal(parsePost(article('hola '.repeat(200)), 'breve.md').minutes, 1);
  assert.equal(parsePost(article('hola '.repeat(201)), 'largo.md').minutes, 2);
  assert.equal(parsePost(article(`[hola](https://example.com/${'texto/'.repeat(500)})`), 'enlace.md').minutes, 1);
});

test('invalid metadata reports the filename and the offending field', () => {
  const invalid = [
    ['---\ncategory: Algo\n---\nTexto', /title/],
    [article('', ''), /contenido/],
    [article('Texto', 'category: []\n'), /category/],
    [article('Texto', 'date: 2026-02-30\n'), /date/],
    [article('Texto', 'date: 2026-13-01\n'), /date/],
    [article('Texto', 'date: 2026-11-07T10:00:00Z\n'), /date/],
    [article('Texto', 'example: "true"\n'), /example/],
    [article('Texto', 'titulo: Otro\n'), /titulo/],
    ['---\ntitle: Sin cierre\nTexto', /metadatos/],
    ['---\ntitle: [\n---\nTexto', /./],
  ];
  for (const [source, message] of invalid) assert.throws(() => parsePost(source, 'invalido.md'), error => {
    assert.match(error.message, /^invalido\.md:/);
    assert.match(error.message, message);
    return true;
  });
  assert.throws(() => parsePost(article(), 'Nombre con espacios.md'), /nombre/);
  assert.equal(parsePost(article('Texto', 'date: 2024-02-29\nexample: true\n'), 'valido.md').date, '2024-02-29');
});

test('embedded HTML and executable links never become active HTML', () => {
  const html = parsePost(article('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[x](javascript:alert%281%29)\n\n[x](vbscript:alert)\n\n[x](data:text/html,test)\n\n![x](data:image/png;base64,AAAA)\n\n[x](jav&#x61;script:alert)\n\n[correo](mailto:me@example.com)\n\n[local](assets/posts/file.png)'), 'seguro.md').html;
  assert.doesNotMatch(html, /<script|<img|href="(?:javascript:|vbscript:|data:)/i);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /href="mailto:me@example.com"/);
  assert.match(html, /href="assets\/posts\/file.png"/);
  assert.throws(() => parsePost('---javascript\n(globalThis.executedMarkdown = true, {title: "Mal"})\n---\nTexto', 'motor.md'), /metadatos/);
  assert.equal(globalThis.executedMarkdown, undefined);
  assert.throws(() => parsePost(article('Texto', 'example: !!js/function "function () {}"\n'), 'tipo.md'));
});

test('build discovers posts, sorts dates and names, and exports a standalone deterministic module', async t => {
  const options = await fixture(t);
  for (const [name, fields] of [['b', ''], ['a', ''], ['viejo', 'date: 2020-01-01\n'], ['nuevo', 'date: 2026-11-07\nexample: true\n']]) {
    await writeFile(join(options.source, `${name}.md`), article('Una idea.', fields));
  }
  await writeFile(join(options.source, 'notas.txt'), 'Ignorar');
  const posts = await buildPosts(options);
  assert.deepEqual(posts.map(post => post.id), ['nuevo', 'viejo', 'a', 'b']);
  assert.equal(posts[0].example, true);
  const first = await readFile(options.output, 'utf8');
  await buildPosts(options);
  assert.equal(await readFile(options.output, 'utf8'), first);
  const generated = await import(options.output);
  assert.deepEqual(generated.posts, posts);
  assert.doesNotMatch(first, /\bimport\b/);
});

test('failed builds preserve the previous module and removing every post produces an empty list', async t => {
  const options = await fixture(t);
  const path = join(options.source, 'uno.md');
  await writeFile(path, article());
  await buildPosts(options);
  const previous = await readFile(options.output, 'utf8');
  await writeFile(path, 'Sin metadatos');
  await assert.rejects(buildPosts(options), /uno.md/);
  assert.equal(await readFile(options.output, 'utf8'), previous);
  await rm(path);
  assert.deepEqual(await buildPosts(options), []);
  assert.match(await readFile(options.output, 'utf8'), /export const posts = \[\];/);
});

test('development watches additions, atomic saves, errors, recovery and deletions', async t => {
  const options = await fixture(t);
  await buildPosts(options);
  let pending;
  const close = watchPosts({ ...options,
    onBuild: posts => pending?.({ posts }), onError: error => pending?.({ error }),
  });
  t.after(close);
  async function change(action) {
    const result = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('No llegó la actualización de Markdown.')), 5000);
      pending = event => { clearTimeout(timeout); pending = null; resolve(event); };
    });
    await action();
    return result;
  }
  const path = join(options.source, 'nuevo.md');
  assert.equal((await change(() => writeFile(path, article('Primero')))).posts.length, 1);
  const event = await change(async () => {
    await writeFile(join(options.source, 'save.tmp'), article('Texto actualizado'));
    await rename(join(options.source, 'save.tmp'), path);
  });
  assert.match(event.posts[0].html, /Texto actualizado/);
  const previous = await readFile(options.output, 'utf8');
  assert.match((await change(() => writeFile(path, 'Roto'))).error.message, /nuevo.md/);
  assert.equal(await readFile(options.output, 'utf8'), previous);
  assert.match((await change(() => writeFile(path, article('Corregido')))).posts[0].html, /Corregido/);
  assert.deepEqual((await change(() => rm(path))).posts, []);
});
