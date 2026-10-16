import * as THREE from 'three';

export const waterShader = {
  name:'TidelineWater',
  uniforms:{color:{value:new THREE.Color('#566862')},tDiffuse:{value:null},textureMatrix:{value:null},uTime:{value:0},uPulse:{value:0},uOrigin:{value:new THREE.Vector2()},uDark:{value:0},uLava:{value:0},uAudio:{value:0}},
  vertexShader:`uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWorld;
    void main(){vUv=textureMatrix*vec4(position,1.);vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse; uniform float uTime,uPulse,uDark,uLava,uAudio; uniform vec2 uOrigin; varying vec4 vUv; varying vec3 vWorld;
    vec2 hash22(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash22(i).x,hash22(i+vec2(1.,0.)).x,f.x),mix(hash22(i+vec2(0.,1.)).x,hash22(i+1.).x,f.x),f.y);}
    float fbm(vec2 p){return noise(p)*.57+noise(p*2.03)*.28+noise(p*4.07)*.15;}
    float fissures(vec2 p){vec2 g=floor(p),f=fract(p);float a=8.,b=8.;for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){vec2 cell=vec2(float(x),float(y));vec2 r=cell+hash22(g+cell)-f;float d=dot(r,r);if(d<a){b=a;a=d;}else if(d<b){b=d;}}}return sqrt(b)-sqrt(a);}
    void main(){
      vec2 p=vWorld.xz; float d=length(p-uOrigin); float ripple=sin(d*1.3-uTime*3.6)*exp(-d*.025)*uPulse;
      float w=sin(p.x*.7+uTime*.35+sin(p.y*.3))*sin(p.y*.6-uTime*.24);
      float fine=sin(p.y*4.2+p.x*.25+sin(p.x*.8+uTime*.2))*sin(p.x*2.8-uTime*.15);
      vec2 uv=vUv.xy/vUv.w; uv+=vec2(w*.0017+ripple*.0025,fine*.0007+w*.0016);
      vec3 reflected=texture2D(tDiffuse,uv).rgb;
      float horizon=smoothstep(70.,300.,length(p));
      vec3 base=mix(vec3(.008,.11,.30),vec3(.025,.28,.49),horizon);
      vec3 c=mix(base,reflected*vec3(.48,.78,1.),.32)+vec3(.005,.045,.08)*(w*.35+fine*.22);
      c+=vec3(.035,.19,.24)*pow(max(0.,fine*w),5.);
      c+=vec3(.15,.07,.025)*max(0.,ripple)*.18;
      c=mix(c,c*.36,uDark*.65);c=mix(c,mix(vec3(.24,.40,.50),vec3(.008,.025,.065),uDark),smoothstep(85.,330.,length(p)));
      // A continuous molten current carries a deliberately block-grained surface.
      vec2 flow=p*.13+vec2(uTime*.075,-uTime*.055);
      vec2 warp=vec2(fbm(flow+uTime*.025),fbm(flow+vec2(8.2,2.4)-uTime*.018));
      vec2 current=flow+warp*2.7;
      float heat=fbm(current*2.4);
      float ribbons=1.-smoothstep(.018,.105,abs(heat-.5));
      float grain=noise(current*27.);
      float crust=smoothstep(.59,.74,heat);
      vec3 lava=mix(vec3(.58,.022,.001),vec3(2.1,.28,.004),smoothstep(.2,.64,heat));
      lava+=ribbons*vec3(.9,.19,.012);
      lava=mix(lava,vec3(.05,.009,.004)+grain*vec3(.06,.012,.003),crust*.91);
      lava+=pow(grain,12.)*vec3(.7,.18,.005)*(1.+uAudio*.2);
      lava+=max(0.,ripple)*vec3(.5,.13,.005)*.35;
      // Match the sky's lower hemisphere exactly; no red plane at the horizon.
      float distanceToEye=length(vWorld.xz-cameraPosition.xz);
      float haze=smoothstep(55.,235.,distanceToEye);
      lava=mix(lava,vec3(.014,.009,.008),haze);
      c=mix(c,lava,uLava);gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
};

export function createSky(){
  const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{uDark:{value:0},uLava:{value:0}},vertexShader:`varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vPosition;uniform float uDark,uLava;void main(){vec3 dir=normalize(vPosition);float h=smoothstep(-.06,.6,dir.y);vec3 c=mix(vec3(.53,.58,.55),vec3(.31,.39,.39),h);float glow=pow(max(0.,dot(dir,normalize(vec3(-.6,.35,.15)))),8.);c+=vec3(.25,.21,.14)*glow;c=mix(c,vec3(.017,.035,.036)+c*.06,uDark);
  vec2 uv=vec2(atan(dir.z,dir.x),asin(dir.y))*vec2(70.,90.);vec2 cell=floor(uv);float seed=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);float star=step(.994,seed)*(1.-smoothstep(.02,.13,length(fract(uv)-.5)))*smoothstep(.04,.2,dir.y);
  float moon=smoothstep(.9991,.99945,dot(dir,normalize(vec3(-.55,.32,-.75))));vec3 night=mix(vec3(.014,.009,.008),vec3(.0015,.002,.003),smoothstep(0.,.34,dir.y));night+=vec3(.8,.72,.57)*(star*.6+moon*.6);c=mix(c,night,uLava);gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(650,32,16),material);return mesh;
}

export function createField(mobile){
  const n=mobile?72:110,count=n*n,positions=new Float32Array(count*3),seeds=new Float32Array(count);
  let i=0;
  for(let x=0;x<n;x++)for(let y=0;y<n;y++){
    positions[i*3]=(x/(n-1)-.5)*19.5;positions[i*3+1]=(y/(n-1)-.5)*19.5;positions[i*3+2]=0;seeds[i]=(Math.sin(i*127.1)*43758.5453)%1;i++;
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uPointer:{value:new THREE.Vector2()},uForce:{value:0},uPulse:{value:0},uOpacity:{value:0},uPixelRatio:{value:1}},vertexShader:`attribute float aSeed;uniform float uTime,uForce,uPulse,uPixelRatio;uniform vec2 uPointer;varying float vDepth;varying float vMask;void main(){vec3 p=position;float d=length(p.xy-uPointer);float ring=sin(d*1.3-uTime*3.)*exp(-d*.16);p.z=sin(length(p.xy)*.8-uTime*.65)*.4+ring*(uForce*3.+uPulse*4.);p.xy+=normalize(p.xy-uPointer+vec2(.001))*exp(-d*.2)*uForce*.8;vDepth=p.z;vMask=1.-smoothstep(8.4,9.65,length(position.xy));vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp((1.8+aSeed*.5)*uPixelRatio*22./max(2.,-mv.z),1.,7.);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform float uOpacity;varying float vDepth,vMask;void main(){float a=1.-smoothstep(.1,.5,length(gl_PointCoord-.5));vec3 c=mix(vec3(.31,.51,.48),vec3(1.,.43,.15),smoothstep(-.6,1.3,vDepth));gl_FragColor=vec4(c,a*vMask*uOpacity*.9);}`});
  const field=new THREE.Group();field.material=material;
  const surfaceMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:material.uniforms,
    vertexShader:`uniform float uTime,uForce,uPulse;uniform vec2 uPointer;varying vec3 vWorld;varying vec2 vLocal;varying float vHeight;
    void main(){vec3 p=position;float d=length(p.xy-uPointer);p.z=sin(length(p.xy)*.8-uTime*.65)*.4+sin(d*1.3-uTime*3.)*exp(-d*.16)*(uForce*3.+uPulse*4.);vLocal=p.xy;vHeight=p.z;vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform float uOpacity,uTime;varying vec3 vWorld;varying vec2 vLocal;varying float vHeight;
    void main(){float radius=length(vLocal);if(radius>9.5)discard;vec3 normal=normalize(cross(dFdx(vWorld),dFdy(vWorld)));float light=abs(dot(normal,normalize(vec3(-.4,.6,1.))));float contour=pow(.5+.5*sin(radius*9.-vHeight*5.-uTime*.3),13.);float glint=pow(light,18.);vec3 c=mix(vec3(.022,.055,.051),vec3(.17,.24,.20),light);c+=vec3(.32,.12,.034)*contour*.8;c+=vec3(.26,.31,.23)*glint;c=mix(c,vec3(.55,.17,.045),smoothstep(.6,3.,vHeight)*.65);gl_FragColor=vec4(c,uOpacity*(1.-smoothstep(9.1,9.5,radius))*.94);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`});
  const surface=new THREE.Mesh(new THREE.PlaneGeometry(19,19,mobile?70:110,mobile?70:110),surfaceMaterial);field.add(surface);
  const points=new THREE.Points(geometry,material);points.position.z=.035;field.add(points);field.position.set(0,20,-3);return field;
}
