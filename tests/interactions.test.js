// Exercise app.js event wiring with DOM and Canvas test doubles. This is not browser QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { posts } from '../dist/posts.js';

class Element {
  constructor(tag='div') {
    this.tagName=tag;this.dataset={};this.style={};this.attributes={};this.children=[];this.listeners={};
    this.textContent='';this.innerHTML='';this.open=false;this.value='384';this.hidden=false;
    const names=new Set();
    this.classList={add:name=>names.add(name),remove:name=>names.delete(name),toggle:(name,on)=>on?names.add(name):names.delete(name),contains:name=>names.has(name)};
  }
  append(child) { this.children.push(child); }
  setAttribute(name,value) { this.attributes[name]=value; }
  addEventListener(name,fn) { (this.listeners[name]??=[]).push(fn); }
  emit(name,event={}) { for(const fn of this.listeners[name]??[])fn({target:this,preventDefault(){},...event}); }
  // Only the generated buttons needed to exercise reader navigation are modeled.
  set innerHTML(value) {
    this.markup = value;
    this.children = [...value.matchAll(/<button\b([^>]*)>/g)].map(([, attributes]) => {
      const child = new Element('button');
      child.id = attributes.match(/\bid="([^"]+)"/)?.[1];
      const post = attributes.match(/data-post="([^"]+)"/)?.[1];
      if (post) child.dataset.post = post;
      return child;
    });
  }
  get innerHTML() { return this.markup; }
  querySelectorAll(selector) {
    if (selector === '[data-target]') return this.children.filter(c => c.dataset.target);
    if (selector === '[data-post]') return this.children.filter(c => c.dataset.post);
    if (selector.startsWith('#')) return this.children.filter(c => c.id === selector.slice(1));
    return [];
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0]; }
  closest(selector) { return selector.split(',').map(s=>s.trim()).includes(this.tagName)?this:null; }
  getBoundingClientRect() { return {left:0,top:0,width:768,height:352}; }
  setPointerCapture(id) { this.pointerId=id; }
  hasPointerCapture(id) { return this.pointerId===id; }
  releasePointerCapture() { this.pointerId=null; }
  focus() { this.focused=true; }
  showModal() { this.open=true; }
  close() { this.open=false;this.emit('close'); }
  getContext() { return new Proxy({}, {get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>(target[key]=value,true)}); }
}
let loadNumber=0;
async function loadApp(t,{reducedMotion=false}={}) {
  const source=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  const elements=new Map([...source.matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"/g)].map(([,tag,id])=>[id,new Element(tag)]));
  const quick=[new Element('button'),new Element('button')];quick[0].dataset.open='blog';quick[1].dataset.open='cv';
  const document=new Element();
  document.createElement=tag=>new Element(tag);
  document.querySelector=selector=>elements.get(selector.slice(1)) ?? elements.get('terminal-body').querySelector(selector);
  document.querySelectorAll=selector=>selector==='[data-target]'?elements.get('hotspots').children:selector==='[data-open]'?quick:[];
  const window=new Element();
  let frame,now=0;
  const globals={document,window,matchMedia:()=>({matches:reducedMotion}),requestAnimationFrame:callback=>{frame=callback;},setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1};
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

test('the library book links to Memoria virtual in a new tab and cancels pending terminal visits', async t => {
  const app = await loadApp(t);
  const book = app.object('memoryBook');
  assert.equal(book.tagName, 'a');
  assert.equal(book.href, 'https://mendezmariano.github.io/memoria-virtual/');
  assert.equal(book.target, '_blank');
  assert.equal(book.rel, 'noopener noreferrer');
  assert.match(book.attributes['aria-label'], /Memoria virtual.*otra pestaña/);
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

test('Mirar describes the library book without following its link, then the next click follows it', async t => {
  const app = await loadApp(t, { reducedMotion: true });
  const book = app.object('memoryBook');
  app.get('look-button').emit('click');
  let prevented = false;
  book.emit('click', { preventDefault() { prevented = true; } });
  app.advance(.02);
  assert.equal(prevented, true);
  assert.match(app.get('speech').textContent, /Memoria virtual.*otra pestaña/);
  assert.equal(app.get('look-button').attributes['aria-pressed'], 'false');
  assert.equal(app.get('terminal-dialog').open, false);
  prevented = false;
  book.emit('click', { preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
});

test('pointer and keyboard input on the book do not drag the scene or make Mariano walk', async t => {
  const app = await loadApp(t);
  const scene = app.get('scene');
  const book = app.object('memoryBook');
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
  buttons[0].emit('click');
  assert.ok(body.innerHTML.includes(posts[0].html));
  assert.ok(body.innerHTML.includes(`${posts[0].id}.md`));
  assert.match(body.innerHTML, /ENTRADA DE EJEMPLO/);
  const back = body.querySelector('#back-to-posts');
  assert.equal(back.focused, true);
  back.emit('click');
  assert.equal(body.querySelectorAll('[data-post]').length, posts.length);
  assert.equal(body.querySelector('[data-post]').focused, true);
  app.get('close-terminal').emit('click');
  assert.equal(app.get('terminal-dialog').open, false);
  assert.equal(app.quick[0].focused, true);
});
