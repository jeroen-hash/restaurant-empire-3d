import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const canvas=document.querySelector('#world');
const statusEl=document.querySelector('#loadStatus');
const loading=document.querySelector('#loading');
const loadingText=document.querySelector('#loadingText');
const errorPanel=document.querySelector('#errorPanel');
const errorText=document.querySelector('#errorText');
const toastEl=document.querySelector('#toast');
const actionBtn=document.querySelector('#actionBtn');
const cameraBtn=document.querySelector('#cameraBtn');

let renderer,scene,camera,clock;
let playerRoot,playerMixer,playerActions={},activeAction=null;
let fallbackAvatar=null;
const cafeDoorLeaves=[];
let insideCafe=false,thirdPerson=true,doorOpen=false;
let yaw=0,pitch=0.22,moveX=0,moveY=0,joystickActive=false;
let toastTimer=0;
const keys={};
const raycaster=new THREE.Raycaster();
const tempV=new THREE.Vector3();
const colliders=[];
const textureLoader=new THREE.TextureLoader();
const gltfLoader=new GLTFLoader();

function setStatus(text){statusEl.textContent=text}
function toast(text){toastEl.textContent=text;toastEl.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove('show'),2200)}
function box(w,h,d,mat,x,y,z,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function cylinder(rt,rb,h,mat,x,y,z,parent=scene,segments=16){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function sphere(r,mat,x,y,z,parent=scene){const m=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function makeMat(color,roughness=.8,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness})}
function loadTexture(url,repeatX=1,repeatY=1){const t=textureLoader.load(url,undefined,undefined,()=>{});t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeatX,repeatY);return t}

const brickColor=loadTexture('https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brick_wall_001/brick_wall_001_diffuse_1k.jpg',3,2.3);
const brickNormal=textureLoader.load('https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brick_wall_001/brick_wall_001_nor_gl_1k.jpg');
const brickRough=textureLoader.load('https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brick_wall_001/brick_wall_001_rough_1k.jpg');
const brickMat=new THREE.MeshStandardMaterial({map:brickColor,normalMap:brickNormal,roughnessMap:brickRough,roughness:.92});
const stoneMat=makeMat('#c6bba8',.82);
const darkMetal=makeMat('#202827',.34,.72);
const brass=makeMat('#b08b52',.28,.72);
const glass=new THREE.MeshPhysicalMaterial({color:'#b7d0d0',metalness:.08,roughness:.12,transmission:.32,transparent:true,opacity:.82,thickness:.18,envMapIntensity:1.4});
const warmGlass=new THREE.MeshPhysicalMaterial({color:'#d8c29b',metalness:.04,roughness:.16,transmission:.18,transparent:true,opacity:.86,emissive:'#7b4b20',emissiveIntensity:.18});
const plaster=makeMat('#d9d0c1',.9);
const wood=makeMat('#493326',.5);
const asphaltColor=loadTexture('https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/asphalt_01/asphalt_01_diff_1k.jpg',18,18);
const asphaltNormal=textureLoader.load('https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/asphalt_01/asphalt_01_nor_gl_1k.jpg');
const asphaltRough=textureLoader.load('https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/asphalt_01/asphalt_01_rough_1k.jpg');
const asphalt=new THREE.MeshStandardMaterial({map:asphaltColor,normalMap:asphaltNormal,roughnessMap:asphaltRough,roughness:.96});
const paving=makeMat('#8d8980',.95);
const gold=makeMat('#c5a16c',.36,.45);

function createSign(text,w,h){
  const c=document.createElement('canvas');c.width=1024;c.height=256;
  const ctx=c.getContext('2d');ctx.fillStyle='#18211f';ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle='#c6a16b';ctx.lineWidth=8;ctx.strokeRect(18,18,c.width-36,c.height-36);
  ctx.fillStyle='#e5c795';ctx.font='bold 108px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,c.width/2,128);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshStandardMaterial({map:tex,roughness:.42,metalness:.12,emissive:'#4b3014',emissiveIntensity:.15});
  return new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
}

function addWindow(parent,x,y,z,w=2.15,h=2.25){
  const frame=makeMat('#252b29',.36,.45);
  box(w+.22,h+.22,.16,frame,x,y,z,parent);
  box(w-.12,h-.12,.08,glass,x,y,z+.105,parent);
  box(.075,h,.12,frame,x,y,z+.15,parent);
  box(w,.075,.12,frame,x,y,z+.15,parent);
  box(w,.075,.12,frame,x,y+h*.16,z+.15,parent);
  box(w+.38,.16,.34,stoneMat,x,y-h/2-.13,z+.06,parent);
  box(w+.28,.12,.25,stoneMat,x,y+h/2+.13,z+.05,parent);
}

function addBalcony(parent,x,z,y=7.2){
  const rail=darkMetal;
  box(2.8,.14,1.0,stoneMat,x,y-.55,z+.38,parent);
  box(2.8,.12,.12,rail,x,y-.05,z+.85,parent);
  for(let i=0;i<13;i++){const px=x-1.3+i*.216; cylinder(.025,.025,.78,rail,px,y-.43,z+.85,parent,8)}
  box(2.8,.14,.12,rail,x,y-.83,z+.85,parent);
  box(2.95,.16,.18,stoneMat,x,y-.99,z+.38,parent);
}

function addLamp(x,z){
  const g=new THREE.Group();scene.add(g);
  cylinder(.11,.16,5.5,darkMetal,x,2.75,z,g);
  const arm=cylinder(.055,.055,1.15,darkMetal,x+.38,5.25,z,g);arm.rotation.z=Math.PI/2;
  const hood=sphere(.27,brass,x+.9,5.0,z,g);hood.scale.set(1.25,.4,1);
  const bulb=sphere(.13,new THREE.MeshBasicMaterial({color:'#ffe0a5'}),x+.9,4.83,z,g);
  const light=new THREE.PointLight('#ffd5a0',18,12,2);light.position.set(x+.9,4.8,z);g.add(light);
}

function addTree(x,z){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  const trunkMat=makeMat('#514034',.95);
  cylinder(.18,.28,3.2,trunkMat,0,1.6,0,g);
  const leafMat=new THREE.MeshStandardMaterial({color:'#405c4b',roughness:1});
  for(let i=0;i<7;i++){const a=i*2.4;const s=.85+(i%3)*.18;sphere(s,leafMat,Math.cos(a)*.65,3.4+(i%2)*.65,Math.sin(a)*.55,g)}
  const pit=box(1.8,.18,1.8,makeMat('#554f45'),x,.09,z);pit.castShadow=false;
}

function addFacade(x,z,width,height,kind='residential'){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  if(kind==='cafe'){
    box(width,height,.55,brickMat,0,height/2,-3.72,g);
    box(.55,height,7.45,brickMat,-width/2+.275,height/2,0,g);
    box(.55,height,7.45,brickMat,width/2-.275,height/2,0,g);
    box(width,height-4,.55,brickMat,0,(height+4)/2,3.72,g);
  }else{
    const shell=box(width,height,8,brickMat,0,height/2,0,g);shell.castShadow=true;
  }
  box(width+.3,.32,8.3,stoneMat,0,.16,0,g);
  box(width+.5,.34,8.45,stoneMat,0,height-.17,0,g);
  box(width+.55,.2,8.5,darkMetal,0,height+.1,0,g);
  // Ground-floor shopfront: layered frames, glazing, recessed entrance.
  const shopH=3.5,shopY=2.05;
  if(kind==='cafe'){
    for(const wx of [-4.45,4.45]){
      box(4.0,2.85,.14,darkMetal,wx,2.0,4.12,g);
      box(3.76,2.61,.06,warmGlass,wx,2.0,4.22,g);
      box(.07,2.6,.1,darkMetal,wx,2.0,4.28,g);
      box(4.08,.12,.22,stoneMat,wx,.48,4.18,g);
      box(4.08,.12,.22,stoneMat,wx,3.52,4.18,g);
    }
    for(const wx of [-1.52,1.52])box(.16,3.18,.3,darkMetal,wx,1.95,4.23,g);
    box(3.12,.18,.3,darkMetal,0,3.56,4.23,g);
    for(const side of [-1,1]){
      const hinge=new THREE.Group();hinge.position.set(side<0?-1.42:1.42,.12,4.34);g.add(hinge);
      const leafX=side<0?.68:-.68;
      box(1.36,2.58,.09,wood,leafX,1.29,0,hinge);
      box(1.22,2.34,.035,warmGlass,leafX,1.29,.065,hinge);
      cylinder(.025,.025,.34,brass,side<0?1.15:-1.15,1.25,.13,hinge,10);
      cafeDoorLeaves.push({hinge,side,open:0});
    }
    box(3.0,.16,.5,stoneMat,0,.08,4.45,g);
  }else{
    box(width-.65,shopH,.22,darkMetal,0,shopY,4.06,g);
    box(width-.92,shopH-.28,.1,glass,0,shopY,4.2,g);
    for(let i=0;i<5;i++){const xx=-width/2+.75+i*(width-1.5)/4;box(.09,shopH,.16,darkMetal,xx,shopY,4.29,g)}
    box(width-.6,.16,.3,stoneMat,0,3.92,4.14,g);
    box(width-.6,.18,.3,stoneMat,0,.22,4.14,g);
  }
  // Upper floors with stone-framed windows and small balconies.  // Upper floors with stone-framed windows and small balconies.
  const floors=Math.max(1,Math.floor((height-4.5)/3.5));
  for(let f=0;f<floors;f++){
    const wy=5.5+f*3.25;
    const count=Math.max(2,Math.floor(width/3.5));
    for(let i=0;i<count;i++){
      const wx=-width/2+1.8+i*(width-3.6)/Math.max(1,count-1);
      addWindow(g,wx,wy,4.07,2.05,2.35);
      if(f===0&&i%2===0)addBalcony(g,wx,4.08,wy-1.05);
      box(.22,.24,.24,stoneMat,wx,wy+1.38,4.12,g);
    }
  }
  // Vertical pilasters and subtle facade bands.
  for(const px of [-width/2+.28,width/2-.28]){
    box(.28,height-.4,.35,stoneMat,px,height/2,4.08,g);
    box(.42,.22,.48,stoneMat,px,height-.45,4.08,g);
  }
  for(let y=4.35;y<height-1;y+=3.25)box(width,.12,.3,stoneMat,0,y,4.12,g);
  // Store awning, canopy valance and warm downlights.
  if(kind==='cafe'){
    box(7.6,.14,1.45,makeMat('#a33f31',.7),0,3.62,4.95,g);
    for(let i=0;i<12;i++)box(.62,.16,1.46,i%2?makeMat('#f1e4cb') : makeMat('#a33f31'),-3.4+i*.62,3.62,4.96,g);
    box(7.8,.16,.18,stoneMat,0,3.5,5.65,g);
    const sign=createSign('ANIMO CAFE',6.8,1.05);sign.position.set(0,5.0,4.36);g.add(sign);
    for(const sx of [-2.7,0,2.7]){const l=new THREE.PointLight('#ffca8a',16,5,2);l.position.set(sx,3.4,4.9);g.add(l)}
    // Working hinged double doors are created in the shopfront above.
  }else{
    const sign=createSign(kind==='hotel'?'ANIMO HOTEL':'ANIMO',Math.min(width*.62,5),.62);sign.position.set(0,4.0,4.28);g.add(sign);
  }
  return g;
}

function makeInterior(){
  const g=new THREE.Group();g.name='cafeInterior';scene.add(g);
  const floor=makeMat('#75634e',.65);
  box(12,.22,11,floor,0,.02,-4.7,g);
  const back=box(12,5.6,.28,brickMat,0,2.85,-10.1,g);
  box(12,.22,11,plaster,0,5.7,-4.7,g);
  box(.22,5.7,11,plaster,-6,2.85,-4.7,g);
  box(.22,5.7,11,plaster,6,2.85,-4.7,g);
  // Counter and back bar.
  box(5.8,1.15,1.25,wood,-2.3,.78,-8.25,g);
  box(5.95,.12,1.38,stoneMat,-2.3,1.4,-8.25,g);
  box(5.8,2.1,.32,wood,-2.3,2.55,-9.72,g);
  for(let i=0;i<4;i++){box(.08,1.4,.12,brass,-4.5+i*1.45,2.55,-9.5,g)}
  // Tables, chairs and warm pendants.
  for(const [x,z] of [[1.4,-3.4],[4,-5.4],[1.4,-7.1]]){
    cylinder(.72,.72,.12,wood,x,1.05,z,g,32);cylinder(.1,.14,1.0,darkMetal,x, .5,z,g);
    for(const [dx,dz] of [[-.92,0],[.92,0],[0,-.92],[0,.92]]){
      box(.62,.12,.62,wood,x+dx, .55,z+dz,g);
      for(const lx of [-.22,.22])for(const lz of [-.22,.22])cylinder(.035,.045,.52,darkMetal,x+dx+lx,.28,z+dz+lz,g,8);
      box(.62,.58,.12,wood,x+dx,.92,z+dz+(dz<0?-.23:.23),g);
    }
    const lamp=new THREE.PointLight('#ffd6a0',14,6,2);lamp.position.set(x,3.8,z);g.add(lamp);
    cylinder(.08,.08,.25,brass,x,4.0,z,g,12);
    sphere(.18,new THREE.MeshBasicMaterial({color:'#ffdda9'}),x,3.82,z,g);
  }
  // Menu wall and service details.
  const board=box(2.1,1.55,.12,darkMetal,3.65,3.55,-9.85,g);
  const menu=createSign('DAGMENU',1.8,.5);menu.position.set(3.65,3.9,-9.76);g.add(menu);
  const plantMat=new THREE.MeshStandardMaterial({color:'#4c7258',roughness:1});
  for(const [x,z] of [[-5,-3],[5,-8]]){cylinder(.32,.4,.65,makeMat('#b6a58c'),x,.42,z,g);for(let i=0;i<5;i++)sphere(.34,plantMat,x+Math.sin(i*2)*.2,.95+(i%2)*.2,z+Math.cos(i*2)*.2,g)}
  g.visible=false;
  return g;
}

function buildWorld(){
  scene=new THREE.Scene();scene.background=new THREE.Color('#9aa7a8');scene.fog=new THREE.FogExp2('#aab2af',.009);
  camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,180);
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  renderer.physicallyCorrectLights=true;
  clock=new THREE.Clock();
  scene.add(new THREE.HemisphereLight('#dce8ed','#52483d',2.0));
  const sun=new THREE.DirectionalLight('#fff0d7',3.2);sun.position.set(-12,24,14);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;sun.shadow.bias=-.00015;scene.add(sun);
  // Street surface, curbs and Belgian-style stone sidewalks.
  box(60,.25,64,asphalt,0,-.18,0);
  for(const side of [-1,1]){
    box(60,.42,3.6,paving,0,-.02,side*7.3);
    box(60,.22,.28,stoneMat,0,.08,side*5.45);
    for(let i=0;i<40;i++){const seam=box(.025,.015,3.35,makeMat('#6e6a62'),-29+i*1.48,.205,side*7.3);seam.castShadow=false}
  }
  // Facades form a compact, believable European street frontage.
  addFacade(-14,0,12,13,'residential');
  addFacade(0,0,14,14,'cafe');
  addFacade(15,0,13,16,'hotel');
  addFacade(-14,-25,12,12,'residential');
  addFacade(14,-25,12,13,'residential');
  // Roof silhouettes and chimney stacks.
  for(const x of [-14,0,15]){box(12,1.2,8,makeMat('#343b3a'),x,15.2,0);for(let i=0;i<3;i++)box(.8,1.5,.8,makeMat('#8b8274'),x-4+i*4,16.4,0)}
  addLamp(-8,8);addLamp(9,8);addLamp(-25,-2);addLamp(25,-2);
  addTree(-24,-8);addTree(24,-8);addTree(-24,8);addTree(24,8);
  // Road markings and tactile crossings.
  const lineMat=makeMat('#d8d2c5',.82);
  for(let i=0;i<8;i++)box(1.1,.025,.16,lineMat,-4.2+i*1.2, -.035,12.5);
  const cafeInside=makeInterior();cafeInside.position.z=3.9;
  // Front threshold and door trigger marker.
  const threshold=box(3.8,.12,.8,stoneMat,0,.05,4.8);threshold.castShadow=false;
  const doorLight=new THREE.PointLight('#ffd2a0',22,8,2);doorLight.position.set(0,3.3,4.5);scene.add(doorLight);
  const player=new THREE.Group();player.position.set(0,0,9.0);scene.add(player);playerRoot=player;
  fallbackAvatar=createFallbackAvatar();player.add(fallbackAvatar);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.46,32),new THREE.MeshBasicMaterial({color:'#0b1110',transparent:true,opacity:.32}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;player.add(shadow);
  // A small interaction marker sits above the cafe entrance.
  const marker=new THREE.Mesh(new THREE.TorusGeometry(.38,.045,8,32),new THREE.MeshBasicMaterial({color:'#d6b37a'}));marker.position.set(0,2.9,4.25);scene.add(marker);
  marker.userData.float=true;
  return {cafeInside,marker};
}

let worldParts;
async function loadLighting(){
  try{
    const hdr=await new RGBELoader().loadAsync('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/urban_street_01_1k.hdr');
    hdr.mapping=THREE.EquirectangularReflectionMapping;
    scene.environment=hdr;
    scene.environmentIntensity=.55;
  }catch(e){console.warn('HDRI niet beschikbaar; standaard omgevingslicht actief',e)}
}
function createFallbackAvatar(){
  const g=new THREE.Group();
  const shirt=makeMat('#263e4c',.82),pants=makeMat('#263039',.9),skin=makeMat('#c99572',.82),shoes=makeMat('#e4e1d9',.72);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.29,.62,5,10),shirt);torso.position.y=1.05;torso.castShadow=true;g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.19,18,14),skin);head.position.y=1.72;head.castShadow=true;g.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.195,16,10,0,Math.PI*2,0,Math.PI*.55),makeMat('#33271f',.95));hair.position.y=1.78;g.add(hair);
  for(const side of [-1,1]){
    const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.085,.48,4,8),shirt);arm.position.set(side*.38,1.12,0);arm.rotation.z=side*-.12;arm.castShadow=true;g.add(arm);
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.57,4,8),pants);leg.position.set(side*.14,.43,0);leg.castShadow=true;g.add(leg);
    const foot=new THREE.Mesh(new THREE.BoxGeometry(.19,.12,.34),shoes);foot.position.set(side*.14,.09,-.08);foot.castShadow=true;g.add(foot);
  }
  return g;
}
async function loadCharacter(){
  try{
    const gltf=await gltfLoader.loadAsync('https://models.vinish.dev/people/casual-man.glb');
    const model=gltf.scene;
    const bounds=new THREE.Box3().setFromObject(model);
    const height=Math.max(.01,bounds.max.y-bounds.min.y);
    model.scale.setScalar(1.78/height);
    model.position.y=-bounds.min.y*model.scale.y;
    model.rotation.y=Math.PI;
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material)o.material.envMapIntensity=1.0}});
    playerRoot.add(model);fallbackAvatar.visible=false;
    playerMixer=new THREE.AnimationMixer(model);
    for(const clip of gltf.animations){const name=clip.name.toLowerCase();if(name.includes('idle'))playerActions.idle=playerMixer.clipAction(clip);if(name.includes('walk'))playerActions.walk=playerMixer.clipAction(clip)}
    playAction('idle');return true;
  }catch(e){console.warn('Extern personage kon niet laden; reservepersonage actief',e);fallbackAvatar.visible=true;return false}
}
function playAction(name){const next=playerActions[name];if(!next||activeAction===next)return;if(activeAction)activeAction.fadeOut(.18);next.reset().fadeIn(.18).play();activeAction=next}
function setMovement(x,y){moveX=x;moveY=y}
function updatePlayer(dt){
  const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(-forward.z,0,forward.x);
  const v=forward.clone().multiplyScalar(moveY).addScaledVector(right,moveX);
  const moving=v.lengthSq()>.001;
  if(moving){v.normalize().multiplyScalar(3.1*dt);playerRoot.position.add(v);playerRoot.rotation.y=Math.atan2(v.x,v.z)+Math.PI}
  const limit=insideCafe?{x:5.3,zMin:-6.0,zMax:3.15}:{x:27,zMin:5.1,zMax:28};
  playerRoot.position.x=THREE.MathUtils.clamp(playerRoot.position.x,-limit.x,limit.x);
  playerRoot.position.z=THREE.MathUtils.clamp(playerRoot.position.z,limit.zMin,limit.zMax);
  // Keep the avatar outside the facade unless the cafe has been entered.
  if(!insideCafe&&playerRoot.position.z<5.1)playerRoot.position.z=5.1;
  if(insideCafe&&playerRoot.position.z>3.15)playerRoot.position.z=3.15;
  playAction(moving?'walk':'idle');
  if(insideCafe&&playerRoot.position.z>3.0){insideCafe=false;worldParts.cafeInside.visible=false;toast('Je staat weer buiten.');actionBtn.textContent='BINNEN';document.querySelector('#locationTitle').textContent='ANIMO CAFE';document.querySelector('#locationSubtitle').textContent='Een nieuwe start. Een eigen verhaal.'}
}
function updateCamera(dt){
  const target=playerRoot.position.clone().add(new THREE.Vector3(0,1.48,0));
  if(thirdPerson){
    const radius=4.6,horizontal=Math.cos(pitch)*radius;
    const offset=new THREE.Vector3(Math.sin(yaw)*horizontal,Math.sin(pitch)*radius+.35,Math.cos(yaw)*horizontal);
    camera.position.lerp(target.clone().add(offset),1-Math.pow(.00008,dt));
    camera.lookAt(target);
  }else{
    camera.position.lerp(target.clone().add(new THREE.Vector3(0,.16,0)),1-Math.pow(.00008,dt));
    camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;
  }
}
function setCafeDoors(open){for(const door of cafeDoorLeaves)door.open=open?1:0}
function updateCafeDoors(dt){for(const door of cafeDoorLeaves){const target=door.open?door.side*Math.PI*.48:0;door.hinge.rotation.y=THREE.MathUtils.damp(door.hinge.rotation.y,target,8,dt)}}
function enterCafe(){
  if(!insideCafe){
    insideCafe=true;worldParts.cafeInside.visible=true;setCafeDoors(true);
    playerRoot.position.set(0,0,3.0);actionBtn.textContent='NAAR BUITEN';
    document.querySelector('#locationTitle').textContent='ANIMO CAFE';
    document.querySelector('#locationSubtitle').textContent='Binnen begint jouw horeca-avontuur.';
    toast('Welkom in ANIMO CAFE.');
  }else{
    insideCafe=false;worldParts.cafeInside.visible=false;setCafeDoors(false);
    playerRoot.position.set(0,0,5.25);actionBtn.textContent='BINNEN';
    document.querySelector('#locationTitle').textContent='ANIMO CAFE';
    document.querySelector('#locationSubtitle').textContent='Een nieuwe start. Een eigen verhaal.';
    toast('Je bent weer buiten.');
  }
}
function handleAction(){
  if(!insideCafe&&Math.hypot(playerRoot.position.x,playerRoot.position.z-5.1)>6.2){toast('Loop naar de ingang onder het ANIMO CAFE-bord.');return}
  enterCafe();
}
function onResize(){if(!renderer||!camera)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.6))}
function bindControls(){
  // Clear all held inputs whenever the page loses focus. This prevents a stuck
  // joystick/key state after iOS Safari interrupts touch input.
  function clearInputs(){
    for(const code of Object.keys(keys))keys[code]=false;
    moveX=0;moveY=0;joystickActive=false;
    const stick=document.querySelector('#stick');
    if(stick)stick.style.transform='translate(-50%,-50%)';
  }
  addEventListener('keydown',e=>{
    keys[e.code]=true;
    if(e.code==='KeyE'||e.code==='Enter')handleAction();
    if(e.code==='KeyC')toggleCamera();
  });
  addEventListener('keyup',e=>{keys[e.code]=false});
  addEventListener('blur',clearInputs);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInputs()});
  actionBtn.addEventListener('click',handleAction);
  cameraBtn.addEventListener('click',toggleCamera);

  // Desktop mouse-look. Pointer lock is optional; dragging still works without it.
  let mouseDragging=false,lastX=0,lastY=0;
  canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='mouse')return;
    mouseDragging=true;lastX=e.clientX;lastY=e.clientY;
    if(canvas.setPointerCapture){try{canvas.setPointerCapture(e.pointerId)}catch(_){}}
    if(canvas.requestPointerLock){try{canvas.requestPointerLock()}catch(_){}}
  });
  document.addEventListener('pointerlockchange',()=>{
    if(document.pointerLockElement===canvas)mouseDragging=true;
    else if(!document.querySelector('#lookZone').matches(':active'))mouseDragging=false;
  });
  addEventListener('pointermove',e=>{
    if(!mouseDragging||e.pointerType!=='mouse')return;
    const locked=document.pointerLockElement===canvas;
    const dx=locked?e.movementX:e.clientX-lastX;
    const dy=locked?e.movementY:e.clientY-lastY;
    yaw-=dx*.006;pitch=THREE.MathUtils.clamp(pitch-dy*.005,-.42,1.05);
    lastX=e.clientX;lastY=e.clientY;
  });
  addEventListener('pointerup',e=>{
    if(e.pointerType==='mouse'){
      mouseDragging=false;
      if(document.pointerLockElement===canvas&&document.exitPointerLock)document.exitPointerLock();
    }
  });
  addEventListener('pointercancel',e=>{if(e.pointerType==='mouse')mouseDragging=false});

  // Mobile movement joystick with explicit active state (not CSS-transform detection).
  const stickZone=document.querySelector('#stickZone');
  const stick=document.querySelector('#stick');
  let stickId=null,stickRect=null;
  function moveStick(e){
    if(!stickRect)return;
    const cx=stickRect.left+stickRect.width/2,cy=stickRect.top+stickRect.height/2;
    let dx=e.clientX-cx,dy=e.clientY-cy;
    const max=43,len=Math.hypot(dx,dy);
    if(len>max){dx=dx/len*max;dy=dy/len*max}
    stick.style.transform='translate(calc(-50% + '+dx+'px),calc(-50% + '+dy+'px))';
    setMovement(dx/max,-dy/max);
  }
  function releaseStick(e){
    if(stickId===null||(e&&e.pointerId!==undefined&&e.pointerId!==stickId))return;
    stickId=null;stickRect=null;joystickActive=false;setMovement(0,0);
    stick.style.transform='translate(-50%,-50%)';
  }
  stickZone.addEventListener('pointerdown',e=>{
    if(stickId!==null)return;
    e.preventDefault();stickId=e.pointerId;joystickActive=true;
    stickRect=stickZone.getBoundingClientRect();
    try{stickZone.setPointerCapture(e.pointerId)}catch(_){}
    moveStick(e);
  });
  stickZone.addEventListener('pointermove',e=>{if(e.pointerId===stickId){e.preventDefault();moveStick(e)}});
  stickZone.addEventListener('pointerup',releaseStick);
  stickZone.addEventListener('pointercancel',releaseStick);
  stickZone.addEventListener('lostpointercapture',releaseStick);

  // Independent right-side camera zone. Capturing the pointer avoids losing
  // camera movement when a finger drifts outside the zone during a swipe.
  const lookZone=document.querySelector('#lookZone');
  let lookId=null,lx=0,ly=0;
  lookZone.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'||lookId!==null)return;
    e.preventDefault();lookId=e.pointerId;lx=e.clientX;ly=e.clientY;
    try{lookZone.setPointerCapture(e.pointerId)}catch(_){}
  });
  lookZone.addEventListener('pointermove',e=>{
    if(e.pointerId!==lookId)return;
    e.preventDefault();
    const dx=e.clientX-lx,dy=e.clientY-ly;
    yaw-=dx*.008;pitch=THREE.MathUtils.clamp(pitch-dy*.007,-.42,1.05);
    lx=e.clientX;ly=e.clientY;
  });
  const releaseLook=e=>{if(lookId===null||(e&&e.pointerId!==undefined&&e.pointerId!==lookId))return;lookId=null};
  lookZone.addEventListener('pointerup',releaseLook);
  lookZone.addEventListener('pointercancel',releaseLook);
  lookZone.addEventListener('lostpointercapture',releaseLook);
  addEventListener('resize',onResize);
}
function toggleCamera(){thirdPerson=!thirdPerson;cameraBtn.textContent=thirdPerson?'3P':'1P';toast(thirdPerson?'Derde persoon':'Eerste persoon')}
function frame(){
  requestAnimationFrame(frame);
  if(!renderer)return;
  const dt=Math.min(clock.getDelta(),.04);
  const keyX=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  const keyY=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
  if(keyX||keyY){moveX=keyX;moveY=keyY}
  else if(!joystickActive) {moveX=0;moveY=0}
  updatePlayer(dt);updateCamera(dt);
  if(playerMixer)playerMixer.update(dt);
  if(worldParts?.marker){worldParts.marker.rotation.z+=dt*.65;worldParts.marker.position.y=2.9+Math.sin(performance.now()*.0018)*.12}
  updateCafeDoors(dt);
  renderer.render(scene,camera);
}
async function start(){
  try{
    worldParts=buildWorld();bindControls();
    loadingText.textContent='Materialen en licht worden geladen…';
    const [lighting,character]=await Promise.all([loadLighting(),loadCharacter()]);
    setStatus(character?'3D-wereld klaar · personage geladen':'3D-wereld klaar · reservepersonage actief');
    if(!character)toast('Reservepersonage actief.');
    loading.classList.add('hidden');
    frame();
  }catch(e){
    console.error(e);errorText.textContent=e.message||'Onbekende fout';errorPanel.hidden=false;loading.classList.add('hidden');
  }
}
document.querySelector('#retryBtn').addEventListener('click',()=>location.reload());
start();
