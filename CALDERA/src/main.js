import './style.css';
import './experience.css';
import gsap from 'gsap';
import { Observatory } from './scene.js';
import { Soundscape } from './audio.js';
import { GravityFrame } from './gravity.js';
import { SpatialCanvas } from './spatial-canvas.js';
import { applyPalette } from './palette.js';
import { setupPortfolio } from './portfolio.js';
import { setupShowcase } from './showcase.js';

const $=s=>document.querySelector(s),body=document.body,journey=$('#journey');
const panels=[...document.querySelectorAll('.chapter-content')],nav=[...document.querySelectorAll('.chapter-nav button')];
const names=['CALDERA / STUDIO','SELECTED WORK','INTERACTION LAB','THE PURPOSE'];
const sound=new Soundscape(),state={progress:0,mode:0};
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=motionPreference.matches,world,menuOpen=false,lastChapter=-1,raf=0,lastTime=performance.now(),targetScroll=0,touching=false,frameSamples=0,slowFrames=0,holdingTimer=0,lastTap=0,night=false;
let pointerStart={x:0,y:0},pointerMoved=false;
try{night=localStorage.getItem('tideline-mode')==='night';}catch{}
state.mode=night?1:0;
const announce=text=>{$('#announcement').textContent=text;};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

function showFallback(message){body.classList.add('loaded','renderer-unavailable');$('#fallback').hidden=false;if(message)$('#fallback-message').textContent=message;}
try{world=new Observatory($('#world'));world.reduced=reduced;world.mode=state.mode;world.renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();showFallback('The graphics connection was interrupted. Try again to rebuild the observatory.');world=null;});}catch(error){console.error('TIDELINE renderer:',error);showFallback();}
$('#retry').addEventListener('click',()=>location.reload());$('#quiet').addEventListener('click',()=>{$('#fallback').hidden=true;announce('Continuing with the text chapters.');});

const spatial=new SpatialCanvas($('#spatial-canvas'));
const gravity=new GravityFrame($('#gravity-canvas'),active=>{
  gsap.killTweensOf(journey);targetScroll=journey.scrollLeft;
  journey.inert=active;$('.header').inert=active;$('.gesture-dock').inert=active;$('.journey-controls').inert=active;
  if(world)world.holding=false;
  if(active){$('#rebuild').focus();announce('Gravity mode. Drag the fallen text. Press R or Rebuild the frame to return.');}
  else{$('.gesture-dock button').focus();announce('The frame is rebuilt. Continue your journey.');}
});

function maximumScroll(){return journey.scrollWidth-journey.clientWidth;}
function moveTo(x,immediate=false){targetScroll=clamp(x,0,maximumScroll());gsap.killTweensOf(journey);if(reduced||immediate)journey.scrollLeft=targetScroll;else gsap.to(journey,{scrollLeft:targetScroll,duration:.32,ease:'power2.out',overwrite:true});}
function goTo(chapter){if(gravity.active)return;if(menuOpen)toggleMenu(false);moveTo(clamp(chapter,0,3)*journey.clientWidth);if(chapter===0&&world){world.pulse=0;world.holding=false;}announce(names[clamp(chapter,0,3)]);}
document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>goTo(Number(button.dataset.go))));
$('.identity').addEventListener('click',e=>{e.preventDefault();goTo(0);});
$('#previous').addEventListener('click',()=>goTo(Math.round(targetScroll/journey.clientWidth)-1));$('#next').addEventListener('click',()=>goTo(Math.round(targetScroll/journey.clientWidth)+1));
addEventListener('wheel',event=>{if(event.ctrlKey||menuOpen||gravity.active||event.target.closest('dialog'))return;event.preventDefault();const delta=(Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY)*(event.deltaMode===1?16:event.deltaMode===2?innerWidth:1);moveTo(targetScroll+delta*3.2);},{passive:false});
journey.addEventListener('scroll',()=>{if(touching||!gsap.isTweening(journey))targetScroll=journey.scrollLeft;},{passive:true});
addEventListener('resize',()=>{gsap.killTweensOf(journey);targetScroll=clamp(state.progress*maximumScroll(),0,maximumScroll());journey.scrollLeft=targetScroll;});

function toggleMenu(open){menuOpen=open;body.classList.toggle('index-open',open);$('#index-toggle').setAttribute('aria-expanded',String(open));$('#index-panel').inert=!open;journey.inert=open;$('.journey-controls').inert=open;$('.gesture-dock').inert=open;gsap.killTweensOf(journey);targetScroll=journey.scrollLeft;if(world)world.holding=false;if(open)$('#index-panel button').focus();else $('#index-toggle').focus();}
$('#index-toggle').addEventListener('click',()=>toggleMenu(!menuOpen));
function setReduced(value){reduced=value;body.classList.toggle('reduced-motion',value);$('#motion').setAttribute('aria-pressed',String(value));$('#motion').textContent=`REDUCED MOTION: ${value?'ON':'OFF'}`;if(world)world.reduced=value;gravity.reduced=value;spatial.reduced=value;if(value){gsap.killTweensOf(journey);journey.scrollLeft=targetScroll;gsap.killTweensOf(state);state.mode=night?1:0;}}
$('#motion').addEventListener('click',()=>setReduced(!reduced));motionPreference.addEventListener('change',e=>setReduced(e.matches));setReduced(reduced);

function setNight(value,initial=false){night=value;body.classList.toggle('night',value);$('#mode-toggle').setAttribute('aria-checked',String(value));$('#mode-label').textContent=value?'EMBER / NIGHT':'TIDE / DAY';$('#material-label').textContent=value?'METAL. MAGMA. RESONANCE.':'METAL. WATER. RESONANCE.';$('#world').setAttribute('aria-label',value?'A kinetic observatory above a glowing lava sea at night':'A kinetic observatory above reflective water in daylight');gsap.killTweensOf(state);if(initial||reduced)state.mode=value?1:0;else gsap.to(state,{mode:value?1:0,duration:2,ease:'power2.inOut'});try{localStorage.setItem('tideline-mode',value?'night':'day');}catch{}if(!initial){world?.sendPulse();sound.pulse();announce(value?'Volcanic night. The sea becomes lava.':'Daylight. The sea returns to water.');}}
$('#mode-toggle').addEventListener('click',()=>setNight(!night));setNight(night,true);

$('#sound').addEventListener('click',async()=>{try{const on=await sound.toggle();$('#sound').setAttribute('aria-pressed',String(on));$('#sound-label').textContent=on?'SOUND ON':'SOUND OFF';announce(on?'Sound enabled. The field responds to the synthesizer.':'Sound disabled');}catch(error){$('#sound-label').textContent='SOUND UNAVAILABLE';announce('Audio is unavailable in this browser.');console.warn(error);}});
$('#pulse').addEventListener('click',()=>{world?.sendPulse();sound.pulse();announce('A wave is moving through the observatory.');});
function shatter(){if(menuOpen||gravity.active)return;clearTimeout(holdingTimer);if(world)world.holding=false;gravity.break();sound.pulse();}
document.querySelectorAll('.break-button').forEach(b=>b.addEventListener('click',shatter));$('#rebuild').addEventListener('click',()=>gravity.rebuild());
document.addEventListener('keydown',event=>{
  if(document.querySelector('dialog[open]'))return;
  if(event.target.matches('input,textarea,[contenteditable]'))return;
  if(gravity.active){if(event.key.toLowerCase()==='r'||event.key==='Escape'){event.preventDefault();gravity.rebuild();}return;}
  if(event.key==='Escape'&&menuOpen){toggleMenu(false);return;}
  if(event.key==='Tab'&&menuOpen){const focusable=[$('#index-toggle'),...$('#index-panel').querySelectorAll('button')],first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}return;}
  if(menuOpen)return;
  if(event.key.toLowerCase()==='g'){event.preventDefault();shatter();}
  if(['ArrowRight','PageDown'].includes(event.key)){event.preventDefault();goTo(Math.round(targetScroll/journey.clientWidth)+1);}
  if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();goTo(Math.round(targetScroll/journey.clientWidth)-1);}
  if(event.key==='Home'){event.preventDefault();goTo(0);}if(event.key==='End'){event.preventDefault();goTo(3);}
});

const cursor=$('.interaction-cursor'),cursorRing=cursor.querySelector('circle');
function interactive(target){return target.closest('button,a,aside,header,dialog,#physics-controls');}
function endHold(){clearTimeout(holdingTimer);if(world){if(world.holding){world.sendPulse();sound.pulse();}world.holding=false;}}
addEventListener('pointermove',event=>{if(gravity.active)return;const x=event.clientX/innerWidth*2-1,y=1-event.clientY/innerHeight*2;world?.setPointer(x,y);spatial.pointer={x:event.clientX/innerWidth,y:event.clientY/innerHeight};cursor.style.transform=`translate3d(${event.clientX}px,${event.clientY}px,0)`;cursor.style.opacity=!reduced&&!menuOpen&&!interactive(event.target)&&state.progress>.2&&state.progress<.82?'1':'0';if(Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>12){pointerMoved=true;if(event.pointerType==='touch')endHold();}},{passive:true});
addEventListener('pointerdown',event=>{if(gravity.active||menuOpen||interactive(event.target))return;pointerStart={x:event.clientX,y:event.clientY};pointerMoved=false;if(event.pointerType==='touch'){touching=true;gsap.killTweensOf(journey);targetScroll=journey.scrollLeft;}world?.setPointer(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2);holdingTimer=setTimeout(()=>{if(world)world.holding=true;},event.pointerType==='touch'?260:0);},{passive:true});
addEventListener('pointerup',event=>{endHold();if(touching){targetScroll=journey.scrollLeft;touching=false;}if(event.pointerType==='touch'&&!pointerMoved&&!interactive(event.target)&&!gravity.active){const now=performance.now();if(now-lastTap<340){shatter();lastTap=0;}else lastTap=now;}},{passive:true});
addEventListener('pointercancel',()=>{endHold();targetScroll=journey.scrollLeft;touching=false;},{passive:true});
addEventListener('dblclick',event=>{if(!interactive(event.target)&&!gravity.active){event.preventDefault();shatter();}});
addEventListener('blur',endHold);document.documentElement.addEventListener('pointerleave',()=>{cursor.style.opacity='0';endHold();});

function updateUI(){
  state.progress=maximumScroll()>0?journey.scrollLeft/maximumScroll():0;
  const position=state.progress*3,chapter=clamp(Math.round(position),0,3),palette=applyPalette(state.mode);
  panels.forEach((panel,i)=>{const distance=Math.abs(position-i),opacity=1-clamp((distance-.25)/.75,0,1);panel.style.opacity=String(opacity);panel.style.visibility=opacity>.005?'visible':'hidden';panel.inert=distance>.55;panel.style.transform='none';});
  if(chapter!==lastChapter){nav.forEach((b,i)=>{if(i===chapter)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});$('#phase-label').textContent=`0${chapter} / ${names[chapter]}`;lastChapter=chapter;}
  $('.header').style.color=state.progress<.16?palette.css.ink:palette.css.paper;
  $('.bottom-status').style.opacity='1';$('#progress').textContent=String(Math.round(state.progress*100)).padStart(3,'0');$('#travel-progress').style.transform=`scaleX(${state.progress})`;
  $('#previous').disabled=state.progress<.005;$('#next').disabled=state.progress>.995;
  $('#status-text').textContent=world?.holding?'RESONANCE BUILDING':world?.pulse>.2?'A DISTURBANCE, TRAVELLING':night?'THE EARTH IS BREATHING':'THE TIDE IS LISTENING';
  if(world){cursorRing.style.strokeDashoffset=String(220*(1-world.force));cursor.querySelector('span').textContent=world.holding?'RELEASE':'HOLD';}
  $('#mode-toggle').dataset.blend=state.mode.toFixed(3);$('#journey').dataset.progress=state.progress.toFixed(3);$('#sound').dataset.audioState=sound.context?.state||'not-created';
  return chapter;
}
const updatePortfolio=setupPortfolio({goTo,shatter,setNight,sound,world,gravity});
const updateShowcase=setupShowcase({goTo,shatter,setNight,sound,world,gravity});
function frame(now){
  const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;const chapter=updateUI();sound.update(state.progress,world?.force||0,state.mode);
  if(world){world.progress=reduced?[0,.33,.65,1][chapter]:state.progress;world.mode=state.mode;world.audioEnergy=sound.energy;world.render(dt);if(world.frame>180&&frameSamples<180){frameSamples++;if(dt>.031)slowFrames++;if(frameSamples===180&&slowFrames>100){world.renderer.setPixelRatio(1);world.water.getRenderTarget().setSize(512,512);}}}
  spatial.render(dt,state.progress,state.mode,sound.spectrum,sound.energy,world?.force||0);gravity.render(dt,state.mode);updatePortfolio(dt);updateShowcase(dt);raf=requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{sound.visibility(document.hidden).catch(()=>{});cancelAnimationFrame(raf);if(document.hidden)endHold();else{lastTime=performance.now();raf=requestAnimationFrame(frame);}});
raf=requestAnimationFrame(frame);document.fonts.ready.then(()=>body.classList.add('loaded'));
addEventListener('pagehide',()=>{cancelAnimationFrame(raf);world?.dispose();spatial.dispose();gravity.dispose();},{once:true});
