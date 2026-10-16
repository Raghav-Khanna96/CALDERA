import { paletteAt } from './palette.js';

// A screen-space contour instrument, drawn from equations rather than images.
export class SpatialCanvas{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.pointer={x:.6,y:.45};this.t=0;this.reduced=false;this.resize=()=>{const dpr=Math.min(devicePixelRatio,1.4);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);};this.resize();addEventListener('resize',this.resize);}
  render(dt,progress,mode,spectrum,energy,force){
    this.t+=this.reduced?0:dt;const ctx=this.ctx,w=innerWidth,h=innerHeight;ctx.clearRect(0,0,w,h);
    const strength=Math.max(0,1-Math.abs(progress-.645)/.22);this.canvas.style.opacity=String(strength*.72);if(strength<.01)return;
    const palette=paletteAt(mode),cx=w*(w<760?.52:.69),cy=h*.48,r=Math.min(w,h)*(w<760?.31:.285),t=this.t;
    ctx.strokeStyle=palette.css.accent;ctx.lineWidth=.8;
    for(let ring=0;ring<14;ring++){
      ctx.globalAlpha=.08+ring/14*.25;ctx.beginPath();
      for(let i=0;i<=160;i++){
        const a=i/160*Math.PI*2,bin=spectrum?.[Math.floor((i%160)/160*80)]||0;
        const distance=Math.hypot(Math.cos(a)*r+cx-this.pointer.x*w,Math.sin(a)*r+cy-this.pointer.y*h);
        const bend=Math.exp(-distance/(r*.6))*force*23;
        const radius=r*(.4+ring*.047)+Math.sin(a*3+t+ring*.22)*(3+energy*18)+bin/255*(10+ring)+bend;
        const x=cx+Math.cos(a)*radius,y=cy+Math.sin(a)*radius*.78;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }ctx.closePath();ctx.stroke();
    }
    // The trace is the actual analyser waveform amplitude, zero when audio is off.
    ctx.globalAlpha=.8;ctx.strokeStyle=palette.css.paper;ctx.beginPath();const span=w<760?110:180,x0=w-span-50,y0=h-80;
    for(let i=0;i<=80;i++){const v=(spectrum?.[i]||0)/255,x=x0+i/80*span,y=y0-v*30*(i%2?1:-1);if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();ctx.globalAlpha=1;
    this.canvas.dataset.audioEnergy=energy.toFixed(3);
  }
  dispose(){removeEventListener('resize',this.resize);}
}
