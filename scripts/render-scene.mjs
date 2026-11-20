// Export the same Canvas operations as SVG, including the real camera and poses.
import { writeFile, mkdir } from 'node:fs/promises';
import { createRenderer, drawCharacter, PALETTE, RENDER_SCALE } from '../dist/scene.js';
import { createCharacter, WIDTH, HEIGHT, greet, GREETING_SECONDS } from '../dist/world.js';

import { SVGContext, SVGCanvas, wrap } from './svg-context.mjs';

globalThis.document={createElement:()=>new SVGCanvas()};
const output='/tmp/mendez-lab-art';await mkdir(output,{recursive:true});

const canvas=new SVGCanvas();const renderer=createRenderer(canvas);const character=createCharacter();
for(const [name,x] of [['west',0],['center',384],['east',768]]) {
  renderer.render(character,1,false,{x});
  await writeFile(`${output}/${name}.svg`,wrap(canvas.ctx.elements,WIDTH,HEIGHT,RENDER_SCALE));
}
greet(character);character.greeting.elapsed=1.3;renderer.render(character,1,false,{x:384});
await writeFile(`${output}/greeting.svg`,wrap(canvas.ctx.elements,WIDTH,HEIGHT,RENDER_SCALE));
const greetings=new SVGContext();greetings.fillStyle=PALETTE.teal;greetings.fillRect(0,0,880,680);
const phases=[['INICIO',0],['TOMA LA MÁSCARA',.31],['LA APARTA',.52],['ROSTRO VISIBLE',.8],
  ['SALUDA',1.3],['SE LA COLOCA',2.13],['REPOSO',GREETING_SECONDS],['MOVIMIENTO REDUCIDO',1.3,true]];
for(const [index,[label,elapsed,reducedMotion]] of phases.entries()) {
  const x=index%4*220,y=Math.floor(index/4)*340;
  greetings.save();greetings.translate(x+124,y+293-321*2);greetings.scale(2,2);
  drawCharacter(greetings,{...createCharacter(),x:0,greeting:{elapsed}},reducedMotion);greetings.restore();
  greetings.fillStyle=PALETTE.paper;greetings.font='11px monospace';greetings.fillText(label,x+12,y+313);
}
await writeFile(`${output}/greeting-sequence.svg`,wrap(greetings.elements,880,680));
if(process.argv.includes('--greeting-frames')) {
  const frames=[];
  await mkdir(`${output}/greeting-frames`,{recursive:true});
  // Include a short pause after the action so the loop shows the return to rest.
  for(let frame=0;frame<96;frame++) {
    const context=new SVGContext();context.fillStyle=PALETTE.teal;context.fillRect(0,0,280,320);
    context.save();context.translate(160,293-321*2);context.scale(2,2);
    drawCharacter(context,{...createCharacter(),x:0,greeting:frame/30<GREETING_SECONDS?{elapsed:frame/30}:null});
    context.restore();
    const path=`${output}/greeting-frames/${String(frame).padStart(3,'0')}.svg`;
    await writeFile(path,wrap(context.elements,280,320));frames.push(path);
  }
  await writeFile(`${output}/greeting-frames/frames.json`,JSON.stringify({frames,fps:30},null,2));
}
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
console.log(`Artwork validated against ${new Set(Object.values(PALETTE)).size} base colors and exported to ${output}: west, center, east, greeting, greeting-sequence, walk, character, palette. These are artwork renders, not browser screenshots.`);
