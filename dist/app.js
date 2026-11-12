import { profile } from './content.js';
import { posts } from './posts.js';
import { createCharacter, walkTo, stepCharacter, moveWithKeys, stopCharacter, greet, targets, WIDTH, HEIGHT, WORLD_WIDTH, FLOOR, createCamera, panCamera, revealCharacter, stepCamera, scenePoint } from './world.js';
import { createRenderer } from './scene.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#lab-canvas');
const scene = $('#scene');
const renderer = createRenderer(canvas);
const character = createCharacter();
const camera = createCamera();
const hotspots = $('#hotspots');
const cameraRange = $('#camera-position');
const lookButton = $('#look-button');
const greetButton = $('#greet-button');
let looking = false;
let pointer = null;
let dragged = false;
for (const [id, target] of Object.entries(targets)) {
  const button = document.createElement('button');
  button.className = 'hotspot';
  button.dataset.target = id;
  button.setAttribute('aria-label', `Explorar ${target.label}`);
  const label = document.createElement('span');
  label.className = 'hotspot-label';
  label.textContent = target.label;
  button.append(label);
  hotspots.append(button);
}
const objectButtons = [...hotspots.querySelectorAll('[data-target]')];
function updateCameraControls() {
  for (const button of objectButtons) {
    const [x, y, width, height] = targets[button.dataset.target].bounds;
    button.hidden = x + width <= camera.x || x >= camera.x + WIDTH;
    button.style.left = `${(x - camera.x) / WIDTH * 100}%`;
    button.style.top = `${y / HEIGHT * 100}%`;
    button.style.width = `${width / WIDTH * 100}%`;
    button.style.height = `${height / HEIGHT * 100}%`;
  }
  cameraRange.value = String(Math.round(camera.x));
  $('#pan-left').disabled = camera.x <= 0;
  $('#pan-right').disabled = camera.x >= WORLD_WIDTH - WIDTH;
  $('#camera-location').textContent = camera.x < 220 ? 'ALA OESTE · BIBLIOTECA' : camera.x > 560 ? 'ALA ESTE · EXPERIMENTOS' : 'SALA CENTRAL · CÓMPUTO';
}
updateCameraControls();
const terminal = $('#terminal-dialog');
const help = $('#help-dialog');
const body = $('#terminal-body');
const speech = $('#speech');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let speechTimer;
let lastTime = 0;
let returnFocus = null;
let ambient = null;
let soundEnabled = false;
const keys = new Set();
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function say(message, duration=4800){
  speech.textContent=message;speech.classList.remove('hidden');clearTimeout(speechTimer);
  speechTimer=setTimeout(()=>speech.classList.add('hidden'),duration);
}
function setLooking(value) {
  looking = value;
  lookButton.setAttribute('aria-pressed', String(value));
  scene.classList.toggle('is-looking', value);
}
function interact(id, trigger) {
  const target = targets[id];
  returnFocus = trigger;
  const kind = looking ? 'look' : 'use';
  setLooking(false);
  keys.clear();
  camera.following = true;
  speech.classList.add('hidden');
  walkTo(character, target.x, target.y, { kind, target: id });
  playTone(230, .04);
}
function activate(action) {
  if (action.kind === 'use' && ['blog', 'cv'].includes(action.target)) openTerminal(action.target);
  else say(targets[action.target].description, 7000);
}
function stopWalking() { keys.clear(); stopCharacter(character); }
function moveCamera(x) {
  stopWalking();
  panCamera(camera, x);
  updateCameraControls();
}

function showBlog(){
  $('#terminal-title').textContent='MENDEZ-OS / BITÁCORA';
  body.innerHTML=`<p class="terminal-prompt"><b>visitante@cluster</b>:~/bitacora$ ls</p><h2>Ideas desde el laboratorio.</h2><p class="terminal-subtitle">Experimentos, preguntas y notas sobre ciencias de la computación.</p><div class="post-list">${posts.map((post,index)=>`<button class="post-entry" data-post="${escapeHTML(post.id)}"><span class="post-number">0${index+1}</span><span><span class="post-title">${escapeHTML(post.title)}</span><span class="post-meta">${post.date?`${escapeHTML(post.date)} · `:''}${escapeHTML(post.category)} · ${post.minutes} MIN${post.example?' · EJEMPLO':''}</span></span><span class="post-arrow" aria-hidden="true">↗</span></button>`).join('')}</div><p class="terminal-footer">${posts.length} archivos encontrados. ${posts.length?'Seleccioná uno para leer.':'Todavía no hay artículos publicados.'}<br>${posts.some(post=>post.example)?'Las entradas marcadas como ejemplo muestran el funcionamiento del blog.':''}</p>`;
  body.querySelectorAll('[data-post]').forEach(button=>button.addEventListener('click',()=>showPost(button.dataset.post)));
}
function showPost(id){
  const post=posts.find(item=>item.id===id);if(!post)return;
  body.innerHTML=`<button class="terminal-back" id="back-to-posts">← Volver a la bitácora</button><p class="terminal-prompt"><b>visitante@cluster</b>:~/bitacora$ cat ${escapeHTML(post.id)}.md</p>${post.example?'<span class="demo-badge">ENTRADA DE EJEMPLO</span>':''}<h2>${escapeHTML(post.title)}</h2><p class="post-meta">${post.date?`${escapeHTML(post.date)} · `:''}${escapeHTML(post.category)} · ${post.minutes} MIN DE LECTURA</p><hr class="terminal-rule"><article class="article-content">${post.html}</article><p class="terminal-footer">[ fin del archivo ]</p>`;
  terminal.scrollTop=0;$('#back-to-posts').addEventListener('click',()=>{showBlog();body.querySelector('[data-post]').focus();});$('#back-to-posts').focus();playTone(310,.035);
}
function showCV(){
  $('#terminal-title').textContent='MENDEZ-OS / CURRICULUM VITAE';
  body.innerHTML=`<p class="terminal-prompt"><b>visitante@mendez</b>:~$ cat curriculum.txt</p><h2>${escapeHTML(profile.name)}</h2><dl class="cv-grid"><dt>ÁREA</dt><dd>${escapeHTML(profile.field)}</dd><dt>ESTADO</dt><dd>Perfil en preparación</dd></dl>${profile.sections.map(section=>`<section class="cv-section"><h3>${escapeHTML(section.title)}</h3><p>${escapeHTML(section.text)}</p></section>`).join('')}<form class="terminal-form" id="command-form"><label for="command-input">visitante@mendez:~$</label><input id="command-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribí ayuda" aria-label="Comando de terminal"><button type="submit" aria-label="Ejecutar comando">↵</button></form><pre class="command-output" id="command-output" aria-live="polite"></pre><p class="terminal-footer">Comandos: ayuda · perfil · formacion · experiencia · publicaciones · limpiar · salir</p>`;
  $('#command-form').addEventListener('submit',event=>{
    event.preventDefault();const input=$('#command-input');const command=input.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');input.value='';
    const responses={ayuda:'Comandos disponibles:\nperfil, formacion, experiencia, publicaciones, limpiar, salir',perfil:`${profile.name}\n${profile.field}`,formacion:profile.sections[1].text,experiencia:profile.sections[2].text,publicaciones:profile.sections[3].text};
    if(command==='salir'){terminal.close();return;}
    const output=$('#command-output');if(command==='limpiar'){output.textContent='';return;}
    output.textContent=responses[command]??`Comando no reconocido: ${command || '(vacío)'}. Escribí ayuda para ver las opciones.`;output.scrollIntoView({block:'nearest'});playTone(180,.035);
  });
}
function openTerminal(kind,trigger){
  if(trigger)returnFocus=trigger;stopWalking();speech.classList.add('hidden');
  if(kind==='blog')showBlog();else showCV();
  if(!terminal.open)terminal.showModal();terminal.scrollTop=0;$('#close-terminal').focus();
  playTone(420,.06);
}

function playTone(frequency,duration){
  if(!soundEnabled||!ambient||ambient.context.state!=='running')return;
  const {context}=ambient;const oscillator=context.createOscillator();const gain=context.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.025,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+duration);oscillator.connect(gain).connect(context.destination);oscillator.start();oscillator.stop(context.currentTime+duration);
}
async function toggleSound(){
  try{
    if(!ambient){
      const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)throw new Error('Audio no disponible');
      const context=new AudioContext();const gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);
      const tones=[55,82.41,110].map((frequency)=>{const oscillator=context.createOscillator();oscillator.type='sine';oscillator.frequency.value=frequency;oscillator.connect(gain);oscillator.start();return oscillator;});ambient={context,gain,tones};
    }
    soundEnabled=!soundEnabled;await ambient.context.resume();ambient.gain.gain.setTargetAtTime(soundEnabled ? .008 : 0,ambient.context.currentTime,.4);
    $('#sound-toggle').setAttribute('aria-pressed',String(soundEnabled));$('#sound-toggle').setAttribute('aria-label',soundEnabled?'Desactivar sonido ambiental':'Activar sonido ambiental');$('#sound-label').textContent=soundEnabled?'SONIDO ON':'SONIDO OFF';playTone(330,.08);
  }catch{soundEnabled=false;say('El sonido no está disponible en este navegador. Podés seguir explorando.');}
}

document.querySelectorAll('[data-target]').forEach(button=>{
  button.addEventListener('click',()=>interact(button.dataset.target,button));
});
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>openTerminal(button.dataset.open,button)));
lookButton.addEventListener('click', () => {
  stopWalking();
  setLooking(!looking);
  if (looking) say('¿Qué miramos? Elegí un objeto del laboratorio.', 6500);
  else speech.classList.add('hidden');
});
greetButton.addEventListener('click', () => {
  keys.clear();
  setLooking(false);
  greet(character);
  revealCharacter(camera, character);
  updateCameraControls();
  say('¡Hola! Sí, a vos, del otro lado de la pantalla. Soy Mariano. Pasá, estás en tu laboratorio.', 8500);
  playTone(330, .08);
});
$('#pan-left').addEventListener('click', () => moveCamera(camera.x - WIDTH * .38));
$('#pan-right').addEventListener('click', () => moveCamera(camera.x + WIDTH * .38));
cameraRange.addEventListener('input', () => moveCamera(Number(cameraRange.value)));
scene.addEventListener('wheel', event => {
  const delta = event.deltaX || (event.shiftKey ? event.deltaY : 0);
  if (!delta) return;
  event.preventDefault();
  const bounds = scene.getBoundingClientRect();
  const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? bounds.width : 1;
  moveCamera(camera.x + delta * units * WIDTH / bounds.width);
}, { passive: false });
scene.addEventListener('pointerdown', event => {
  if (event.target.closest('button') || event.button !== 0) return;
  dragged = false;
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, cameraX: camera.x };
  scene.setPointerCapture(event.pointerId);
});
scene.addEventListener('pointermove', event => {
  if (!pointer || pointer.id !== event.pointerId) return;
  const dx = event.clientX - pointer.x;
  const dy = event.clientY - pointer.y;
  if (!dragged && (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy))) return;
  dragged = true;
  scene.classList.add('is-dragging');
  moveCamera(pointer.cameraX - dx * WIDTH / scene.getBoundingClientRect().width);
});
function releasePointer(event) {
  if (!pointer || event.pointerId !== pointer.id) return;
  if (scene.hasPointerCapture(event.pointerId)) scene.releasePointerCapture(event.pointerId);
  pointer = null;
  scene.classList.remove('is-dragging');
}
scene.addEventListener('pointerup', releasePointer);
scene.addEventListener('pointercancel', releasePointer);
scene.addEventListener('click', event => {
  if (dragged) { dragged = false; return; }
  if (event.target.closest('button')) return;
  const point = scenePoint(event.clientX, event.clientY, scene.getBoundingClientRect(), camera);
  if (looking) {
    setLooking(false);
    say('Libros a la izquierda, cómputo en el centro y experimentos a la derecha. Todavía quedan preguntas por resolver.', 7500);
    return;
  }
  if (point.y < FLOOR.top - 14) return;
  keys.clear();
  camera.following = true;
  speech.classList.add('hidden');
  walkTo(character, point.x, point.y);
});
$('#close-terminal').addEventListener('click',()=>terminal.close());
terminal.addEventListener('close',()=>{returnFocus?.focus();});
$('#help-button').addEventListener('click',()=>{stopWalking();help.showModal();});
$('#close-help').addEventListener('click',()=>help.close());$('#start-exploring').addEventListener('click',()=>help.close());
$('#sound-toggle').addEventListener('click',toggleSound);
for(const dialog of [terminal,help])dialog.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();}});
window.addEventListener('keydown',event=>{
  if(terminal.open||help.open||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input, textarea, select, button, [contenteditable]'))return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();keys.add(event.key);speech.classList.add('hidden');}
});
window.addEventListener('keyup',event=>keys.delete(event.key));window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{keys.clear();if(ambient){if(document.hidden)ambient.context.suspend();else if(soundEnabled)ambient.context.resume();}});

function frame(timestamp){
  const seconds=Math.min((timestamp-lastTime)/1000,.05);lastTime=timestamp;
  if(!terminal.open&&!help.open){
    if(keys.size){
      const dx=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0);
      const dy=(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0);
      camera.following = true;
      moveWithKeys(character,dx,dy,seconds);
    } else {
      stepCharacter(character,seconds,motionPreference.matches);
    }
    if(character.arrived)activate(character.arrived);
  }
  stepCamera(camera, character, seconds, motionPreference.matches);
  updateCameraControls();
  renderer.render(character,timestamp/1000,motionPreference.matches,camera);
  requestAnimationFrame(frame);
}
$('#year').textContent=new Date().getFullYear();
requestAnimationFrame(frame);
