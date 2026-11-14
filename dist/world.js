import { CYCLE_DISTANCE, DEPTH_RATIO } from './gait.js';

export const WIDTH = 768;
export const HEIGHT = 352;
export const WORLD_WIDTH = 1536;
export const WALK_SPEED = 150;
export const GREETING_SECONDS = 2.6;
export const FLOOR = Object.freeze({ left: 30, right: WORLD_WIDTH - 30, top: 286, bottom: 336 });
export const targets = Object.freeze({
  library: { x: 172, y: 302, bounds: [75, 68, 190, 204], label: 'biblioteca', description: 'Algoritmos, sistemas y algunos libros que todavía tengo pendientes. Esta es la memoria de largo plazo del laboratorio.' },
  memoryBook: { x: 220, y: 302, bounds: [216, 123, 8, 36], label: 'Memoria virtual', href: 'https://mendezmariano.github.io/memoria-virtual/', description: 'Memoria virtual. Este libro abre el sitio dedicado al tema en otra pestaña. Hacé clic de nuevo para visitarlo.' },
  window: { x: 343, y: 298, bounds: [290, 55, 105, 174], label: 'ventana', description: 'Afuera sigue el mundo. De vez en cuando conviene apartar la vista de la pantalla.' },
  cluster: { x: 520, y: 300, bounds: [450, 92, 130, 183], label: 'clúster', description: 'Varias máquinas, una misma pregunta. Las luces parpadean; las respuestas están en proceso.' },
  blog: { x: 695, y: 300, bounds: [631, 149, 94, 100], label: 'terminal de la bitácora', description: 'La terminal principal del clúster. Acá viven las ideas, los experimentos y la bitácora. Podés abrirla haciendo clic sin el modo Mirar.' },
  board: { x: 831, y: 294, bounds: [658, 48, 204, 87], label: 'pizarra', description: 'Hipótesis del día: el café se transforma en código. Falta revisar la demostración.' },
  cv: { x: 1000, y: 301, bounds: [953, 158, 91, 88], label: 'computadora del currículum', description: 'Mi recorrido profesional, en verde fósforo. El perfil está en preparación.' },
  plant: { x: 1115, y: 303, bounds: [1082, 166, 66, 118], label: 'planta Ada', description: 'El único proceso del laboratorio que necesita luz solar. Se llama Ada.' },
  workbench: { x: 1320, y: 307, bounds: [1203, 151, 252, 133], label: 'mesa de experimentos', description: 'Un osciloscopio, un circuito a medio armar y una taza. Todo experimento empieza con una pregunta y termina con otra.' },
});

export function clampPoint(x, y) {
  return { x: Math.max(FLOOR.left, Math.min(FLOOR.right, x)), y: Math.max(FLOOR.top, Math.min(FLOOR.bottom, y)) };
}

export function createCharacter() {
  return { x: 864, y: 321, facing: 'front', destination: null, walking: false, arrived: null, stride: 0, greeting: null };
}

export function stopCharacter(character) {
  character.destination = null;
  character.arrived = null;
  character.walking = false;
  character.greeting = null;
}

export function greet(character) {
  stopCharacter(character);
  character.greeting = { elapsed: 0 };
  character.facing = 'front';
}

export function walkTo(character, x, y, action = null) {
  character.greeting = null;
  character.destination = { ...clampPoint(x, y), action };
  character.arrived = null;
}

function move(character, x, y) {
  const dx = x - character.x;
  const dy = y - character.y;
  const distance = Math.hypot(dx, dy);
  if (distance > .00001) {
    character.facing = Math.abs(dx) >= Math.abs(dy)
      ? (dx < 0 ? 'left' : 'right')
      : (dy < 0 ? 'back' : 'front');
  }
  if (distance > 0) {
    if (!character.walking) character.stride = 0;
    character.stride += Math.hypot(dx, dy / DEPTH_RATIO) / CYCLE_DISTANCE;
  }
  character.walking = distance > 0;
  character.x = x;
  character.y = y;
}

export function moveWithKeys(character, dx, dy, seconds) {
  character.destination = null;
  character.arrived = null;
  character.greeting = null;
  const length = Math.hypot(dx, dy);
  const step = WALK_SPEED * Math.max(0, Math.min(seconds, .05));
  const next = length ? clampPoint(character.x + dx / length * step, character.y + dy / length * step * DEPTH_RATIO) : character;
  move(character, next.x, next.y);
}

export function stepCharacter(character, seconds, reducedMotion = false) {
  character.arrived = null;
  const elapsed = Math.max(0, Math.min(seconds, .05));
  if (character.greeting) {
    character.greeting.elapsed += elapsed;
    if (character.greeting.elapsed >= GREETING_SECONDS) character.greeting = null;
    return;
  }
  if (!character.destination) { character.walking = false; return; }
  const dx = character.destination.x - character.x;
  const dy = character.destination.y - character.y;
  const distance = Math.hypot(dx, dy / DEPTH_RATIO);
  const step = reducedMotion ? Infinity : WALK_SPEED * elapsed;
  if (distance <= step) {
    move(character, character.destination.x, character.destination.y);
    character.arrived = character.destination.action;
    character.destination = null;
    character.walking = false;
  } else {
    move(character, character.x + dx / distance * step, character.y + dy / distance * step);
  }
}

export function createCamera() { return { x: 384, following: true }; }
export function clampCamera(x) { return Math.max(0, Math.min(WORLD_WIDTH - WIDTH, x)); }
export function panCamera(camera, x) {
  camera.x = clampCamera(x);
  camera.following = false;
}
export function revealCharacter(camera, character) {
  camera.x = clampCamera(character.x - WIDTH / 2);
  camera.following = true;
}
export function stepCamera(camera, character, seconds, reducedMotion = false) {
  if (!camera.following) return;
  const left = camera.x + WIDTH * .28;
  const right = camera.x + WIDTH * .72;
  const target = clampCamera(character.x < left ? character.x - WIDTH * .28 : character.x > right ? character.x - WIDTH * .72 : camera.x);
  camera.x += (target - camera.x) * (reducedMotion ? 1 : 1 - Math.exp(-10 * Math.max(0, Math.min(seconds, .05))));
  if (Math.abs(camera.x - target) < .01) camera.x = target;
}
export function scenePoint(clientX, clientY, bounds, camera) {
  return { x: (clientX - bounds.left) / bounds.width * WIDTH + camera.x, y: (clientY - bounds.top) / bounds.height * HEIGHT };
}
