import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createSky, createField, waterShader } from './shaders.js';

const smooth=THREE.MathUtils.smoothstep;
const clamp=THREE.MathUtils.clamp;
const TAU=Math.PI*2;

export class Observatory {
  constructor(container){
    this.mobile=innerWidth<760;this.reduced=false;this.time=0;this.progress=0;this.force=0;this.pulse=0;this.mode=0;this.audioEnergy=0;this.pointer=new THREE.Vector2();this.pointerTarget=new THREE.Vector2();this.lastInput=0;this.frame=0;this.quality=1;
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.mobile?1.35:1.7));this.renderer.setSize(innerWidth,innerHeight);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;container.append(this.renderer.domElement);
    this.scene=new THREE.Scene();this.scene.fog=new THREE.FogExp2('#869793',.0038);
    this.camera=new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.1,1000);
    const pmrem=new THREE.PMREMGenerator(this.renderer);const room=new RoomEnvironment();this.env=pmrem.fromScene(room,.025);this.scene.environment=this.env.texture;room.dispose();pmrem.dispose();
    this.sky=createSky();this.scene.add(this.sky);
    this.ambient=new THREE.HemisphereLight('#e6eadb','#314945',2.2);this.scene.add(this.ambient);
    this.sun=new THREE.DirectionalLight('#fff2d8',4.5);this.sun.position.set(-30,70,40);this.sun.castShadow=true;this.sun.shadow.mapSize.set(this.mobile?1024:2048,this.mobile?1024:2048);Object.assign(this.sun.shadow.camera,{left:-37,right:37,top:45,bottom:-25,near:1,far:150});this.sun.shadow.normalBias=.06;this.scene.add(this.sun);
    this.rim=new THREE.DirectionalLight('#d0e5de',3);this.rim.position.set(35,35,-25);this.scene.add(this.rim);
    this.innerLight=new THREE.PointLight('#fd8a41',130,45,2);this.innerLight.position.set(0,20,0);this.scene.add(this.innerLight);
    this.lavaLight=new THREE.PointLight('#ff6622',0,100,2);this.lavaLight.position.set(0,3,16);this.scene.add(this.lavaLight);this.nightFog=new THREE.Color('#150906');this.dayRim=new THREE.Color('#d0e5de');this.nightRim=new THREE.Color('#e7a46b');this.dayMetal=new THREE.Color('#8d968e');this.nightMetal=new THREE.Color('#776b5e');
    this.buildArchitecture();this.buildSea();this.field=createField(this.mobile);this.scene.add(this.field);this.buildDust();
    this.positionCurve=new THREE.CatmullRomCurve3([
      new THREE.Vector3(48,29,76),new THREE.Vector3(40,28,63),new THREE.Vector3(30,26,49),new THREE.Vector3(20,23,39),new THREE.Vector3(8,21,33),new THREE.Vector3(2,20,32),new THREE.Vector3(0,20,31),new THREE.Vector3(0,20,25),new THREE.Vector3(-2,22,-18),new THREE.Vector3(-25,34,-67),new THREE.Vector3(-32,36,-82)
    ],false,'catmullrom',.25);
    this.lookCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-9,14,0),new THREE.Vector3(-6,17,0),new THREE.Vector3(-4,20,0),new THREE.Vector3(-4,20,0),new THREE.Vector3(-2,20,-3),new THREE.Vector3(-1,20,-4),new THREE.Vector3(-1,20,-5),new THREE.Vector3(-1,20,-7),new THREE.Vector3(0,22,-28),new THREE.Vector3(0,33,0),new THREE.Vector3(0,35,0)],false,'catmullrom',.25);
    this.look=new THREE.Vector3();this.cameraBase=new THREE.Vector3();this.clock=new THREE.Clock();this.dummy=new THREE.Object3D();this.fogDay=new THREE.Color('#869793');this.fogNight=new THREE.Color('#0a1b1b');this.resize=()=>{this.mobile=innerWidth<760;this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);};addEventListener('resize',this.resize);
    this.render(1/60);
  }
  buildArchitecture(){
    const metal=new THREE.MeshStandardMaterial({color:'#8d968e',roughness:.27,metalness:.92,envMapIntensity:.95});
    // Fine directional machining lines remain in object space as the fins move.
    metal.onBeforeCompile=(shader)=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMetalPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvMetalPosition=position;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vMetalPosition;').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor+=.07*sin(vMetalPosition.x*115.)*sin(vMetalPosition.z*42.);');};
    const dark=new THREE.MeshStandardMaterial({color:'#263834',metalness:.6,roughness:.5});
    const bronze=new THREE.MeshStandardMaterial({color:'#894022',metalness:.85,roughness:.28,emissive:'#682209',emissiveIntensity:.12});
    this.architecture=new THREE.Group();this.scene.add(this.architecture);
    this.count=180;this.fins=new THREE.InstancedMesh(new THREE.BoxGeometry(10.4,.105,11.8),metal,this.count);this.fins.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.fins.castShadow=true;this.fins.receiveShadow=true;this.fins.frustumCulled=false;this.architecture.add(this.fins);this.finAngles=new Float32Array(this.count);this.finVelocity=new Float32Array(this.count);
    this.innerFins=new THREE.InstancedMesh(new THREE.BoxGeometry(1.15,.13,9.5),bronze,this.count);this.innerFins.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.innerFins.castShadow=true;this.innerFins.frustumCulled=false;this.architecture.add(this.innerFins);
    for(const z of [-5.5,5.5]){for(const radius of [10.5,18.7]){const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.13,8,180),radius===10.5?bronze:dark);ring.position.set(0,20,z);ring.castShadow=true;this.architecture.add(ring);}}
    const foundation=new THREE.Mesh(new THREE.CylinderGeometry(17.5,18,1,96),new THREE.MeshStandardMaterial({color:'#212c29',roughness:.86,metalness:.2}));foundation.position.y=-.12;foundation.receiveShadow=true;this.scene.add(foundation);
    const pathMaterial=new THREE.MeshStandardMaterial({color:'#555f55',roughness:.82,metalness:.2});
    const stairs=new THREE.InstancedMesh(new THREE.BoxGeometry(3.1,.26,1.2),pathMaterial,48);const dummy=new THREE.Object3D();
    for(let i=0;i<48;i++){dummy.position.set(0,.12+i*.19,40-i*.79);dummy.updateMatrix();stairs.setMatrixAt(i,dummy.matrix);}stairs.castShadow=true;stairs.receiveShadow=true;this.scene.add(stairs);
    for(const x of [-1.52,1.52]){const rail=new THREE.Mesh(new THREE.BoxGeometry(.045,.055,39),bronze);rail.position.set(x,5.3,21);rail.rotation.x=Math.atan(.19/.79);this.scene.add(rail);}
    const interior=new THREE.Mesh(new THREE.BoxGeometry(3.1,.22,15),dark);interior.position.set(0,9.17,-5.5);interior.receiveShadow=true;this.scene.add(interior);
    // Small scale markers make the monument's size legible.
    const bollards=new THREE.InstancedMesh(new THREE.BoxGeometry(.11,.85,.11),dark,24);
    for(let i=0;i<24;i++){const step=Math.floor(i/2)*4;dummy.position.set(i%2?-1.5:1.5,.7+step*.19,40-step*.79);dummy.updateMatrix();bollards.setMatrixAt(i,dummy.matrix);}this.scene.add(bollards);
    const lightMaterial=new THREE.MeshBasicMaterial({color:'#e8a86a'});const lights=new THREE.InstancedMesh(new THREE.BoxGeometry(.035,.025,.48),lightMaterial,36);
    for(let i=0;i<36;i++){dummy.position.set(i%2?-1.43:1.43,.3+Math.floor(i/2)*.38,40-Math.floor(i/2)*1.58);dummy.updateMatrix();lights.setMatrixAt(i,dummy.matrix);}this.scene.add(lights);
    const poles=new THREE.InstancedMesh(new THREE.CylinderGeometry(.055,.055,5,6),dark,12);
    for(let i=0;i<12;i++){const angle=i/12*TAU;dummy.position.set(Math.cos(angle)*43,1.2,Math.sin(angle)*43);dummy.updateMatrix();poles.setMatrixAt(i,dummy.matrix);}this.scene.add(poles);
  }
  buildSea(){this.water=new Reflector(new THREE.PlaneGeometry(1400,1400),{textureWidth:this.mobile?512:1024,textureHeight:this.mobile?512:1024,clipBias:.003,shader:waterShader,multisample:0});this.water.rotation.x=-Math.PI/2;this.water.position.y=-.67;this.scene.add(this.water);}
  buildDust(){const n=this.mobile?150:400,p=new Float32Array(n*3);for(let i=0;i<n;i++){const seed=(Math.sin(i*48.17)*4737.5)%1;p[i*3]=Math.sin(i*2.399)*35;p[i*3+1]=3+Math.abs(seed)*42;p[i*3+2]=Math.cos(i*2.399)*28;}this.dust=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(p,3)),new THREE.PointsMaterial({size:.045,color:'#d4dcc6',transparent:true,opacity:.25,depthWrite:false}));this.scene.add(this.dust);}
  setPointer(x,y){this.pointerTarget.set(x,y);this.lastInput=1;}
  sendPulse(){this.pulse=1;}
  render(dt){
    dt=Math.min(dt,.04);this.frame++;const motion=this.reduced?0:1;this.time+=dt*motion;this.pointer.lerp(this.pointerTarget,1-Math.exp(-dt*5));this.lastInput*=Math.exp(-dt*1.8);this.pulse*=Math.exp(-dt*.65);
    this.force=THREE.MathUtils.damp(this.force,this.holding?1:this.lastInput*.2,3,dt);const p=this.progress,t=this.time;
    const darkness=smooth(p,.23,.55)*(1-.35*smooth(p,.76,.99));
    const mode=this.mode,energy=this.reduced?0:this.audioEnergy;
    this.sky.material.uniforms.uDark.value=darkness*.94;this.sky.material.uniforms.uLava.value=mode;this.scene.fog.color.copy(this.fogDay).lerp(this.fogNight,darkness).lerp(this.nightFog,mode);this.ambient.intensity=(1.2-darkness*.8)*(1-mode*.83);this.sun.intensity=(3.3-darkness*2.3)*(1-mode*.94);this.rim.intensity=(2.7-darkness*1.6)*(1-mode*.35);this.rim.color.copy(this.dayRim).lerp(this.nightRim,mode);this.innerLight.intensity=130+darkness*350+this.force*200+mode*850+energy*450;this.lavaLight.intensity=mode*(2300+energy*1000);this.fins.material.envMapIntensity=.95-mode*.62;this.fins.material.color.copy(this.dayMetal).lerp(this.nightMetal,mode);this.innerFins.material.emissiveIntensity=.12+mode*1.7+energy*.6;
    this.positionCurve.getPoint(p,this.cameraBase);this.lookCurve.getPoint(p,this.look);
    if(this.mobile){const wide=1-smooth(p,.1,.52)+smooth(p,.8,1);this.cameraBase.z+=Math.sign(this.cameraBase.z)*wide*55;this.cameraBase.x*=.6;this.look.x=0;this.look.y+=wide*13;this.camera.fov=48;}else{this.camera.fov=39;}
    this.camera.position.copy(this.cameraBase);this.camera.position.x+=this.pointer.x*.8*motion;this.camera.position.y+=this.pointer.y*.5*motion;this.camera.lookAt(this.look);this.camera.updateProjectionMatrix();
    const pointerAngle=Math.atan2(this.pointer.y,this.pointer.x);const release=smooth(p,.75,1);
    for(let i=0;i<this.count;i++){
      const a=i/this.count*TAU;const distance=Math.atan2(Math.sin(a-pointerAngle),Math.cos(a-pointerAngle));const influence=Math.exp(-distance*distance*2.5)*this.force;
      const wave=(Math.sin(a*3-t*.7)*(.035+energy*.16)+Math.sin(a*6-t*3.4)*this.pulse*.33+influence*Math.sin(a*4-t*2)*.32)*motion;
      const target=wave+release*Math.sin(a*2)*.24;
      const acceleration=(target-this.finAngles[i])*35-this.finVelocity[i]*8;this.finVelocity[i]+=acceleration*dt;this.finAngles[i]+=this.finVelocity[i]*dt;
      const radius=16.2+Math.sin(a*2+.4)*.5+release*.7;this.dummy.position.set(Math.cos(a)*radius,20+Math.sin(a)*radius,Math.sin(a*2)*1.4);this.dummy.rotation.set(0,0,a);this.dummy.rotateX(.22+Math.sin(a)*.22+this.finAngles[i]);this.dummy.rotateY(.1+Math.cos(a*2)*.15);this.dummy.scale.set(1+Math.sin(a*2)*.1,1,1+Math.cos(a)*.08);this.dummy.updateMatrix();this.fins.setMatrixAt(i,this.dummy.matrix);
      this.dummy.position.set(Math.cos(a)*10.3,20+Math.sin(a)*10.3,-.25);this.dummy.rotation.set(0,0,a);this.dummy.rotateX(this.finAngles[i]*.7+.12);this.dummy.scale.set(1,1,1);this.dummy.updateMatrix();this.innerFins.setMatrixAt(i,this.dummy.matrix);
    }
    this.fins.instanceMatrix.needsUpdate=true;this.innerFins.instanceMatrix.needsUpdate=true;
    const wu=this.water.material.uniforms;wu.uTime.value=t;wu.uPulse.value=this.pulse+this.force*.4;wu.uOrigin.value.set(this.pointer.x*24,this.pointer.y*24);wu.uDark.value=darkness;wu.uLava.value=mode;wu.uAudio.value=energy;
    const fu=this.field.material.uniforms;fu.uTime.value=t;fu.uPointer.value.set(this.pointer.x*10,this.pointer.y*10);fu.uForce.value=(this.force+energy*.65)*motion;fu.uPulse.value=this.pulse*motion;fu.uOpacity.value=smooth(p,.33,.51)*(1-smooth(p,.73,.83));fu.uPixelRatio.value=this.renderer.getPixelRatio();this.field.visible=fu.uOpacity.value>.001;
    this.dust.rotation.y=t*.008;this.dust.position.y=mode*Math.sin(t*.18)*2;this.dust.material.color.setHSL((165-143*mode)/360,.1+mode*.8,.7);this.dust.material.opacity=.2+darkness*.2+mode*.4;
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){removeEventListener('resize',this.resize);this.water.dispose();this.env.dispose();this.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});this.renderer.dispose();}
}
