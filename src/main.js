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
  const oak=new THREE.MeshStandardMaterial({color:'#68452f',roughness:.48});
  const oakDark=new THREE.MeshStandardMaterial({color:'#35251e',roughness:.42});
  const walnut=new THREE.MeshStandardMaterial({color:'#4a3025',roughness:.38});
  const tile=new THREE.MeshStandardMaterial({color:'#b7a995',roughness:.34});
  const grout=makeMat('#786f63',.92);
  const brassMetal=new THREE.MeshStandardMaterial({color:'#b08a51',metalness:.78,roughness:.24});
  const steel=new THREE.MeshStandardMaterial({color:'#89918e',metalness:.82,roughness:.25});
  const black=makeMat('#171d1d',.28,.28);
  const upholstery=new THREE.MeshStandardMaterial({color:'#34483e',roughness:.9});
  const leather=new THREE.MeshStandardMaterial({color:'#754a35',roughness:.78});
  const cream=makeMat('#e6d9c4',.88);
  const warmBulb=new THREE.MeshBasicMaterial({color:'#ffd99b'});
  const floor=makeMat('#8b7760',.38);
  box(12,.24,11,floor,0,-.08,-4.7,g);
  // Large stone-look floor tiles with fine grout joints.
  for(let x=-5.5;x<=5.5;x+=1.1)box(.018,.008,10.7,grout,x,.047,-4.7,g);
  for(let z=-9.9;z<=.5;z+=1.1)box(11.8,.008,.018,grout,0,.048,z,g);
  // Warm plaster walls, lower oak wainscoting and a detailed ceiling.
  box(12,5.65,.28,plaster,0,2.86,-10.1,g);
  box(.22,5.65,11,plaster,-6,2.86,-4.7,g);
  box(.22,5.65,11,plaster,6,2.86,-4.7,g);
  box(12,.2,11,makeMat('#e8dfd0',.86),0,5.68,-4.7,g);
  box(12,1.05,.08,oakDark,0,.66,-9.91,g);
  box(.08,1.05,11,oakDark,-5.87,.66,-4.7,g);
  box(.08,1.05,11,oakDark,5.87,.66,-4.7,g);
  for(let x=-5.4;x<=5.4;x+=.9)box(.035,.88,.035,oak,x,.66,-9.84,g);
  box(12,.12,.18,oakDark,0,1.2,-9.86,g);
  for(const z of [-8.8,-5.2,-1.6])box(.18,.16,11,oakDark,0,5.48,z,g);
  // Front service counter: paneled oak, stone top, brass foot rail and display glass.
  box(5.55,1.02,1.12,oakDark,-2.35,.68,-7.85,g);
  box(5.38,.78,.08,oak,-2.35,.72,-7.26,g);
  for(let x=-4.8;x<=.1;x+=.82)box(.045,.68,.07,brassMetal,x,.7,-7.19,g);
  box(5.78,.13,1.34,makeMat('#d6c8b3',.24),-2.35,1.27,-7.85,g);
  box(5.72,.045,1.28,brassMetal,-2.35,1.19,-7.85,g);
  box(5.55,.07,.1,cream,-2.35,1.37,-7.85,g);
  // Glass pastry display on the counter.
  box(1.65,.62,.68,glass,-4.15,1.72,-7.78,g);
  for(const x of [-4.95,-3.35])box(.045,.68,.72,brassMetal,x,1.72,-7.78,g);
  box(1.68,.045,.72,brassMetal,-4.15,2.06,-7.78,g);
  for(let i=0;i<3;i++){const pastry=cylinder(.12,.13,.06,makeMat('#c99a60'),-4.65+i*.48,1.48,-7.75,g,20);pastry.rotation.x=Math.PI/2}
  // Back bar cabinetry, illuminated shelves and realistic bottle silhouettes.
  box(5.8,2.25,.34,oakDark,-2.35,2.38,-9.72,g);
  box(5.55,.08,.12,brassMetal,-2.35,1.42,-9.49,g);
  for(let level=0;level<3;level++){
    const y=1.78+level*.82;
    box(5.35,.055,.58,oak,-2.35,y,-9.43,g);
    box(5.35,.025,.04,brassMetal,-2.35,y+.045,-9.12,g);
    const led=new THREE.PointLight('#ffd5a0',3.5,4,2);led.position.set(-2.35,y-.12,-9.2);g.add(led);
    for(let n=0;n<8;n++){
      const x=-4.75+n*.69;
      const bottleMat=[makeMat('#315143',.22),makeMat('#76513a',.22),makeMat('#263f45',.2)][n%3];
      cylinder(.085,.105,.32,bottleMat,x,y+.22,-9.42,g,12);
      cylinder(.035,.035,.12,bottleMat,x,y+.43,-9.42,g,10);
      cylinder(.09,.09,.035,brassMetal,x,y+.05,-9.42,g,12);
    }
  }
  // Professional espresso station with group heads, steam wands and grinder.
  box(1.62,.66,.72,steel,.25,1.78,-8.02,g);
  box(1.54,.12,.68,black,.25,2.16,-8.02,g);
  box(1.48,.24,.08,black,.25,1.97,-7.64,g);
  for(const x of [-.18,.25,.68]){
    cylinder(.11,.11,.08,brassMetal,x,1.72,-7.62,g,20);
    cylinder(.025,.025,.32,steel,x,1.51,-7.58,g,10);
  }
  for(const x of [-.38,.88]){
    cylinder(.045,.045,.5,steel,x,1.68,-7.66,g,12);
    const handle=cylinder(.035,.035,.23,black,x,1.39,-7.58,g,10);handle.rotation.z=.4;
  }
  box(.38,.52,.42,black,1.35,1.68,-8.02,g);
  cylinder(.11,.11,.22,steel,1.35,2.05,-8.02,g,20);
  cylinder(.12,.1,.24,steel,1.35,1.31,-8.02,g,20);
  // Ceramic cups and small service details on the counter.
  for(let i=0;i<4;i++){
    cylinder(.105,.13,.16,cream,-1.25+i*.34,1.51,-7.82,g,20);
    cylinder(.11,.11,.018,makeMat('#8d7964'),-1.25+i*.34,1.6,-7.82,g,20);
  }
  // Seating area: upholstered banquette, wood tables, solid chairs.
  box(4.5,.78,.62,upholstery,3.55,.58,-8.55,g);
  box(4.5,.14,.7,leather,3.55,1.0,-8.5,g);
  box(4.5,1.05,.18,upholstery,3.55,1.55,-8.82,g);
  for(let x=1.45;x<=5.65;x+=1.4)box(.055,.95,.08,oakDark,x,.55,-8.14,g);
  function addChair(x,z,rot=0){
    const chair=new THREE.Group();chair.position.set(x,0,z);chair.rotation.y=rot;g.add(chair);
    box(.68,.13,.68,leather,0,.56,0,chair);
    box(.68,.72,.13,oakDark,0,.98,-.28,chair);
    box(.54,.5,.045,leather,0,1.0,-.2,chair);
    for(const dx of [-.25,.25])for(const dz of [-.24,.24])box(.065,.52,.065,oakDark,dx,.28,dz,chair);
    box(.82,.07,.82,oak,0,.65,0,chair);
  }
  function addTable(x,z,r=.64){
    cylinder(r,r,.11,oak,x,1.02,z,g,40);
    cylinder(.11,.14,.88,black,x,.49,z,g,20);
    cylinder(.34,.34,.07,black,x,.09,z,g,24);
    cylinder(.095,.095,.035,brassMetal,x,1.09,z,g,20);
    // Table setting: folded napkin and small vase.
    box(.22,.018,.16,cream,x-.19,1.09,z+.12,g);
    cylinder(.045,.1,.12,makeMat('#d2c2a7'),x+.2,1.17,z-.13,g,16);
    sphere(.075,makeMat('#668064'),x+.2,1.29,z-.13,g);
  }
  addTable(2.45,-5.85,.68);addChair(1.5,-5.85,Math.PI/2);addChair(3.35,-5.85,-Math.PI/2);
  addTable(4.2,-3.65,.58);addChair(4.2,-2.75,Math.PI);addChair(4.2,-4.55,0);
  addTable(2.3,-2.65,.54);addChair(1.45,-2.65,Math.PI/2);addChair(3.15,-2.65,-Math.PI/2);
  // Framed menu boards with clear ANIMO identity.
  box(2.45,1.65,.14,oakDark,3.62,3.62,-9.82,g);
  box(2.27,1.47,.05,black,3.62,3.62,-9.72,g);
  const menu=createSign('ANIMO MENU',2.0,.48);menu.position.set(3.62,4.05,-9.67);g.add(menu);
  // Wall art, brass picture rails and potted greenery.
  box(1.45,1.05,.08,oakDark,-4.55,3.5,-9.82,g);
  const art=createSign('KOFFIE',1.2,.5);art.position.set(-4.55,3.52,-9.74);g.add(art);
  for(const [x,z] of [[-5,-2.1],[5.35,-7.1],[5.25,-1.7]]){
    cylinder(.32,.4,.58,makeMat('#9b8063'),x,.34,z,g,24);
    for(let n=0;n<7;n++){
      const a=n*Math.PI*2/7;
      const leaf=sphere(.16,makeMat('#45654d'),x+Math.cos(a)*.23,.75+(n%2)*.13,z+Math.sin(a)*.23,g);
      leaf.scale.set(.75,1.7,.7);
    }
  }
  // Pendant lights with brass fittings and warm pools of light.
  for(const [x,z] of [[-2.4,-5.4],[2.3,-5.1],[4.1,-2.8]]){
    cylinder(.025,.025,.75,brassMetal,x,5.05,z,g,10);
    cylinder(.24,.12,.16,brassMetal,x,4.62,z,g,24);
    sphere(.12,warmBulb,x,4.5,z,g);
    const light=new THREE.PointLight('#ffd3a0',11,7,2);light.position.set(x,4.48,z);g.add(light);
  }
  // Recessed ceiling spots and discreet wall sconces.
  for(const x of [-4.7,-1.6,1.6,4.7])for(const z of [-8.8,-5.2,-1.7]){
    const spot=new THREE.PointLight('#fff0d6',2.3,3.5,2);spot.position.set(x,5.45,z);g.add(spot);
    cylinder(.095,.095,.035,brassMetal,x,5.56,z,g,16);
  }
  for(const x of [-5.75,5.75]){
    box(.12,.62,.18,brassMetal,x,3.05,-4.6,g);
    sphere(.12,warmBulb,x,3.05,-4.48,g);
    const sconce=new THREE.PointLight('#ffdda9',2.5,3,2);sconce.position.set(x*.94,3.05,-4.3);g.add(sconce);
  }
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
  const modelUrl='https://tevy.dev/models/casual-walker/v1/lod0.glb';
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
      let idleClip=null,walkClip=null;
      for(const clip of gltf.animations){
        const n=clip.name.toLowerCase();
        if(!idleClip&&n.includes('idle'))idleClip=clip;
        if(!walkClip&&(n.includes('walk')||n.includes('locomotion')||n.includes('run')))walkClip=clip;
      }
      if(!idleClip&&gltf.animations.length)idleClip=gltf.animations[0];
      if(!walkClip)walkClip=idleClip;
      if(idleClip)playerActions.idle=playerMixer.clipAction(idleClip);
      if(walkClip)playerActions.walk=playerMixer.clipAction(walkClip);
      if(playerActions.idle)playAction('idle');
      setStatus('Personage geladen');
      return true;
    }catch(e){
      lastError=e;
      console.warn('3D-personage poging '+attempt+' mislukt',e);
      if(attempt<3)await new Promise(resolve=>setTimeout(resolve,700*attempt));
    }
  }
  fallbackAvatar.visible=false;
  setStatus('Echt 3D-personage kon niet laden · controleer verbinding');
  console.error('Het echte 3D-personage kon niet worden geladen:',lastError);
  return false;
}

function playAction(name){const next=playerActions[name];if(!next||activeAction===next)return;if(activeAction)activeAction.fadeOut(.18);next.reset().fadeIn(.18).play();activeAction=next}
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
    const [lighting,character]=await Promise.all([loadLighting(),loadCharacter()]);
    setStatus(character?'3D-wereld klaar · personage geladen':'Wereld klaar · personage kon niet laden');
    if(!character)toast('Personage niet geladen. Controleer de internetverbinding.');
    loading.classList.add('hidden');
    frame();
  }catch(e){
    console.error(e);errorText.textContent=e.message||'Onbekende fout';errorPanel.hidden=false;loading.classList.add('hidden');
  }
}
document.querySelector('#retryBtn').addEventListener('click',()=>location.reload());
start();
