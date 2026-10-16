// One deterministic palette, shared by DOM, Canvas2D and the scene.
// Hues cannot drift with audio, randomness or pointer input.
export const clamp01 = v => Math.max(0, Math.min(1, v));
export function hslRgb(h,s,l){
  s/=100;l/=100;const a=s*Math.min(l,1-l);
  const f=n=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};
  return [f(0),f(8),f(4)];
}
const css = rgb => `rgb(${rgb.map(v=>Math.round(v*255)).join(' ')})`;
const mix = (a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function luminance(rgb){return rgb.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);}
export function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function paletteAt(value){
  const t=clamp01(value),neutral=(l)=>hslRgb(165,5,l),warm=(s,l)=>hslRgb(22,s,l);
  const background=mix(neutral(83),warm(13,5),t);
  const foreground=mix(neutral(14),warm(20,92),t);
  // Intermediate switch states also remain legible: choose the stronger endpoint.
  const ink=contrast(foreground,background)>=4.6?foreground:(contrast(neutral(0),background)>contrast(neutral(100),background)?neutral(0):neutral(100));
  return {background,ink,accent:mix(warm(64,37),warm(95,65),t),paper:neutral(93),sea:hslRgb(165,22,18),ember:warm(95,55),css:{background:css(background),ink:css(ink),accent:css(mix(warm(64,37),warm(95,65),t)),paper:css(neutral(93))}};
}
export function applyPalette(value){
  const palette=paletteAt(value),style=document.documentElement.style;
  style.setProperty('--mode-bg',palette.css.background);style.setProperty('--mode-ink',palette.css.ink);style.setProperty('--accent',palette.css.accent);style.setProperty('--paper',palette.css.paper);style.setProperty('--night',value.toFixed(3));
  return palette;
}
