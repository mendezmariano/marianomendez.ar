// Exercise app.js event wiring with DOM and Canvas test doubles. This is not browser QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { posts } from '../dist/posts.js';
import { profile } from '../dist/content.js';
import { parsePost } from '../scripts/posts.mjs';

class Element {
  constructor(tag='div') {
    this.tagName=tag;this.dataset={};this.style={setProperty(name,value){this[name]=value;},removeProperty(name){delete this[name];}};this.attributes={};this.children=[];this.listeners={};
    this.textContent='';this.innerHTML='';this.open=false;this.value='384';this.hidden=false;
    this.scrollTop=0;
    const names=new Set();
    this.classList={add:name=>names.add(name),remove:name=>names.delete(name),toggle:(name,on)=>on?names.add(name):names.delete(name),contains:name=>names.has(name)};
  }
  append(child) { this.children.push(child); }
  setAttribute(name,value) { this.attributes[name]=value; }
  addEventListener(name,fn) { (this.listeners[name]??=[]).push(fn); }
  emit(name,event={}) { for(const fn of this.listeners[name]??[])fn({target:this,preventDefault(){},...event}); }
  // Generated controls and content regions needed by the readers are modeled.
  set innerHTML(value) {
    this.markup = value;
    this.children = [...value.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/g)].filter(([, tag, attributes]) => ['pre', 'table'].includes(tag) || /\bid=|\bdata-post=|\bdata-cv-section=/.test(attributes)).map(([, tag, attributes]) => {
      const child = new Element(tag);
      child.id = attributes.match(/\bid="([^"]+)"/)?.[1];
      const post = attributes.match(/data-post="([^"]+)"/)?.[1];
      if (post) child.dataset.post = post;
      const cvSection = attributes.match(/data-cv-section="([^"]+)"/)?.[1];
      if (cvSection) child.dataset.cvSection = cvSection;
      return child;
    });
  }
  get innerHTML() { return this.markup; }
  get disabled() { return this.isDisabled ?? false; }
  set disabled(value) {
    this.isDisabled = value;
    if (value && globalThis.document?.activeElement === this) {
      this.focused = false;
      document.activeElement = null;
    }
  }
  querySelectorAll(selector) {
    if (selector === '[data-target]') return this.children.filter(c => c.dataset.target);
    if (selector === '[data-post]') return this.children.filter(c => c.dataset.post);
    if (selector === '[data-cv-section]') return this.children.filter(c => c.dataset.cvSection);
    if (selector === '.article-content pre, .article-content table') return this.children.filter(c => ['pre', 'table'].includes(c.tagName));
    if (selector.startsWith('#')) return this.children.filter(c => c.id === selector.slice(1));
    return [];
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0]; }
  closest(selector) { return selector.split(',').map(s=>s.trim()).includes(this.tagName)?this:null; }
  getBoundingClientRect() { return {left:0,top:0,width:768,height:352}; }
  setPointerCapture(id) { this.pointerId=id; }
  hasPointerCapture(id) { return this.pointerId===id; }
  releasePointerCapture() { this.pointerId=null; }
  focus() { if(document.activeElement)document.activeElement.focused=false;document.activeElement=this;this.focused=true; }
  showModal() { this.open=true; }
  close() { this.open=false;this.emit('close'); }
  getContext() { return new Proxy({}, {get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>(target[key]=value,true)}); }
}
let loadNumber=0;
async function loadApp(t,{reducedMotion=false,storage}={}) {
  const source=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  const elements=new Map([...source.matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"/g)].map(([,tag,id])=>[id,new Element(tag)]));
  const quick=[new Element('button'),new Element('button')];quick[0].dataset.open='blog';quick[1].dataset.open='cv';
  const document=new Element();
  document.createElement=tag=>new Element(tag);
  document.querySelector=selector=>elements.get(selector.slice(1)) ?? elements.get('terminal-body').querySelector(selector);
  document.querySelectorAll=selector=>selector==='[data-target]'?elements.get('hotspots').children:selector==='[data-open]'?quick:[];
  const window=new Element();
  let frame,now=0;
  const globals={document,window,localStorage:storage,matchMedia:()=>({matches:reducedMotion}),requestAnimationFrame:callback=>{frame=callback;},setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1};
  const originals=new Map(Object.keys(globals).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  for(const [key,value] of Object.entries(globals))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
  t.after(()=>{for(const [key,descriptor] of originals)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];});
  await import(`../dist/app.js?interaction-test=${loadNumber++}`);
  return {get:id=>elements.get(id),object:id=>elements.get('hotspots').children.find(button=>button.dataset.target===id),window,quick,
    advance:seconds=>{for(let i=0;i<Math.ceil(seconds/.02);i++){now+=20;frame(now);}}};
}

test('Mirar describes a terminal, then a direct object click opens its contents',async t=>{
  const app=await loadApp(t,{reducedMotion:true});
  app.get('look-button').emit('click');
  assert.equal(app.get('look-button').attributes['aria-pressed'],'true');
  app.object('blog').emit('click');app.advance(.02);
  assert.match(app.get('speech').textContent,/terminal principal/i);
  assert.equal(app.get('terminal-dialog').open,false);
  assert.equal(app.get('look-button').attributes['aria-pressed'],'false');
  app.object('blog').emit('click');app.advance(.02);
  assert.equal(app.get('terminal-dialog').open,true);
  assert.match(app.get('terminal-body').innerHTML,/Ideas desde el laboratorio/);
});

for(const [id,title,url] of [
  ['memoryBook','Memoria virtual','https://mendezmariano.github.io/memoria-virtual/'],
  ['planningBook','Principios de Planificacion','https://raw.githack.com/mendezmariano/planificacion/4bef5f638a2bd559d73be9eb84bc4e288d76d72c/dist/index.html'],
]) {
  test(`${title} opens in a new tab and cancels pending terminal visits`, async t => {
    const app = await loadApp(t);
    const book = app.object(id);
    assert.equal(book.tagName, 'a');
    assert.equal(book.href, url);
    assert.equal(book.target, '_blank');
    assert.equal(book.rel, 'noopener noreferrer');
    assert.equal(book.attributes['aria-label'], `Abrir ${title} (en otra pestaña)`);
    assert.equal(book.children[0].textContent, title);
    assert.equal(book.hidden, true);
    app.get('camera-position').value = '0';
    app.get('camera-position').emit('input');
    assert.equal(book.hidden, false);
    app.object('blog').emit('click');
    let prevented = false;
    book.emit('click', { preventDefault() { prevented = true; } });
    app.advance(8);
    assert.equal(prevented, false);
    assert.equal(app.get('terminal-dialog').open, false);
    assert.equal(app.get('speech').classList.contains('hidden'), true);
  });

  test(`Mirar describes ${title} without following its link, then the next click follows it`, async t => {
    const app = await loadApp(t, { reducedMotion: true });
    const book = app.object(id);
    app.get('look-button').emit('click');
    let prevented = false;
    book.emit('click', { preventDefault() { prevented = true; } });
    app.advance(.02);
    assert.equal(prevented, true);
    assert.ok(app.get('speech').textContent.startsWith(title + '.'));
    assert.match(app.get('speech').textContent, /otra pestaña/);
    assert.equal(app.get('look-button').attributes['aria-pressed'], 'false');
    assert.equal(app.get('terminal-dialog').open, false);
    prevented = false;
    book.emit('click', { preventDefault() { prevented = true; } });
    assert.equal(prevented, false);
  });

  test(`pointer and keyboard input on ${title} do not drag the scene or make Mariano walk`, async t => {
    const app = await loadApp(t);
    const scene = app.get('scene');
    const book = app.object(id);
    app.get('camera-position').value = '0';
    app.get('camera-position').emit('input');
    scene.emit('pointerdown', { target: book, button: 0, pointerId: 1, clientX: 219, clientY: 140 });
    scene.emit('pointermove', { target: book, pointerId: 1, clientX: 80, clientY: 140 });
    scene.emit('pointerup', { target: book, pointerId: 1 });
    assert.equal(app.get('camera-position').value, '0');
    assert.equal(scene.hasPointerCapture(1), false);
    app.window.emit('keydown', { target: book, key: 'ArrowLeft' });
    app.advance(1);
    app.get('greet-button').emit('click');
    assert.equal(app.get('camera-position').value, '480');
  });
}

test('Saludar addresses the visitor and cancels a terminal opening in progress',async t=>{
  const app=await loadApp(t);
  app.object('blog').emit('click');app.advance(.04);
  app.get('greet-button').emit('click');app.advance(3);
  assert.match(app.get('speech').textContent,/a vos, del otro lado de la pantalla/);
  assert.equal(app.get('terminal-dialog').open,false);
  assert.equal(app.get('look-button').attributes['aria-pressed'],'false');
});

test('camera controls reveal both side rooms and clamp at either end',async t=>{
  const app=await loadApp(t);
  app.get('camera-position').value='0';app.get('camera-position').emit('input');app.advance(.1);
  assert.equal(app.object('library').hidden,false);
  assert.equal(app.object('workbench').hidden,true);
  assert.equal(app.get('pan-left').disabled,true);
  for(let i=0;i<5;i++)app.get('pan-right').emit('click');app.advance(.1);
  assert.equal(app.get('camera-position').value,'768');
  assert.equal(app.object('workbench').hidden,false);
  assert.equal(app.object('library').hidden,true);
  assert.equal(app.get('pan-right').disabled,true);
});

test('horizontal drag pans the view and its release does not trigger walking',async t=>{
  const app=await loadApp(t),scene=app.get('scene');
  const target=app.get('lab-canvas');
  scene.emit('pointerdown',{target,button:0,pointerId:1,clientX:600,clientY:320});
  scene.emit('pointermove',{target,pointerId:1,clientX:100,clientY:320});
  scene.emit('pointerup',{target,pointerId:1});
  scene.emit('click',{target,clientX:100,clientY:320});
  app.advance(2);
  assert.equal(app.get('camera-position').value,'768');
  app.get('greet-button').emit('click');
  assert.equal(app.get('camera-position').value,'480');
});

test('vertical wheel keeps page scrolling, horizontal wheel pans the laboratory',async t=>{
  const app=await loadApp(t);let prevented=false;
  app.get('scene').emit('wheel',{deltaX:0,deltaY:80,deltaMode:0,preventDefault(){prevented=true;}});
  assert.equal(prevented,false);assert.equal(app.get('camera-position').value,'384');
  app.get('scene').emit('wheel',{deltaX:100,deltaY:0,deltaMode:0,preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(app.get('camera-position').value,'484');
});

test('camera slider keyboard input does not also make the character walk',async t=>{
  const app=await loadApp(t);
  app.window.emit('keydown',{target:app.get('camera-position'),key:'ArrowRight'});app.advance(1);
  app.get('greet-button').emit('click');
  assert.equal(app.get('camera-position').value,'480');
});

test('the reader opens generated Markdown, returns to the list and restores keyboard focus', async t => {
  const app = await loadApp(t);
  app.quick[0].emit('click');
  const body = app.get('terminal-body');
  const buttons = body.querySelectorAll('[data-post]');
  assert.equal(buttons.length, posts.length);
  buttons[1].emit('click');
  assert.ok(body.innerHTML.includes(posts[1].html));
  assert.match(body.innerHTML, /Entrada de ejemplo/);
  assert.doesNotMatch(body.innerHTML, /visitante@cluster|fin del archivo/);
  assert.equal(app.get('terminal-dialog').attributes['aria-labelledby'], 'article-title');
  const back = app.get('back-to-posts');
  assert.equal(back.focused, true);
  back.emit('click');
  assert.equal(body.querySelectorAll('[data-post]').length, posts.length);
  assert.equal(body.querySelectorAll('[data-post]')[1].focused, true);
  assert.equal(app.get('reader-controls').hidden, true);
  assert.equal(app.get('terminal-dialog').classList.contains('reader-dialog'), false);
  app.get('close-terminal').emit('click');
  assert.equal(app.get('terminal-dialog').open, false);
  assert.equal(app.quick[0].focused, true);
});

test('articles start as a light notebook and changing preferences preserves the article, focus and scroll', async t => {
  const app = await loadApp(t);
  app.quick[0].emit('click');
  const body = app.get('terminal-body');
  body.querySelector('[data-post]').emit('click');
  const terminal = app.get('terminal-dialog');
  assert.equal(terminal.classList.contains('reader-dialog'), true);
  assert.equal(terminal.dataset.readerTheme, 'light');
  assert.equal(terminal.style['--reader-font-size'], '1.125rem');
  assert.equal(app.get('reader-controls').hidden, false);
  const title = body.querySelector('#article-title');
  const content = body.innerHTML;
  body.scrollTop = 480;
  for (const id of ['reader-dark', 'reader-larger', 'reader-light']) {
    const control = app.get(id);
    control.focus();
    control.emit('click');
    assert.equal(control.focused, true);
    assert.equal(body.scrollTop, 480);
    assert.equal(body.innerHTML, content);
    assert.equal(body.querySelector('#article-title'), title);
  }
  assert.equal(terminal.dataset.readerTheme, 'light');
  assert.equal(terminal.style['--reader-font-size'], '1.25rem');
  assert.equal(app.get('reader-light').attributes['aria-pressed'], 'true');
  assert.equal(app.get('reader-dark').attributes['aria-pressed'], 'false');
});

test('reader font controls stop at both limits and keep keyboard focus on an available control', async t => {
  const app = await loadApp(t);
  app.quick[0].emit('click');
  app.get('terminal-body').querySelector('[data-post]').emit('click');
  const smaller = app.get('reader-smaller');
  const larger = app.get('reader-larger');
  smaller.focus();
  smaller.emit('click');
  assert.equal(app.get('reader-size').textContent, '16 px');
  assert.equal(smaller.disabled, true);
  assert.equal(larger.focused, true);
  for (let i = 0; i < 6; i++) larger.emit('click');
  assert.equal(app.get('reader-size').textContent, '24 px');
  assert.equal(larger.disabled, true);
  assert.equal(smaller.disabled, false);
  assert.equal(smaller.focused, true);
  for (let i = 0; i < 6; i++) smaller.emit('click');
  assert.equal(app.get('reader-size').textContent, '16 px');
});

test('resizing text keeps the same relative reading position inside the visible paragraph', async t => {
  const app = await loadApp(t);
  app.quick[0].emit('click');
  const body = app.get('terminal-body');
  body.querySelector('[data-post]').emit('click');
  body.scrollTop = 700;
  body.getBoundingClientRect = () => ({top: 100});
  const paragraph = {getBoundingClientRect() {
    const enlarged = app.get('reader-size').textContent === '20 px';
    const top = 100 + (enlarged ? 650 : 600) - body.scrollTop;
    const height = enlarged ? 240 : 200;
    return {top, height, bottom: top + height};
  }};
  const query = body.querySelectorAll.bind(body);
  body.querySelectorAll = selector => selector === '.article-header, .article-content > *' ? [paragraph] : query(selector);
  app.get('reader-larger').emit('click');
  assert.equal(body.scrollTop, 770);
  const rect = paragraph.getBoundingClientRect();
  assert.equal((100 - rect.top) / rect.height, .5);
});

test('the reader preserves rich Markdown and gives keyboard access to code and tables', async t => {
  const source = await readFile(new URL('./fixtures/reader-article.md', import.meta.url), 'utf8');
  const post = parsePost(source, 'reader-article.md');
  posts.push(post);
  t.after(() => posts.pop());
  const app = await loadApp(t);
  app.quick[0].emit('click');
  const body = app.get('terminal-body');
  body.querySelectorAll('[data-post]').find(button => button.dataset.post === post.id).emit('click');
  assert.ok(body.innerHTML.includes(post.html));
  assert.match(body.innerHTML, /<time datetime="2026-11-18">2026-11-18<\/time>/);
  for (const tag of ['h4', 'ul', 'ol', 'blockquote', 'img', 'pre', 'table']) assert.ok(post.html.includes(`<${tag}`), tag);
  const regions = body.querySelectorAll('.article-content pre, .article-content table');
  assert.equal(regions.length, 2);
  for (const region of regions) assert.equal(region.tabIndex, 0);
  assert.equal(regions.find(region => region.tagName === 'pre').attributes['aria-label'], 'Bloque de código');
});

test('reader preferences survive reopening and a new page load without styling the CV or article list', async t => {
  const values = new Map();
  const storage = {getItem:key=>values.get(key) ?? null,setItem:(key,value)=>values.set(key,value)};
  await t.test('choose preferences and open the CV', async t => {
    const app = await loadApp(t, {storage});
    app.quick[0].emit('click');
    app.get('terminal-body').querySelector('[data-post]').emit('click');
    app.get('reader-dark').emit('click');
    app.get('reader-larger').emit('click');
    app.get('close-terminal').emit('click');
    assert.equal(app.get('terminal-dialog').classList.contains('reader-dialog'), false);
    assert.equal(app.get('reader-controls').hidden, true);
    app.quick[1].emit('click');
    assert.equal(app.get('terminal-dialog').dataset.readerTheme, undefined);
    assert.equal(app.get('terminal-dialog').style['--reader-font-size'], undefined);
    assert.equal(app.get('terminal-dialog').attributes['aria-labelledby'], 'terminal-title');
    assert.ok(app.get('terminal-body').innerHTML.includes(profile.name));
    app.quick[0].emit('click');
    assert.equal(app.get('reader-controls').hidden, true);
    app.get('terminal-body').querySelector('[data-post]').emit('click');
    assert.equal(app.get('terminal-dialog').dataset.readerTheme, 'dark');
    assert.equal(app.get('reader-size').textContent, '20 px');
  });
  await t.test('reload the page with saved preferences', async t => {
    const app = await loadApp(t, {storage});
    app.quick[0].emit('click');
    app.get('terminal-body').querySelector('[data-post]').emit('click');
    assert.equal(app.get('terminal-dialog').dataset.readerTheme, 'dark');
    assert.equal(app.get('reader-size').textContent, '20 px');
  });
});

test('invalid or unavailable preference storage falls back safely and controls still work for the session', async t => {
  const cases = ['invalid json', 'null', '[]', '{"theme":"sepia","fontSize":999}', '{"theme":"light","fontSize":"20"}', '{"fontSize":19}'];
  const unavailable = {getItem(){throw new Error('Storage blocked');},setItem(){throw new Error('Storage full');}};
  for (const stored of [...cases, unavailable]) await t.test(String(stored), async t => {
    const storage = typeof stored === 'string' ? {getItem:()=>stored,setItem(){}} : stored;
    const app = await loadApp(t, {storage});
    app.quick[0].emit('click');
    app.get('terminal-body').querySelector('[data-post]').emit('click');
    assert.equal(app.get('terminal-dialog').dataset.readerTheme, 'light');
    assert.equal(app.get('reader-size').textContent, '18 px');
    app.get('reader-dark').emit('click');
    app.get('reader-larger').emit('click');
    app.get('back-to-posts').emit('click');
    app.get('terminal-body').querySelector('[data-post]').emit('click');
    assert.equal(app.get('terminal-dialog').dataset.readerTheme, 'dark');
    assert.equal(app.get('reader-size').textContent, '20 px');
  });
});

test('the CV terminal reads imported sections through buttons and accented commands', async t => {
  const app = await loadApp(t);
  app.quick[1].emit('click');
  const body = app.get('terminal-body');
  assert.equal(app.get('terminal-dialog').open, true);
  assert.ok(body.innerHTML.includes(profile.name));
  assert.doesNotMatch(body.innerHTML, /Perfil en preparación/);
  const buttons = body.querySelectorAll('[data-cv-section]');
  assert.equal(buttons.length, profile.sections.length);
  const content = body.querySelector('#cv-content');
  const input = body.querySelector('#command-input');
  const form = body.querySelector('#command-form');
  const output = body.querySelector('#command-output');
  const escaped = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  for (const section of profile.sections) {
    const button = buttons.find(item => item.dataset.cvSection === section.id);
    button.emit('click');
    assert.equal(button.attributes['aria-pressed'], 'true');
    assert.ok(content.innerHTML.includes(escaped(section.paragraphs[0])));
  }
  input.value = 'FORMACIÓN'; form.emit('submit');
  assert.ok(content.innerHTML.includes(escaped(profile.sections.find(section => section.id === 'formacion').paragraphs[0])));
  assert.equal(input.value, '');
  input.value = 'ayuda'; form.emit('submit');
  for (const section of profile.sections) assert.ok(output.textContent.includes(section.id));
  input.value = 'desconocido'; form.emit('submit');
  assert.match(output.textContent, /Comando no reconocido/);
  input.value = 'limpiar'; form.emit('submit');
  assert.equal(output.textContent, '');
  input.value = 'salir'; form.emit('submit');
  assert.equal(app.get('terminal-dialog').open, false);
  assert.equal(app.quick[1].focused, true);
});

test('Word content remains text instead of executable markup in the CV terminal', async t => {
  const original = profile.sections;
  profile.sections = [{ id: 'perfil', title: 'Perfil <b>literal</b>', paragraphs: ['<img src=x onerror=alert(1)> & texto'] }];
  t.after(() => { profile.sections = original; });
  const app = await loadApp(t);
  app.quick[1].emit('click');
  const content = app.get('terminal-body').querySelector('#cv-content').innerHTML;
  assert.match(content, /&lt;img src=x onerror=alert\(1\)&gt; &amp; texto/);
  assert.match(content, /Perfil &lt;b&gt;literal&lt;\/b&gt;/);
  assert.doesNotMatch(content, /<img|<b>/);
});
