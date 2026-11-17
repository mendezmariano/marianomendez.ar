import { readFile, readdir, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { watch } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import mammoth from 'mammoth';

export const cvDirectory = fileURLToPath(new URL('../cv/', import.meta.url));
export const cvOutput = fileURLToPath(new URL('../dist/content.js', import.meta.url));
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const isDocument = name => !/^(?:~\$|\.)/.test(name) && /\.docx?$/i.test(name);
const headings = new Map([
  ['datos personales', ['personal', 'Datos personales']],
  ['formacion academica', ['formacion', 'Formación académica']],
  ['formacion complementaria', ['cursos', 'Formación complementaria']],
  ['antecedentes en cyt', ['experiencia', 'Antecedentes en ciencia y tecnología']],
  ['publicaciones', ['publicaciones', 'Publicaciones']],
  ['otros antecedentes cyt', ['otros', 'Otros antecedentes']],
]);

export function parseCV(text, { includePersonalData = false } = {}) {
  const paragraphs = text.replace(/\r\n?/g, '\n').split(/\n\s*\n/)
    .map(value => value.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const valueOf = label => paragraphs.find(value => normalize(value).startsWith(`${label}:`))?.split(':').slice(1).join(':').trim();
  const firstName = valueOf('nombre');
  const lastName = valueOf('apellido');
  if (!firstName || !lastName || !paragraphs.some(value => normalize(value) === 'formacion academica')) {
    throw new Error('No se reconoce el CV de CVar. Debe incluir Nombre, Apellido y Formación académica.');
  }
  const name = `${firstName} ${lastName}`.toLocaleLowerCase('es').replace(/(^|\s)(\p{L})/gu, (_, space, letter) => space + letter.toLocaleUpperCase('es'));
  const repeatedName = normalize(`${lastName}, ${firstName}`);
  const dateText = paragraphs.find(value => normalize(value).startsWith('fecha de generacion:'));
  const date = dateText?.match(/(\d{2})\/(\d{2})\/(\d{4})$/);
  const documentDate = date ? `${date[3]}-${date[2]}-${date[1]}` : null;
  if (documentDate && (Number.isNaN(Date.parse(documentDate)) || new Date(documentDate).toISOString().slice(0, 10) !== documentDate)) {
    throw new Error('La fecha de generación del CV no es válida.');
  }
  const sections = [{ id: 'perfil', title: 'Perfil', paragraphs: [] }];
  let section = sections[0];
  let workContact = false;
  const contact = [];
  for (const paragraph of paragraphs) {
    const key = normalize(paragraph);
    if (key === repeatedName || key.startsWith('cvar es una iniciativa') || key.startsWith('fecha de generacion:') || key === 'null') continue;
    if (headings.has(key)) {
      const [id, title] = headings.get(key);
      section = { id, title, paragraphs: [] };
      sections.push(section);
      continue;
    }
    if (section.id === 'personal' && !includePersonalData) {
      if (key.startsWith('direccion laboral:')) workContact = true;
      if (key.startsWith('direccion residencial:')) workContact = false;
      if ((workContact && key.startsWith('correo electronico:')) || key.startsWith('correo electronico laboral:')) contact.push(paragraph);
      continue;
    }
    section.paragraphs.push(paragraph);
  }
  if (contact.length) sections.push({ id: 'contacto', title: 'Contacto laboral', paragraphs: contact });
  const field = sections[0].paragraphs.find(value => normalize(value).startsWith('ciencias naturales y exactas'))?.split('>').at(-1).trim() ?? '';
  const populated = sections.filter(item => item.paragraphs.length);
  if (!populated.some(item => item.id === 'formacion')) throw new Error('La sección Formación académica está vacía.');
  return { name, field, documentDate, sections: populated };
}

async function readPolicy(source) {
  let text;
  try {
    text = await readFile(resolve(source, 'import.json'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return { includePersonalData: false };
    throw error;
  }
  const policy = JSON.parse(text);
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)
    || Object.keys(policy).some(key => key !== 'includePersonalData') || typeof policy.includePersonalData !== 'boolean') {
    throw new Error('cv/import.json debe contener únicamente includePersonalData con valor true o false.');
  }
  return policy;
}

export async function buildCV({ source = cvDirectory, output = cvOutput } = {}) {
  const entries = await readdir(source, { withFileTypes: true });
  const documents = entries.filter(entry => entry.isFile() && isDocument(entry.name));
  if (documents.length !== 1) throw new Error(`Dejá un único CV de Word en ${source}. Se encontraron ${documents.length}.`);
  const filename = documents[0].name;
  let profile;
  try {
    const policy = await readPolicy(source);
    const buffer = await readFile(resolve(source, filename));
    if (!buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
      throw new Error('Guardá el documento como Word moderno (.docx). También se acepta ese formato con extensión .doc.');
    }
    const result = await mammoth.extractRawText({ buffer });
    const extractionError = result.messages.find(message => message.type === 'error');
    if (extractionError) throw new Error(extractionError.message);
    profile = { ...parseCV(result.value, policy), source: { filename, sha256: createHash('sha256').update(buffer).digest('hex') } };
  } catch (error) {
    throw new Error(`${filename}: ${error.message}`, { cause: error });
  }
  const module = `// Generado por npm run build. Editá el documento de cv/, no este archivo.\nexport const profile = ${JSON.stringify(profile, null, 2)};\n`;
  await mkdir(dirname(output), { recursive: true });
  const temporary = `${output}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, module);
    await rename(temporary, output);
  } finally {
    await rm(temporary, { force: true });
  }
  return profile;
}

export function watchCV({ source = cvDirectory, output = cvOutput, onBuild = () => {}, onError = console.error } = {}) {
  let timer;
  let queue = Promise.resolve();
  let closed = false;
  const watcher = watch(source, (_event, filename) => {
    if (filename && !isDocument(String(filename)) && String(filename) !== 'import.json') return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      queue = queue.then(async () => {
        if (!closed) onBuild(await buildCV({ source, output }));
      }).catch(onError);
    }, 150);
  });
  watcher.on('error', onError);
  return async () => {
    closed = true;
    clearTimeout(timer);
    watcher.close();
    await queue;
  };
}
