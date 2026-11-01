/* Il Mercato als begehbarer Ort in 3D: eine kleine Piazza mit Häusern ringsum, Brunnen, Wimpelketten und
   fünf Ständen (BANCHE in inhalt/dialoge.js). Jede Zutat liegt in ihrer eigenen Holzkiste auf der Theke, davor
   ein Preisschild auf Italienisch, dahinter steht die Händlerin oder der Händler. Man läuft selbst über den Platz:
   Boden antippen geht dorthin, Stand oder Kiste antippen geht zum Stand. Am Stand unten die Kisten zum Kaufen
   (mkCard/mkBuy aus mercato.js). Ohne WebGL bleibt der flache Markt (rMercato2D).
   Gebaut wie stadt3d.js/campagna3d.js: gleiche Teile werden zu einem Mesh je Farbe zusammengelegt.
   Meter: x nach Osten, z nach Süden (Eingang), y nach oben. */
const MK={ok:null,r:null,scene:null,cam:null,host:null,tgt:null,th:0,ph:1.12,rad:6,ptrs:new Map(),drag:null,pinch:null,
  raf:0,last:0,t:0,picks:[],batch:{},anim:[],tags:{},tagSig:"",walk:null,near:null,shown:null,sel:null,
  hop:null,mark:null,crates:{},keys:{},placed:false,win:null};
// Die Stände: Mitte, Blickrichtung (ry: 0 = nach Süden), Breite der Theke, Markisenfarben, Schild, Händler
const MK_STANDS={
  verdura:{x:0,z:-8.5,ry:0,w:7.2,cols:["#3a9a4a","#f3eee2"],sign:"FRUTTA E VERDURA",
    who:{skin:0xd9a07a,shirt:0x8a5a8a,apron:0x3a9a4a,hair:0x8a8a88,skirt:0x4a3a5a,scarf:0xd8402f}},
  latticini:{x:-10.5,z:-2,ry:Math.PI/2,w:6,cols:["#2f78c4","#f3eee2"],sign:"LATTICINI",
    who:{skin:0xe8b48e,shirt:0x9ac0e0,apron:0xf6f3ea,hair:0x5a3420,skirt:0x2f4a7a,bun:1}},
  salumi:{x:10.5,z:-5,ry:-Math.PI/2,w:4.4,cols:["#d8402f","#f3eee2"],sign:"SALUMERIA",
    who:{skin:0xd99a74,shirt:0xf6f3ea,apron:0xa3262a,hair:0x2a2420,pants:0x3a3a40,mous:1,wide:1}},
  pesce:{x:10.5,z:3.5,ry:-Math.PI/2,w:4.4,cols:["#1f8fb0","#f3eee2"],sign:"PESCHERIA",
    who:{skin:0xc98e64,shirt:0x2f4a7a,apron:0xf2c230,hair:0xd8d8d4,pants:0x2b2f2c,cap:0x2f3f6a,beard:1}},
  alimentari:{x:-10.5,z:6.5,ry:Math.PI/2,w:4.4,cols:["#f4c64f","#6b4126"],sign:"ALIMENTARI",
    who:{skin:0xd9a07a,shirt:0xf0ebe0,apron:0x6b5a40,hair:0x3a3a3a,pants:0x4a4038,mous:1,glasses:1}}
};
const MK_BOUND={x0:-14.3,x1:14.3,z0:-13,z1:13.4};
const MK_FOUNT={x:0,z:2,r:2.3};

/* ---------- Bausteine ---------- */
// Teil vormerken (Weltlage), am Ende ein Mesh je Schlüssel. Schlüssel "#rrggbb" ist einfach diese Farbe.
function mkAdd(key,geo,x,y,z,ry,rx,rz){
  const m=new THREE.Matrix4().makeRotationY(ry||0);
  if(rx)m.multiply(new THREE.Matrix4().makeRotationX(rx)); if(rz)m.multiply(new THREE.Matrix4().makeRotationZ(rz));
  m.setPosition(x,y,z); const g=geo.index?geo.toNonIndexed():geo.clone(); g.applyMatrix4(m);
  (MK.batch[key]=MK.batch[key]||[]).push(g);
}
// Lage relativ zu einem Stand: dx nach rechts (vom Kunden aus gesehen links), dz nach vorn zum Kunden
function mkLocal(st){const c=Math.cos(st.ry), s=Math.sin(st.ry);
  return {at:(dx,dz)=>[st.x+dx*c+dz*s,st.z-dx*s+dz*c],
    add:(key,geo,dx,dy,dz,r,rx,rz)=>mkAdd(key,geo,st.x+dx*c+dz*s,dy,st.z-dx*s+dz*c,st.ry+(r||0),rx,rz)};}
const mBox=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const mCyl=(a,b,h,n)=>new THREE.CylinderGeometry(a,b,h,n||8);
const mBall=(r)=>frSphere(r,8,6);

/* ---------- Was in den Kisten liegt ---------- */
// Form je Zutat: Kugeln, Stangen, Blätter, Laibe, Flaschen, Dosen, Fische …  (sonst Kugeln in ihrer Farbe)
const MK_LOOK={
  pomodoro:["ball",.075,["#d8402b","#c8321f","#e24a30"]], cipolla:["ball",.08,["#cfa6dc","#b585c8"]], aglio:["ball",.065,["#efe6d2","#f6f0e2"],1.1,.9],
  peperoni:["ball",.085,["#d8402b","#f2b134","#4f9a3a"],1,1.25], melanzane:["ball",.07,["#5b2f63","#4a2552"],2.4,1], carciofi:["ball",.085,["#8aa357","#7a9347"],1,.9],
  funghi:["mush",.07,["#b08d6a","#9a7a5a"]], olive:["ball",.035,["#2a2a2a","#4a5a2a"],1.3,1], capperi:["jar",0,["#7d8f4a"]],
  zucchine:["log",.045,["#5d9a3f","#4a8a32"],.52], salame:["log",.06,["#a3262a","#8a1f22"],.5], salsiccia:["link",.035,["#9c5a3a"]],
  basilico:["leaf",0,["#3f9a45","#358a3a"]], rucola:["leaf",0,["#4f8a2a","#3f7a22"]], friarielli:["leaf",0,["#2f6b2a","#3a7a30"]],
  prezzemolo:["leaf",0,["#3a8a3a","#2f7a2f"]], origano:["bunch",0,["#6f8a3a"]],
  mozzarella:["ball",.075,["#f6f0e2","#fbf8f0"]], bufala:["ball",.09,["#fffdf6"]], ricotta:["basket",0,["#fbf8f0"]],
  scamorza:["pear",.09,["#e9b56a"]], provola:["pear",.085,["#d9a55a"]],
  parmigiano:["wheel",.2,["#f1d98a"],.13], pecorino:["wheel",.16,["#efe4bf"],.12], fontina:["wheel",.18,["#f4e0a0"],.09], gorgonzola:["wheel",.15,["#e3e0c6"],.11],
  prosciutto:["slab",0,["#e79a9a"]], crudo:["ham",0,["#c75a5a"]],
  tonno:["can",0,["#c8d0d4"]], acciughe:["fish",.11,["#8f8a86","#a9a5a0"]], gamberi:["shrimp",.05,["#f08a5a","#e8794a"]], cozze:["ball",.045,["#2c2f3a"],1.7,.8],
  olio:["bottle",0,["#d6b532"]]
};
// Füllt eine Kiste (Mitte cx,cz in Weltlage, Boden y, Drehung ry) mit ihrer Zutat
function mkStuff(k,cx,y,cz,ry,rnd){
  const L=MK_LOOK[k]||["ball",.07,[ING[k]?ING[k][1]:"#c0a080"]], [kind,r,cols]=L, c=Math.cos(ry), s=Math.sin(ry);
  const P=(dx,dz)=>[cx+dx*c+dz*s,cz-dx*s+dz*c], col=i=>cols[i%cols.length];
  const grid=(nx,nz,fn)=>{for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const dx=-.24+(i+.5)*.48/nx+(rnd()-.5)*.03,dz=-.16+(j+.5)*.32/nz+(rnd()-.5)*.03;fn(dx,dz,i*nz+j);}};
  if(kind==="ball"||kind==="mush"||kind==="pear"){
    const sx=L[3]||1, sy=L[4]||1, n=Math.max(2,Math.round(.46/(2*r*Math.max(1,sx*.6)))), m=Math.max(2,Math.round(.3/(2*r)));
    for(let layer=0;layer<2;layer++)grid(n-layer,m-layer,(dx,dz,i)=>{const g=mBall(r);g.scale(sx,sy,1);const [x,z]=P(dx,dz);
      mkAdd(col(i+layer),g,x,y+.1+r*sy*.8+layer*r*1.3,z,ry+rnd()*.6);
      if(kind==="mush")mkAdd("#efe4cf",mCyl(r*.4,r*.45,r*1.1,6),x,y+.06+r*.5,z);
      if(kind==="pear")mkAdd(col(i),mBall(r*.45),x,y+.1+r*1.6+layer*r*1.3,z);});
    return;
  }
  if(kind==="log"){for(let layer=0;layer<2;layer++)for(let i=0;i<Math.round(.3/(2*r))-layer;i++){const g=mCyl(r,r,L[3],8);g.rotateZ(Math.PI/2);
      const [x,z]=P((rnd()-.5)*.03,-.13+i*2.1*r+layer*r);mkAdd(col(i+layer),g,x,y+.1+r+layer*r*1.6,z,ry+(rnd()-.5)*.15);}return;}
  if(kind==="link"){for(let j=0;j<4;j++)for(let i=0;i<5;i++){const g=mCyl(r,r,.09,6);g.rotateZ(Math.PI/2);const [x,z]=P(-.2+i*.1,-.12+j*.08);mkAdd(col(0),g,x,y+.1+r+(j%2)*.02,z,ry+.15*(i%2?1:-1));}return;}
  if(kind==="leaf"||kind==="bunch"){grid(5,3,(dx,dz,i)=>{const [x,z]=P(dx,dz);
      if(kind==="bunch"){mkAdd("#8a6a3a",mCyl(.015,.015,.2,4),x,y+.17,z,0,.6);mkAdd(col(0),mCyl(.06,.03,.12,6),x,y+.24,z);}
      else{mkAdd(col(i),mCyl(.09,.03,.13+rnd()*.05,6),x,y+.17,z,rnd()*3);mkAdd(col(i+1),mBall(.05),x+(rnd()-.5)*.05,y+.27,z);}});return;}
  if(kind==="wheel"){const h=L[3];mkAdd(col(0),mCyl(r,r,h,16),...(([x,z])=>[x,y+.1+h/2,z])(P(-.06,0)),ry);
    const w=mCyl(r*.8,r*.8,h*.9,3,1);mkAdd(col(0),w,...(([x,z])=>[x,y+.1+h*.45,z])(P(.16,.02)),ry+.5);
    mkAdd("#c9a15a",mCyl(r+.004,r+.004,h*.3,16),...(([x,z])=>[x,y+.1+h/2,z])(P(-.06,0)),ry);return;}
  if(kind==="jar"||kind==="can"){grid(4,2,(dx,dz)=>{const [x,z]=P(dx,dz);
      if(kind==="jar"){mkAdd("#cfe0d0",mCyl(.045,.045,.11,8),x,y+.16,z);mkAdd(col(0),mCyl(.04,.04,.08,8),x,y+.15,z);mkAdd("#d8402f",mCyl(.047,.047,.025,8),x,y+.23,z);}
      else{mkAdd(col(0),mCyl(.05,.05,.05,10),x,y+.13,z);mkAdd("#2f78c4",mCyl(.051,.051,.025,10),x,y+.13,z);mkAdd(col(0),mCyl(.05,.05,.05,10),x,y+.19,z);}});return;}
  if(kind==="bottle"){grid(4,2,(dx,dz)=>{const [x,z]=P(dx,dz);mkAdd("#3f6b2a",mCyl(.04,.045,.22,8),x,y+.21,z);mkAdd("#3f6b2a",mCyl(.015,.02,.08,6),x,y+.36,z);
      mkAdd(col(0),mBox(.07,.06,.005),...(([a,b])=>[a,y+.22,b])(P(dx,dz+.045)),ry);mkAdd("#2b2620",mCyl(.017,.017,.02,6),x,y+.41,z);});return;}
  if(kind==="fish"||kind==="shrimp"){mkAdd("#e6f2f6",mBox(.5,.04,.34),...(([x,z])=>[x,y+.12,z])(P(0,0)),ry);
    grid(kind==="fish"?3:5,kind==="fish"?4:4,(dx,dz,i)=>{const [x,z]=P(dx,dz);
      if(kind==="fish"){const g=mBall(.04);g.scale(r/.04*1.2,.45,.6);mkAdd(col(i),g,x,y+.16,z,ry+.3*(i%2?1:-1));mkAdd(col(i),mBox(.03,.03,.05),...(([a,b])=>[a,y+.16,b])(P(dx+r*1.15,dz)),ry);}
      else{const g=mBall(r);g.scale(1.6,.8,.9);mkAdd(col(i),g,x,y+.17,z,ry+rnd()*3);}});return;}
  if(kind==="basket"){grid(3,2,(dx,dz)=>{const [x,z]=P(dx,dz);mkAdd("#c9a15a",mCyl(.07,.06,.08,10),x,y+.14,z);mkAdd(col(0),mCyl(.065,.068,.03,10),x,y+.19,z);});return;}
  if(kind==="slab"){for(let i=0;i<2;i++){const [x,z]=P(-.12+i*.25,0);mkAdd(col(0),mBox(.22,.12,.28),x,y+.16,z,ry+(i?.1:-.1));mkAdd("#f6d0d0",mBox(.23,.02,.29),x,y+.23,z,ry+(i?.1:-.1));}return;}
  if(kind==="ham"){const g=mBall(.12);g.scale(1.9,.8,1);const [x,z]=P(-.02,0);mkAdd(col(0),g,x,y+.18,z,ry+.2);
    mkAdd("#f3e6d6",mCyl(.03,.035,.12,6),...(([a,b])=>[a,y+.2,b])(P(.26,.06)),ry,0,Math.PI/2);mkAdd("#f6e0d8",mBall(.07),...(([a,b])=>[a,y+.22,b])(P(-.24,-.02)),ry);return;}
}
// Eine Holzkiste aus Latten (offen), Mitte cx,cz, Boden y
function mkCrate(cx,y,cz,ry){
  const c=Math.cos(ry), s=Math.sin(ry), P=(dx,dz)=>[cx+dx*c+dz*s,cz-dx*s+dz*c], W="#c99a5c", D="#a87a44";
  [[0,.21,.62,.04],[0,-.21,.62,.04]].forEach(([dx,dz,w,d])=>{[0,1].forEach(k=>{const [x,z]=P(dx,dz);mkAdd(k?D:W,mBox(w,.075,d),x,y+.06+k*.1,z,ry);});});
  [[.3,0],[-.3,0]].forEach(([dx,dz])=>{[0,1].forEach(k=>{const [x,z]=P(dx,dz);mkAdd(k?D:W,mBox(.04,.075,.42),x,y+.06+k*.1,z,ry);});});
  const [x,z]=P(0,0); mkAdd(D,mBox(.6,.03,.42),x,y+.03,z,ry);
}
// Preisschild auf Italienisch: Name und Preis, wird neu gezeichnet, wenn sich der Preis ändert
function mkTagDraw(T,k){
  const g=T.g, w=T.c.width, h=T.c.height, md=isMarketDay(S.day);
  g.fillStyle="#fbf3dc"; g.fillRect(0,0,w,h); g.strokeStyle="#6b4126"; g.lineWidth=6; g.strokeRect(3,3,w-6,h-6);
  g.fillStyle="#2b2620"; g.textAlign="center"; g.textBaseline="middle";
  let fs=44; g.font=`${fs}px "Lilita One", system-ui, sans-serif`; while(g.measureText(k).width>w-20&&fs>20){fs-=2;g.font=`${fs}px "Lilita One", system-ui, sans-serif`;}
  g.fillText(k,w/2,h*.33);
  g.fillStyle=md?"#c0392b":"#2b2620"; g.font=`54px "Lilita One", system-ui, sans-serif`; g.fillText(`${mkPrice(k)} €`,w/2,h*.72);
  T.t.needsUpdate=true;
}
function mkTag(k,x,y,z,ry){
  const c=document.createElement("canvas"); c.width=256; c.height=160;
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(.3,.19),new THREE.MeshBasicMaterial({map:t}));
  m.position.set(x,y,z); m.rotation.order="YXZ"; m.rotation.y=ry; m.rotation.x=-.35; MK.scene.add(m);
  MK.tags[k]={m,c,g:c.getContext("2d"),t}; mkTagDraw(MK.tags[k],k);
}
function mkTagsUpdate(){
  const sig=S.day+":"+Object.keys(MK.tags).map(mkPrice).join(","); if(sig===MK.tagSig)return; MK.tagSig=sig;
  Object.entries(MK.tags).forEach(([k,T])=>mkTagDraw(T,k));
}

/* ---------- Menschen ---------- */
// Figur aus einfachen Formen: Beine oder Rock, Oberkörper, Schürze, Arme (zum Winken), Kopf, Haare, Mütze, Schnurrbart
function mkPerson(o){
  const T=THREE, g=new T.Group(), M=c=>c3mat(c), skin=M(o.skin), wide=o.wide?1.18:1;
  const B=(w,h,d,c,x,y,z,p)=>{const b=new T.Mesh(mBox(w,h,d),typeof c==="object"?c:M(c));b.position.set(x,y,z);(p||g).add(b);return b;};
  const legs=[];
  if(o.skirt!=null){const sk=new T.Mesh(mCyl(.2*wide,.3*wide,.62,10),M(o.skirt));sk.position.y=.55;g.add(sk);B(.1,.26,.1,o.skin,-.08,.13,0);B(.1,.26,.1,o.skin,.08,.13,0);}
  else [-.1,.1].forEach(x=>{const L=new T.Group();L.position.set(x*wide,.84,0);g.add(L);B(.15,.8,.17,o.pants||0x3a3a40,0,-.42,0,L);B(.16,.08,.24,0x2b2620,0,-.8,.04,L);legs.push(L);});
  B(.46*wide,.56,.28*wide,o.shirt,0,1.12,0);
  B(.4*wide,.6,.02,o.apron,0,1.02,.15*wide);
  const arms=[-1,1].map(sd=>{const A=new T.Group();A.position.set(sd*(.29*wide),1.36,0);g.add(A);B(.12,.52,.13,o.shirt,0,-.24,0,A);B(.1,.1,.1,o.skin,0,-.53,0,A);return A;});
  const head=new T.Group(); head.position.set(0,1.62,0); g.add(head);
  const hd=new T.Mesh(frSphere(.15,12,8),skin); hd.scale.set(1,1.12,1); head.add(hd);
  B(.04,.04,.04,0x2b2620,-.055,.02,.14,head); B(.04,.04,.04,0x2b2620,.055,.02,.14,head);
  B(.05,.06,.05,o.skin,0,-.03,.155,head);
  const hair=new T.Mesh(frSphere(.16,12,8),M(o.hair)); hair.scale.set(1.02,.75,1.02); hair.position.set(0,.06,-.02); head.add(hair);
  if(o.bun){const b=new T.Mesh(frSphere(.08,8,6),M(o.hair));b.position.set(0,.12,-.16);head.add(b);}
  if(o.scarf){const sc=new T.Mesh(frSphere(.168,12,8),M(o.scarf));sc.scale.set(1.04,.8,1.06);sc.position.set(0,.05,-.02);head.add(sc);}
  if(o.mous)B(.14,.035,.03,o.hair,0,-.07,.15,head);
  if(o.beard)B(.2,.1,.06,o.hair,0,-.12,.11,head);
  if(o.glasses){B(.07,.045,.01,0x2b2620,-.055,.02,.155,head);B(.07,.045,.01,0x2b2620,.055,.02,.155,head);}
  if(o.cap){B(.34,.1,.34,o.cap,0,.15,0,head);B(.2,.03,.12,o.cap,0,.11,.2,head);}
  const sh=new T.Mesh(flatPlane(1,1),new T.MeshBasicMaterial({map:tex("blob"),transparent:true,depthWrite:false})); sh.position.y=.02; sh.renderOrder=-1; g.add(sh);
  g.userData.parts={head,arms,legs}; return g;
}

/* ---------- Den Platz bauen ---------- */
function mkInit(){
  if(MK.ok!==null)return MK.ok;
  try{
    if(!window.THREE)throw 0;
    const r=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});
    r.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5)); r.setClearColor(0xbfe0f0);
    r.domElement.className="loc-canvas"; MK.r=r; MK.ok=true;
  }catch(e){MK.ok=false;return false;}
  const T=THREE, sc=new T.Scene(); MK.scene=sc; sc.fog=new T.Fog(0xbfe0f0,40,90);
  MK.cam=new T.PerspectiveCamera(50,1,.1,200); MK.tgt=new T.Vector3(0,1.1,12);
  sc.add(new T.HemisphereLight(0xfff1dc,0x9a8a70,1.9));
  const sun=new T.DirectionalLight(0xffe2b8,1.5); sun.position.set(20,40,15); sc.add(sun);
  const fill=new T.DirectionalLight(0xc6d8ff,.45); fill.position.set(-20,15,-10); sc.add(fill);
  mkBuild(); mkPointers(MK.r.domElement);
  addEventListener("resize",()=>{if(MK.host&&MK.host.isConnected)mkResize();});
  addEventListener("keydown",mkKey);
  return true;
}
function mkBuild(){
  const T=THREE, rnd=seeded(31);
  // Pflaster
  const gm=new T.Mesh(flatPlane(60,60),c3mat(0xffffff,{map:PIAZZA_TEX()})); const uv=gm.geometry.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*15,uv.getY(i)*15); MK.scene.add(gm); MK.ground=gm;
  mkHouses(rnd); mkFountain(); mkBunting();
  BANCHE.forEach(b=>mkStand(b,rnd));
  // Ein paar leere Kisten und Fässer am Rand, ein Karren beim Eingang
  [[-6,-12.2],[-5.3,-12.3],[6.5,-12.1],[13.2,9.5],[-13.2,-8]].forEach(([x,z],i)=>{mkCrate(x,0,z,rnd()*.4);if(i%2)mkCrate(x,.22,z,rnd()*.4);});
  const cx=6.5,cz=11.5; [[-.7,0],[.7,0]].forEach(([dx])=>{const w=mCyl(.45,.45,.08,14);w.rotateZ(Math.PI/2);mkAdd("#6b4126",w,cx+dx,.45,cz);});
  mkAdd("#a87a44",mBox(1.3,.12,2),cx,.75,cz); mkAdd("#a87a44",mBox(.08,.3,2),cx-.62,.9,cz); mkAdd("#a87a44",mBox(.08,.3,2),cx+.62,.9,cz);
  mkAdd("#6b4126",mBox(.06,.06,1.4),cx-.3,.7,cz+1.6); mkAdd("#6b4126",mBox(.06,.06,1.4),cx+.3,.7,cz+1.6);
  mkStuff("melone",cx-.3,.68,cz-.4,0,rnd); mkStuff("patate",cx+.3,.68,cz+.4,0,rnd);
  // Alles Gesammelte zu Meshes
  Object.entries(MK.batch).forEach(([k,geos])=>{const o=new T.Mesh(c3merge(geos),k[0]==="#"?c3mat(new T.Color(k)):c3mat(0xff00ff));MK.scene.add(o);});
  MK.batch={};
  // Leute auf dem Platz: drei schlendern um den Brunnen, Tauben picken
  [[{skin:0xe8b48e,shirt:0xd8402f,apron:0xd8402f,hair:0x2a2420,skirt:0x2f4a7a},4.6,.0,.32],
   [{skin:0xc98e64,shirt:0x3a7ab8,apron:0x3a7ab8,hair:0x2a2420,pants:0xc9b48a},5.4,2.2,-.26],
   [{skin:0xd9a07a,shirt:0xf3eee2,apron:0x8a5a3a,hair:0xd8d8d4,skirt:0x5a3a2a,scarf:0x2f4a7a},4,4.1,.22]].forEach(([o,R,p,v])=>{
    const f=mkPerson(o); MK.scene.add(f); const P=f.userData.parts;
    MK.anim.push(t=>{const a=p+t*v/R*1.6; f.position.set(MK_FOUNT.x+Math.cos(a)*R,0,MK_FOUNT.z+Math.sin(a)*R*.8); f.rotation.y=-a+(v>0?Math.PI:0);
      P.legs.forEach((L,i)=>L.rotation.x=Math.sin(t*6+i*Math.PI)*.4); P.arms.forEach((A,i)=>A.rotation.x=Math.sin(t*6+i*Math.PI+Math.PI)*.3);});});
  for(let i=0;i<5;i++){const d=new T.Group(), c=c3mat(i%2?0x8a8f96:0x6f747c);
    const b=new T.Mesh(frSphere(.09,8,6),c); b.scale.set(1.4,1,1); b.position.y=.1; d.add(b);
    const h=new T.Mesh(frSphere(.05,8,6),c); h.position.set(.11,.17,0); d.add(h);
    const bx=-3+i*1.4, bz=6.2+(i%2)*.8; d.position.set(bx,0,bz); d.rotation.y=i*1.3; MK.scene.add(d);
    MK.anim.push(t=>{const k=Math.max(0,Math.sin(t*4+i*1.7));h.position.y=.17-k*.12;d.position.x=bx+Math.sin(t*.5+i)*.4;});}
  // Ziel-Ring beim Gehen
  MK.mark=new T.Mesh(new T.RingGeometry(.25,.36,24),new T.MeshBasicMaterial({color:0xf4c64f,transparent:true,opacity:.9,depthWrite:false}));
  MK.mark.rotation.x=-Math.PI/2; MK.mark.position.y=.03; MK.mark.visible=false; MK.scene.add(MK.mark);
  // Rahmen um die ausgewählte Kiste
  MK.selBox=new T.Mesh(mBox(.72,.32,.52),new T.MeshBasicMaterial({color:0xf4c64f,wireframe:true})); MK.selBox.visible=false; MK.scene.add(MK.selBox);
}
// Häuser rings um den Platz, Lücke im Süden als Eingang mit Torbogen und Schild
function mkHouses(rnd){
  const T=THREE, row=(x0,x1,fixed,ns,skip)=>{let a=x0; while(a<x1-1){const w=Math.min(x1-a,5+Math.round(rnd()*3)), m=a+w/2;
      if(!(skip&&m>skip[0]&&m<skip[1])){const h=8+Math.round(rnd()*4), col=WALL_COLS[Math.floor(rnd()*WALL_COLS.length)];
        const o=new T.Mesh(ns?wallBox(w,h,3):wallBox(3,h,w),c3mat(0xffffff,{map:facadeTex(col)}));
        o.position.set(ns?m:fixed,h/2,ns?fixed:m); MK.scene.add(o);
        mkAdd("#f3eee2",ns?mBox(w+.2,.3,3.2):mBox(3.2,.3,w+.2),ns?m:fixed,h+.15,ns?fixed:m);
        // Ladentüren unten, Balkon mit Blumen
        const n=Math.max(1,Math.floor(w/3)), face=ns?(fixed<0?1:-1):(fixed<0?1:-1);
        for(let i=0;i<n;i++){const t=-w/2+(i+.5)*w/n;
          const P=(d,o2)=>ns?[m+t,fixed+face*(1.5+d)]:[fixed+face*(1.5+d),m+t];
          const [dx,dz]=P(.02); mkAdd("#6b4126",ns?mBox(1.1,2.2,.06):mBox(.06,2.2,1.1),dx,1.1,dz);
          if(i%2===0){const [bx,bz]=P(.35); mkAdd("#2b2f2c",ns?mBox(1.6,.08,.7):mBox(.7,.08,1.6),bx,4.4,bz);
            const [rx,rz]=P(.68); mkAdd("#2b2f2c",ns?mBox(1.6,.6,.04):mBox(.04,.6,1.6),rx,4.75,rz);
            const [fx,fz]=P(.5); mkAdd(rnd()<.5?"#d8402f":"#f39ab0",ns?mBox(1.3,.18,.25):mBox(.25,.18,1.3),fx,4.55,fz);}}}
      a+=w;}};
  row(-18,18,-16,true); row(-18,18,16,true,[-3.5,3.5]); row(-16,16,-17.5,false); row(-16,16,17.5,false);
  // Torbogen am Eingang
  mkAdd("#d9c38f",mBox(1,6,1.2),-3.6,3,15.4); mkAdd("#d9c38f",mBox(1,6,1.2),3.6,3,15.4); mkAdd("#d9c38f",mBox(8.2,1.4,1.2),0,6.3,15.4);
  const s=signMesh("IL MERCATO",5,.9,"#3a9a4a","#f3eee2"); s.position.set(0,5.2,14.78); s.rotation.y=Math.PI; MK.scene.add(s);
}
function mkFountain(){
  const {x,z}=MK_FOUNT;
  mkAdd("#b8ab93",mCyl(1.9,2,.6,20),x,.3,z); mkAdd("#2f93bd",mCyl(1.7,1.7,.05,20),x,.56,z);
  mkAdd("#c9bca3",mCyl(.25,.35,1.6,10),x,1.1,z); mkAdd("#b8ab93",mCyl(.8,.4,.3,14),x,1.95,z); mkAdd("#2f93bd",mCyl(.7,.7,.04,14),x,2.09,z);
  mkAdd("#c9bca3",mCyl(.1,.14,.6,8),x,2.4,z);
  // Wasserstrahlen
  const w=new THREE.Mesh(mCyl(.04,.12,.55,8),c3mat(0xbfe8f6,{transparent:true,opacity:.7})); w.position.set(x,2.9,z); MK.scene.add(w);
  MK.anim.push(t=>{w.scale.y=1+Math.sin(t*5)*.08;});
}
// Wimpelketten quer über den Platz (rot, weiß, grün)
function mkBunting(){
  const cols=["#d8402f","#f3eee2","#3a9a4a"];
  [[[-14.5,-14.5],[14.5,14.5]],[[14.5,-14.5],[-14.5,14.5]],[[-14.5,0],[14.5,0]]].forEach(([[ax,az],[bx,bz]])=>{
    const L=Math.hypot(bx-ax,bz-az), n=Math.floor(L/.7), r=Math.atan2(bx-ax,bz-az);
    for(let i=0;i<n;i++){const k=(i+.5)/n, x=ax+(bx-ax)*k, z=az+(bz-az)*k, y=7.2-Math.sin(k*Math.PI)*1.3;
      const f=mCyl(.2,0,.36,3); f.rotateX(Math.PI); f.scale(1,1,.15); mkAdd(cols[i%3],f,x,y-.2,z,r+Math.PI/2);}
    // Leine
    const seg=12; for(let i=0;i<seg;i++){const k0=i/seg,k1=(i+1)/seg, x0=ax+(bx-ax)*k0, z0=az+(bz-az)*k0, x1=ax+(bx-ax)*k1, z1=az+(bz-az)*k1;
      const y0=7.2-Math.sin(k0*Math.PI)*1.3, y1=7.2-Math.sin(k1*Math.PI)*1.3, l=Math.hypot(x1-x0,y1-y0,z1-z0);
      mkAdd("#2b2620",mBox(.02,.02,l),(x0+x1)/2,(y0+y1)/2,(z0+z1)/2,r,Math.atan2(y0-y1,Math.hypot(x1-x0,z1-z0)));}
  });
}
// Ein Stand: Theke mit Tuch, Kisten in ein oder zwei Reihen, Preisschilder, Markise auf vier Stangen, Schild, Händler
function mkStand(b,rnd){
  const st=MK_STANDS[b.id]; if(!st)return; const T=THREE, L=mkLocal(st), w=st.w, n=b.ing.length;
  const rows=n>5?2:1, per=Math.ceil(n/rows), sp=Math.min(.74,(w-.3)/per);
  // Theke
  L.add("#8a5a36",mBox(w,.85,1.4),0,.425,0); L.add(st.cols[0],mBox(w+.02,.55,.02),0,.5,.71);
  for(let i=0;i<Math.ceil(w/.6);i++)L.add(st.cols[1],mBox(.3,.12,.025),-w/2+.15+i*.6,.72,.715);
  if(rows>1)L.add("#6b4126",mBox(w-.2,.16,.62),0,.93,-.32);
  if(b.id==="pesce")L.add("#e6f2f6",mBox(w-.1,.06,1.3),0,.88,0);
  MK.crates[b.id]={};
  b.ing.forEach((k,i)=>{const r=rows>1&&i>=per?1:0, j=r?i-per:i, m=r?n-per:Math.min(n,per);
    const dx=(j-(m-1)/2)*sp, dz=rows>1?(r?-.32:.34):.1, y=.85+(r?.16:0), [cx,cz]=L.at(dx,dz);
    mkCrate(cx,y,cz,st.ry); mkStuff(k,cx,y,cz,st.ry,rnd);
    const [tx,tz]=L.at(dx,dz+(r?.24:.3)); mkTag(k,tx,y+(r?.42:.3),tz,st.ry);
    const hit=new T.Mesh(mBox(.7,.55,.6),new T.MeshBasicMaterial({visible:false})); hit.position.set(cx,y+.25,cz); hit.rotation.y=st.ry;
    hit.userData={k,bank:b.id}; MK.scene.add(hit); MK.picks.push(hit); MK.crates[b.id][k]={x:cx,y,z:cz};});
  // Stangen, Markise, Schild
  [[-w/2,-1.1],[w/2,-1.1],[-w/2,1],[w/2,1]].forEach(([dx,dz])=>L.add("#6b4126",mBox(.1,dz>0?2.35:2.75,.1),dx,dz>0?1.17:1.37,dz));
  const aw=new T.Mesh(mBox(w+.5,.06,2.7),c3mat(0xffffff,{map:awningTex(st.cols[0],st.cols[1])}));
  const [ax,az]=L.at(0,0); aw.position.set(ax,2.58,az); aw.rotation.order="YXZ"; aw.rotation.y=st.ry; aw.rotation.x=.16; MK.scene.add(aw);
  // Volant vorn an der Markise
  for(let i=0;i<Math.round((w+.5)/.25);i++){const [vx,vz]=L.at(-(w+.5)/2+.125+i*.25,1.36);mkAdd(i%2?st.cols[1]:st.cols[0],mBox(.25,.2,.02),vx,2.28,vz,st.ry);}
  const s=signMesh(st.sign,Math.min(w*.8,3.6),.5,st.cols[0],st.cols[1]); const [sx,sz]=L.at(0,1.4); s.position.set(sx,2.62,sz); s.rotation.y=st.ry; MK.scene.add(s);
  // Hinten: gestapelte Kisten, beim Alimentari ein Regal mit Flaschen und Gläsern, beim Salumiere hängende Salami
  [[-w/2+.5,-1.6],[w/2-.5,-1.6]].forEach(([dx,dz],i)=>{const [cx,cz]=L.at(dx,dz);mkCrate(cx,0,cz,st.ry+.1);mkCrate(cx,.22,cz,st.ry-.1);if(i)mkCrate(cx,.44,cz,st.ry);});
  if(b.id==="alimentari"){L.add("#6b4126",mBox(w-1.6,1.9,.35),0,.95,-1.75);
    for(let r=0;r<3;r++)for(let i=0;i<7;i++){const dx=-(w-1.9)/2+i*(w-1.9)/6;L.add(r===1?"#7d8f4a":r?"#3f6b2a":"#d6b532",r===1?mCyl(.06,.06,.14,8):mCyl(.05,.05,.26,8),dx,.45+r*.55,-1.55);}}
  if(b.id==="salumi")for(let i=0;i<6;i++){const dx=-w/2+.6+i*(w-1.2)/5;L.add("#8a1f22",mCyl(.05,.06,.4,8),dx,2.05,-.9);L.add("#f3eee2",mBox(.01,.2,.01),dx,2.35,-.9);}
  if(b.id==="pesce"){const [lx,lz]=L.at(0,-1.3); const net=new T.Mesh(mBox(.9,.6,.02),c3mat(0x2f78c4)); net.position.set(lx,2,lz); net.rotation.y=st.ry; MK.scene.add(net);}
  // Händlerin oder Händler hinter der Theke
  const f=mkPerson(st.who), [fx,fz]=L.at(0,-1); f.position.set(fx,0,fz); f.rotation.y=st.ry; MK.scene.add(f);
  const P=f.userData.parts; st.fig=f; st.wave=0;
  MK.anim.push((t,dt)=>{P.head.rotation.y=Math.sin(t*.7+st.x)*.3; st.wave=Math.max(0,st.wave-dt);
    P.arms[1].rotation.z=st.wave>0?2.6+Math.sin(t*10)*.35:Math.sin(t*1.3+st.z)*.05; P.arms[0].rotation.x=Math.sin(t*1.1+st.x)*.1;});
  // unsichtbare Tippfläche über dem ganzen Stand
  const hit=new T.Mesh(mBox(w+.6,3,3.2),new T.MeshBasicMaterial({visible:false})); const [hx,hz]=L.at(0,-.3);
  hit.position.set(hx,1.5,hz); hit.rotation.y=st.ry; hit.userData={bank:b.id}; MK.scene.add(hit); MK.picks.push(hit);
}

/* ---------- Gehen ---------- */
// Punkt vor dem Stand, an dem man steht, um einzukaufen
function mkFront(id){const st=MK_STANDS[id], [x,z]=mkLocal(st).at(0,2.3);return {x,z,th:st.ry};}
// Nicht durch Stände, Brunnen und Häuser laufen
function mkCollide(p){
  p.x=Math.max(MK_BOUND.x0,Math.min(MK_BOUND.x1,p.x)); p.z=Math.max(MK_BOUND.z0,Math.min(MK_BOUND.z1,p.z));
  const fx=p.x-MK_FOUNT.x, fz=p.z-MK_FOUNT.z, fd=Math.hypot(fx,fz); if(fd<MK_FOUNT.r){const k=MK_FOUNT.r/(fd||1);p.x=MK_FOUNT.x+fx*k;p.z=MK_FOUNT.z+fz*k;}
  Object.values(MK_STANDS).forEach(st=>{const c=Math.cos(st.ry), s=Math.sin(st.ry), dx=p.x-st.x, dz=p.z-st.z;
    const lx=dx*c-dz*s, lz=dx*s+dz*c, hw=st.w/2+.4, z0=-2.3, z1=1.2;
    if(Math.abs(lx)<hw&&lz>z0&&lz<z1){const pen=[hw-lx,lx+hw,z1-lz,lz-z0], m=Math.min(...pen);
      let nx=lx, nz=lz; if(m===pen[0])nx=hw; else if(m===pen[1])nx=-hw; else if(m===pen[2])nz=z1; else nz=z0;
      p.x=st.x+nx*c+nz*s; p.z=st.z-nx*s+nz*c;}});
}
// Liegt der Brunnen im Weg, geht man außen herum (ein Zwischenpunkt neben dem Becken)
function mkWalkTo(x,z,th,bank){
  const p=MK.tgt, F=MK_FOUNT, dx=x-p.x, dz=z-p.z, L2=dx*dx+dz*dz||1, t=Math.max(0,Math.min(1,((F.x-p.x)*dx+(F.z-p.z)*dz)/L2));
  const cx=p.x+dx*t-F.x, cz=p.z+dz*t-F.z, d=Math.hypot(cx,cz), via=[];
  if(d<F.r+.7&&t>0&&t<1){let nx=cx, nz=cz; if(d<.01){nx=-dz;nz=dx;} const n=Math.hypot(nx,nz)||1;
    via.push({x:F.x+nx/n*(F.r+1.3),z:F.z+nz/n*(F.r+1.3)});}
  MK.walk={x,z,th,bank,via,ph:bank?1.17:1.3,rad:bank?6.8:6}; MK.mark.position.set(x,.03,z); MK.mark.visible=!bank;
}
function mkGoStand(id,k){
  const f=mkFront(id); mkWalkTo(f.x,f.z,f.th,id); if(k!==undefined)MK.sel=k;
}
function mkStep(dt){
  const W=MK.walk, p=MK.tgt;
  if(W){const goal=W.via.length?W.via[0]:W, dx=goal.x-p.x, dz=goal.z-p.z, d0=Math.hypot(dx,dz), v=Math.min(d0,dt*4.2);
    if(d0>.02){p.x+=dx/d0*v;p.z+=dz/d0*v;}
    if(W.via.length&&d0<.3)W.via.shift();
    const d=W.via.length?9:Math.hypot(W.x-p.x,W.z-p.z);
    if(W.th!=null){let a=W.th-MK.th; a=Math.atan2(Math.sin(a),Math.cos(a)); MK.th+=a*Math.min(1,dt*3);}
    if(W.ph!=null){MK.ph+=(W.ph-MK.ph)*Math.min(1,dt*2.5); MK.rad+=(W.rad-MK.rad)*Math.min(1,dt*2.5);}
    const before={x:p.x,z:p.z}; mkCollide(p);
    const stuck=Math.hypot(p.x-before.x,p.z-before.z)>v*.8&&d>.3&&!W.via.length;
    if(d<.05||stuck){if(W.th==null||Math.abs(Math.atan2(Math.sin(W.th-MK.th),Math.cos(W.th-MK.th)))<.02){MK.walk=null;MK.mark.visible=false;}}}
  // Pfeiltasten / WASD am PC
  const K=MK.keys, f=(K.ArrowUp||K.w?1:0)-(K.ArrowDown||K.s?1:0), t=(K.ArrowRight||K.d?1:0)-(K.ArrowLeft||K.a?1:0);
  if(f||t){MK.walk=null;MK.mark.visible=false; MK.th-=t*dt*1.8; p.x-=Math.sin(MK.th)*f*dt*4; p.z-=Math.cos(MK.th)*f*dt*4; mkCollide(p);}
  // Am nächsten Stand: der wird unten angezeigt
  let best=null, bd=4.2; Object.keys(MK_STANDS).forEach(id=>{const F=mkFront(id), d=Math.hypot(F.x-p.x,F.z-p.z); if(d<bd){bd=d;best=id;}});
  if(best!==MK.near){MK.near=best; if(best&&(!MK.walk||MK.walk.bank===best||!MK.walk.bank))mkArrive(best);}
}
// Am Stand angekommen: Händler winkt und grüßt, unten erscheinen seine Kisten
function mkArrive(id){
  const B=BANCHE.find(b=>b.id===id); if(!B)return; MK_STANDS[id].wave=1.6;
  const neu=mkTab!==id; if(neu){mkTab=id; if(MK.sel&&!B.ing.includes(MK.sel))MK.sel=null; mkMsg="";}
  MK.shown=id; render(); if(neu&&S.sound)speak(B.say[0],B.who);
}
function mkKey(e){
  if(screen!=="mercato"||!MK.host||!MK.host.isConnected)return;
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d"].includes(e.key)&&!/INPUT|TEXTAREA/.test((e.target||{}).tagName||"")){
    MK.keys[e.key]=e.type==="keydown"; e.preventDefault();}
}
addEventListener("keyup",e=>{if(MK.keys[e.key])MK.keys[e.key]=false;});
// Nach dem Kauf hüpft die Kiste kurz
function mk3Hop(k){MK.hop={k,t:0};}

/* ---------- Kamera, Zeichnen ---------- */
function mkCam(){
  const c=MK.cam, t=MK.tgt; MK.ph=Math.max(.55,Math.min(1.42,MK.ph)); MK.rad=Math.max(2.2,Math.min(16,MK.rad));
  let x=t.x+MK.rad*Math.sin(MK.ph)*Math.sin(MK.th), z=t.z+MK.rad*Math.sin(MK.ph)*Math.cos(MK.th);
  x=Math.max(-15.4,Math.min(15.4,x)); z=Math.max(-13.9,Math.min(14,z));
  c.position.set(x,t.y+MK.rad*Math.cos(MK.ph),z);
  // Blick etwas vor die eigenen Füße: so steht der Stand mitten im Bild und nicht oben am Rand
  MK.ah=(MK.ah||1.8)+((MK.near&&!(MK.walk&&!MK.walk.bank)?1.8:5)-(MK.ah||1.8))*.06; const ah=MK.ah; MK.look=MK.look||new THREE.Vector3(); MK.look.set(t.x-Math.sin(MK.th)*ah,t.y+.1+(ah-1.8)*.12,t.z-Math.cos(MK.th)*ah); c.lookAt(MK.look);
}
function mkResize(){
  const h=MK.host; if(!h)return; const w=h.clientWidth||300, hh=h.clientHeight||300;
  MK.r.setSize(w,hh,false); MK.cam.aspect=w/hh; MK.cam.fov=w<hh?62:48;
  // Mitte des Bildes in die Mitte des freien Fensters (zwischen Kopfzeile und Kisten)
  const W=MK.win=winBox(h), ym=(W.y0+W.y1)/2;
  MK.cam.setViewOffset(w,hh,0,ym*hh/2,w,hh); MK.cam.updateProjectionMatrix();
}
function mkLoop(now){
  MK.raf=0; if(!MK.host||!MK.host.isConnected||screen!=="mercato")return;
  MK.raf=requestAnimationFrame(mkLoop);
  if(now-MK.last<33)return; const dt=Math.min(.1,(now-MK.last)/1000||.03); MK.last=now; MK.t+=dt;
  mkStep(dt); MK.anim.forEach(f=>f(MK.t,dt));
  if(MK.mark.visible)MK.mark.scale.setScalar(1+Math.sin(MK.t*6)*.12);
  const sel=MK.sel&&MK.crates[mkTab]&&MK.crates[mkTab][MK.sel];
  MK.selBox.visible=!!sel; if(sel){MK.selBox.position.set(sel.x,sel.y+.15,sel.z);MK.selBox.rotation.y=MK_STANDS[mkTab].ry;}
  if(MK.hop){MK.hop.t+=dt; const c=MK.crates[mkTab]&&MK.crates[mkTab][MK.hop.k]; if(c&&MK.hop.t<.6){MK.selBox.visible=true;MK.selBox.position.set(c.x,c.y+.15+Math.sin(MK.hop.t/.6*Math.PI)*.35,c.z);} else MK.hop=null;}
  mkCam(); MK.r.render(MK.scene,MK.cam);
}
function mkMount(host){
  MK.host=host; if(!host||!mkInit())return false;
  host.prepend(MK.r.domElement); mkTagsUpdate(); mkResize();
  if(!MK.placed){MK.placed=true; MK.tgt.set(0,1.1,12.5); MK.th=0; MK.near=null; mkGoStand(mkTab);}
  else if(MK.shown!==mkTab&&!MK.walk&&MK.near!==mkTab)mkGoStand(mkTab);
  MK.shown=mkTab;
  mkCam(); MK.r.render(MK.scene,MK.cam);
  if(!MK.raf){MK.last=0;MK.raf=requestAnimationFrame(mkLoop);}
  return true;
}
// Beim Betreten des Markts: wieder am Eingang anfangen
function mk3Enter(){MK.placed=false; MK.sel=null; MK.walk=null;}

/* ---------- Finger ---------- */
function mkPointers(el){
  const pinchNow=()=>{const [a,b]=[...MK.ptrs.values()];return {d:Math.max(20,Math.hypot(a.x-b.x,a.y-b.y))};};
  el.addEventListener("pointerdown",e=>{el.setPointerCapture(e.pointerId);MK.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(MK.ptrs.size===2){MK.drag=null;MK.pinch=pinchNow();return;} MK.drag={x0:e.clientX,y0:e.clientY,moved:false};});
  el.addEventListener("pointermove",e=>{
    const p=MK.ptrs.get(e.pointerId); if(!p)return; const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY;
    if(MK.ptrs.size>=2&&MK.pinch){const n=pinchNow(); MK.rad*=MK.pinch.d/n.d; MK.pinch=n; if(MK.walk)MK.walk.ph=null; return;}
    const D=MK.drag; if(!D)return; if(!D.moved&&Math.hypot(e.clientX-D.x0,e.clientY-D.y0)<9)return;
    D.moved=true; MK.th-=dx*.006; MK.ph-=dy*.005; if(MK.walk){MK.walk.th=null;MK.walk.ph=null;}
  });
  const up=e=>{MK.ptrs.delete(e.pointerId); if(MK.ptrs.size<2)MK.pinch=null;
    const D=MK.drag; MK.drag=null; if(!D||D.moved||MK.ptrs.size)return;
    const r=el.getBoundingClientRect(), rc=new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),MK.cam);
    const hits=rc.intersectObjects(MK.picks,false), crate=hits.find(h=>h.object.userData.k), stand=hits[0];
    if(crate)return mkTapCrate(crate.object.userData.k,crate.object.userData.bank);
    if(stand)return mkTapStand(stand.object.userData.bank);
    const g=rc.intersectObject(MK.ground,false)[0]; if(!g)return;
    const p={x:g.point.x,z:g.point.z}; mkCollide(p); mkWalkTo(p.x,p.z,null,null); sfx("select");};
  el.addEventListener("pointerup",up); el.addEventListener("pointercancel",up);
  el.addEventListener("wheel",e=>{e.preventDefault();MK.rad*=e.deltaY>0?1.1:.9;},{passive:false});
}
function mkTapStand(id){sfx("select"); mkGoStand(id); if(MK.near===id)mkArrive(id);}
// Kiste antippen: hingehen, Kiste markieren, das Wort hören; unten springt die Karte ins Bild
function mkTapCrate(k,id){
  MK.sel=k; sfx("select"); mkGoStand(id); speak(k,BANCHE.find(b=>b.id===id).who);
  if(mkTab!==id&&MK.near===id)mkArrive(id); else render();
  setTimeout(()=>{const c=document.querySelector(`.mk3 .mk-card[data-k="${k}"]`); if(c&&c.scrollIntoView)c.scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"});},60);
}

/* ---------- Bildschirm ---------- */
// Kleine Karte für die Leiste unten: Kiste, Name, Vorrat, Kaufen (1 Kiste = KISTE Portionen)
function mkCard3(k){
  const n=stockOf(k), p=mkPrice(k), neu=!hasIng(k);
  return `<div class="card mk-card${neu?" neu":""}${n<4&&!neu?" low":""}${MK.sel===k?" sel":""}" data-k="${k}">${kisteImg(k)}<b>${k}</b><small>${esc(ING[k][0])}</small>
    <span class="mk-stock">${neu?"neu":`Vorrat <b>${n}</b>`}</span>
    <button class="buy" data-act="mkbuy" data-k="${k}" ${S.coins<p?"disabled":""} aria-label="Eine Kiste ${esc(ING[k][0])} für ${p} Euro">+${KISTE} · ${p} €</button></div>`;
}
function rMercato3D(){
  const B=BANCHE.find(b=>b.id===mkTab)||BANCHE[0], md=isMarketDay(S.day), list=mkList(), cost=mkListCost(), kisten=list.reduce((a,x)=>a+x.n,0);
  $("#screen").innerHTML=`${head("Il Mercato",md?`Markttag: alles ${MK_RABATT*100} % günstiger`:"Boden antippen: gehen · Stand oder Kiste: kaufen")}
    <div class="map city full3d mk3d" id="mk3d"></div>
    <div class="win3d"></div>
    <div class="mk3">
      <div class="mk-tabs" role="tablist" aria-label="Zu welchem Stand?">${BANCHE.map(b=>`<button class="chip${b===B?" on":""}" role="tab" aria-selected="${b===B}" data-act="mkbank" data-b="${b.id}"><span aria-hidden="true">${b.ic}</span> ${esc(b.it)}</button>`).join("")}</div>
      <div class="bubble mk-say"><div class="who">${esc(B.who)} <span class="mk-kasse">Kasse <b>${S.coins} €</b></span></div><div class="it">${wordsHTML(B.say[0],true)}</div><div class="tr">${esc(B.say[1])}</div>${mkMsg?`<b class="mk-msg">${esc(mkMsg)}</b>`:""}</div>
      <div class="cards mk-list">${B.ing.map(mkCard3).join("")}</div>
      <button class="big mk-fill" data-act="mkfill" ${!kisten||S.coins<Math.min(...list.map(x=>mkPrice(x.k)))?"disabled":""}>${kisten?"Vorrat auffüllen":"Vorrat reicht"}<small>${kisten?`${kisten} ${kisten===1?"Kiste":"Kisten"} von allen Ständen · ${cost} €`:`genug für etwa ${dayPizze()} Pizzen`}</small></button>
    </div>`;
  if(!mkMount($("#mk3d")))return rMercato2D();
}
