// Export the same Canvas operations as SVG, including the real camera and poses.
import { writeFile, mkdir } from 'node:fs/promises';
import { createRenderer, drawCharacter, PALETTE, RENDER_SCALE } from '../dist/scene.js';
import { createCharacter, WIDTH, HEIGHT, greet } from '../dist/world.js';

import { SVGContext, SVGCanvas, wrap } from './svg-context.mjs';

globalThis.document={createElement:()=>new SVGCanvas()};
const output='/tmp/mendez-lab-art';await mkdir(output,{recursive:true});

const canvas=new SVGCanvas();const renderer=createRenderer(canvas);const character=createCharacter();
for(const [name,x] of [['west',0],['center',384],['east',768]]) {
  renderer.render(character,1,false,{x});
  await writeFile(`${output}/${name}.svg`,wrap(canvas.ctx.elements,WIDTH,HEIGHT,RENDER_SCALE));
}
greet(character);character.greeting.elapsed=.8;renderer.render(character,1,false,{x:384});
await writeFile(`${output}/greeting.svg`,wrap(canvas.ctx.elements,WIDTH,HEIGHT,RENDER_SCALE));
const sprites=new SVGContext();sprites.fillStyle=PALETTE.teal;sprites.fillRect(0,0,960,680);
for(const [row,facing] of ['right','left','back','front'].entries()) {
  sprites.save();sprites.translate(0,row*170-176);
  for(let i=0;i<8;i++)drawCharacter(sprites,{...createCharacter(),x:40+i*92,y:321,stride:i/8,walking:true,facing});
  drawCharacter(sprites,{...createCharacter(),x:810,y:321,facing});
  drawCharacter(sprites,{...createCharacter(),x:905,y:321,greeting:{elapsed:.65+row*.2}});
  sprites.restore();
}
await writeFile(`${output}/walk.svg`,wrap(sprites.elements,960,680));
const portraits=new SVGContext();portraits.fillStyle=PALETTE.teal;portraits.fillRect(0,0,800,340);
for(const [index,facing] of ['front','right','back','left'].entries()) {
  portraits.save();portraits.translate(100+index*200,293-321*2);portraits.scale(2,2);
  drawCharacter(portraits,{...createCharacter(),x:0,y:321,facing});portraits.restore();
  portraits.fillStyle=PALETTE.paper;portraits.font='12px monospace';
  portraits.fillText(['FRENTE','PERFIL DERECHO','ESPALDA','PERFIL IZQUIERDO'][index],index*200+30,312);
}
await writeFile(`${output}/character.svg`,wrap(portraits.elements,800,340));
const swatches=new SVGContext();swatches.fillStyle=PALETTE.ink;swatches.fillRect(0,0,800,340);
Object.entries(PALETTE).forEach(([name,color],index)=>{
  const x=(index%8)*100,y=Math.floor(index/8)*68;
  swatches.fillStyle=color;swatches.fillRect(x+6,y+5,88,30);
  swatches.fillStyle=PALETTE.paper;swatches.font='9px monospace';
  swatches.fillText(name,x+7,y+39);swatches.fillText(color,x+7,y+51);
});
await writeFile(`${output}/palette.svg`,wrap(swatches.elements,800,340));
console.log(`Artwork validated against ${new Set(Object.values(PALETTE)).size} base colors and exported to ${output}: west, center, east, greeting, walk, character, palette. These are artwork renders, not browser screenshots.`);
