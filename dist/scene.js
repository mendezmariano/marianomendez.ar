import { WIDTH, HEIGHT, WORLD_WIDTH, FLOOR, targets } from './world.js';
import { sampleGait } from './gait.js';

// Warm interiors and cool machinery, sampled from the supplied adventure references.
export const PALETTE = Object.freeze({
  ink: '#171c23', darkest: '#10171d', shadow: '#34343b', woodDark: '#3e2c0d',
  wood: '#744912', woodLight: '#8e7142', ochre: '#b99454', sand: '#cbb374',
  cream: '#e7e0c0', wall: '#a3a390', wallShade: '#8e817b', gray: '#757472',
  steelDark: '#2d2f2f', steel: '#60635e', steelLight: '#a9a8a7', paper: '#e1ddd0',
  sage: '#638972', teal: '#31575d', tealLight: '#79b4c8', blue: '#4b6c89',
  sky: '#b1daee', glass: '#92b8b8', greenDark: '#173c35', green: '#619a79',
  mint: '#b5d6a0', amber: '#e7b35c', rust: '#975129', clay: '#bf7d5c',
  red: '#812b17', blush: '#eecaaa', skin: '#d6a17e', skinShadow: '#ae755c',
  coat: '#f4f1e7', coatShade: '#cad6d5', white: '#ffffff', navy: '#273747',
  trousers: '#313c47', shoe: '#22242b', floor: '#7e716a', tile: '#9d8b7b',
});
const P = PALETTE;
export const RENDER_SCALE = 2;

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function poly(c, points, color) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.closePath(); c.fill();
}
function line(c, points, color, width = 1) {
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.stroke();
}
function ellipse(c, x, y, rx, ry, color) {
  c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
}
function text(c, value, x, y, size = 8, color = P.cream) {
  c.fillStyle = color; c.font = `${size}px monospace`; c.textBaseline = 'top'; c.fillText(value, x, y);
}
function framed(c, x, y, w, h, color, border = P.wood) {
  rect(c, x, y, w, h, P.ink); rect(c, x+2, y+2, w-4, h-4, border);
  rect(c, x+4, y+4, w-8, 2, P.sand); rect(c, x+6, y+7, w-12, h-14, color);
}
function pipe(c, points) {
  line(c, points, P.ink, 10); line(c, points, P.steel, 7); line(c, points.map(([x,y])=>[x-1,y-1]), P.steelLight, 2);
}
function lamp(c, x) {
  line(c, [[x, 23], [x, 43]], P.ink, 3);
  poly(c, [[x-17,43],[x+17,43],[x+29,53],[x-29,53]], P.ink);
  poly(c, [[x-16,43],[x+15,43],[x+24,49],[x-24,49]], P.teal);
  rect(c, x-22, 52, 44, 3, P.cream); rect(c, x-16, 55, 32, 2, P.amber);
}
function monitor(c, x, y, title, w = 90, h = 70) {
  poly(c, [[x+5,y],[x+w-5,y],[x+w,y+6],[x+w-2,y+h-5],[x+w-9,y+h],[x+6,y+h],[x,y+h-5],[x,y+6]], P.ink);
  rect(c, x+3, y+5, w-6, h-10, P.steelLight);
  rect(c, x+7, y+2, w-14, 3, P.paper);
  framed(c,x+8,y+9,w-16,h-24,P.greenDark,P.steel);
  rect(c,x+17,y+20,w-36,1,P.sage);
  text(c,title,x+18,y+27,9,P.mint);
  for(let i=0;i<3;i++)rect(c,x+18,y+42+i*4,w-42-i*7,1,P.green);
  rect(c,x+12,y+h-10,20,2,P.steel); ellipse(c,x+w-11,y+h-9,2,2,P.mint);
  rect(c,x+w/2-7,y+h,14,8,P.steel); rect(c,x+w/2-21,y+h+8,42,4,P.ink);
}
function keyboard(c,x,y,w=78) {
  poly(c,[[x+5,y],[x+w-5,y],[x+w,y+10],[x,y+10]],P.ink);
  poly(c,[[x+6,y+1],[x+w-6,y+1],[x+w-3,y+8],[x+3,y+8]],P.paper);
  for(let row=0;row<3;row++)for(let col=0;col<12;col++)rect(c,x+9+col*(w-18)/12,y+2+row*2,3,1,P.steel);
}
function rack(c,x,number) {
  framed(c,x,92,60,182,P.steelDark,P.steelLight);
  text(c,`NODE 0${number}`,x+9,103,8,P.paper);
  for(let row=0;row<7;row++) {
    const y=121+row*19;
    rect(c,x+7,y,46,16,P.steel); rect(c,x+8,y,44,1,P.steelLight);
    rect(c,x+11,y+4,29,8,P.ink);
    for(let k=0;k<7;k++)rect(c,x+13+k*3.5,y+5,1,6,P.gray);
    ellipse(c,x+46,y+6,1.5,1.5,P.mint); ellipse(c,x+46,y+11,1.5,1.5,P.amber);
  }
  rect(c,x+9,273,10,6,P.ink);rect(c,x+42,273,10,6,P.ink);
}
function desk(c,x,y,w,drawers=false) {
  poly(c,[[x+9,y],[x+w-9,y],[x+w,y+13],[x,y+13]],P.ink);
  poly(c,[[x+10,y+1],[x+w-11,y+1],[x+w-4,y+9],[x+4,y+9]],P.ochre);
  rect(c,x,y+12,w,7,P.wood);rect(c,x+3,y+12,w-6,2,P.sand);
  rect(c,x+10,y+19,8,45,P.ink);rect(c,x+11,y+19,2,41,P.steel);
  rect(c,x+w-18,y+19,8,45,P.ink);rect(c,x+w-17,y+19,2,41,P.steel);
  if(drawers)for(let i=0;i<3;i++) {
    rect(c,x+w-57,y+19+i*14,47,13,P.woodDark);rect(c,x+w-55,y+20+i*14,43,11,P.woodLight);
    rect(c,x+w-41,y+24+i*14,14,2,P.ink);
  }
}
function books(c,x,y,count=12) {
  const colors=[P.rust,P.teal,P.ochre,P.sage,P.paper,P.red,P.blue];
  for(let i=0;i<count;i++) {
    const h=20+(i*13)%17,w=7+(i%3);
    rect(c,x+i*10,y-h,w,h,P.ink);rect(c,x+i*10+1,y-h+1,w-2,h-2,colors[i%colors.length]);
    rect(c,x+i*10+2,y-h+5,w-4,1,P.sand);rect(c,x+i*10+2,y-5,w-4,1,P.sand);
  }
}
function cup(c,x,y) {
  ellipse(c,x+11,y-8,5,5,P.paper);ellipse(c,x+12,y-8,2.5,3,P.woodDark);
  rect(c,x,y-15,11,16,P.paper);ellipse(c,x+5.5,y-15,5.5,2,P.coat);ellipse(c,x+5.5,y-15,4,1,P.woodDark);
}
function plant(c,x,y) {
  line(c,[[x,y-22],[x-3,y-78]],P.greenDark,4);
  for(let i=0;i<9;i++) {
    const yy=y-42-i*7,side=i%2?1:-1,xx=x+side*(16+(i%3)*4);
    line(c,[[x,yy+13],[xx,yy]],P.greenDark,2);
    poly(c,[[x,yy+10],[xx-side*5,yy-9],[xx+side*8,yy-7],[xx+side*3,yy+5]],P.greenDark);
    line(c,[[x,yy+10],[xx,yy-3]],i%3?P.sage:P.green,3);
  }
  poly(c,[[x-19,y-29],[x+19,y-29],[x+13,y],[x-12,y]],P.red);
  poly(c,[[x-16,y-28],[x+4,y-28],[x+1,y-2],[x-11,y-2]],P.rust);
  rect(c,x-21,y-32,42,7,P.clay);rect(c,x-20,y-31,40,1,P.blush);
}

function drawRoom(c) {
  rect(c,0,0,WORLD_WIDTH,HEIGHT,P.ink);
  rect(c,0,20,WORLD_WIDTH,253,P.ochre);
  // Layered architectural panels keep the palette quiet behind the equipment.
  for(let x=0;x<WORLD_WIDTH;x+=96) {
    rect(c,x+3,39,90,219,P.sand);rect(c,x+6,42,84,211,P.ochre);
    rect(c,x+7,43,82,80,P.wall);rect(c,x+7,126,82,125,P.wallShade);
    rect(c,x+8,44,2,206,P.cream);rect(c,x+86,44,3,207,P.woodLight);
    rect(c,x+10,124,76,2,P.woodLight);
  }
  rect(c,0,0,WORLD_WIDTH,12,P.woodDark);rect(c,0,12,WORLD_WIDTH,4,P.ochre);
  rect(c,0,16,WORLD_WIDTH,7,P.cream);rect(c,0,23,WORLD_WIDTH,7,P.woodLight);
  rect(c,0,259,WORLD_WIDTH,14,P.woodDark);rect(c,0,260,WORLD_WIDTH,3,P.sand);
  rect(c,0,273,WORLD_WIDTH,79,P.floor);
  const rows=[273,285,302,324,352];
  for(let row=0;row<4;row++) {
    const top=rows[row],bottom=rows[row+1],offset=row*6;
    for(let col=-2;col<30;col++) {
      const x=col*68;
      poly(c,[[x-offset,top+1],[x+67-offset,top+1],[x+67-offset-6,bottom-1],[x-offset-6,bottom-1]],(col+row)%2?P.tile:P.floor);
      line(c,[[x-offset,top+1],[x-offset-6,bottom]],P.shadow,.8);
    }
    line(c,[[0,top],[WORLD_WIDTH,top]],P.shadow,1);
  }
  for(const x of [180,515,797,1050,1328])lamp(c,x);
  for(const x of [16,408,1165,1514]) {
    rect(c,x,30,14,241,P.woodDark);rect(c,x+2,31,9,236,P.woodLight);rect(c,x+3,33,2,233,P.ochre);
  }
  // West alcove: books and a night window.
  framed(c,74,68,194,205,P.woodDark);
  for(let shelf=0;shelf<4;shelf++) {
    const y=113+shelf*46;
    books(c,86,y,shelf===1?11:16);rect(c,80,y,182,7,P.wood);rect(c,82,y,178,2,P.sand);
  }
  const [bookX, bookY, bookWidth, bookHeight] = targets.memoryBook.bounds;
  rect(c,bookX,bookY,bookWidth,bookHeight,P.ink);
  rect(c,bookX+1,bookY+1,bookWidth-2,bookHeight-2,P.amber);
  rect(c,bookX+1,bookY+1,5,bookHeight-2,P.rust);
  rect(c,bookX+7,bookY+3,bookWidth-10,1,P.cream);
  text(c,'MEMORIA',bookX+8,bookY+10,6.5,P.ink);
  text(c,'VIRTUAL',bookX+8,bookY+19,6.5,P.ink);
  rect(c,bookX+17,bookY+31,12,1,P.rust);
  text(c,'BIBLIOTECA',125,55,10,P.woodDark);
  framed(c,289,55,107,173,P.navy);
  rect(c,298,65,89,150,P.blue);
  ellipse(c,361,88,14,14,P.cream);ellipse(c,367,84,13,13,P.blue);
  for(let i=0;i<15;i++)ellipse(c,302+(i*19)%81,72+(i*29)%76,.7,.7,P.cream);
  for(let i=0;i<7;i++) {
    const h=30+(i*23)%48;
    rect(c,298+i*13,215-h,12,h,P.navy);
    for(let yy=219-h;yy<210;yy+=9)for(let xx=0;xx<2;xx++)if((i+yy+xx)%3)rect(c,301+i*13+xx*5,yy,2,3,P.ochre);
  }
  rect(c,339,63,5,153,P.woodDark);rect(c,295,141,94,5,P.woodDark);
  rect(c,281,225,124,7,P.wood);rect(c,282,225,122,2,P.cream);
  desk(c,299,245,94);cup(c,310,246);books(c,338,247,4);
  // Central computing laboratory.
  pipe(c,[[433,36],[433,62],[596,62],[607,73],[607,265]]);
  pipe(c,[[440,34],[440,51],[588,51]]);
  rack(c,451,1);rack(c,517,2);
  framed(c,460,72,107,15,P.ink,P.steel);text(c,'CLUSTER / ONLINE',467,76,7,P.mint);
  for(let i=0;i<3;i++)line(c,[[468+i*14,278],[468+i*14,286+i*2],[601+i*6,289+i*2],[624+i*5,274]],i===1?P.rust:P.ink,2);
  framed(c,658,48,204,87,P.greenDark);
  text(c,'P = NP ?',671,61,13,P.cream);text(c,'cafe > codigo',671,107,9,P.mint);
  const nodes=[[783,76],[816,64],[841,91],[797,102]];
  for(let i=0;i<4;i++)line(c,[nodes[i],nodes[(i+1)%4]],P.sage,1.5);
  line(c,[nodes[1],nodes[3]],P.sage,1.5);
  for(const [x,y] of nodes)ellipse(c,x,y,3,3,P.ochre);
  rect(c,657,134,207,4,P.woodDark);rect(c,672,134,17,2,P.cream);
  desk(c,620,239,252);monitor(c,636,151,'BITACORA');monitor(c,751,172,'SYS',68,55);
  keyboard(c,637,240,86);keyboard(c,753,241,67);cup(c,829,240);
  rect(c,630,263,205,14,P.steelDark);text(c,'MENDEZ LAB / COMPUTACION',642,267,7,P.steelLight);
  ellipse(c,830,270,2,2,P.mint);
  framed(c,888,67,36,37,P.paper,P.steel);
  ellipse(c,906,85,12,12,P.cream);line(c,[[906,76],[906,85],[913,89]],P.ink,1.5);
  books(c,953,101,13);rect(c,944,101,152,7,P.woodDark);rect(c,945,101,150,2,P.sand);
  text(c,'ARCHIVO PERSONAL',954,115,8,P.woodDark);
  desk(c,941,242,143,true);monitor(c,955,160,'CV / PERFIL',88,70);keyboard(c,958,243,72);
  rect(c,1049,201,23,40,P.ink);rect(c,1051,203,19,36,P.steelLight);
  rect(c,1054,210,13,3,P.ink);rect(c,1054,216,13,2,P.gray);ellipse(c,1062,232,2,2,P.mint);
  plant(c,1116,283);
  // East alcove: electronics bench and storage. All objects are original drawings.
  framed(c,1235,57,190,74,P.teal);
  text(c,'EXPERIMENTOS',1262,69,11,P.cream);
  for(let i=0;i<3;i++) {
    const x=1260+i*56;
    line(c,[[x,92],[x+25,92],[x+25,112],[x,112],[x,92]],P.sage,1);
    ellipse(c,x+12,102,4,4,P.ochre);line(c,[[x+25,102],[x+51,102]],P.mint,1);
  }
  desk(c,1200,239,259,true);
  framed(c,1216,175,89,61,P.steel,P.steelLight);framed(c,1223,183,51,39,P.greenDark,P.ink);
  const wave=[];for(let i=0;i<40;i++)wave.push([1229+i,203+Math.sin(i*.3)*9]);line(c,wave,P.mint,1.5);
  for(let yy=0;yy<3;yy++)ellipse(c,1289,189+yy*14,4,4,P.ink);
  rect(c,1320,231,62,10,P.greenDark);
  for(let i=0;i<6;i++) {rect(c,1325+i*8,233,5,5,P.ink);line(c,[[1327+i*8,231],[1330+i*8,225],[1340+i*7,225]],P.ochre,1);}
  line(c,[[1384,234],[1391,206],[1410,190]],P.ink,4);
  poly(c,[[1398,183],[1422,183],[1431,194],[1390,194]],P.teal);rect(c,1392,194,36,3,P.cream);
  cup(c,1425,239);
  framed(c,1466,86,37,178,P.teal,P.steel);rect(c,1494,169,3,18,P.ochre);
  for(let i=0;i<6;i++)rect(c,1474,98+i*5,21,2,P.ink);
  text(c,'01',1478,243,9,P.cream);
}

function drawFrontHead(c) {
  // Angular jaw, ears and swept brown hair follow the supplied front-facing portrait.
  poly(c,[[-14,-109],[-10,-119],[1,-122],[12,-117],[16,-107],[14,-92],[8,-82],[-6,-82],[-13,-92]],P.ink);
  poly(c,[[-12,-107],[-9,-115],[2,-117],[12,-111],[12,-94],[7,-84],[-5,-84],[-11,-93]],P.skin);
  poly(c,[[-9,-109],[-5,-114],[5,-114],[8,-108],[7,-90],[2,-86],[-5,-89]],P.blush);
  ellipse(c,-14,-100,3.5,5,P.skinShadow);ellipse(c,14,-100,3.5,5,P.skinShadow);
  ellipse(c,-15,-100,1.4,2.5,P.skin);ellipse(c,15,-100,1.4,2.5,P.skin);
  poly(c,[[-15,-104],[-16,-114],[-10,-123],[-3,-126],[4,-123],[10,-124],[16,-117],[16,-106],[12,-100],[10,-110],[7,-115],[2,-116],[-1,-110],[-6,-115],[-10,-110],[-11,-102]],P.woodDark);
  poly(c,[[-12,-115],[-8,-122],[-2,-123],[1,-120],[-4,-119],[-7,-113]],P.woodLight);
  poly(c,[[2,-121],[8,-122],[13,-116],[13,-111],[9,-116],[4,-117]],P.ochre);
  line(c,[[-8,-119],[-4,-121],[0,-119]],P.ochre,1.5);
  // The accessory has its own silhouette: square black rims, false brows and nose.
  for(const side of [-1,1]) {
    const x=side===-1?-18:2;
    poly(c,[[x+2,-110],[x+14,-110],[x+16,-108],[x+15,-98],[x+12,-95],[x+3,-95],[x,-98],[x,-107]],P.darkest);
    poly(c,[[x+3,-107],[x+12,-107],[x+13,-105],[x+12,-99],[x+4,-99],[x+3,-101]],P.paper);
    rect(c,x+7,-105,2.5,5,P.ink);rect(c,x+7,-105,1,1.5,P.white);
    line(c,[[x+4,-107],[x+7,-107]],P.white,1.2);
    const browX=side*10;
    poly(c,[[browX-7,-112],[browX-6,-116],[browX+5,-115],[browX+7,-111]],P.darkest);
    for(let i=0;i<4;i++)line(c,[[browX-5+i*3,-113],[browX-6+i*3,-117-(i%2)]],P.darkest,1);
  }
  line(c,[[-3,-106],[3,-106]],P.darkest,3);
  poly(c,[[-3,-105],[3,-105],[6,-91],[5,-88],[-5,-88],[-6,-91]],P.ink);
  poly(c,[[-2,-104],[2,-104],[5,-92],[3,-89],[-3,-89],[-5,-92]],P.skinShadow);
  poly(c,[[-1,-103],[1,-103],[3,-92],[1,-90],[-3,-91]],P.blush);
  // A wide, bristly moustache is visibly attached beneath the false nose.
  poly(c,[[-4,-92],[-9,-93],[-14,-90],[-16,-85],[-11,-87],[-8,-85],[-3,-87],[0,-89],[3,-87],[8,-85],[11,-87],[16,-85],[14,-90],[9,-93],[4,-92],[2,-90],[-2,-90]],P.darkest);
  for(const side of [-1,1])for(let i=0;i<3;i++)line(c,[[side*(5+i*3),-90],[side*(8+i*3),-87]],P.gray,.6);
  line(c,[[-4,-83],[0,-82],[4,-83]],P.red,1.3);
}

function drawProfileHead(c) {
  poly(c,[[-12,-109],[-9,-120],[0,-125],[10,-121],[15,-114],[15,-105],[17,-99],[13,-96],[11,-85],[4,-81],[-5,-86],[-12,-97]],P.ink);
  poly(c,[[-9,-108],[-6,-116],[2,-120],[11,-114],[12,-104],[14,-99],[11,-96],[9,-86],[4,-84],[-3,-88],[-10,-98]],P.skin);
  poly(c,[[2,-114],[9,-111],[10,-105],[9,-92],[5,-87],[1,-91]],P.blush);
  poly(c,[[-12,-105],[-14,-115],[-9,-123],[-1,-126],[6,-124],[13,-119],[15,-112],[9,-110],[4,-115],[0,-114],[-3,-107],[-5,-100],[-8,-94],[-12,-99]],P.woodDark);
  poly(c,[[-10,-116],[-6,-122],[-1,-123],[2,-121],[-3,-118],[-6,-112]],P.woodLight);
  line(c,[[1,-122],[6,-121],[11,-116]],P.ochre,2);
  ellipse(c,-7,-101,3.5,5,P.skinShadow);ellipse(c,-6,-100,1.5,3,P.skin);
  // Temples remain visible all the way to the ear; the nose projects beyond the face.
  line(c,[[-8,-106],[5,-106]],P.darkest,3);
  poly(c,[[3,-111],[14,-111],[17,-108],[15,-98],[12,-96],[4,-98]],P.darkest);
  poly(c,[[6,-108],[13,-108],[14,-105],[12,-100],[6,-101]],P.paper);
  rect(c,11,-107,2,5,P.ink);rect(c,11,-107,1,1,P.white);
  poly(c,[[3,-113],[4,-117],[13,-116],[17,-112]],P.darkest);
  line(c,[[6,-114],[6,-118]],P.darkest,1.2);line(c,[[10,-114],[11,-118]],P.darkest,1.2);
  poly(c,[[15,-106],[18,-104],[24,-94],[25,-90],[22,-87],[16,-88],[14,-92]],P.ink);
  poly(c,[[16,-104],[18,-102],[23,-93],[23,-90],[20,-89],[16,-91]],P.skinShadow);
  poly(c,[[16,-103],[18,-101],[21,-93],[20,-91],[17,-92]],P.blush);
  poly(c,[[15,-92],[20,-91],[23,-87],[25,-84],[20,-85],[17,-83],[12,-86],[7,-86],[5,-89],[9,-93]],P.darkest);
  for(let i=0;i<3;i++)line(c,[[10+i*3,-91],[14+i*3,-87]],P.gray,.6);
  line(c,[[6,-83],[11,-83]],P.red,1.3);
}

function drawBackHead(c) {
  rect(c,-6,-91,12,9,P.skinShadow);
  ellipse(c,-14,-100,3,5,P.skinShadow);ellipse(c,14,-100,3,5,P.skinShadow);
  poly(c,[[-14,-106],[-13,-117],[-7,-124],[0,-126],[9,-122],[15,-116],[15,-105],[11,-94],[7,-90],[-6,-90],[-11,-96]],P.ink);
  poly(c,[[-12,-108],[-11,-116],[-6,-122],[0,-123],[8,-120],[13,-114],[12,-103],[8,-94],[-5,-93],[-10,-100]],P.woodDark);
  poly(c,[[-10,-116],[-5,-122],[1,-121],[-3,-115],[-4,-108],[-8,-110]],P.woodLight);
  poly(c,[[4,-120],[10,-116],[11,-107],[7,-110],[5,-115]],P.ochre);
  line(c,[[-10,-106],[-8,-99],[-4,-95]],P.woodLight,2);
  line(c,[[9,-105],[6,-99],[4,-94]],P.woodLight,2);
  // A narrow retaining band and the frame arms identify the mask from behind.
  line(c,[[-15,-103],[-9,-101],[0,-100],[9,-101],[15,-103]],P.darkest,2.5);
}

export function drawCharacter(c, character, reducedMotion = false) {
  const { x, y, facing = 'front', greeting = null } = character;
  const view = greeting ? 'front' : facing;
  const profile = view === 'left' || view === 'right';
  const depth = .94 + (y-FLOOR.top)/(FLOOR.bottom-FLOOR.top)*.06;
  const pose = sampleGait(character,depth,reducedMotion);
  ellipse(c,x,y+1,19*depth,3,P.shadow);
  c.save();c.translate(x,y);c.scale(depth,depth);
  if(view === 'left')c.scale(-1,1);
  for(const leg of pose.legs) {
    line(c,[leg.hip,leg.knee,leg.ankle],P.ink,7);
    line(c,[leg.hip,leg.knee,leg.ankle],leg.side < 0 ? P.navy : P.trousers,4);
    if(profile) {
      const cosine=Math.cos(leg.angle),sine=Math.sin(leg.angle);
      const points=[[-4,-1],[5,-1],[10,2],[10,4],[-4,4]].map(([xx,yy])=>[
        leg.ankle[0]+xx*cosine-yy*sine,leg.ankle[1]+xx*sine+yy*cosine]);
      poly(c,points,P.shoe);line(c,[points[3],points[4]],P.gray,1);
    } else {
      ellipse(c,leg.ankle[0],leg.ankle[1]+2,5,3,P.shoe);
      line(c,[[leg.ankle[0]-4,leg.ankle[1]+4],[leg.ankle[0]+4,leg.ankle[1]+4]],P.gray,1);
    }
  }
  // Only the torso bobs. The support foot stays on the ground throughout stance.
  c.save();c.translate(0,pose.bodyY);
  const farArm=pose.arms[0];
  line(c,[farArm.shoulder,farArm.elbow,farArm.hand],P.ink,7);
  line(c,[farArm.shoulder,farArm.elbow,[farArm.hand[0],farArm.hand[1]-1]],P.coatShade,4);
  ellipse(c,farArm.hand[0],farArm.hand[1]+1,3,4,P.skinShadow);
  poly(c,[[-11,-81],[-4,-86],[7,-85],[13,-78],[11,-53],[15,-36],[-14,-36],[-11,-60]],P.ink);
  poly(c,[[-10,-79],[-3,-84],[7,-83],[11,-76],[9,-53],[13,-38],[-12,-38],[-9,-61]],P.coat);
  poly(c,[[-9,-77],[-5,-76],[-6,-41],[-11,-40]],P.coatShade);
  if(view === 'back') {
    poly(c,[[-7,-83],[6,-83],[9,-77],[-9,-77]],P.coatShade);
    line(c,[[0,-76],[0,-43]],P.coatShade,1);
    line(c,[[-8,-57],[8,-57]],P.coatShade,2);
    line(c,[[0,-47],[-2,-38]],P.steelLight,1);
  } else {
    poly(c,[[-2,-83],[7,-82],[4,-64]],P.blue);
    poly(c,[[1,-80],[4,-79],[3,-76],[5,-67],[2,-64],[0,-68],[2,-76]],P.red);
    poly(c,[[-4,-82],[0,-76],[-3,-70],[-7,-77]],P.white);
    poly(c,[[7,-82],[10,-76],[5,-69],[2,-76]],P.paper);
    line(c,[[2,-68],[2,-39]],P.coatShade,1);
    for(const yy of [-63,-55,-47])ellipse(c,3,yy,.8,.8,P.gray);
    rect(c,-6,-63,5,7,P.coatShade);rect(c,-6,-63,5,1,P.white);line(c,[[-3,-66],[-3,-61]],P.blue,1);
  }
  if(greeting) {
    const t = greeting.elapsed;
    const raise = reducedMotion ? 1 : Math.min(1,t/.3,(2.6-t)/.3);
    const wave = reducedMotion ? 0 : Math.sin(Math.max(0,t-.3)*Math.PI*5)*3*raise;
    const elbow=[20,-64-raise*7],hand=[19+raise*10+wave,-48-raise*47];
    line(c,[[9,-78],elbow,hand],P.ink,8);line(c,[[9,-78],elbow,[hand[0],hand[1]+4]],P.coat,5);
    ellipse(c,hand[0],hand[1],4,6,P.skin);
    for(let i=0;i<4;i++)line(c,[[hand[0]-3+i*2,hand[1]-2],[hand[0]-4+i*2.5,hand[1]-10+(i%2)]],P.skin,1.7);
    line(c,[[hand[0]-3,hand[1]],[hand[0]-7,hand[1]-4]],P.skin,2);
  } else {
    const nearArm=pose.arms[1];
    line(c,[nearArm.shoulder,nearArm.elbow,nearArm.hand],P.ink,7);
    line(c,[nearArm.shoulder,nearArm.elbow,[nearArm.hand[0],nearArm.hand[1]-2]],P.coat,4);
    ellipse(c,nearArm.hand[0],nearArm.hand[1]+1,3,4,P.skin);
  }
  rect(c,-2,-89,7,7,P.skinShadow);
  if(profile)drawProfileHead(c);
  else if(view === 'back')drawBackHead(c);
  else drawFrontHead(c);
  c.restore();c.restore();
}

function makeBackground() {
  const canvas=document.createElement('canvas');
  canvas.width=WORLD_WIDTH*RENDER_SCALE;canvas.height=HEIGHT*RENDER_SCALE;
  const context=canvas.getContext('2d');context.scale(RENDER_SCALE,RENDER_SCALE);drawRoom(context);
  return canvas;
}
export function createRenderer(canvas) {
  canvas.width=WIDTH*RENDER_SCALE;canvas.height=HEIGHT*RENDER_SCALE;
  const context=canvas.getContext('2d');
  const background=makeBackground();
  return {
    render(character,time,reducedMotion,camera={x:384}) {
      context.setTransform(RENDER_SCALE,0,0,RENDER_SCALE,0,0);
      context.clearRect(0,0,WIDTH,HEIGHT);
      context.save();context.translate(-camera.x,0);
      context.drawImage(background,0,0,WORLD_WIDTH,HEIGHT);
      const tick=reducedMotion?0:Math.floor(time*2);
      for(const x of [451,517])for(let row=0;row<7;row++)ellipse(context,x+46,127+row*19,1.5,1.5,(tick+row)%4?P.mint:P.greenDark);
      if(tick%2===0)rect(context,654,208,6,2,P.mint);
      drawCharacter(context,character,reducedMotion);
      context.restore();
    },
  };
}
