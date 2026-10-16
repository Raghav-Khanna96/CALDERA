import assert from 'node:assert/strict';
import { paletteAt, contrast } from './src/palette.js';
import { readdir } from 'node:fs/promises';
for(let i=0;i<=1000;i++){
  const p=paletteAt(i/1000);
  assert(contrast(p.ink,p.background)>=4.5,`Contrast at ${i}`);
  for(const key of ['background','ink','accent','paper','sea','ember']) assert(p[key].every(v=>Number.isFinite(v)&&v>=0&&v<=1));
  assert.deepEqual(p,paletteAt(i/1000));
}
for(const root of ['src','public']){
  const files=await readdir(root,{recursive:true});
  assert(!files.some(f=>/\.(png|jpe?g|webp|gif|avif|mp4)$/i.test(f)),`Raster asset in ${root}`);
}
console.log('PASS: 1001 palette states meet 4.5:1 token contrast; deterministic bounded colors; no raster assets.');
