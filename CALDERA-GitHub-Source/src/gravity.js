import Matter from 'matter-js';
import { paletteAt } from './palette.js';

const {Engine,Bodies,Body,Composite,Query}=Matter;

export class GravityFrame{
  constructor(canvas,onChange){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onChange=onChange;this.active=false;this.rebuilding=false;this.pieces=[];this.mode=0;this.reduced=false;this.dragged=null;
    this.engine=Engine.create({gravity:{x:0,y:1.25},positionIterations:6,velocityIterations:4});
    this.resize=()=>{if(this.active)this.finish();const dpr=Math.min(devicePixelRatio,1.5);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);};this.resize();addEventListener('resize',this.resize);
    canvas.addEventListener('pointerdown',e=>{if(!this.active||this.rebuilding)return;const hit=Query.point(this.pieces.map(p=>p.body),{x:e.clientX,y:e.clientY})[0];if(hit){this.dragged=hit;this.dragOrigin={x:e.clientX,y:e.clientY};this.dragLast={...this.dragOrigin};Body.setStatic(hit,true);canvas.setPointerCapture(e.pointerId);}});
    canvas.addEventListener('pointermove',e=>{if(!this.dragged)return;this.dragLast={x:this.dragOrigin.x,y:this.dragOrigin.y};this.dragOrigin={x:e.clientX,y:e.clientY};Body.setPosition(this.dragged,this.dragOrigin);});
    const release=()=>{if(this.dragged){Body.setStatic(this.dragged,false);Body.setVelocity(this.dragged,{x:Math.max(-18,Math.min(18,(this.dragOrigin.x-this.dragLast.x)*.6)),y:Math.max(-18,Math.min(18,(this.dragOrigin.y-this.dragLast.y)*.6))});this.dragged=null;}};
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  }
  capture(){
    const pieces=[],seen=new Set();
    const roots=document.querySelectorAll('.header .identity span,.header-note,.header-actions button,.chapter-content h1,.chapter-content h2,.chapter-content p,.hero-word,.chapter-content button,.hero-bottom>span,.journey-caption,.gesture-dock button');
    for(const root of roots){
      if(getComputedStyle(root).visibility==='hidden'||root.closest('[inert]'))continue;
      const panel=root.closest('.chapter-content');if(panel&&Number(panel.style.opacity)<.65)continue;
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
      while((node=walker.nextNode())){
        if(seen.has(node))continue;seen.add(node);
        const parent=node.parentElement,style=getComputedStyle(parent),fontSize=parseFloat(style.fontSize);
        const regex=fontSize>45?/\S/gu:/\S+/gu;
        for(const match of node.textContent.matchAll(regex)){
          if(pieces.length>=150)break;
          const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);const r=range.getBoundingClientRect();
          if(r.width<1||r.height<1||r.top<0||r.bottom>innerHeight-12||r.right<0||r.left>innerWidth)continue;
          const x=r.left+r.width/2,y=r.top+r.height/2,width=Math.max(7,r.width),height=Math.max(9,r.height*.82);
          const body=Bodies.rectangle(x,y,width,height,{restitution:.44,friction:.26,frictionAir:.009,density:.002});
          const seed=pieces.length;Body.setVelocity(body,{x:Math.sin(seed*2.39)*4.5,y:-2-Math.abs(Math.cos(seed*1.73))*4});Body.setAngularVelocity(body,Math.sin(seed*3.17)*.055);
          pieces.push({body,x,y,width,height,text:match[0],font:`${style.fontStyle} ${style.fontWeight} ${fontSize}px ${style.fontFamily}`,fontSize,color:style.color});
        }
      }
    }
    return pieces;
  }
  break(){
    if(this.active)return false;this.pieces=this.capture();if(!this.pieces.length)return false;
    Composite.clear(this.engine.world,false);this.engine.timing.timestamp=0;
    Composite.add(this.engine.world,[Bodies.rectangle(innerWidth/2,innerHeight+25,innerWidth+100,90,{isStatic:true,restitution:.35}),Bodies.rectangle(-30,innerHeight/2,60,innerHeight*3,{isStatic:true}),Bodies.rectangle(innerWidth+30,innerHeight/2,60,innerHeight*3,{isStatic:true}),...this.pieces.map(p=>p.body)]);
    this.active=true;this.rebuilding=false;this.time=0;document.body.classList.add('gravity-mode');this.canvas.hidden=false;document.querySelector('#physics-controls').hidden=false;this.onChange(true);
    if(this.reduced)for(let i=0;i<160;i++)Engine.update(this.engine,1000/60);
    return true;
  }
  rebuild(){if(!this.active||this.rebuilding)return;this.dragged=null;this.rebuilding=true;this.rebuildTime=0;for(const p of this.pieces)p.from={x:p.body.position.x,y:p.body.position.y,angle:p.body.angle};if(this.reduced)this.finish();}
  finish(){this.active=false;this.rebuilding=false;this.dragged=null;this.ctx.clearRect(0,0,innerWidth,innerHeight);Composite.clear(this.engine.world,false);this.pieces=[];document.body.classList.remove('gravity-mode');this.canvas.hidden=true;document.querySelector('#physics-controls').hidden=true;this.onChange(false);}
  render(dt,mode){
    if(!this.active)return;this.time+=dt;this.mode=mode;const ctx=this.ctx;ctx.clearRect(0,0,innerWidth,innerHeight);
    if(this.rebuilding){this.rebuildTime+=dt;const t=Math.min(1,this.rebuildTime/1.05),ease=1-(1-t)**4;for(const p of this.pieces){Body.setPosition(p.body,{x:p.from.x+(p.x-p.from.x)*ease,y:p.from.y+(p.y-p.from.y)*ease});Body.setAngle(p.body,p.from.angle*(1-ease));}if(t===1){this.finish();return;}}
    else if(!this.reduced||this.dragged){const steps=Math.max(1,Math.ceil(dt/(1/60)));for(let i=0;i<steps;i++)Engine.update(this.engine,Math.min(dt/steps,1/60)*1000);}
    const palette=paletteAt(mode);ctx.strokeStyle=palette.css.accent;ctx.lineWidth=1;ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(25,innerHeight-20);ctx.lineTo(innerWidth-25,innerHeight-20);ctx.stroke();ctx.globalAlpha=1;
    for(const p of this.pieces){ctx.save();ctx.translate(p.body.position.x,p.body.position.y);ctx.rotate(p.body.angle);ctx.font=p.font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=mode>.5?palette.css.paper:p.color;ctx.fillText(p.text,0,0);ctx.restore();}
    this.canvas.dataset.fragments=String(this.pieces.length);this.canvas.dataset.phase=this.rebuilding?'rebuilding':'falling';
  }
  dispose(){removeEventListener('resize',this.resize);Composite.clear(this.engine.world,false);Engine.clear(this.engine);}
}
