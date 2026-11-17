import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import mammoth from 'mammoth';
import { parseCV, buildCV, watchCV } from '../scripts/cv.mjs';

const fixturePath = new URL('./fixtures/cv-cvar.docx', import.meta.url);
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'mendez-cv-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, 'cv'), output = join(root, 'dist/content.mjs');
  await mkdir(source);
  await copyFile(fixturePath, join(source, 'actual.doc'));
  return { source, output };
}

test('CVar imports professional sections across pages and removes repeated page furniture', async () => {
  const { value } = await mammoth.extractRawText({ buffer: await readFile(fixturePath) });
  const profile = parseCV(value);
  assert.equal(profile.name, 'Ana Prueba');
  assert.equal(profile.field, 'Ciencias de la Computación');
  assert.equal(profile.documentDate, '2026-11-13');
  assert.deepEqual(profile.sections.map(section => section.id), ['perfil', 'formacion', 'cursos', 'experiencia', 'publicaciones', 'otros', 'contacto']);
  assert.deepEqual(profile.sections.find(section => section.id === 'formacion').paragraphs,
    ['Doctora en Informática', 'UNIVERSIDAD DE EJEMPLO', 'Año de finalización: 2020', 'Magister en Software', 'Año de finalización: 2016']);
  const content = profile.sections.flatMap(section => section.paragraphs).join('\n');
  assert.doesNotMatch(content, /CVar ES|Fecha de generación|PRUEBA, ANA|\bnull\b/);
  assert.match(content, /<script>alert\(1\)<\/script> & herramientas/);
});

test('professional imports omit private details and retain only the explicitly marked work email', async () => {
  const { value } = await mammoth.extractRawText({ buffer: await readFile(fixturePath) });
  const professional = parseCV(value);
  assert.deepEqual(professional.sections.at(-1).paragraphs, ['Correo electrónico: trabajo@example.edu']);
  assert.doesNotMatch(JSON.stringify(professional), /Calle Privada|01 - 01 - 1980|Casada|555-|privado@example.com|Campus Ejemplo/);
  const complete = parseCV(value, { includePersonalData: true });
  assert.match(complete.sections.find(section => section.id === 'personal').paragraphs.join('\n'), /Calle Privada 123/);
  assert.ok(!parseCV(value.replace('Dirección laboral: Campus Ejemplo', '')).sections.some(section => section.id === 'contacto'));
});

test('unrecognized CVs and invalid generation dates fail with useful errors', async () => {
  const { value } = await mammoth.extractRawText({ buffer: await readFile(fixturePath) });
  assert.throws(() => parseCV('Una nota cualquiera.'), /CVar/);
  assert.throws(() => parseCV(value.replaceAll('13/11/2026', '31/02/2026')), /fecha/);
  assert.equal(parseCV(value.replaceAll('Fecha de generación: 13/11/2026', '')).documentDate, null);
});

test('Word import accepts modern content with a doc extension and writes a deterministic standalone module', async t => {
  const options = await fixture(t);
  await writeFile(join(options.source, '~$actual.doc'), 'Word lock file');
  const input = await readFile(join(options.source, 'actual.doc'));
  const profile = await buildCV(options);
  assert.equal(profile.name, 'Ana Prueba');
  assert.equal(profile.source.filename, 'actual.doc');
  assert.equal(profile.source.sha256, createHash('sha256').update(input).digest('hex'));
  const module = await readFile(options.output, 'utf8');
  await buildCV(options);
  assert.equal(await readFile(options.output, 'utf8'), module);
  assert.deepEqual((await import(options.output)).profile, profile);
  assert.deepEqual(await readFile(join(options.source, 'actual.doc')), input);
  assert.doesNotMatch(module, /\bimport\b|Calle Privada|privado@example.com/);
});

test('missing, ambiguous, unsupported and damaged source files preserve the last working profile', async t => {
  const options = await fixture(t);
  const path = join(options.source, 'actual.doc');
  await buildCV(options);
  const previous = await readFile(options.output, 'utf8');
  await copyFile(fixturePath, join(options.source, 'otro.docx'));
  await assert.rejects(buildCV(options), /único CV.*2/);
  await rm(join(options.source, 'otro.docx'));
  await writeFile(path, Buffer.from([0xd0, 0xcf, 0x11, 0xe0]));
  await assert.rejects(buildCV(options), /actual.doc:.*Word moderno/);
  await writeFile(path, Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  await assert.rejects(buildCV(options), /actual.doc:/);
  await rm(path);
  await assert.rejects(buildCV(options), /único CV.*0/);
  assert.equal(await readFile(options.output, 'utf8'), previous);
});

test('the import policy is validated and can explicitly include personal data', async t => {
  const options = await fixture(t);
  const policy = join(options.source, 'import.json');
  await writeFile(policy, JSON.stringify({ includePersonalData: true }));
  assert.ok((await buildCV(options)).sections.some(section => section.id === 'personal'));
  const previous = await readFile(options.output, 'utf8');
  await writeFile(policy, JSON.stringify({ includePersonalData: 'false' }));
  await assert.rejects(buildCV(options), /includePersonalData/);
  assert.equal(await readFile(options.output, 'utf8'), previous);
});

test('development imports atomic saves and policy changes and recovers after source errors or removal', async t => {
  const options = await fixture(t);
  await buildCV(options);
  let pending;
  const close = watchCV({ ...options, onBuild: profile => pending?.({ profile }), onError: error => pending?.({ error }) });
  t.after(close);
  async function change(action) {
    const result = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('No llegó la actualización del CV.')), 5000);
      pending = event => { clearTimeout(timeout); pending = null; resolve(event); };
    });
    await action();
    return result;
  }
  const path = join(options.source, 'actual.doc');
  const saved = await change(async () => {
    await copyFile(fixturePath, join(options.source, 'save.tmp'));
    await rename(join(options.source, 'save.tmp'), path);
  });
  assert.equal(saved.profile.name, 'Ana Prueba');
  const previous = await readFile(options.output, 'utf8');
  assert.match((await change(() => writeFile(path, 'Incompleto'))).error.message, /actual.doc/);
  assert.equal(await readFile(options.output, 'utf8'), previous);
  assert.equal((await change(() => copyFile(fixturePath, path))).profile.name, 'Ana Prueba');
  const policy = await change(() => writeFile(join(options.source, 'import.json'), JSON.stringify({ includePersonalData: true })));
  assert.ok(policy.profile.sections.some(section => section.id === 'personal'));
  assert.match((await change(() => rm(path))).error.message, /único CV/);
  const restored = await change(() => copyFile(fixturePath, join(options.source, 'nuevo.docx')));
  assert.equal(restored.profile.source.filename, 'nuevo.docx');
});
