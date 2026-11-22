import * as THREE from 'three';

const root = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9eb5b4);
scene.fog = new THREE.Fog(0x9eb5b4, 42, 175);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 260);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
root.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xdce9ee, 0x5b6257, 2.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe0b2, 3.1); sun.position.set(-24, 38, 18); sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-48; sun.shadow.camera.right=48; sun.shadow.camera.top=48; sun.shadow.camera.bottom=-48; scene.add(sun);
const fill = new THREE.DirectionalLight(0xb4d7e3, 0.75); fill.position.set(24,15,-20); scene.add(fill);

const mats = {
 asphalt: new THREE.MeshStandardMaterial({color:0x343b3a,roughness:0.94}),
 sidewalk: new THREE.MeshStandardMaterial({color:0xaaa99d,roughness:0.9}),
 stone: new THREE.MeshStandardMaterial({color:0xc9c0ae,roughness:0.88}),
 brick: new THREE.MeshStandardMaterial({color:0xa96f5a,roughness:0.92}),
 cream: new THREE.MeshStandardMaterial({color:0xd9d0bc,roughness:0.88}),
 glass: new THREE.MeshStandardMaterial({color:0x506c70,metalness:0.28,roughness:0.22}),
 dark: new THREE.MeshStandardMaterial({color:0x293432,roughness:0.65}),
 gold: new THREE.MeshStandardMaterial({color:0xb9935d,metalness:0.55,roughness:0.32}),
 leaf: new THREE.MeshStandardMaterial({color:0x526e50,roughness:0.95}),
 trunk: new THREE.MeshStandardMaterial({color:0x66503b,roughness:1}),
 white: new THREE.MeshStandardMaterial({color:0xe4e0d4,roughness:0.72})
};
const box = (w,h,d,mat,x,y,z, parent=scene) => { const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m; };
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240,240), new THREE.MeshStandardMaterial({color:0x71806e,roughness:1})); ground.rotation.x=-Math.PI/2; ground.position.y=-0.12; ground.receiveShadow=true; scene.add(ground);
box(13,.12,150,mats.asphalt,0,0,0); box(150,.12,13,mats.asphalt,0,0,0);
box(2,.16,150,mats.sidewalk,-7.5,.02,0); box(2,.16,150,mats.sidewalk,7.5,.02,0); box(150,.16,2,mats.sidewalk,0,.02,-7.5); box(150,.16,2,mats.sidewalk,0,.02,7.5);
const lineMat=new THREE.MeshStandardMaterial({color:0xd8d0ae,roughness:.9});
for(let z=-68;z<=68;z+=9) box(.12,.015,3.8,lineMat,0,.075,z);
for(let x=-68;x<=68;x+=9) box(3.8,.015,.12,lineMat,x,.075,0);

function makeBuilding(x,z,w,d,h,body,shopName,accent=0xb9935d){
 const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
 const bodyMat=new THREE.MeshStandardMaterial({color:body,roughness:.9});
 box(w,h,d,bodyMat,0,h/2,0,g);
 box(w+.35,.22,d+.35,mats.dark,0,h+.11,0,g);
 // Ground-floor shopfront and upper windows
 const frontZ=d/2+.012;
 box(w*.78,2.5,.12,mats.glass,0,1.55,frontZ,g);
 box(w*.82,.18,.22,new THREE.MeshStandardMaterial({color:accent,roughness:.5}),0,2.95,frontZ+.04,g);
 box(w*.84,.12,.18,mats.dark,0,.3,frontZ+.04,g);
 // Mullions and door
 for(let xx=-w*.25;xx<=w*.26;xx+=w*.25) box(.09,2.45,.16,mats.dark,xx,1.55,frontZ+.08,g);
 box(.12,2.2,.18,mats.gold,w*.36,1.45,frontZ+.1,g);
 // Repeated upper windows, sill details
 const floors=Math.max(1,Math.floor((h-3.6)/2.8));
 for(let f=0;f<floors;f++){
  const yy=3.7+f*2.65;
  for(let c=0;c<Math.max(2,Math.floor(w/2.2));c++){
   const xx=-w/2+1.15+c*(w-2.1)/Math.max(1,Math.floor(w/2.2)-1);
   box(.95,1.35,.1,mats.glass,xx,yy,frontZ,g);
   box(1.02,.1,.16,mats.white,xx,yy-.72,frontZ+.04,g);
   box(.07,1.35,.13,mats.white,xx,yy,frontZ+.05,g);
  }
 }
 // Shop sign, canopy and subtle facade bands
 box(w*.72,.42,.2,new THREE.MeshStandardMaterial({color:accent,roughness:.55}),0,3.18,frontZ+.16,g);
 box(w*.86,.12,.7,new THREE.MeshStandardMaterial({color:accent,roughness:.65}),0,2.78,frontZ+.32,g);
 if(shopName){
  const canvas=document.createElement('canvas'); canvas.width=512; canvas.height=128;
  const ctx=canvas.getContext('2d'); ctx.fillStyle='#26332e';ctx.fillRect(0,0,512,128);
  ctx.fillStyle='#e5d2a9';ctx.font='bold 48px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(shopName,256,65);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(w*.7,.34),new THREE.MeshBasicMaterial({map:tex}));sign.position.set(0,3.18,frontZ+.27);g.add(sign);
 }
 // Side facade ledges
 for(let f=1;f<=floors;f++) box(w+.16,.08,d+.16,mats.stone,0,3.2+f*2.65,0,g);
 return g;
}
makeBuilding(-13,-15,9,9,13,0xd1c2a7,'ANIMO MARKET',0x8f9d78);
makeBuilding(13,-15,10,9,17,0xb77d67,'ANIMO FOOD',0xb9935d);
makeBuilding(-14,15,10,10,18,0xd8d0bc,'ANIMO HOTEL',0x8d9c8e);
makeBuilding(14,15,10,10,14,0xc3b6a1,'ANIMO CAFE',0x9b7959);
makeBuilding(-30,-23,12,11,21,0xc5b8a5,'',0x8b9b88);
makeBuilding(30,-23,12,11,16,0xb47e68,'',0x9a7658);
makeBuilding(-30,23,12,11,17,0xd1c9b7,'',0x8b9b88);
makeBuilding(30,23,12,11,20,0xc4b29d,'',0x9a7658);
makeBuilding(-48,0,11,13,19,0xc9b9a5,'',0x8b9b88);
makeBuilding(48,0,11,13,16,0xb57e69,'',0x9a7658);

function tree(x,z,scale=1){
 const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);scene.add(g);
 const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,2.4,8),mats.trunk);t.position.y=1.2;t.castShadow=true;g.add(t);
 const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.45,1),mats.leaf);crown.position.y=3.1;crown.castShadow=true;g.add(crown);
 const crown2=new THREE.Mesh(new THREE.IcosahedronGeometry(.95,1),new THREE.MeshStandardMaterial({color:0x6c835c,roughness:1}));crown2.position.set(.55,3.55,.2);g.add(crown2);
}
for(let z=-60;z<=60;z+=16){tree(-9.1,z,.9);tree(9.1,z,1.05)}
for(let x=-60;x<=60;x+=18){if(Math.abs(x)>13){tree(x,-9.1,.85);tree(x,9.1,.9)}}

// Street lamps
const lampMat=new THREE.MeshStandardMaterial({color:0x303936,metalness:.65,roughness:.4});
for(let z=-55;z<=55;z+=27){const g=new THREE.Group();g.position.set(-6.6,0,z);scene.add(g);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,4.2,8),lampMat);pole.position.y=2.1;g.add(pole);const arm=box(.9,.08,.08,lampMat,.38,4.12,0,g);const bulb=new THREE.Mesh(new THREE.SphereGeometry(.17,12,8),new THREE.MeshBasicMaterial({color:0xffe3ad}));bulb.position.set(.78,4.02,0);g.add(bulb);}

const player=new THREE.Group();scene.add(player);player.position.set(0,0,22);
const skin=new THREE.MeshStandardMaterial({color:0xc99572,roughness:.85});
const jacket=new THREE.MeshStandardMaterial({color:0x263c37,roughness:.8});
const trousers=new THREE.MeshStandardMaterial({color:0x29323b,roughness:.85});
const shoes=new THREE.MeshStandardMaterial({color:0x171d1e,roughness:.8});
const body= new THREE.Mesh(new THREE.CapsuleGeometry(.34,.65,5,10),jacket);body.position.y=1.18;body.castShadow=true;player.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.25,16,12),skin);head.position.y=1.92;head.castShadow=true;player.add(head);
const hair=new THREE.Mesh(new THREE.SphereGeometry(.255,16,8,0,Math.PI*2,0,Math.PI*.58),new THREE.MeshStandardMaterial({color:0x392d27,roughness:1}));hair.position.y=2.02;player.add(hair);
for(const side of [-1,1]){
 const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.55,4,8),trousers);leg.position.set(side*.16,.48,0);leg.castShadow=true;player.add(leg);
 const foot=new THREE.Mesh(new THREE.BoxGeometry(.2,.13,.38),shoes);foot.position.set(side*.16,.12,.08);player.add(foot);
 const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.48,4,8),jacket);arm.position.set(side*.4,1.25,0);arm.rotation.z=side*.08;player.add(arm);
}
const playerShadow=new THREE.Mesh(new THREE.CircleGeometry(.48,24),new THREE.MeshBasicMaterial({color:0x17211d,transparent:true,opacity:.25}));playerShadow.rotation.x=-Math.PI/2;playerShadow.position.y=.02;player.add(playerShadow);

const state={started:false,paused:false,firstPerson:false,elapsed:0,day:1,moveX:0,moveY:0,yaw:0,dragging:false,lastX:0,lastY:0};
const clockEl=document.querySelector('#clock'),dayEl=document.querySelector('#day-label'),pauseOverlay=document.querySelector('#pause-overlay'),welcome=document.querySelector('#welcome');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function toast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1900)}
function saveGame(){const data={x:player.position.x,z:player.position.z,yaw:state.yaw,elapsed:state.elapsed,day:state.day};localStorage.setItem('animo-empire-save-1',JSON.stringify(data));document.querySelector('#save-status').textContent='Voortgang opgeslagen op dit toestel.';toast('Spel opgeslagen');}
function loadGame(){try{const d=JSON.parse(localStorage.getItem('animo-empire-save-1'));if(d){player.position.set(d.x||0,0,d.z||22);state.yaw=d.yaw||0;state.elapsed=d.elapsed||0;state.day=d.day||1;}}catch{}}
loadGame();
function setPaused(value){state.paused=value;pauseOverlay.classList.toggle('hidden',!value);document.querySelector('#pause').textContent=value?'▶':'Ⅱ';}
document.querySelector('#pause').addEventListener('click',()=>{if(!state.started)return;setPaused(!state.paused)});
document.querySelector('#resume').addEventListener('click',()=>setPaused(false));
document.querySelector('#save').addEventListener('click',saveGame);
document.querySelector('#start').addEventListener('click',()=>{state.started=true;welcome.classList.add('dismissed');toast('Welkom in ANIMO-stad');});
document.querySelector('#camera').addEventListener('click',()=>{state.firstPerson=!state.firstPerson;document.querySelector('#camera-label').textContent=state.firstPerson?'EERSTE PERSOON':'DERDE PERSOON';toast(state.firstPerson?'Eerste persoon':'Derde persoon')});
document.querySelector('#interact').addEventListener('click',()=>toast('Je verkent ANIMO-stad. Meer interacties volgen in de volgende bouwfase.'));

// Mobile joystick
const zone=document.querySelector('#joystick-zone'),knob=document.querySelector('#joystick-knob');let joyId=null;
function joyMove(e){const r=zone.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;const dx=e.clientX-cx,dy=e.clientY-cy,dist=Math.hypot(dx,dy),max=36,k=Math.min(1,max/(dist||1));const x=dx*k,y=dy*k;knob.style.transform=`translate(${x}px,${y}px)`;state.moveX=x/max;state.moveY=y/max;}
zone.addEventListener('pointerdown',e=>{if(!state.started||state.paused)return;joyId=e.pointerId;zone.setPointerCapture(joyId);joyMove(e)});
zone.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e)});
function joyEnd(e){if(e.pointerId!==joyId)return;joyId=null;state.moveX=state.moveY=0;knob.style.transform='translate(0,0)'}
zone.addEventListener('pointerup',joyEnd);zone.addEventListener('pointercancel',joyEnd);

// Drag on the open scene to orbit camera. Ignore UI controls.
renderer.domElement.addEventListener('pointerdown',e=>{if(!state.started||state.paused)return;state.dragging=true;state.lastX=e.clientX;state.lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!state.dragging||state.paused)return;const dx=e.clientX-state.lastX;state.lastX=e.clientX;state.lastY=e.clientY;state.yaw-=dx*.006;});
renderer.domElement.addEventListener('pointerup',()=>state.dragging=false);renderer.domElement.addEventListener('pointercancel',()=>state.dragging=false);
addEventListener('keydown',e=>{if(e.key==='Escape'&&state.started)setPaused(!state.paused);if(e.key==='c')document.querySelector('#camera').click();if(e.key==='w'||e.key==='ArrowUp')state.moveY=-1;if(e.key==='s'||e.key==='ArrowDown')state.moveY=1;if(e.key==='a'||e.key==='ArrowLeft')state.moveX=-1;if(e.key==='d'||e.key==='ArrowRight')state.moveX=1});
addEventListener('keyup',e=>{if(['w','s','ArrowUp','ArrowDown'].includes(e.key))state.moveY=0;if(['a','d','ArrowLeft','ArrowRight'].includes(e.key))state.moveX=0});

const v3=new THREE.Vector3(),look=new THREE.Vector3();
function updateClock(dt){state.elapsed+=dt;const total=8*60+state.elapsed/60;const mins=Math.floor(total)%1440;state.day=Math.floor((8*60+state.elapsed/60)/1440)+1;const hh=String(Math.floor(mins/60)).padStart(2,'0'),mm=String(mins%60).padStart(2,'0');clockEl.textContent=hh+':'+mm;dayEl.textContent='DAG '+state.day;const daylight=clamp((Math.sin((mins/1440)*Math.PI*2-Math.PI/2)+1)/2,.08,1);sun.intensity=1.0+2.4*daylight;hemi.intensity=.75+1.35*daylight;const sky=new THREE.Color().lerpColors(new THREE.Color(0x172b3b),new THREE.Color(0xa9c0c2),daylight);scene.background=sky;scene.fog.color.copy(sky);}
function updatePlayer(dt){if(!state.started||state.paused)return;const moving=Math.hypot(state.moveX,state.moveY)>.08;if(moving){const forward=new THREE.Vector3(Math.sin(state.yaw),0,-Math.cos(state.yaw));const right=new THREE.Vector3(-forward.z,0,forward.x);v3.copy(forward).multiplyScalar(-state.moveY).addScaledVector(right,state.moveX).normalize();player.position.addScaledVector(v3,dt*3.4);player.position.x=clamp(player.position.x,-62,62);player.position.z=clamp(player.position.z,-62,62);player.rotation.y=Math.atan2(v3.x,v3.z);} }
function updateCamera(dt){const targetY=state.firstPerson?1.72:1.45;const forward=new THREE.Vector3(Math.sin(state.yaw),0,-Math.cos(state.yaw));if(state.firstPerson){camera.position.set(player.position.x,player.position.y+targetY,player.position.z);look.copy(camera.position).add(forward.multiplyScalar(8));}else{const offset=new THREE.Vector3(0,4.1,7.2).applyAxisAngle(new THREE.Vector3(0,1,0),state.yaw);const desired=player.position.clone().add(offset);camera.position.lerp(desired,1-Math.pow(.001,dt));look.set(player.position.x,player.position.y+1.35,player.position.z);look.add(forward.multiplyScalar(1.5));}camera.lookAt(look);}
let last=performance.now();
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(state.started&&!state.paused){updateClock(dt);updatePlayer(dt);}updateCamera(dt);renderer.render(scene,camera);}
requestAnimationFrame(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.started&&!state.paused)setPaused(true);});
