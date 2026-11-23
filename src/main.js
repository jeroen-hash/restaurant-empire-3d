import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
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
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

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
  const floorMat=new THREE.MeshStandardMaterial({color:'#8a8175',roughness:.34,metalness:.02});
  const wallMat=new THREE.MeshStandardMaterial({color:'#d7d0c4',roughness:.88});
  const darkOak=new THREE.MeshStandardMaterial({color:'#342820',roughness:.42});
  const oak=new THREE.MeshStandardMaterial({color:'#77543b',roughness:.48});
  const brassMetal=new THREE.MeshStandardMaterial({color:'#a98550',metalness:.72,roughness:.26});
  const upholstery=new THREE.MeshStandardMaterial({color:'#34483f',roughness:.9});
  const leather=new THREE.MeshStandardMaterial({color:'#76513d',roughness:.78});
  const cream=new THREE.MeshStandardMaterial({color:'#e8dfd1',roughness:.84});
  const warm=new THREE.MeshBasicMaterial({color:'#ffe0b0'});
  // A clean architectural shell; the service counter and equipment are loaded
  // from a complete, real-scale GLB asset rather than assembled from boxes.
  box(12,.24,11,floorMat,0,-.08,-4.7,g);
  box(12,5.7,.28,wallMat,0,2.86,-10.1,g);
  box(.22,5.7,11,wallMat,-6,2.86,-4.7,g);
  box(.22,5.7,11,wallMat,6,2.86,-4.7,g);
  box(12,.2,11,makeMat('#d8d0c3',.82),0,5.68,-4.7,g);
  // Dark timber wainscoting and architectural trim.
  box(12,1.0,.09,darkOak,0,.62,-9.91,g);
  box(.09,1.0,11,darkOak,-5.87,.62,-4.7,g);
  box(.09,1.0,11,darkOak,5.87,.62,-4.7,g);
  box(12,.09,.16,brassMetal,0,1.16,-9.83,g);
  for(const x of [-5.55,-4.75,-3.95,-3.15,-2.35,-1.55,-.75,.05,.85,1.65,2.45,3.25,4.05,4.85,5.55]){
    box(.025,.78,.025,oak,x,.62,-9.82,g);
  }
  // Street-facing glazing and slim dark metal frames.
  const frame=makeMat('#242a29',.34,.52);
  for(const x of [-4.45,-2.25,0,2.25,4.45]){
    box(1.9,2.35,.10,frame,x,3.18,-.02,g);
    box(1.72,2.17,.045,glass,x,3.18,.045,g);
    box(.045,2.17,.07,frame,x,3.18,.08,g);
    box(1.72,.045,.07,frame,x,3.18,.08,g);
    box(1.72,.045,.07,frame,x,2.55,.08,g);
  }
  // Four dining tables with upholstered bentwood-style chairs.
  function chair(x,z,angle){
    const c=new THREE.Group();c.position.set(x,0,z);c.rotation.y=angle;g.add(c);
    box(.58,.12,.56,leather,0,.52,0,c);
    box(.58,.68,.12,oak,0,.91,-.23,c);
    box(.44,.48,.045,upholstery,0,.94,-.16,c);
    for(const dx of [-.22,.22])for(const dz of [-.2,.2]){
      const leg=box(.055,.48,.055,darkOak,dx,.25,dz,c);leg.rotation.x=dz*.12;
    }
    box(.62,.045,.58,oak,0,.6,0,c);
  }
  function table(x,z){
    cylinder(.56,.56,.095,oak,x,.78,z,g,40);
    cylinder(.075,.1,.68,darkOak,x,.39,z,g,24);
    cylinder(.29,.29,.055,darkOak,x,.065,z,g,32);
    cylinder(.08,.08,.025,brassMetal,x,.835,z,g,20);
    // A restrained table setting gives the room scale without visual clutter.
    box(.18,.012,.13,cream,x-.17,.84,z+.12,g);
    cylinder(.045,.045,.12,cream,x+.18,.9,z-.12,g,18);
  }
  table(-3.55,-3.35);chair(-4.35,-3.35,Math.PI/2);chair(-2.75,-3.35,-Math.PI/2);
  table(3.55,-3.35);chair(2.75,-3.35,Math.PI/2);chair(4.35,-3.35,-Math.PI/2);
  table(-3.55,-6.0);chair(-4.35,-6.0,Math.PI/2);chair(-2.75,-6.0,-Math.PI/2);
  table(3.55,-6.0);chair(2.75,-6.0,Math.PI/2);chair(4.35,-6.0,-Math.PI/2);
  // Wall art, plants and warm pendant lighting.
  box(1.45,1.0,.08,darkOak,-4.7,3.5,-9.82,g);
  box(1.28,.83,.035,makeMat('#26312e',.72),-4.7,3.5,-9.76,g);
  for(const [x,z] of [[-5.15,-1.3],[5.15,-1.3],[-5.15,-7.9],[5.15,-7.9]]){
    cylinder(.27,.33,.48,makeMat('#8b765e',.9),x,.24,z,g,24);
    for(let n=0;n<7;n++){
      const a=n*Math.PI*2/7;
      const leaf=sphere(.12,makeMat('#45634d',.95),x+Math.cos(a)*.18,.58+(n%2)*.12,z+Math.sin(a)*.18,g);
      leaf.scale.set(.7,1.7,.65);
    }
  }
  for(const [x,z] of [[-3.4,-2.2],[0,-2.2],[3.4,-2.2],[-3.4,-5.0],[3.4,-5.0]]){
    cylinder(.022,.022,.78,brassMetal,x,5.15,z,g,10);
    cylinder(.24,.12,.16,darkOak,x,4.72,z,g,24);
    sphere(.1,warm,x,4.6,z,g);
    const lamp=new THREE.PointLight('#ffd5a4',8,6,2);lamp.position.set(x,4.55,z);g.add(lamp);
  }
  for(const x of [-4.8,-1.6,1.6,4.8])for(const z of [-8.7,-5.3,-1.8]){
    const spot=new THREE.PointLight('#fff0d8',1.6,3.2,2);spot.position.set(x,5.45,z);g.add(spot);
  }
  g.visible=false;
  return g;
}

async function loadCafeBar(){
  const url='https://cdn.3dassets.dev/assets/22245/v1/model.glb';
  try{
    setStatus('Echte horeca-apparatuur laden…');
    const gltf=await gltfLoader.loadAsync(url);
    const model=gltf.scene;
    model.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(model);
    const center=bounds.getCenter(new THREE.Vector3());
    const size=bounds.getSize(new THREE.Vector3());
    if(!Number.isFinite(size.x)||size.x<1||size.y<.5||size.z<1)throw new Error('Het café-bar model heeft ongeldige afmetingen');
    model.position.set(-center.x,-bounds.min.y,-7.55-center.z);
    model.traverse(o=>{
      if(o.isMesh){
        o.castShadow=true;o.receiveShadow=true;
        if(o.material){
          const materials=Array.isArray(o.material)?o.material:[o.material];
          for(const m of materials){m.envMapIntensity=1.1;if(m.map)m.map.colorSpace=THREE.SRGBColorSpace}
        }
      }
    });
    worldParts.cafeInside.add(model);
    model.name='ANIMO_REAL_CAFE_BAR';
    return true;
  }catch(error){
    console.error('Echte café-bar kon niet worden geladen:',error);
    setStatus('Café-apparatuur niet geladen: '+(error?.message||String(error)));
    return false;
  }
}

function buildWorld(){
  scene=new THREE.Scene();scene.background=new THREE.Color('#9aa7a8');scene.fog=new THREE.FogExp2('#aab2af',.009);
  camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,180);
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  // The supplied character model uses KTX2-compressed textures. Configure the
  // matching Three.js Basis transcoder before GLTFLoader starts loading it.
  const ktx2Loader=new KTX2Loader();
  ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/basis/');
  ktx2Loader.detectSupport(renderer);
  gltfLoader.setKTX2Loader(ktx2Loader);
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
  const cafeInside=makeInterior();cafeInside.position.z=3.42;cafeInside.scale.z=.727;
  // Front threshold and door trigger marker.
  const threshold=box(3.8,.12,.8,stoneMat,0,.05,4.8);threshold.castShadow=false;
  const doorLight=new THREE.PointLight('#ffd2a0',22,8,2);doorLight.position.set(0,3.3,4.5);scene.add(doorLight);
  const player=new THREE.Group();player.position.set(0,0,9.0);scene.add(player);playerRoot=player;
  fallbackAvatar=createFallbackAvatar();fallbackAvatar.visible=false;player.add(fallbackAvatar);
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
  const modelUrl=new URL('../lod0.glb',import.meta.url).href;
  let lastError=null;
  // Retry transient mobile-network and CDN failures. Never silently show the
  // crude placeholder as if it were the intended player character.
  for(let attempt=1;attempt<=3;attempt++){
    try{
      setStatus('3D-personage laden ('+attempt+'/3)…');
      const gltf=await Promise.race([
        gltfLoader.loadAsync(modelUrl),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('Time-out bij laden van 3D-personage')),12000))
      ]);
      const model=gltf.scene;
      model.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(model);
      const size=bounds.getSize(new THREE.Vector3());
      if(!Number.isFinite(size.y)||size.y<.5)throw new Error('Het 3D-model heeft ongeldige afmetingen');
      const scale=1.78/size.y;
      model.scale.setScalar(scale);
      model.position.set(
        -(bounds.min.x+bounds.max.x)*.5*scale,
        -bounds.min.y*scale,
        -(bounds.min.z+bounds.max.z)*.5*scale
      );
      model.rotation.y=Math.PI;
      model.traverse(o=>{
        if(o.isMesh){
          o.castShadow=true;o.receiveShadow=true;
          if(o.material){
            const mats=Array.isArray(o.material)?o.material:[o.material];
            for(const m of mats){m.envMapIntensity=1.0;if(m.map)m.map.colorSpace=THREE.SRGBColorSpace}
          }
        }
      });
      playerRoot.add(model);
      fallbackAvatar.visible=false;
      playerMixer=new THREE.AnimationMixer(model);
      // Do not blindly play a clip called "idle": the supplied asset's idle
      // clip can contain a low/crouched pose. Keep the model's upright rest
      // pose while standing and use only an explicitly named locomotion clip.
      let walkClip=null;
      for(const clip of gltf.animations){
        const n=clip.name.toLowerCase();
        if(!walkClip&&(n.includes('walk')||n.includes('locomotion')||n.includes('run')))walkClip=clip;
      }
      if(walkClip){
        // Prevent vertical root/hip motion in the walk cycle from pulling
        // the whole body and feet below the floor. Keep the first Y value
        // while preserving horizontal motion and all limb animation.
        for(const track of walkClip.tracks){
          const trackName=track.name.toLowerCase();
          if(trackName.includes('position')&&/(hips|pelvis|root)/.test(trackName)){
            const values=track.values;
            if(values&&values.length>=3){
              const baseY=values[1];
              for(let index=1;index<values.length;index+=3)values[index]=baseY;
            }
          }
        }
        playerActions.walk=playerMixer.clipAction(walkClip);
      }
      setStatus('Personage geladen');
      return true;
    }catch(e){
      lastError=e;
      console.warn('3D-personage poging '+attempt+' mislukt',e);
      if(attempt<3)await new Promise(resolve=>setTimeout(resolve,700*attempt));
    }
  }
  fallbackAvatar.visible=false;
  const reason=lastError?.message||String(lastError||'Onbekende fout');
  setStatus('Personage niet geladen: '+reason);
  console.error('Het echte 3D-personage kon niet worden geladen:',lastError);
  return false;
}

function playAction(name){
  const next=playerActions[name];
  if(!next){
    // Fade out locomotion to restore the model's upright rest pose.
    if(activeAction){activeAction.fadeOut(.16);activeAction=null}
    return;
  }
  if(activeAction===next)return;
  if(activeAction)activeAction.fadeOut(.18);
  next.reset().fadeIn(.18).play();
  activeAction=next;
}
function setMovement(x,y){moveX=x;moveY=y}
function updatePlayer(dt){
  const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(-forward.z,0,forward.x);
  const v=forward.clone().multiplyScalar(moveY).addScaledVector(right,moveX);
  const moving=v.lengthSq()>.001;
  if(moving){v.normalize().multiplyScalar(3.1*dt);playerRoot.position.add(v);playerRoot.rotation.y=Math.atan2(v.x,v.z)+Math.PI}
  const limit=insideCafe?{x:5.3,zMin:-6.0,zMax:3.75}:{x:27,zMin:5.1,zMax:28};
  playerRoot.position.x=THREE.MathUtils.clamp(playerRoot.position.x,-limit.x,limit.x);
  playerRoot.position.z=THREE.MathUtils.clamp(playerRoot.position.z,limit.zMin,limit.zMax);
  // Keep the character's feet on the visible walking surface.
  // Cafe floor top (including tile joints) is about 0.05 m; sidewalk
  // top is 0.19 m; the road top is -0.055 m.
  const absZ=Math.abs(playerRoot.position.z);
  const onSidewalk=absZ>=5.31&&absZ<=9.1;
  const groundY=insideCafe?0.22:(onSidewalk?0.19:-0.055);
  playerRoot.position.y=groundY;
  // Keep the avatar outside the facade unless the cafe has been entered.
  if(!insideCafe&&playerRoot.position.z<5.1)playerRoot.position.z=5.1;
  if(insideCafe&&playerRoot.position.z>3.75)playerRoot.position.z=3.75;
  playAction(moving?'walk':'idle');
  if(insideCafe&&playerRoot.position.z>3.65){insideCafe=false;worldParts.cafeInside.visible=false;toast('Je staat weer buiten.');actionBtn.textContent='BINNEN';document.querySelector('#locationTitle').textContent='ANIMO CAFE';document.querySelector('#locationSubtitle').textContent='Een nieuwe start. Een eigen verhaal.'}
}
function updateCamera(dt){
  const target=playerRoot.position.clone().add(new THREE.Vector3(0,1.48,0));
  if(thirdPerson){
    const radius=insideCafe?3.2:4.6,horizontal=Math.cos(pitch)*radius;
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
    playerRoot.position.set(0,0,.45);actionBtn.textContent='NAAR BUITEN';
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
    yaw-=dx*.006;pitch=THREE.MathUtils.clamp(pitch+dy*.005,-.42,1.05);
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
    yaw-=dx*.008;pitch=THREE.MathUtils.clamp(pitch+dy*.007,-.42,1.05);
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
    const [lighting,character,cafeBar]=await Promise.all([loadLighting(),loadCharacter(),loadCafeBar()]);
    if(character&&cafeBar)setStatus('3D-wereld klaar · echte café-apparatuur geladen');
    if(!character)toast('Personage niet geladen. Controleer de internetverbinding.');
    if(!cafeBar)toast('De nieuwe café-apparatuur kon niet worden geladen.');
    loading.classList.add('hidden');
    frame();
  }catch(e){
    console.error(e);errorText.textContent=e.message||'Onbekende fout';errorPanel.hidden=false;loading.classList.add('hidden');
  }
}
document.querySelector('#retryBtn').addEventListener('click',()=>location.reload());
start();
