// Render actual walking states as SVG/PNG frames and an animated GIF, without a browser.
// --before accepts an earlier source checkout for comparison.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SVGContext, wrap } from './svg-context.mjs';
import { PALETTE, drawCharacter } from '../dist/scene.js';
import { createCharacter, moveWithKeys } from '../dist/world.js';

const output='/tmp/mendez-motion-render';await mkdir(output,{recursive:true});
const beforeIndex=process.argv.indexOf('--before');
const beforeRoot=beforeIndex<0?null:resolve(process.argv[beforeIndex+1]);
const previous=beforeRoot?{
  ...await import(pathToFileURL(resolve(beforeRoot,'dist/scene.js'))),
  ...await import(pathToFileURL(resolve(beforeRoot,'dist/world.js'))),
}:null;
const versions=[...(previous?[{title:'ANTES',...previous}]:[]),{title:'CAMINATA AJUSTADA',createCharacter,moveWithKeys,drawCharacter}];
const characters=versions.map(version=>({...version.createCharacter(),x:90,y:321}));
const width=640,height=versions.length*190;
const frames=[];
for(let frame=0;frame<48;frame++) {
  const context=new SVGContext();context.fillStyle=PALETTE.teal;context.fillRect(0,0,width,height);
  for(const [row,version] of versions.entries()) {
    const floor=row*190+164;
    context.fillStyle=PALETTE.paper;context.font='11px monospace';context.fillText(version.title,14,row*190+12);
    context.fillStyle=PALETTE.steelDark;context.fillRect(0,floor,width,1);
    for(let x=20;x<width;x+=40)context.fillRect(x,floor,1,8);
    version.moveWithKeys(characters[row],1,0,1/30);
    context.save();context.translate(0,floor-321);
    version.drawCharacter(context,characters[row]);context.restore();
  }
  const stem=`${output}/frame-${String(frame).padStart(3,'0')}`;
  await writeFile(`${stem}.svg`,wrap(context.elements,width,height));
  frames.push(`${stem}.svg`);
}
await writeFile(`${output}/frames.json`,JSON.stringify({frames,comparison:!!previous},null,2));
console.log(`${output}/frames.json`);
