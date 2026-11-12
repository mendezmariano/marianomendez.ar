import test from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter, walkTo, stepCharacter, moveWithKeys, FLOOR, targets, WALK_SPEED, greet, createCamera, panCamera, revealCharacter, stepCamera, scenePoint, WIDTH, HEIGHT, WORLD_WIDTH } from '../dist/world.js';
import { posts } from '../dist/posts.js';

test('walking reaches a terminal before triggering its action, once',()=>{
  const character=createCharacter();walkTo(character,targets.cv.x,targets.cv.y,'cv');
  stepCharacter(character,.016);assert.equal(character.walking,true);assert.equal(character.arrived,null);
  assert.ok(character.x<targets.cv.x);
  for(let i=0;i<200&&character.destination;i++)stepCharacter(character,.016);
  assert.equal(character.x,targets.cv.x);assert.equal(character.y,targets.cv.y);
  assert.equal(character.arrived,'cv');assert.equal(character.walking,false);
  stepCharacter(character,.016);assert.equal(character.arrived,null);
});
test('walking stays on the floor and faces the destination',()=>{
  const character=createCharacter();walkTo(character,-200,-500);stepCharacter(character,.016);
  assert.equal(character.facing,'left');assert.equal(character.destination.x,FLOOR.left);assert.equal(character.destination.y,FLOOR.top);
  walkTo(character,5000,2000);stepCharacter(character,1,true);
  assert.equal(character.x,FLOOR.right);assert.equal(character.y,FLOOR.bottom);
});
test('selecting another object cancels the previous pending action',()=>{
  const character=createCharacter();walkTo(character,targets.blog.x,targets.blog.y,'blog');
  walkTo(character,targets.cv.x,targets.cv.y,'cv');stepCharacter(character,.016,true);
  assert.equal(character.arrived,'cv');assert.equal(character.destination,null);
});
test('reduced motion opens the selected terminal without a walking delay',()=>{
  const character=createCharacter();walkTo(character,targets.blog.x,targets.blog.y,'blog');stepCharacter(character,.016,true);
  assert.equal(character.arrived,'blog');assert.equal(character.walking,false);assert.equal(character.x,targets.blog.x);
});
test('a long animation pause cannot move the character across the room',()=>{
  const character=createCharacter();const start=character.x;walkTo(character,700,300);stepCharacter(character,20);
  assert.ok(Math.abs(character.x-start)<=WALK_SPEED*.05);assert.equal(character.arrived,null);
});
test('every post has a unique usable id and readable content',()=>{
  assert.equal(new Set(posts.map(post=>post.id)).size,posts.length);
  for(const post of posts){assert.match(post.id,/^[a-z0-9-]+$/);assert.ok(post.title);assert.ok(post.html.trim());assert.ok(post.minutes>=1);}
});

test('keyboard walking animates, cancels a pending terminal, and stops on release',()=>{
  const character=createCharacter();
  walkTo(character,targets.blog.x,targets.blog.y,'blog');
  const start=character.x;
  moveWithKeys(character,1,0,.016);
  assert.ok(character.x>start);assert.equal(character.walking,true);
  assert.equal(character.destination,null);assert.equal(character.arrived,null);
  stepCharacter(character,.016);
  assert.equal(character.walking,false);
});

test('keyboard movement is independent of frame rate and stays inside the floor',()=>{
  const slow=createCharacter(), fast=createCharacter();
  for(let i=0;i<20;i++)moveWithKeys(slow,1,0,.05);
  for(let i=0;i<100;i++)moveWithKeys(fast,1,0,.01);
  assert.ok(Math.abs(slow.x-fast.x)<.00001);
  for(let i=0;i<200;i++)moveWithKeys(fast,1,1,.05);
  assert.equal(fast.x,FLOOR.right);assert.equal(fast.y,FLOOR.bottom);
  assert.equal(fast.walking,false);
});

test('greeting cancels a pending terminal and returns to idle without opening it',()=>{
  const character=createCharacter();
  walkTo(character,targets.blog.x,targets.blog.y,{kind:'use',target:'blog'});
  greet(character);
  const origin={x:character.x,y:character.y};
  assert.equal(character.destination,null);
  for(let i=0;i<60;i++) {
    stepCharacter(character,.05);
    assert.equal(character.arrived,null);
    assert.deepEqual({x:character.x,y:character.y},origin);
  }
  assert.equal(character.greeting,null);
  assert.equal(character.walking,false);
});

test('greeting can restart and a new walking command interrupts it',()=>{
  const character=createCharacter();
  greet(character);stepCharacter(character,.05);greet(character);
  assert.equal(character.greeting.elapsed,0);
  walkTo(character,100,300);
  assert.equal(character.greeting,null);
  greet(character);moveWithKeys(character,1,0,.02);
  assert.equal(character.greeting,null);assert.equal(character.walking,true);
});

test('look actions arrive once and retain the selected object instead of becoming use actions',()=>{
  const character=createCharacter();
  const action={kind:'look',target:'blog'};
  walkTo(character,targets.blog.x,targets.blog.y,action);
  stepCharacter(character,.02,true);
  assert.deepEqual(character.arrived,action);
  stepCharacter(character,.02,true);assert.equal(character.arrived,null);
});

test('walking animation advances with distance and freezes when stopped',()=>{
  const a=createCharacter(),b=createCharacter();
  for(let i=0;i<20;i++)moveWithKeys(a,-1,0,.05);
  for(let i=0;i<100;i++)moveWithKeys(b,-1,0,.01);
  assert.ok(Math.abs(a.stride-b.stride)<1e-10);
  const phase=a.stride;stepCharacter(a,.05);
  assert.equal(a.stride,phase);assert.equal(a.walking,false);
});

test('manual camera movement stays within the room and does not move the character',()=>{
  const camera=createCamera(),character=createCharacter();
  const origin={...character};
  panCamera(camera,-100);assert.equal(camera.x,0);
  panCamera(camera,9999);assert.equal(camera.x,WORLD_WIDTH-WIDTH);
  stepCamera(camera,character,.05);
  assert.equal(camera.x,WORLD_WIDTH-WIDTH);assert.deepEqual(character,origin);
});

test('walking follows the character at both edges without exposing space outside the room',()=>{
  const camera=createCamera(),character=createCharacter();
  character.x=FLOOR.right;
  for(let i=0;i<100;i++)stepCamera(camera,character,.05);
  assert.equal(camera.x,WORLD_WIDTH-WIDTH);
  character.x=FLOOR.left;
  for(let i=0;i<100;i++)stepCamera(camera,character,.05);
  assert.equal(camera.x,0);
});

test('greeting can reveal a character outside a manually panned view',()=>{
  const camera=createCamera(),character=createCharacter();
  character.x=1400;panCamera(camera,0);revealCharacter(camera,character);
  assert.ok(character.x>=camera.x&&character.x<=camera.x+WIDTH);
  assert.equal(camera.following,true);
});

test('scene clicks use the current camera offset on desktop and mobile',()=>{
  const camera=createCamera();panCamera(camera,640);
  for(const width of [1152,390,320]) {
    const bounds={left:14,top:150,width,height:width*HEIGHT/WIDTH};
    const point=scenePoint(bounds.left+width/2,bounds.top+bounds.height*.9,bounds,camera);
    assert.equal(point.x,640+WIDTH/2);
    assert.ok(Math.abs(point.y-HEIGHT*.9)<1e-10);
  }
});

test('all interactive objects have visible bounds and reachable destinations in the wider room',()=>{
  for(const target of Object.values(targets)) {
    const [x,y,w,h]=target.bounds;
    assert.ok(x>=0&&y>=0&&x+w<=WORLD_WIDTH&&y+h<=HEIGHT);
    assert.ok(target.x>=FLOOR.left&&target.x<=FLOOR.right);
    assert.ok(target.y>=FLOOR.top&&target.y<=FLOOR.bottom);
  }
});

test('walking changes between profile, back and front according to travel direction',()=>{
  const character=createCharacter();
  assert.equal(character.facing,'front');
  for(const [dx,dy,facing] of [[1,0,'right'],[-1,0,'left'],[0,-1,'back'],[0,1,'front']]) {
    moveWithKeys(character,dx,dy,.02);
    assert.equal(character.facing,facing);
    assert.equal(character.walking,true);
    stepCharacter(character,.02);
    assert.equal(character.facing,facing);
    assert.equal(character.walking,false);
  }
});

test('clicking a floor destination changes orientation for depth and horizontal travel',()=>{
  const character=createCharacter();
  for(const [dx,dy,facing] of [[0,-15,'back'],[0,15,'front'],[-30,0,'left'],[30,0,'right']]) {
    walkTo(character,character.x+dx,character.y+dy);
    stepCharacter(character,.02,true);
    assert.equal(character.facing,facing);
    assert.equal(character.destination,null);
  }
});

test('greeting turns from any orientation to face the visitor and stays facing them',()=>{
  for(const facing of ['left','right','back']) {
    const character=createCharacter();character.facing=facing;
    greet(character);
    assert.equal(character.facing,'front');
    for(let i=0;i<60;i++)stepCharacter(character,.05);
    assert.equal(character.greeting,null);
    assert.equal(character.facing,'front');
    moveWithKeys(character,0,-1,.02);
    assert.equal(character.facing,'back');
  }
});
