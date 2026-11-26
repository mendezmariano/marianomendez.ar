import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleGreeting, GREETING_SECONDS } from '../dist/gait.js';
import { createCharacter, greet, stepCharacter, moveWithKeys, walkTo } from '../dist/world.js';
import { drawCharacter, PALETTE } from '../dist/scene.js';
import { SVGContext } from '../scripts/svg-context.mjs';

function drawing(character,reducedMotion=false) {
  const context=new SVGContext();
  drawCharacter(context,character,reducedMotion);
  return context.elements;
}

test('the greeting starts and finishes in the normal resting pose',()=>{
  const character=createCharacter();
  const idle=drawing(character);
  greet(character);
  for(const elapsed of [0,GREETING_SECONDS]) {
    character.greeting.elapsed=elapsed;
    assert.deepEqual(drawing(character),idle);
  }
});

// The old spectacle frames, moustache and strap shared a single ink in the sprite.
const disguiseInk = PALETTE.darkest;

test('all four views show Mariano without the disguise at rest and while walking',()=>{
  for(const facing of ['front','right','back','left']) {
    for(const walking of [false,true]) {
      const character={...createCharacter(),facing,walking,stride:.25};
      assert.ok(drawing(character).every(element=>!element.includes(disguiseInk)),facing);
    }
  }
});

test('the face stays clear while the raised hand waves',()=>{
  const hands=[];
  for(let elapsed=1.1;elapsed<=1.7;elapsed+=.05) {
    const pose=sampleGreeting(elapsed);
    assert.equal(pose.raised,1);
    assert.ok(pose.waveArm.hand[0]>24);
    assert.ok(pose.waveArm.hand[1]<pose.waveArm.shoulder[1]);
    hands.push(pose.waveArm.hand[0]);
  }
  assert.ok(Math.max(...hands)-Math.min(...hands)>5);
});

test('reduced motion holds one open-handed greeting pose',()=>{
  const character=createCharacter();greet(character);
  const first=sampleGreeting(0,true),render=drawing(character,true);
  assert.equal(first.raised,1);
  assert.ok(render.every(element=>!element.includes(disguiseInk)));
  for(const elapsed of [.1,.6,1.3,2.5]) {
    character.greeting.elapsed=elapsed;
    assert.deepEqual(sampleGreeting(elapsed,true),first);
    assert.deepEqual(drawing(character,true),render);
  }
});

test('every greeting frame shows a smooth empty-handed wave in the declared palette',()=>{
  const character=createCharacter();greet(character);
  let previousHand;
  for(let frame=0;frame<=Math.round(GREETING_SECONDS*60);frame++) {
    character.greeting.elapsed=frame/60;
    const {hand}=sampleGreeting(character.greeting.elapsed).waveArm;
    const elements=drawing(character);
    assert.ok(elements.length>0);
    assert.ok(elements.every(element=>!element.includes(disguiseInk)));
    if(previousHand) {
      assert.ok(Math.hypot(hand[0]-previousHand[0],hand[1]-previousHand[1])<5);
    }
    previousHand=hand;
  }
});

test('finishing, restarting or interrupting a wave returns to the expected pose',()=>{
  const character=createCharacter(),idle=drawing(character);
  greet(character);
  for(let frame=0;frame<180;frame++)stepCharacter(character,1/60);
  assert.equal(character.greeting,null);
  assert.deepEqual(drawing(character),idle);

  greet(character);const start=drawing(character);
  character.greeting.elapsed=1.3;
  assert.notDeepEqual(drawing(character),start);
  greet(character);assert.deepEqual(drawing(character),start);

  character.greeting.elapsed=1.3;walkTo(character,900,321);
  assert.deepEqual(drawing(character),idle);
  const walker=createCharacter();moveWithKeys(walker,1,0,.02);
  greet(character);character.greeting.elapsed=1.3;moveWithKeys(character,1,0,.02);
  assert.equal(character.greeting,null);
  assert.deepEqual(drawing(character),drawing(walker));
});
