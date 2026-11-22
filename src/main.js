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

const buildingColliders=[];
function makeBuilding(x,z,w,d,h,body,shopName,accent=0xb9935d){
 buildingColliders.push({x,z,halfW:w/2+.25,halfD:d/2+.25,doorX:shopName==='ANIMO CAFE'?x+w*.36:null,doorZ:shopName==='ANIMO CAFE'?z+d/2+.02:null});
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

// Eerste toegankelijke locatie: ANIMO CAFE. Dit is een aparte, volledig ingerichte testinterieurzone.
const cafeInterior = new THREE.Group();
cafeInterior.position.set(1000,0,1000);
scene.add(cafeInterior);
const interiorMats = {
 floor:new THREE.MeshStandardMaterial({color:0x827b6d,roughness:.82}),
 wall:new THREE.MeshStandardMaterial({color:0xd8cfbd,roughness:.92}),
 dark:new THREE.MeshStandardMaterial({color:0x26332f,roughness:.72}),
 wood:new THREE.MeshStandardMaterial({color:0x76533b,roughness:.62}),
 brass:new THREE.MeshStandardMaterial({color:0xb18a50,metalness:.55,roughness:.34}),
 tile:new THREE.MeshStandardMaterial({color:0xaaa394,roughness:.8}),
 steel:new THREE.MeshStandardMaterial({color:0x9da8a5,metalness:.72,roughness:.3}),
 glass:new THREE.MeshStandardMaterial({color:0x42616a,metalness:.2,roughness:.2}),
 seat:new THREE.MeshStandardMaterial({color:0x526b60,roughness:.9})
};
function interiorBox(w,h,d,mat,x,y,z){return box(w,h,d,mat,x,y,z,cafeInterior)}
// Tiled floor and architectural shell
interiorBox(16,.18,12,interiorMats.floor,0,0,0);
interiorBox(16,4.2,.28,interiorMats.wall,0,2.1,-6);
interiorBox(.28,4.2,12,interiorMats.wall,-8,2.1,0);
interiorBox(.28,4.2,12,interiorMats.wall,8,2.1,0);
// Front wall leaves a proper doorway in the middle
interiorBox(6.4,4.2,.28,interiorMats.wall,-4.8,2.1,6);
interiorBox(6.4,4.2,.28,interiorMats.wall,4.8,2.1,6);
interiorBox(3.2,1.15,.28,interiorMats.wall,0,3.62,6);
interiorBox(15.7,.16,.3,interiorMats.dark,0,4.25,0);
interiorBox(15.7,.12,.3,interiorMats.brass,0,.18,0);
// Wall panelling and warm ceiling lights
for(let x=-6.8;x<=6.8;x+=1.7){interiorBox(.045,1.05,.035,interiorMats.brass,x,.75,-5.82)}
for(const x of [-5,-1.7,1.7,5]){
 const lamp=new THREE.PointLight(0xffd9a3,34,9,2);lamp.position.set(x,3.8,-1);cafeInterior.add(lamp);
 const shade=new THREE.Mesh(new THREE.CylinderGeometry(.28,.38,.16,16),interiorMats.brass);shade.position.set(x,3.72,-1);cafeInterior.add(shade);
}
// Reception / bar and back display
interiorBox(5.2,1.12,1.05,interiorMats.wood,-4.9,.68,-3.8);
interiorBox(5.35,.12,1.15,interiorMats.brass,-4.9,1.28,-3.8);
interiorBox(5.2,2.1,.18,interiorMats.dark,-4.9,2.25,-5.55);
for(let x=-7;x<=-3;x+=1)interiorBox(.7,.5,.08,interiorMats.wood,x,2.25,-5.42);
// Kitchen pass and stainless work line
interiorBox(5.8,1.05,.9,interiorMats.steel,3.7,.58,-4.1);
interiorBox(5.9,.1,1,interiorMats.dark,3.7,1.14,-4.1);
for(let x=1.2;x<=6.2;x+=1.65){
 interiorBox(1.25,.9,.72,interiorMats.steel,x,.55,-5.25);
 interiorBox(1.18,.08,.65,interiorMats.dark,x,1.04,-5.25);
}
interiorBox(5.8,.12,1.15,interiorMats.steel,3.7,2.35,-5.3);
for(let x=1.3;x<=6.1;x+=1.6){interiorBox(.08,1.1,.08,interiorMats.brass,x,1.72,-5.3)}
// Cooking range, ovens and extractor
interiorBox(2.2,.88,.9,interiorMats.dark,5.1,.5,-2.8);
for(let x=4.35;x<=5.85;x+=.75){
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.22,.045,8,20),interiorMats.brass);ring.rotation.x=Math.PI/2;ring.position.set(x,.98,-2.8);cafeInterior.add(ring);
}
interiorBox(2.5,.16,1.25,interiorMats.steel,5.1,2.25,-2.8);
interiorBox(2.2,.18,.16,interiorMats.dark,5.1,3.15,-2.8);
// Dining tables and chairs
function cafeTable(x,z){
 interiorBox(1.55,.12,.95,interiorMats.wood,x,1.05,z);
 for(const dx of [-.62,.62])for(const dz of [-.34,.34])interiorBox(.09,1,.09,interiorMats.dark,x+dx,.5,z+dz);
 for(const dx of [-1.05,1.05]){
  interiorBox(.78,.12,.78,interiorMats.seat,x+dx,.62,z);
  interiorBox(.78,.85,.12,interiorMats.seat,x+dx,1.05,z-.32);
  for(const dz of [-.25,.25])interiorBox(.07,.55,.07,interiorMats.dark,x+dx+(.32*Math.sign(dx)),.3,z+dz);
 }
}
cafeTable(-3,1.8);cafeTable(1,1.8);cafeTable(-3,4.1);cafeTable(1,4.1);
// Decorative framed ANIMO wall sign
const signCanvas=document.createElement('canvas');signCanvas.width=768;signCanvas.height=256;
const signCtx=signCanvas.getContext('2d');signCtx.fillStyle='#24342f';signCtx.fillRect(0,0,768,256);
signCtx.strokeStyle='#b9935d';signCtx.lineWidth=7;signCtx.strokeRect(14,14,740,228);
signCtx.fillStyle='#e5d2a9';signCtx.textAlign='center';signCtx.font='bold 86px Georgia';signCtx.fillText('ANIMO CAFE',384,145);
const signTexture=new THREE.CanvasTexture(signCanvas);signTexture.colorSpace=THREE.SRGBColorSpace;
const cafeSign=new THREE.Mesh(new THREE.PlaneGeometry(4.8,1.6),new THREE.MeshBasicMaterial({map:signTexture}));
cafeSign.position.set(0,3.05,-5.78);cafeInterior.add(cafeSign);


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

const state={started:false,paused:false,firstPerson:false,insideCafe:false,outsidePosition:null,elapsed:0,day:1,moveX:0,moveY:0,yaw:0,dragging:false,lastX:0,lastY:0};
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
function enterCafe(){
 state.outsidePosition=new THREE.Vector3(17.6,0,21.1);
 state.insideCafe=true;
 player.position.set(1000,0,1004.35);
 state.yaw=0;
 document.querySelector('#location').textContent='ANIMO CAFE';
 document.querySelector('#action-label').textContent='NAAR BUITEN';
 toast('Welkom binnen bij ANIMO CAFE.');
}
function exitCafe(){
 state.insideCafe=false;
 player.position.set(17.6,0,21.1);
 state.yaw=0;
 document.querySelector('#location').textContent='CENTRUM';
 document.querySelector('#action-label').textContent='BINNEN';
 toast('Je staat weer buiten bij ANIMO CAFE.');
}
function interact(){
 if(!state.started||state.paused)return;
 if(state.insideCafe){exitCafe();return;}
 const doorX=17.6,doorZ=20.6;
 if(Math.hypot(player.position.x-doorX,player.position.z-doorZ)<4.5){enterCafe();return;}
 toast('Loop naar de glazen voordeur van ANIMO CAFE om binnen te gaan.');
}
document.querySelector('#interact').addEventListener('click',interact);

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
function updatePlayer(dt){
 if(!state.started||state.paused)return;
 const moving=Math.hypot(state.moveX,state.moveY)>.08;
 if(!moving)return;
 const forward=new THREE.Vector3(Math.sin(state.yaw),0,-Math.cos(state.yaw));
 const right=new THREE.Vector3(-forward.z,0,forward.x);
 v3.copy(forward).multiplyScalar(-state.moveY).addScaledVector(right,state.moveX).normalize();
 const step=v3.clone().multiplyScalar(dt*3.4);
 const nextX=player.position.x+step.x,nextZ=player.position.z+step.z;
 player.rotation.y=Math.atan2(v3.x,v3.z);
 if(state.insideCafe){
  const inDoorLane=player.position.x>998.45&&player.position.x<1001.55&&nextZ>=1005.55;
  if(inDoorLane){exitCafe();return;}
  player.position.x=clamp(nextX,992.45,1007.55);
  player.position.z=clamp(nextZ,994.35,1005.55);
  return;
 }
 const cafe=buildingColliders.find(b=>b.doorX!==null&&b.doorX!==undefined);
 const crossingCafeDoor=!!cafe&&Math.abs(nextX-cafe.doorX)<.95&&player.position.z>cafe.doorZ+.05&&nextZ<=cafe.doorZ+.05;
 if(crossingCafeDoor){enterCafe();return;}
 const blocked=(x,z)=>buildingColliders.some(b=>{
  const inCafeDoor= b.doorX!==null&&Math.abs(x-b.doorX)<.95&&z>b.doorZ-.5&&z<b.doorZ+1.2;
  return !inCafeDoor&&Math.abs(x-b.x)<b.halfW+.42&&Math.abs(z-b.z)<b.halfD+.42;
 });
 if(!blocked(nextX,player.position.z))player.position.x=nextX;
 if(!blocked(player.position.x,nextZ))player.position.z=nextZ;
 player.position.x=clamp(player.position.x,-62,62);
 player.position.z=clamp(player.position.z,-62,62);
}
function updateCamera(dt){const targetY=state.firstPerson?1.72:1.45;const forward=new THREE.Vector3(Math.sin(state.yaw),0,-Math.cos(state.yaw));if(state.firstPerson){camera.position.set(player.position.x,player.position.y+targetY,player.position.z);look.copy(camera.position).add(forward.multiplyScalar(8));}else if(state.insideCafe){const offset=new THREE.Vector3(0,3.0,-3.1).applyAxisAngle(new THREE.Vector3(0,1,0),state.yaw);const desired=player.position.clone().add(offset);camera.position.lerp(desired,1-Math.pow(.001,dt));look.set(player.position.x,player.position.y+1.35,player.position.z);look.add(forward.multiplyScalar(1.2));}else{const offset=new THREE.Vector3(0,4.1,7.2).applyAxisAngle(new THREE.Vector3(0,1,0),state.yaw);const desired=player.position.clone().add(offset);camera.position.lerp(desired,1-Math.pow(.001,dt));look.set(player.position.x,player.position.y+1.35,player.position.z);look.add(forward.multiplyScalar(1.5));}camera.lookAt(look);}
let last=performance.now();
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(state.started&&!state.paused){updateClock(dt);updatePlayer(dt);}updateCamera(dt);renderer.render(scene,camera);}
requestAnimationFrame(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.started&&!state.paused)setPaused(true);});
