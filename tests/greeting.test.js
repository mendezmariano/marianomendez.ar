import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleGait, sampleGreeting, GREETING_SECONDS } from '../dist/gait.js';
import { createCharacter, greet, stepCharacter, moveWithKeys, walkTo } from '../dist/world.js';
import { drawCharacter } from '../dist/scene.js';
import { SVGContext } from '../scripts/svg-context.mjs';

function drawing(character,reducedMotion=false) {
  const context=new SVGContext();
  drawCharacter(context,character,reducedMotion);
  return context.elements;
}

test('greeting starts and finishes with the mask on and both arms at rest',()=>{
  const idle=sampleGait(createCharacter());
  for(const time of [0,GREETING_SECONDS]) {
    const pose=sampleGreeting(time);
    assert.equal(pose.reveal,0);
    assert.ok(pose.maskOffset.every(value=>value===0));
    assert.deepEqual(pose.maskArm.hand,idle.arms[0].hand);
    assert.deepEqual(pose.waveArm.hand,idle.arms[1].hand);
  }
});

test('the hand grips the frame throughout removal and replacement',()=>{
  for(let frame=0;frame<=156;frame++) {
    const pose=sampleGreeting(frame/60);
    if(pose.reveal>0) {
      assert.equal(pose.reach,1);
      assert.deepEqual(pose.maskArm.hand,[-18+pose.maskOffset[0],-103+pose.maskOffset[1]]);
    }
  }
});

test('the face stays clear while the raised hand waves',()=>{
  const hands=[];
  for(let elapsed=1.1;elapsed<=1.7;elapsed+=.05) {
    const pose=sampleGreeting(elapsed);
    assert.equal(pose.reveal,1);
    assert.equal(pose.raised,1);
    // The mask's top edge is below the face, and the raised hand is to its right.
    assert.ok(-118+pose.maskOffset[1]>=-82);
    assert.ok(pose.waveArm.hand[0]>24);
    hands.push(pose.waveArm.hand[0]);
  }
  assert.ok(Math.max(...hands)-Math.min(...hands)>5);
});

test('reduced motion holds the same uncovered face and mask-in-hand pose',()=>{
  const character=createCharacter();greet(character);
  const first=sampleGreeting(0,true),render=drawing(character,true);
  assert.equal(first.reveal,1);
  assert.equal(first.raised,1);
  for(const elapsed of [.1,.6,1.3,2.5]) {
    character.greeting.elapsed=elapsed;
    assert.deepEqual(sampleGreeting(elapsed,true),first);
    assert.deepEqual(drawing(character,true),render);
  }
});

test('every greeting frame renders with finite coordinates and the declared palette',()=>{
  const character=createCharacter();greet(character);
  let previous;
  for(let frame=0;frame<=156;frame++) {
    character.greeting.elapsed=frame/60;
    const pose=sampleGreeting(character.greeting.elapsed);
    assert.ok(drawing(character).length>0);
    if(previous)for(const arm of ['maskArm','waveArm']) {
      assert.ok(Math.hypot(...pose[arm].hand.map((value,index)=>value-previous[arm].hand[index]))<5);
    }
    previous=pose;
  }
});

test('finishing, restarting or interrupting the greeting restores the worn disguise',()=>{
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
