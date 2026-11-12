import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleGait, CYCLE_DISTANCE, DEPTH_RATIO } from '../dist/gait.js';
import { createCharacter, moveWithKeys, stepCharacter, WALK_SPEED, FLOOR } from '../dist/world.js';

const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
const scaleAt=y=>.94+(y-FLOOR.top)/(FLOOR.bottom-FLOOR.top)*.06;

test('the supporting foot stays anchored to the floor while walking left or right',()=>{
  for(const direction of [-1,1]) {
    const character=createCharacter();character.x=500;
    let anchor;
    for(let i=0;i<15;i++) {
      moveWithKeys(character,direction,0,.02);
      const scale=scaleAt(character.y),pose=sampleGait(character,scale);
      const leg=pose.legs[1];assert.equal(leg.support,true);
      const position=character.x+direction*leg.ankle[0]*scale;
      anchor??=position;close(position,anchor);
      close(leg.ankle[1]+4,0);
    }
  }
});

test('front and back support feet stay fixed even as perspective scale changes',()=>{
  for(const direction of [-1,1]) {
    const character=createCharacter();character.y=310;
    let anchor;
    for(let i=0;i<12;i++) {
      moveWithKeys(character,0,direction,.02);
      const scale=scaleAt(character.y),leg=sampleGait(character,scale).legs[1];
      assert.equal(leg.support,true);
      const position=character.y+(leg.ankle[1]+4)*scale;
      anchor??=position;close(position,anchor);
    }
  }
});

test('every gait phase has a supporting foot and the swinging knee bends without stretching the leg',()=>{
  for(const scale of [.94,.98,1])for(let i=0;i<160;i++) {
    const character={...createCharacter(),walking:true,facing:'right',stride:i/160};
    const pose=sampleGait(character,scale);
    assert.ok(pose.legs.some(leg=>leg.support));
    for(const leg of pose.legs) {
      close(Math.hypot(leg.knee[0]-leg.hip[0],leg.knee[1]-leg.hip[1]),27);
      close(Math.hypot(leg.ankle[0]-leg.knee[0],leg.ankle[1]-leg.knee[1]),27);
      assert.ok(leg.ankle[1]+4<=1e-8);
    }
  }
  const pose=sampleGait({...createCharacter(),walking:true,facing:'right',stride:.75});
  const leg=pose.legs[1];
  assert.ok(leg.ankle[1]<-12);
  assert.ok(leg.knee[0]>leg.ankle[0]+10);
});

test('the near arm swings back when its leg reaches forward',()=>{
  const character={...createCharacter(),walking:true,facing:'right'};
  const contact=sampleGait(character);
  assert.ok(contact.legs[1].ankle[0]>0);
  assert.ok(contact.arms[1].hand[0]<contact.arms[1].shoulder[0]);
  const opposite=sampleGait({...character,stride:.5});
  assert.ok(opposite.legs[1].ankle[0]<0);
  assert.ok(opposite.arms[1].hand[0]>opposite.arms[1].shoulder[0]);
});

test('one walking cycle takes the same time at different frame rates',()=>{
  for(const fps of [30,60,120]) {
    const character=createCharacter();
    for(let i=0;i<fps;i++)moveWithKeys(character,1,0,1/fps);
    close(character.stride,WALK_SPEED/CYCLE_DISTANCE);
  }
  const sideways=createCharacter(),depth=createCharacter();depth.y=300;
  moveWithKeys(sideways,1,0,.04);moveWithKeys(depth,0,1,.04);
  close(sideways.stride,depth.stride);
  close(depth.y-300,(sideways.x-864)*DEPTH_RATIO);
});

test('stopping plants both feet and restarting begins with a contact pose',()=>{
  const character=createCharacter();moveWithKeys(character,1,0,.05);
  stepCharacter(character,.02);
  const idle=sampleGait(character);
  assert.equal(idle.bodyY,0);assert.ok(idle.legs.every(leg=>leg.support));
  moveWithKeys(character,1,0,.01);
  close(character.stride,WALK_SPEED*.01/CYCLE_DISTANCE);
});

test('reduced motion and greeting suppress the gait even with a nonzero phase',()=>{
  const character={...createCharacter(),walking:true,stride:.75};
  const reduced=sampleGait(character,1,true);
  const greeting=sampleGait({...character,greeting:{elapsed:.7}});
  for(const pose of [reduced,greeting]) {
    assert.equal(pose.bodyY,0);assert.ok(pose.legs.every(leg=>leg.support));
    for(const leg of pose.legs)close(leg.ankle[1],-4);
  }
});
