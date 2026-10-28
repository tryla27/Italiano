/* Il locale in 3D: das Restaurant mit three.js (js/lib/three-mini.js) und den Blender-Modellen aus www/modelle/.
   Kamera drehen und zoomen, jedes Möbelstück antippen, ziehen, drehen oder einlagern.
   Gespeichert wird in S.locale: {Schlüssel: {x, z, r, y, st}} in Metern (r = Vierteldrehungen, st = eingelagert).
   Alte Plätze vom Raster (S.place, 8 × 6 Felder) werden beim ersten Öffnen umgerechnet. */
const LW=9, LD=7, LH=3;                 // Raum: Breite (x), Tiefe (z), Höhe in Metern; Tür vorne in der Mitte
const OUT_Z0=LD/2+.15, OUT_Z1=LD/2+3.6;  // Gehweg vor der Tür (Vespa, Terrasse, Schirm)
const SEA_Z0=OUT_Z1+.5, SEA_Z1=OUT_Z1+4; // Wasser am Kai (Boot)
const DOOR_W=.75;                        // halbe Türbreite
const OLD_GW=8, OLD_GH=6;                // altes Raster aus einrichtung.js
/* Modell und Platz jedes Stücks. z: floor (Boden, Standard), top (auf Theke oder Tisch, sonst Boden), wall (an der Wand,
   h = Höhe), ceil (Decke), rug (Teppich, darf unter Möbel), out (draußen), sea (Wasser), cloth (keine Figur: Tischdecken).
   surf: darauf kann man kleine Dinge stellen. "@…" wird hier gebaut statt geladen. */
const MODEL={
  forno1:{m:"ofen-1-elettrico"},forno:{m:"ofen-3-legna"},forno3:{m:"ofen-4-napoletano"},forno_oro:{m:"forno-oro"},
  bancone1:{m:"theke",surf:1},bancone2:{m:"bancone-vetrina",surf:1},bancone3:{m:"bancone-marmo",surf:1},
  tavoli1:{m:"tisch",surf:1},tavoli2:{m:"tischgruppe",surf:1},tavoli3:{m:"tavolo-candele",surf:1},
  frigo1:{m:"@kuehlbox",surf:1},frigo2:{m:"frigo",surf:1},frigo3:{m:"vetrina-frigo"},
  moka:{m:"kaffee-1-caffettiera",z:"top"},macchina:{m:"kaffee-3-espresso",z:"top"},leva:{m:"kaffee-4-leva",z:"top"},
  basilico:{m:"basilico",z:"top"},lavagna:{m:"lavagna"},mandolino:{m:"mandolino"},tovaglie:{z:"cloth"},
  vespa:{m:"vespa",z:"out"},botti:{m:"botti",surf:1},foto:{m:"bild",z:"wall",h:1.7},insegna:{m:"insegna",z:"wall"},
  agenda:{m:"agenda"},lampadari:{m:"lampadario",z:"ceil"},pianoforte:{m:"pianoforte",surf:1},
  terrazza:{m:"terrazza",z:"out"},ombrellone:{m:"ombrellone",z:"out"},barca:{m:"barca",z:"sea",r:1},stella:{m:"stella",z:"wall"},
  sedia:{m:"stuhl"},pianta:{m:"pflanze"},fiori:{m:"fiori",z:"top"},lampada:{m:"wandlampe",z:"wall",h:1.9},quadro:{m:"bild",z:"wall",h:1.7},
  orologio:{m:"orologio",z:"wall"},candela:{m:"candela",z:"top"},specchio:{m:"specchio",z:"wall"},limoni:{m:"limoni",z:"top"},
  tovaglia:{z:"cloth"},bottiglie:{m:"regal",z:"wall",h:1.1},tappeto:{m:"tappeto",z:"rug"},
  pulcinella:{m:"pulcinella"},corno:{m:"corno"},presepe:{m:"presepe"},mandolino_oro:{m:"mandolino-oro"},vespa_epoca:{m:"vespa-epoca",z:"out"}
};
const zoneOf=d=>d.z||"floor";
// Wände: Mittelpunkt, Richtung ins Zimmer, Drehung (r) eines Stücks an dieser Wand, Länge
const WALLS=[
  {n:[0,1],p:[0,-LD/2],r:0,len:LW},   // hinten
  {n:[1,0],p:[-LW/2,0],r:1,len:LD},   // links
  {n:[-1,0],p:[LW/2,0],r:3,len:LD},   // rechts
  {n:[0,-1],p:[0,LD/2],r:2,len:LW}    // vorne mit Tür
];
const wallOfR=r=>WALLS.findIndex(w=>w.r===r);
// Erste Plätze im neuen Laden: Ofen und Kühlung an der Rückwand, Theke davor, Tische vorne
// Weitere Tische in den Gastraum, Deko an die Wände entlang (die Mitte bleibt frei)
const TABLE_SPOTS=[[1.8,1.2],[-2.2,1.4],[.4,2.3],[3,-.5],[-3,-.4],[2.8,2.4]];
const DECO_SPOTS=[[-4,2.6],[4,2.6],[-4,.2],[4,.6],[-4,-1.2],[4,1.6],[-4,1.4],[-2.8,2.9],[2.6,2.9],[4,-1.4],[-1.6,2.9],[1.4,2.9]];
const PREF={forno:[-2.6,"back"],frigo:[3.7,"back"],bancone:[-.4,-1.6],tavoli:[1.8,1.2],forno_oro:[-.2,"back"],botti:[-4,"back"],pianoforte:[3.2,-.5]};
const L3={ok:null,r:null,scene:null,cam:null,items:[],byKey:{},walls:[],models:{},sel:null,msg:"",drag:null,ptrs:new Map(),
  th:.62,ph:.92,rad:13.5,tgt:null,dirty:true,raf:0,thumb:"",thumbSig:"",building:null,grid:null,box:null,host:null};

/* ---------- Was im Restaurant steht ---------- */
function locItems(){
  const out=[];
  placedFurn().forEach(i=>{const d=MODEL[i.id];if(d&&d.m)out.push({key:placeKey(i),id:i.id,it:i.it,de:i.de,ic:i.ic,d});});
  Object.entries(S.deko||{}).forEach(([id,n])=>{const it=decoById(id),d=MODEL[id];if(!it||!d||!d.m)return;
    for(let k=0;k<n;k++)out.push({key:`d:${id}:${k}`,id,it:it.it,de:it.de,ic:it.ic,d,rare:it.rare});});
  return out;
}
const hasCloth=()=>S.owned.includes("tovaglie")||!!(S.deko&&S.deko.tovaglia);
const locStruct=()=>JSON.stringify([locItems().map(i=>i.key+i.id),hasCloth()]);
const locSig=()=>locStruct()+JSON.stringify(S.locale);

/* ---------- three.js starten ---------- */
function loc3dInit(){
  if(L3.ok!==null)return L3.ok;
  try{
    if(!window.THREE)throw 0;
    const r=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});
    r.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
    r.setClearColor(0x1b221f);
    r.domElement.className="loc-canvas";
    L3.r=r; L3.ok=true;
  }catch(e){L3.ok=false;return false;}
  const T=THREE, sc=new T.Scene(); L3.scene=sc;
  L3.cam=new T.PerspectiveCamera(40,1,.1,80); L3.tgt=new T.Vector3(0,.6,.8);
  sc.add(new T.HemisphereLight(0xfff1dc,0x5a4030,2.1));
  const sun=new T.DirectionalLight(0xffe7c4,1.5); sun.position.set(4,9,7); sc.add(sun);
  const fill=new T.DirectionalLight(0xc8d8ff,.45); fill.position.set(-6,4,-3); sc.add(fill);
  buildRoom();
  bindPointers(L3.r.domElement);
  addEventListener("resize",()=>{if(L3.host&&L3.host.isConnected){locResize();}});
  return true;
}
// Leinwand-Texturen: Schachbrett-Boden, Pflaster, Wasser, Tischdecke, weicher Schatten, Lichtschein
function canvasTex(w,h,draw,rep){
  const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);}
  return t;
}
const TEX={};
function tex(name){
  if(TEX[name])return TEX[name];
  const T={
    floor:()=>canvasTex(128,128,(g,w)=>{g.fillStyle="#efe6d2";g.fillRect(0,0,w,w);g.fillStyle="#2f4a3c";g.fillRect(0,0,w/2,w/2);g.fillRect(w/2,w/2,w/2,w/2);
      g.strokeStyle="rgba(0,0,0,.12)";g.lineWidth=2;g.strokeRect(0,0,w,w);g.strokeRect(0,0,w/2,w/2);},[LW/1.2,LD/1.2]),
    street:()=>canvasTex(128,128,(g,w)=>{g.fillStyle="#b9ab94";g.fillRect(0,0,w,w);for(let y=0;y<4;y++)for(let x=0;x<4;x++){
      g.fillStyle=["#cbbda4","#c2b39a","#d3c6ae"][(x*3+y*5)%3];g.fillRect(x*32+(y%2)*16+2,y*32+2,28,28);}},[LW/1.6,(OUT_Z1-LD/2)/1.6]),
    sea:()=>canvasTex(128,128,(g,w)=>{const gr=g.createLinearGradient(0,0,0,w);gr.addColorStop(0,"#3aa0c2");gr.addColorStop(1,"#2a7fa8");g.fillStyle=gr;g.fillRect(0,0,w,w);
      g.strokeStyle="rgba(255,255,255,.35)";g.lineWidth=3;for(let i=0;i<5;i++){g.beginPath();const y=12+i*25;g.moveTo(10+(i%2)*40,y);g.quadraticCurveTo(30+(i%2)*40,y-8,50+(i%2)*40,y);g.stroke();}},[4,2]),
    cloth:()=>canvasTex(64,64,(g,w)=>{g.fillStyle="#f7f1e6";g.fillRect(0,0,w,w);g.fillStyle="#d8402f";for(let y=0;y<8;y++)for(let x=0;x<8;x++)if((x+y)%2===0)g.fillRect(x*8,y*8,8,8);}),
    blob:()=>canvasTex(64,64,(g,w)=>{const gr=g.createRadialGradient(w/2,w/2,2,w/2,w/2,w/2);gr.addColorStop(0,"rgba(0,0,0,.45)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(0,0,w,w);}),
    glow:()=>canvasTex(64,64,(g,w)=>{const gr=g.createRadialGradient(w/2,w/2,1,w/2,w/2,w/2);gr.addColorStop(0,"rgba(255,214,150,.8)");gr.addColorStop(1,"rgba(255,200,120,0)");g.fillStyle=gr;g.fillRect(0,0,w,w);})
  }[name](); TEX[name]=T; return T;
}
const mat=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
function box(w,h,d,m,x,y,z,parent){const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);(parent||L3.scene).add(b);return b;}
// Raum: Boden, vier Wände (die zur Kamera hin werden ausgeblendet), Fenster, Wimpelkette, Wandlampen, draußen Gehweg und Meer
function buildRoom(){
  const T=THREE, sc=L3.scene;
  const floor=new T.Mesh(new T.PlaneGeometry(LW,LD),new T.MeshLambertMaterial({map:tex("floor")}));floor.rotation.x=-Math.PI/2;sc.add(floor);
  const street=new T.Mesh(new T.PlaneGeometry(LW+6,OUT_Z1-LD/2+.5),new T.MeshLambertMaterial({map:tex("street")}));street.rotation.x=-Math.PI/2;street.position.set(0,-.02,(LD/2+OUT_Z1+.5)/2);sc.add(street);
  box(LW+6,.25,.4,mat(0x8f8576),0,-.1,OUT_Z1+.3); // Kaimauer
  const sea=new T.Mesh(new T.PlaneGeometry(LW+14,SEA_Z1-SEA_Z0+6),new T.MeshLambertMaterial({map:tex("sea")}));sea.rotation.x=-Math.PI/2;sea.position.set(0,-.35,(SEA_Z0+SEA_Z1+6)/2-.2);sc.add(sea);
  const plaster=mat(0xf4e9d6), terra=mat(0xc8694a), rail=mat(0x7a4a2a), base=mat(0x8a5134);
  WALLS.forEach((w,i)=>{
    const g=new T.Group(), side=i===1||i===2, th=.14;
    const seg=(a,b,y0,y1,m)=>{const len=b-a, c=(a+b)/2, h=y1-y0;
      const bx=box(side?th:len,h,side?len:th,m,0,y0+h/2,0,g);if(side)bx.position.z=c;else bx.position.x=c;};
    const parts=i===3?[[-LW/2,-DOOR_W],[DOOR_W,LW/2]]:[[-w.len/2,w.len/2]];
    parts.forEach(([a,b])=>{seg(a,b,0,1.05,terra);seg(a,b,1.05,1.13,rail);seg(a,b,1.13,LH,plaster);});
    if(i===3)seg(-DOOR_W,DOOR_W,2.25,LH,plaster);
    g.position.set(w.p[0]-w.n[0]*th/2,0,w.p[1]-w.n[1]*th/2);
    // niedrige Sockelleiste bleibt sichtbar, wenn die Wand ausgeblendet ist
    const low=new T.Group(); parts.forEach(([a,b])=>{const len=b-a,c=(a+b)/2;const bx=box(side?th:len,.3,side?len:th,base,0,.15,0,low);if(side)bx.position.z=c;else bx.position.x=c;});
    low.position.copy(g.position); low.visible=false; sc.add(g); sc.add(low);
    L3.walls.push({g,low,deco:[]});
  });
  // Fenster rechts, Tür vorne, Wimpelkette hinten
  const win=new T.Group(); box(.06,1.3,2.2,mat(0x6b4126),0,1.9,0,win); box(.07,1.15,1,mat(0xdff1f7,{emissive:0x8fb6c4}),0,1.9,-.53,win); box(.07,1.15,1,mat(0xdff1f7,{emissive:0x8fb6c4}),0,1.9,.53,win);
  win.position.set(LW/2-.02,0,.6); sc.add(win); L3.walls[2].deco.push(win);
  const door=new T.Group(); box(DOOR_W*2+.2,.12,.18,mat(0x6b4126),0,2.3,0,door); box(.1,2.3,.18,mat(0x6b4126),-DOOR_W-.05,1.15,0,door); box(.1,2.3,.18,mat(0x6b4126),DOOR_W+.05,1.15,0,door);
  door.position.set(0,0,LD/2); sc.add(door); L3.walls[3].deco.push(door);
  const flags=new T.Group(), cols=[0x3a9a4a,0xf3eee2,0xd8402f];
  for(let k=0;k<17;k++){const x=-LW/2+.4+k*(LW-.8)/16, sh=new T.Shape();sh.moveTo(-.13,0);sh.lineTo(.13,0);sh.lineTo(0,-.3);
    const f=new T.Mesh(new T.ShapeGeometry(sh),mat(cols[k%3],{side:T.DoubleSide}));f.position.set(x,2.8-Math.sin(k/16*Math.PI)*.18,0);flags.add(f);}
  flags.position.set(0,0,-LD/2+.03); sc.add(flags); L3.walls[0].deco.push(flags);
  // Feste Wandlampen mit warmem Lichtschein an der Wand (keine Hängelampen)
  L3.fixed=[[0,-2.4],[0,2.4],[1,-1.2],[2,-1.8]].map(([wi,t])=>({wi,t,y:1.95}));
  L3.fixed.forEach(f=>{const w=WALLS[f.wi], gl=new T.Mesh(new T.PlaneGeometry(1.6,1.6),new T.MeshBasicMaterial({map:tex("glow"),transparent:true,depthWrite:false}));
    const [x,z]=wallPoint(f.wi,f.t,.02); gl.position.set(x,f.y+.2,z); gl.rotation.y=w.r*Math.PI/2; sc.add(gl); L3.walls[f.wi].deco.push(gl);
    loadModel("wandlampe").then(m=>{const o=m.clone(true);const [x2,z2]=wallPoint(f.wi,f.t,0);o.position.set(x2,f.y,z2);o.rotation.y=w.r*Math.PI/2;sc.add(o);L3.walls[f.wi].deco.push(o);L3.dirty=true;req3d();});});
  const pl=new T.PointLight(0xffc68a,6,9,1.6); pl.position.set(-1.5,2.4,-2); sc.add(pl);
  const pl2=new T.PointLight(0xffc68a,4,8,1.6); pl2.position.set(2.5,2.4,1); sc.add(pl2);
  // Raster beim Ziehen, Rahmen um das gewählte Stück
  const gp=[]; for(let x=-LW/2;x<=LW/2+.01;x+=.5)gp.push(x,0,-LD/2,x,0,LD/2); for(let z=-LD/2;z<=LD/2+.01;z+=.5)gp.push(-LW/2,0,z,LW/2,0,z);
  const gg=new T.BufferGeometry(); gg.setAttribute("position",new T.Float32BufferAttribute(gp,3));
  L3.grid=new T.LineSegments(gg,new T.LineBasicMaterial({color:0x6bbb5f,transparent:true,opacity:.45})); L3.grid.position.y=.012; L3.grid.visible=false; sc.add(L3.grid);
  L3.box=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1,1,1)),new T.LineBasicMaterial({color:0xf4c64f}));L3.box.visible=false;sc.add(L3.box);
}
// Punkt auf Wand wi an Stelle t (entlang der Wand), um d ins Zimmer gerückt
function wallPoint(wi,t,d){const w=WALLS[wi];return w.n[0]?[w.p[0]+w.n[0]*d,t]:[t,w.p[1]+w.n[1]*d];}

/* ---------- Modelle laden (jedes nur einmal, Kopien teilen sich Geometrie) ---------- */
function loadModel(name){
  if(L3.models[name])return L3.models[name];
  if(name==="@kuehlbox"){const g=new THREE.Group();box(.62,.42,.42,mat(0x2f78c4),0,.21,0,g);box(.66,.08,.46,mat(0xf3f3f3),0,.46,0,g);box(.3,.05,.05,mat(0xf3f3f3),0,.53,0,g);
    return L3.models[name]=Promise.resolve(g);}
  return L3.models[name]=new Promise(res=>{
    new THREE.GLTFLoader().load(`modelle/${name}.glb`,gl=>{const o=gl.scene; o.traverse(m=>{if(!m.isMesh)return;
      // einfaches Licht (Lambert) statt PBR: läuft auch auf alten Handys flüssig
      const s=m.material, n=mat(s.color,{emissive:s.emissive,emissiveIntensity:s.emissiveIntensity||1,transparent:s.transparent,opacity:s.opacity,side:s.side});
      n.name=s.name; m.material=n;});
      res(o);},undefined,()=>res(null));
  });
}
// Karierte Tischdecken (Shop: le tovaglie a quadri, Truhe: la tovaglia) auf alle Tische
function clothify(o){
  o.traverse(m=>{if(!m.isMesh||m.material.name!=="Tuch")return;
    const g=m.geometry; if(!g.attributes.uv){const p=g.attributes.position,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){uv[i*2]=p.getX(i)*3;uv[i*2+1]=p.getZ(i)*3;}g.setAttribute("uv",new THREE.BufferAttribute(uv,2));}
    m.material=m.material.clone(); m.material.color.set(0xffffff); m.material.map=tex("cloth"); m.material.map.wrapS=m.material.map.wrapT=THREE.RepeatWrapping;});
}

/* ---------- Plätze: prüfen, suchen, umrechnen ---------- */
// Achsen-Box eines Stücks an Position x,y,z mit Drehung r (aus der Box des Modells)
function boxAt(I,x,y,z,r){
  const b=I.lb; let x0,x1,z0,z1;
  if(r===0){x0=b.min.x;x1=b.max.x;z0=b.min.z;z1=b.max.z;}
  else if(r===1){x0=b.min.z;x1=b.max.z;z0=-b.max.x;z1=-b.min.x;}
  else if(r===2){x0=-b.max.x;x1=-b.min.x;z0=-b.max.z;z1=-b.min.z;}
  else{x0=-b.max.z;x1=-b.min.z;z0=b.min.x;z1=b.max.x;}
  return {x0:x+x0,x1:x+x1,y0:y+b.min.y,y1:y+b.max.y,z0:z+z0,z1:z+z1};
}
const hit=(a,b,e)=>a.x0<b.x1-e&&a.x1>b.x0+e&&a.z0<b.z1-e&&a.z1>b.z0+e;
const hit3=(a,b,e)=>hit(a,b,e)&&a.y0<b.y1-e&&a.y1>b.y0+e;
// Wo das Stück hin darf (Raum, Gehweg, Wasser) und nicht in die Tür
function zoneOk(I,B,P){
  const z=zoneOf(I.d); let m=.1;
  if(z==="out")return B.x0>=-LW/2-2&&B.x1<=LW/2+2&&B.z0>=OUT_Z0&&B.z1<=OUT_Z1&&!(B.x0<DOOR_W+.2&&B.x1>-DOOR_W-.2&&B.z0<OUT_Z0+1.2);
  if(z==="sea")return B.x0>=-LW/2-3&&B.x1<=LW/2+3&&B.z0>=SEA_Z0&&B.z1<=SEA_Z1;
  if(z==="wall")m=0;
  const inRoom=B.x0>=-LW/2+m-.02&&B.x1<=LW/2-m+.02&&B.z0>=-LD/2+m-.02&&B.z1<=LD/2-m+.02;
  if(!inRoom)return false;
  if(z==="wall"){if(wallOfR(P.r)===3&&B.x0<DOOR_W+.1&&B.x1>-DOOR_W-.1&&B.y0<2.4)return false;return B.y1<=LH-.05;}
  if(z==="ceil"||(z==="top"&&P.y>0)||z==="rug")return true;
  return !(B.x0<DOOR_W+.1&&B.x1>-DOOR_W-.1&&B.z1>LD/2-1.1);
}
// Überschneidung mit anderen Stücken derselben Ebene (Boden, Wand, Tischplatte, Decke)
function layerOf(I,P){const z=zoneOf(I.d);if(z==="top")return P.y>0?"top":"floor";if(z==="out"||z==="sea")return "floor";return z;}
function placeOk(I,P,ignore){
  const B=boxAt(I,P.x,P.y,P.z,P.r); if(!zoneOk(I,B,P))return false;
  const L=layerOf(I,P); if(L==="rug")return true;
  for(const J of L3.items){if(J===I||J===ignore||J.st||!J.lb||!J.pos)continue;
    if(layerOf(J,J.pos)!==L)continue;
    const C=boxAt(J,J.pos.x,J.pos.y,J.pos.z,J.pos.r);
    if(L==="wall"||L==="top"?hit3(B,C,.02):hit(B,C,.03))return false;}
  if(L==="wall")for(const f of L3.fixed){const [x,z]=wallPoint(f.wi,f.t,0);if(WALLS[f.wi].r===P.r&&hit3(B,{x0:x-.25,x1:x+.25,y0:f.y-.25,y1:f.y+.35,z0:z-.25,z1:z+.25},0))return false;}
  return true;
}
// Wandstück: an Wand wi, Stelle t
function wallPos(I,wi,t){const w=WALLS[wi],[x,z]=wallPoint(wi,t,.01-I.lb.min.z);return {x,z,r:w.r,y:I.d.h||0};}
const snap=(v,s)=>Math.round(v/s)*s;
const ceilY=I=>LH-.02-I.lb.max.y;
// Freien Platz suchen, nah an (px, pz); für Wand- und Tischstücke eigene Suche
function findSpot(I,px,pz,r){
  const z=zoneOf(I.d); r=r==null?(I.d.r||0):r;
  if(z==="wall"){
    const order=[0,1,2,3].sort((a,b)=>a===(I.wPref??0)?-1:b===(I.wPref??0)?1:0);
    for(const wi of order){const half=WALLS[wi].len/2, ts=[];for(let t=-half;t<=half;t+=.25)ts.push(t);
      ts.sort((a,b)=>Math.abs(a-(I.tPref||0))-Math.abs(b-(I.tPref||0)));
      for(const t of ts){const P=wallPos(I,wi,t);if(placeOk(I,P))return P;}}
    return null;
  }
  if(z==="top"){const P=topSpot(I);if(P)return P;}
  const y=z==="ceil"?ceilY(I):0, c=[];
  const [xa,xb,za,zb]=z==="out"?[-LW/2-2,LW/2+2,OUT_Z0,OUT_Z1]:z==="sea"?[-LW/2-3,LW/2+3,SEA_Z0,SEA_Z1]:[-LW/2,LW/2,-LD/2,LD/2];
  for(let x=xa;x<=xb;x+=.25)for(let zz=za;zz<=zb;zz+=.25)c.push([x,zz,(x-px)**2+(zz-pz)**2]);
  c.sort((a,b)=>a[2]-b[2]);
  for(const rr of [r,(r+1)%4])for(const [x,zz] of c){const P={x,z:zz,r:rr,y};if(placeOk(I,P))return P;}
  return null;
}
// Kleines Stück auf eine Fläche stellen: Theke zuerst, dann Kühlung, dann Tische
function topSpot(I){
  const surf=L3.items.filter(J=>J.d.surf&&!J.st&&J.obj&&J!==I).sort((a,b)=>(a.key==="bancone"?0:a.key==="frigo"?1:2)-(b.key==="bancone"?0:b.key==="frigo"?1:2));
  for(const J of surf){const B=boxAt(J,J.pos.x,J.pos.y,J.pos.z,J.pos.r);
    for(let x=B.x0+.25;x<=B.x1-.2;x+=.2)for(let z=B.z0+.15;z<=B.z1-.1;z+=.15){const y=surfaceY(J,x,z);if(y==null)continue;
      const P={x,z,r:J.pos.r,y};if(placeOk(I,P))return P;}}
  return null;
}
// Steht ein kleines Stück wirklich auf einer Fläche (Höhe passt)?
function onSurface(I,P){return L3.items.some(J=>J!==I&&J.d.surf&&!J.st&&J.obj&&J.pos&&(y=>y!=null&&Math.abs(y-P.y)<.06)(surfaceY(J,P.x,P.z)));}
const ray=()=>L3.rc||(L3.rc=new THREE.Raycaster());
function surfaceY(J,x,z){
  J.obj.updateMatrixWorld(true); const rc=ray(); rc.set(new THREE.Vector3(x,LH+1,z),new THREE.Vector3(0,-1,0));
  const h=rc.intersectObject(J.obj,true).find(h=>h.face&&h.face.normal&&Math.abs(h.face.normal.clone().transformDirection(h.object.matrixWorld).y)>.6);
  return h&&h.point.y>.3?h.point.y:null;
}
// Alter Platz auf dem Raster (8 × 6 Feldern, oben die Küchenwand) → Meter im neuen Raum
function fromGrid(I,gx,gy){
  const x=(gx+.5)*LW/OLD_GW-LW/2, z=(gy+.5)*LD/OLD_GH-LD/2;
  return gy===0?{x,z:-LD/2+.1-I.lb.min.z,r:0,y:0}:{x,z,r:0,y:0};
}
// Jedem Stück einen Platz geben: gespeicherter Platz, sonst alter Rasterplatz, sonst ein freier Platz
function placeAll(){
  const L=S.locale;
  L3.items.forEach(I=>{if(!I.lb)return; const s=L[I.key];
    if(s&&s.st){I.st=true;I.pos=null;return;} I.st=false;
    let P=s&&s.x!=null?{x:s.x,z:s.z,r:s.r||0,y:s.y||0}:null;
    if(P&&zoneOf(I.d)==="wall"&&wallOfR(P.r)<0)P=null;
    if(P&&zoneOf(I.d)==="ceil")P.y=ceilY(I);
    if(!P&&S.place&&S.place[I.key]&&zoneOf(I.d)==="floor")P=fromGrid(I,S.place[I.key][0],S.place[I.key][1]);
    I.want=P; I.pos=null;});
  // erst Boden, dann Wände und Decke, zuletzt kleine Stücke auf den Flächen
  const order=I=>({floor:0,rug:0,out:0,sea:0,wall:1,ceil:1,top:2})[zoneOf(I.d)]+(I.want?-.6:PREF[I.key]?-.3:0); // Gespeichertes zuerst, Neues sucht sich Platz drumherum
  let nT=0,nD=0;
  [...L3.items].filter(I=>I.lb&&!I.st).sort((a,b)=>order(a)-order(b)).forEach(I=>{
    let P=I.want;
    if(P&&zoneOf(I.d)==="top"&&P.y>0&&!onSurface(I,P))P=null; // Theke oder Tisch ist nicht mehr da
    if(P&&!placeOk(I,P))P=zoneOf(I.d)==="wall"?(I.wPref=wallOfR(P.r),I.tPref=WALLS[wallOfR(P.r)].n[0]?P.z:P.x,findSpot(I,P.x,P.z)):zoneOf(I.d)==="top"?null:findSpot(I,P.x,P.z,P.r);
    if(!P){const pr=PREF[I.key]; let px=0,pz=.8;
      if(pr){px=pr[0];pz=pr[1]==="back"?-LD/2+.1-I.lb.min.z:pr[1];}
      else if(zoneOf(I.d)==="floor"){const sp=I.d.surf?TABLE_SPOTS[nT++%TABLE_SPOTS.length]:DECO_SPOTS[nD++%DECO_SPOTS.length];px=sp[0];pz=sp[1];}
      else if(zoneOf(I.d)==="rug"){px=1.6;pz=1.2;}
      if(zoneOf(I.d)==="out"){px=-2.2;pz=OUT_Z0+1.4;} if(zoneOf(I.d)==="sea"){px=0;pz=(SEA_Z0+SEA_Z1)/2;}
      P=findSpot(I,px,pz);}
    if(P){I.pos=P;setObj(I);remember(I);}
    else{I.st=true;remember(I);} // kein Platz mehr frei: ins Lager
    if(I.obj)I.obj.visible=!I.st;
  });
}
function remember(I){
  const r2=v=>Math.round(v*100)/100;
  S.locale[I.key]=I.st?{st:1}:{x:r2(I.pos.x),z:r2(I.pos.z),r:I.pos.r,y:r2(I.pos.y)};
}
function setObj(I){
  if(!I.obj||!I.pos)return; const P=I.pos;
  I.obj.position.set(P.x,P.y,P.z); I.obj.rotation.y=P.r*Math.PI/2; I.obj.visible=!I.st;
  if(I.blob){const B=boxAt(I,P.x,P.y,P.z,P.r);I.blob.visible=!I.st&&(P.y<.05||zoneOf(I.d)==="top");I.blob.position.set((B.x0+B.x1)/2,P.y+.008,(B.z0+B.z1)/2);I.blob.scale.set((B.x1-B.x0)*1.25,(B.z1-B.z0)*1.25,1);}
  L3.dirty=true;
}

/* ---------- Szene mit dem Spielstand abgleichen ---------- */
async function locSync(){
  if(!loc3dInit())return false;
  const sig=locStruct(); if(L3.syncSig===sig&&L3.locRef===S.locale&&!L3.building)return true;
  if(L3.building)return L3.building;
  L3.building=(async()=>{
    const want=locItems(), keep={};
    L3.items.forEach(I=>{const w=want.find(x=>x.key===I.key);if(w&&w.id===I.id)keep[I.key]=I;else if(I.obj){L3.scene.remove(I.obj);if(I.blob)L3.scene.remove(I.blob);}});
    const cloth=hasCloth();
    L3.items=await Promise.all(want.map(async w=>{
      let I=keep[w.key]; if(I&&I.cloth===cloth)return Object.assign(I,{it:w.it,de:w.de});
      if(I&&I.obj){L3.scene.remove(I.obj);if(I.blob)L3.scene.remove(I.blob);}
      I=Object.assign({},w); const m=await loadModel(w.d.m); if(!m)return I;
      I.obj=m.clone(true); I.obj.userData.key=w.key; I.cloth=cloth; if(cloth&&w.d.surf)clothify(I.obj);
      I.obj.rotation.y=0; I.obj.position.set(0,0,0); I.obj.updateMatrixWorld(true);
      I.lb=new THREE.Box3().setFromObject(I.obj);
      if(zoneOf(w.d)!=="wall"&&zoneOf(w.d)!=="ceil"&&zoneOf(w.d)!=="rug"&&zoneOf(w.d)!=="sea"){
        I.blob=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:tex("blob"),transparent:true,depthWrite:false}));I.blob.rotation.x=-Math.PI/2;L3.scene.add(I.blob);}
      L3.scene.add(I.obj); return I;}));
    L3.byKey={}; L3.items.forEach(I=>L3.byKey[I.key]=I);
    L3.scene.updateMatrixWorld(true);
    placeAll(); L3.scene.updateMatrixWorld(true);
    if(L3.sel&&!L3.byKey[L3.sel])L3.sel=null;
    L3.syncSig=locStruct(); L3.locRef=S.locale; L3.dirty=true; L3.building=null; return true;
  })();
  return L3.building;
}

/* ---------- Kamera und Zeichnen ---------- */
function camUpdate(){
  const c=L3.cam,t=L3.tgt; L3.ph=Math.max(.32,Math.min(1.3,L3.ph)); L3.rad=Math.max(4.5,Math.min(24,L3.rad));
  c.position.set(t.x+L3.rad*Math.sin(L3.ph)*Math.sin(L3.th),t.y+L3.rad*Math.cos(L3.ph),t.z+L3.rad*Math.sin(L3.ph)*Math.cos(L3.th));
  c.lookAt(t);
  // Wände zwischen Kamera und Raum ausblenden, dort bleibt nur die Sockelleiste
  L3.wallVis=WALLS.map((w,i)=>{const v=(c.position.x-w.p[0])*w.n[0]+(c.position.z-w.p[1])*w.n[1]>0;
    const W=L3.walls[i]; W.g.visible=v; W.low.visible=!v; W.deco.forEach(o=>o.visible=v); return v;});
  L3.items.forEach(I=>{if(I.obj&&I.pos&&zoneOf(I.d)==="wall")I.obj.visible=!I.st&&L3.wallVis[wallOfR(I.pos.r)];});
}
function req3d(){if(!L3.raf&&L3.r)L3.raf=requestAnimationFrame(draw3d);}
function draw3d(){
  L3.raf=0; if(!L3.host||!L3.host.isConnected)return;
  if(!L3.dirty)return; L3.dirty=false;
  camUpdate(); selBox(); L3.r.render(L3.scene,L3.cam);
}
function locResize(){
  const h=L3.host; if(!h)return; const w=h.clientWidth||300, hh=h.clientHeight||300;
  L3.r.setSize(w,hh,false); L3.cam.aspect=w/hh;
  // Hochformat: weiter weg, damit der ganze Raum passt
  L3.cam.fov=w<hh?46:38; L3.cam.updateProjectionMatrix();
  if(!L3.fitted){L3.fitted=true;if(w<hh){L3.th=.38;L3.ph=.72;L3.rad=Math.min(22,12.5*hh/w*.8);L3.tgt.set(.3,0,1.7);}}
  L3.dirty=true; req3d();
}
function selBox(){
  const I=L3.sel&&L3.byKey[L3.sel]; L3.grid.visible=!!(L3.drag&&L3.drag.moved&&I&&I.pos&&zoneOf(I.d)!=="wall"&&zoneOf(I.d)!=="out"&&zoneOf(I.d)!=="sea");
  if(!I||!I.pos||I.st||!I.lb){L3.box.visible=false;return;}
  const B=boxAt(I,I.pos.x,I.pos.y,I.pos.z,I.pos.r), p=.04;
  L3.box.visible=true; L3.box.scale.set(B.x1-B.x0+p,B.y1-B.y0+p,B.z1-B.z0+p); L3.box.position.set((B.x0+B.x1)/2,(B.y0+B.y1)/2,(B.z0+B.z1)/2);
  L3.box.material.color.set(L3.drag&&L3.drag.bad?0xe5533f:0xf4c64f);
}
// Leinwand in den Bildschirm hängen (nach jedem render() neu, die Szene bleibt dieselbe)
function loc3dMount(host){
  L3.host=host; if(!host)return;
  if(!loc3dInit()){host.innerHTML=`<p class="note loc-no3d">3D geht auf diesem Gerät leider nicht. Deine Einrichtung bleibt trotzdem gespeichert.</p>`;return;}
  host.appendChild(L3.r.domElement); locResize();
  locSync().then(()=>{L3.dirty=true;req3d();const ld=host.querySelector(".loc-load");if(ld)ld.remove();if(screen==="locale"&&L3.needUI){L3.needUI=false;render();}});
}

/* ---------- Finger: drehen, zoomen, Möbel ziehen ---------- */
function ndc(e){const r=L3.r.domElement.getBoundingClientRect();return new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);}
function pickAt(e){
  const rc=ray(); rc.setFromCamera(ndc(e),L3.cam);
  const objs=L3.items.filter(I=>I.obj&&I.obj.visible).map(I=>I.obj);
  const h=rc.intersectObjects(objs,true)[0]; if(!h)return null;
  let o=h.object; while(o&&!o.userData.key)o=o.parent; return o?L3.byKey[o.userData.key]:null;
}
function floorAt(e,y){const rc=ray();rc.setFromCamera(ndc(e),L3.cam);const p=new THREE.Vector3();return rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-(y||0)),p)?p:null;}
function bindPointers(el){
  el.addEventListener("pointerdown",e=>{
    el.setPointerCapture(e.pointerId); L3.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(L3.ptrs.size===2){if(L3.drag&&L3.drag.I){dragCancel();}L3.drag=null;L3.pinch=pinchState();return;}
    const I=pickAt(e);
    L3.drag={I,x0:e.clientX,y0:e.clientY,moved:false,bad:false};
    if(I&&I.pos){const f=floorAt(e,zoneOf(I.d)==="top"?I.pos.y:0);L3.drag.off=f?[I.pos.x-f.x,I.pos.z-f.z]:[0,0];L3.drag.start=Object.assign({},I.pos);L3.drag.good=Object.assign({},I.pos);
      L3.drag.riders=I.d.surf?riders(I):[];}
  });
  el.addEventListener("pointermove",e=>{
    const p=L3.ptrs.get(e.pointerId); if(!p)return;
    const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY;
    if(L3.ptrs.size>=2&&L3.pinch){const n=pinchState(),o=L3.pinch;L3.rad*=o.d/n.d;
      // zwei Finger verschieben: Blickpunkt mitziehen
      const s=L3.rad/600, c=Math.cos(L3.th), si=Math.sin(L3.th);
      L3.tgt.x-=(n.x-o.x)*s*c+(n.y-o.y)*s*si; L3.tgt.z-=-(n.x-o.x)*s*si+(n.y-o.y)*s*c;
      L3.tgt.x=Math.max(-LW/2,Math.min(LW/2,L3.tgt.x)); L3.tgt.z=Math.max(-LD/2,Math.min(SEA_Z1,L3.tgt.z));
      L3.pinch=n; L3.dirty=true; req3d(); return;}
    const D=L3.drag; if(!D)return;
    if(!D.moved&&Math.hypot(e.clientX-D.x0,e.clientY-D.y0)<9)return;
    if(!D.moved&&D.I&&D.I.pos&&L3.sel!==D.I.key){L3.sel=D.I.key;L3.msg="";speak(D.I.it);}
    D.moved=true;
    if(D.I&&D.I.pos){dragTo(D.I,e);}
    else{L3.th-=dx*.008; L3.ph-=dy*.006; L3.dirty=true; req3d();}
  });
  const up=e=>{
    L3.ptrs.delete(e.pointerId); if(L3.ptrs.size<2)L3.pinch=null;
    const D=L3.drag; L3.drag=null; if(!D||L3.ptrs.size)return;
    if(!D.moved){locTap(D.I);return;}
    if(D.I&&D.start&&L3.sel===D.I.key){const I=D.I;
      if(D.bad){I.pos=D.good;sfx("wrong");}else{sfx("click");L3.msg="";learn(I.it);}
      setObj(I); remember(I); moveRiders(D,I.pos); save(); render();}
    L3.dirty=true; req3d();
  };
  el.addEventListener("pointerup",up); el.addEventListener("pointercancel",up);
  el.addEventListener("wheel",e=>{e.preventDefault();L3.rad*=e.deltaY>0?1.1:.9;L3.dirty=true;req3d();},{passive:false});
}
function pinchState(){const [a,b]=[...L3.ptrs.values()];return {d:Math.max(20,Math.hypot(a.x-b.x,a.y-b.y)),x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
function dragCancel(){const D=L3.drag;if(D&&D.I&&D.start){D.I.pos=D.start;setObj(D.I);moveRiders(D,D.start);}}
// Was auf einer Theke oder einem Tisch steht, wandert beim Ziehen mit
function riders(J){const B=boxAt(J,J.pos.x,J.pos.y,J.pos.z,J.pos.r);
  return L3.items.filter(I=>I!==J&&I.pos&&!I.st&&zoneOf(I.d)==="top"&&I.pos.y>.3&&I.pos.x>B.x0&&I.pos.x<B.x1&&I.pos.z>B.z0&&I.pos.z<B.z1).map(I=>({I,p:Object.assign({},I.pos)}));}
function moveRiders(D,P){if(!D.riders||!D.start)return;const dx=P.x-D.start.x,dz=P.z-D.start.z;
  D.riders.forEach(({I,p})=>{I.pos=Object.assign({},p,{x:p.x+dx,z:p.z+dz});setObj(I);remember(I);});}
// Ziehen: Boden auf dem Raster (25 cm), Wandstücke an der nächsten sichtbaren Wand, kleine Dinge auf Theke und Tische
function dragTo(I,e){
  const D=L3.drag, z=zoneOf(I.d); let P=null;
  if(z==="wall"){
    const f=floorAt(e,I.pos.y||1.5)||floorAt(e,0); if(!f)return;
    let best=null;WALLS.forEach((w,wi)=>{if(!L3.wallVis[wi])return;const d=Math.abs((f.x-w.p[0])*w.n[0]+(f.z-w.p[1])*w.n[1]);if(!best||d<best.d)best={wi,d};});
    if(!best)return; const w=WALLS[best.wi], half=w.len/2-.3;
    const t=Math.max(-half,Math.min(half,snap(w.n[0]?f.z:f.x,.25)));
    P=wallPos(I,best.wi,t);
  }else if(z==="top"){
    const rc=ray(); rc.setFromCamera(ndc(e),L3.cam);
    const surf=L3.items.filter(J=>J!==I&&J.d.surf&&J.obj&&J.obj.visible).map(J=>J.obj);
    const h=rc.intersectObjects(surf,true).find(h=>h.face&&Math.abs(h.face.normal.clone().transformDirection(h.object.matrixWorld).y)>.6&&h.point.y>.3);
    if(h)P={x:snap(h.point.x,.05),z:snap(h.point.z,.05),y:h.point.y,r:I.pos.r};
    else{const f=floorAt(e,0);if(!f)return;P={x:snap(f.x,.25),z:snap(f.z,.25),y:0,r:I.pos.r};}
  }else{
    const y=z==="ceil"?ceilY(I):0, f=floorAt(e,z==="ceil"?0:0); if(!f)return;
    // nicht aus dem Bereich ziehen: Raum, Gehweg oder Wasser
    const [xa,xb,za,zb]=z==="out"?[-LW/2-2,LW/2+2,OUT_Z0,OUT_Z1]:z==="sea"?[-LW/2-3,LW/2+3,SEA_Z0,SEA_Z1]:[-LW/2,LW/2,-LD/2,LD/2];
    P={x:Math.max(xa,Math.min(xb,snap(f.x+D.off[0],.25))),z:Math.max(za,Math.min(zb,snap(f.z+D.off[1],.25))),y,r:I.pos.r};
  }
  I.pos=P; D.bad=!placeOk(I,P); if(!D.bad)D.good=Object.assign({},P);
  setObj(I); moveRiders(D,P); req3d();
}
function locTap(I){
  if(!I){if(L3.sel){L3.sel=null;L3.msg="";render();}return;}
  L3.sel=L3.sel===I.key?null:I.key; if(L3.sel){speak(I.it);sfx("select");}
  render();
}

/* ---------- Knöpfe: drehen, einlagern, aufstellen ---------- */
function locRotate(){
  const I=L3.byKey[L3.sel]; if(!I||!I.pos)return;
  const z=zoneOf(I.d); if(z==="wall")return;
  const rd=I.d.surf?riders(I):[];
  for(let k=1;k<=4;k++){const P=Object.assign({},I.pos,{r:(I.pos.r+k)%4});
    let Q=placeOk(I,P)?P:null;
    if(!Q&&z!=="top"){Q=findSpot(I,I.pos.x,I.pos.z,P.r);if(Q&&(Q.r!==P.r||Math.hypot(Q.x-I.pos.x,Q.z-I.pos.z)>1.6))Q=null;}
    if(Q){I.pos=Q;setObj(I);remember(I);replaceRiders(rd);sfx("click");save();L3.dirty=true;req3d();return;}}
  sfx("wrong");
}
function locStore(){
  const I=L3.byKey[L3.sel]; if(!I)return;
  const rd=I.d.surf?riders(I):[];
  I.st=true; I.pos=null; if(I.obj)I.obj.visible=false; if(I.blob)I.blob.visible=false;
  remember(I); replaceRiders(rd); L3.sel=null; L3.msg=""; sfx("click"); save(); L3.dirty=true; req3d();
}
function locPut(key){
  const I=L3.byKey[key]; if(!I||!I.lb)return;
  I.st=false; const P=findSpot(I,0,.8);
  if(!P){I.st=true;sfx("wrong");L3.msg="Kein Platz mehr frei. Lagere zuerst etwas anderes ein.";return;}
  I.pos=P; setObj(I); remember(I); L3.sel=key; speak(I.it); sfx("click"); save(); L3.dirty=true; req3d();
}
// Fläche gedreht oder eingelagert: was darauf stand, sucht sich einen neuen Platz
function replaceRiders(rd){L3.scene.updateMatrixWorld(true);rd.forEach(({I})=>{I.pos=null;const P=findSpot(I,0,.8);if(P){I.pos=P;setObj(I);}else{I.st=true;if(I.obj)I.obj.visible=false;}remember(I);});}
// Nach dem Kauf im Shop: neues Stück ist ausgewählt, Signor Moretti fragt, wohin
function locNew(key,msg){L3.sel=key;L3.msg=msg;}

/* ---------- Bildschirm „Il mio locale“ ---------- */
function rLocale(){
  const items=L3.ok===false?[]:L3.items, I=L3.sel&&L3.byKey[L3.sel], stored=items.filter(i=>i.st&&i.lb);
  const z=I&&zoneOf(I.d);
  const ready=L3.syncSig===locStruct()&&L3.locRef===S.locale&&!L3.building;
  if(L3.ok!==false&&!ready)L3.needUI=true;
  $("#screen").innerHTML=`${head("Il mio locale","Dein Restaurant in 3D")}
    <div class="loc-wrap"><div id="loc3d" class="loc3d">${ready?"":`<p class="loc-load">Il locale si prepara …</p>`}</div>
      ${L3.msg?`<div class="loc-msg">${esc(L3.msg)}</div>`:""}
      ${I?`<div class="loc-sel"><button class="loc-name" data-act="lsay"><b>${esc(I.it)}</b><small>${esc(I.de)}</small></button>
        ${z!=="wall"?`<button class="sec loc-b" data-act="lrot" aria-label="Drehen">⟳<small>Drehen</small></button>`:""}
        <button class="sec loc-b" data-act="lstore" aria-label="Einlagern">📦<small>Lager</small></button>
        <button class="sec loc-b" data-act="ldone" aria-label="Fertig">✓<small>Fertig</small></button></div>`
      :`<p class="loc-hint">Ein Finger dreht den Raum, zwei Finger zoomen. Tippe ein Möbelstück an und zieh es an seinen Platz.</p>`}
    </div>
    ${stored.length?`<div class="loc-store"><b>Il magazzino</b><small>Lager · antippen zum Aufstellen</small><div class="chips">${stored.map(i=>`<button class="chip${i.rare?" rare":""}" data-act="lput" data-k="${esc(i.key)}">${i.ic} ${esc(i.it)}</button>`).join("")}</div></div>`:""}`;
  loc3dMount($("#loc3d"));
}
// Kleines Bild vom Restaurant für Startseite und Shop (einmal gerendert, bis sich etwas ändert)
function locThumbHTML(){return L3.thumb&&L3.thumbSig===locSig()?`<img src="${L3.thumb}" alt="">`:`<span class="locph">🍕</span>`;}
function locThumbSoon(){
  if(L3.ok===false||L3.thumbBusy||(L3.thumb&&L3.thumbSig===locSig()))return;
  L3.thumbBusy=true;
  setTimeout(async()=>{
    try{if(!loc3dInit()||!(await locSync()))return;
      const r=L3.r, keep={th:L3.th,ph:L3.ph,rad:L3.rad,t:L3.tgt.clone()}, oldHost=L3.host;
      L3.th=.55;L3.ph=.9;L3.rad=12;L3.tgt.set(0,.5,-.2);
      r.setSize(360,240,false); L3.cam.aspect=1.5; L3.cam.fov=38; L3.cam.updateProjectionMatrix();
      const sel=L3.sel; L3.sel=null; camUpdate(); selBox(); r.render(L3.scene,L3.cam);
      L3.thumb=r.domElement.toDataURL("image/jpeg",.82); L3.thumbSig=locSig(); L3.sel=sel;
      Object.assign(L3,{th:keep.th,ph:keep.ph,rad:keep.rad}); L3.tgt.copy(keep.t);
      if(oldHost&&oldHost.isConnected)locResize();
      document.querySelectorAll(".locthumb").forEach(el=>el.innerHTML=locThumbHTML());
    }catch(e){console.warn("3D-Vorschau",e);} finally{L3.thumbBusy=false;}
  },60);
}
