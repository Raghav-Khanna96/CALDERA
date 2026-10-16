import './portfolio.css';
import {paletteAt,contrast} from './palette.js';

export function setupPortfolio({goTo,shatter,setNight,sound,world,gravity}){
  const $=s=>document.querySelector(s);
  document.title='CALDERA — Spatial Design Studio / TIDELINE';
  $('.identity span').innerHTML='CALDERA<small>SPATIAL DESIGN STUDIO</small>';
  $('.header-note').innerHTML='Space. Motion. Emotion.<br>Designed to be experienced.';
  $('.arrival-intro .eyebrow').textContent='CALDERA / CONCEPT PORTFOLIO 001';
  $('#arrival-title').innerHTML='We shape spaces.<br>You <em>feel them.</em>';
  $('.intro-description').innerHTML='Interactive architecture. Digital experiences.<br>Explore a studio at the intersection.';
  $('.arrival-intro .text-link').innerHTML='EXPLORE THE PROJECT <span aria-hidden="true">↗</span>';
  $('.side-copy .eyebrow').textContent='01 / SELECTED WORK — TIDELINE';
  $('#structure-title').innerHTML='From mechanics<br>to <em>experience.</em>';
  $('.side-copy>p:not(.eyebrow)').innerHTML='An interactive architectural concept.<br>180 moving fins. Two material worlds.<br>Designed to be explored, not just viewed.';
  $('.side-copy .micro').innerHTML='ROLE / CONCEPT & FRONTEND EXPERIMENT<br>FORMAT / REAL-TIME WEB EXPERIENCE';
  $('.resonance-copy .eyebrow').textContent='02 / INTERACTION LAB';
  $('.ending-copy .eyebrow').textContent='03 / WHY THIS EXISTS';
  $('#release-title').innerHTML='Let people try<br>the <em>idea.</em>';
  $('.ending-copy>p:not(.eyebrow)').innerHTML='Spatial storytelling for architecture, exhibitions and product launches.<br>Explore the concept. Experience the materials. Inspect the thinking.';
  $('.end-credit').innerHTML='<span>CALDERA / TIDELINE</span><span>FICTIONAL STUDIO · INDEPENDENT CONCEPT</span>';
  $('.ending-copy .replay').insertAdjacentHTML('beforebegin','<button class="purpose-button" id="case-open">READ THE CASE STUDY ↗</button>');
  const navNames=['Introduction','Selected work','Interaction lab','The purpose'];
  $('#index-panel nav').querySelectorAll('button').forEach((b,i)=>b.innerHTML=`<small>0${i}</small>${navNames[i]}<span>↗</span>`);
  document.body.insertAdjacentHTML('beforeend',`<button id="judge-open" class="judge-open">JUDGE DEMO <span>↗</span></button>
  <dialog id="judge-panel" class="folio-dialog" aria-labelledby="judge-title"><div class="dialog-head"><span>LIVE PROOF / TRACK ALPHA</span><button data-close aria-label="Close judge demo">×</button></div><h2 id="judge-title">Don't take our word.<br><em>Try the mechanisms.</em></h2><p class="dialog-intro">Each test runs the actual feature. Evidence is recorded for this visit, not pre-ticked as complete.</p>
  <article><small>C1 / PLOT TWIST</small><h3>Break the interface.</h3><p>Real rigid-body gravity, collision and dragging. Rebuild returns you to the same chapter.</p><button id="demo-gravity">DEMONSTRATE GRAVITY ↘</button><output id="proof-gravity">Not demonstrated yet</output></article>
  <article><small>C2 / MAKE IT COME ALIVE</small><h3>Hear it. See it respond.</h3><p>Web Audio synthesis → analyser → spatial contours, light and motion. This button enables sound.</p><button id="demo-audio">PLAY THE AUDIO-VISUAL DEMO ↗</button><output id="proof-audio">Not demonstrated yet</output></article>
  <article><small>C3 / CHAOS CARD</small><h3>Generated, down to the surface.</h3><p>No raster images or videos. Procedural geometry, SVG and Canvas graphics; deterministic palette and contrast guard. Semantic HTML keeps text and controls accessible.</p><button id="demo-palette">RUN THE PALETTE CHECK ↗</button><output id="proof-palette">Not checked yet</output></article><p class="judge-note">These are implementation checks, not an organizer's eligibility certification. If “SVG/Canvas only” excludes HTML controls, that interpretation needs confirmation.</p></dialog>
  <dialog id="case-panel" class="folio-dialog" aria-labelledby="case-title"><div class="dialog-head"><span>CASE STUDY / 001</span><button data-close aria-label="Close case study">×</button></div><h2 id="case-title">TIDELINE.<br><em>Ideas made tangible.</em></h2><p class="dialog-intro">A concept project for CALDERA, a fictional spatial design studio exploring architecture, motion and digital storytelling.</p><article><small>THE PROBLEM</small><h3>A static image can't explain an experience.</h3><p>Architects, exhibition teams and product brands need a way to communicate how an idea feels before it is built. This studio portfolio demonstrates that through an experience visitors can manipulate.</p></article><article><small>THE EXPERIENCE</small><h3>Explore. Interact. Inspect.</h3><p>Travel through the architecture, compare water and molten material studies, drive the field with sound, and inspect the challenge mechanics in the judge demo.</p></article><article><small>WHERE THIS APPROACH FITS</small><h3>Architecture & product storytelling.</h3><p>The same interaction approach could support a concept pavilion preview, an exhibition microsite, or an interactive product launch. This is a demonstrator, not a commissioned building or an engineering-certified simulation.</p></article><article><small>THE BUILD</small><h3>One scene. No pre-rendered movie.</h3><p>JavaScript, Three.js, GLSL, Canvas2D, Web Audio, Matter.js and GSAP. A restrained material palette, responsive composition and reduced-motion option.</p></article><button id="case-demo">OPEN JUDGE DEMO ↗</button></dialog>`);
  const judge=$('#judge-panel'),caseStudy=$('#case-panel');
  for(const dialog of [judge,caseStudy]){dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});}
  $('#judge-open').onclick=()=>judge.showModal();$('#case-open').onclick=()=>caseStudy.showModal();$('#case-demo').onclick=()=>{caseStudy.close();judge.showModal();};
  $('#demo-gravity').onclick=()=>{judge.close();shatter();$('#proof-gravity').textContent=gravity.active?`Demonstrated · ${gravity.pieces?.length||document.querySelector('#gravity-canvas').dataset.fragments} live fragments · press R to rebuild`:'Could not start; rebuild the current scene and retry.';};
  let audioRequested=false;
  $('#demo-audio').onclick=async()=>{try{if(!sound.enabled)await sound.toggle();$('#sound').setAttribute('aria-pressed',String(sound.enabled));$('#sound-label').textContent=sound.enabled?'SOUND ON':'SOUND OFF';audioRequested=true;judge.close();goTo(2);world?.sendPulse();sound.pulse();}catch{$('#proof-audio').textContent='Audio unavailable in this browser';}};
  $('#demo-palette').onclick=()=>{let minimum=Infinity;for(let i=0;i<=1000;i++){const p=paletteAt(i/1000);minimum=Math.min(minimum,contrast(p.ink,p.background));}const images=document.querySelectorAll('img,video').length;$('#proof-palette').textContent=`${minimum>=4.5?'PASS':'FAIL'} · 1,001 palette states · min ${minimum.toFixed(2)}:1 token contrast · ${images} image/video elements`;};
  let elapsed=0;return dt=>{elapsed+=dt;if(elapsed<.2)return;elapsed=0;if(audioRequested)$('#proof-audio').textContent=sound.context?.state==='running'&&sound.energy>.001?`LIVE · analyser active · energy ${sound.energy.toFixed(3)}`:sound.enabled?'Waiting for audio signal…':'Demonstrated · sound now off';};
}
