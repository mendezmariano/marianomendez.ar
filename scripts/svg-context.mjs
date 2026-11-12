// Canvas operation recorder shared by static artwork and motion previews.
import { PALETTE } from '../dist/scene.js';

const colors = new Set(Object.values(PALETTE));
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class SVGContext {
  elements = []; stack = []; transform = ''; path = '';
  fillStyle = PALETTE.ink; strokeStyle = PALETTE.ink; lineWidth = 1; font = '10px monospace';
  validate(values, color) {
    if (!values.every(Number.isFinite)) throw new Error('Non-finite artwork coordinate.');
    if (!colors.has(color)) throw new Error(`Undeclared artwork color: ${color}`);
  }
  add(shape) { this.elements.push(`<g transform="${this.transform}">${shape}</g>`); }
  fillRect(x,y,width,height) {
    this.validate([x,y,width,height],this.fillStyle);
    if(width<0||height<0)throw new Error('Negative artwork rectangle.');
    this.add(`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${this.fillStyle}"/>`);
  }
  clearRect() { this.elements = []; }
  drawImage(canvas,x,y,width,height) {
    this.add(`<g transform="translate(${x},${y}) scale(${width/canvas.width},${height/canvas.height})">${canvas.ctx.elements.join('')}</g>`);
  }
  beginPath() { this.path=''; }
  moveTo(x,y) { this.validate([x,y],this.fillStyle);this.path+=`M ${x} ${y} `; }
  lineTo(x,y) { this.validate([x,y],this.fillStyle);this.path+=`L ${x} ${y} `; }
  closePath() { this.path+='Z '; }
  ellipse(x,y,rx,ry) {
    this.validate([x,y,rx,ry],this.fillStyle);
    this.path+=`M ${x-rx} ${y} a ${rx} ${ry} 0 1 0 ${rx*2} 0 a ${rx} ${ry} 0 1 0 ${-rx*2} 0 `;
  }
  fill() { this.validate([],this.fillStyle);this.add(`<path d="${this.path}" fill="${this.fillStyle}"/>`); }
  stroke() { this.validate([this.lineWidth],this.strokeStyle);this.add(`<path d="${this.path}" fill="none" stroke="${this.strokeStyle}" stroke-width="${this.lineWidth}" stroke-linecap="round" stroke-linejoin="round"/>`); }
  fillText(value,x,y) {
    this.validate([x,y],this.fillStyle);
    const size=parseFloat(this.font);
    this.add(`<text x="${x}" y="${y+size*.82}" font-size="${size}" font-family="DejaVu Sans Mono,monospace" fill="${this.fillStyle}">${escape(value)}</text>`);
  }
  save() { this.stack.push({transform:this.transform,fillStyle:this.fillStyle,strokeStyle:this.strokeStyle,lineWidth:this.lineWidth,font:this.font}); }
  restore() { Object.assign(this,this.stack.pop()); }
  translate(x,y) { this.transform+=` translate(${x},${y})`; }
  scale(x,y) { this.transform+=` scale(${x},${y})`; }
  setTransform(a,b,c,d,e,f) { this.transform=`matrix(${a} ${b} ${c} ${d} ${e} ${f})`; }
}
export class SVGCanvas { ctx=new SVGContext();getContext(){return this.ctx;} }

export const wrap=(elements,width,height,scale=1)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width*scale} ${height*scale}">${elements.join('')}</svg>`;
