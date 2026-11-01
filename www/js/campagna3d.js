/* La campagna in 3D: das Land am Hang des Vesuvs, außerhalb der Stadt (three.js, gebaut wie stadt3d.js).
   Drei Orte: La Masseria (Bauernhof unten im Tal), das Haus von Don Vincenzo (einsam oben am Berg, mit Garten)
   und La Vigna (sein Weinberg auf Terrassen, mit Cantina). Der Weinberg ist zu, bis Don Vincenzo dein Freund ist
   (5 Herzen, siehe Bauernhof-Konzept). Noch ohne Spielinhalt: antippen zeigt, wer dort wohnt und was kommt.
   Gleiche Teile werden wie in der Stadt zu wenigen Meshes zusammengelegt. Meter: x nach Osten, z nach Süden, y nach oben. */
const K3={ok:null,r:null,scene:null,cam:null,host:null,tgt:null,th:.3,ph:.95,rad:90,fitted:false,
  ptrs:new Map(),drag:null,pinch:null,raf:0,last:0,t:0,picks:[],batch:{},anim:[],smoke:[],gate:null,gateOpen:null,msg:null,
  roofs:{},inside:null,fly:null,outside:null};
// Orte: x, z und Höhe des Schilds über dem Boden
const LAND_SPOTS={masseria:[2,0,9],vincenzo:[-30,-46,8],vigna:[30,-50,7.5]};
const LAND_PLACES=[
  {id:"masseria",it:"La Masseria",de:"Bauernhof"},
  {id:"vincenzo",it:"Don Vincenzo",de:"das Haus am Berg"},
  {id:"vigna",it:"La Vigna",de:"Weinberg"}
];
// Weinberg offen? Erst wenn Don Vincenzo dein Freund ist (5 Herzen). Das Feld kommt mit dem Spielinhalt.
const vignaOpen=()=>((S.amici&&S.amici.vincenzo)||0)>=5;
// Was man beim Antippen hört und liest [Italienisch, Deutsch]
const LAND_SAY={
  masseria:{who:"Nonna Pina",lines:[["Benvenuto alla masseria! Qui crescono pomodori, basilico e zucchine.","Willkommen auf dem Bauernhof! Hier wachsen Tomaten, Basilikum und Zucchini."],
    ["Guarda le mucche! E le galline fanno le uova ogni mattina.","Schau dir die Kühe an! Und die Hühner legen jeden Morgen Eier."]],note:"Bald: Beete anlegen, gießen, ernten, Tiere füttern."},
  vincenzo:{who:"Don Vincenzo",lines:[["Ancora tu?! Che vuoi?","Schon wieder du?! Was willst du?"],
    ["Vattene! Questa è proprietà privata.","Hau ab! Das ist Privatbesitz."],
    ["Mmh… va bene, siediti. Ma solo cinque minuti!","Mmh … na gut, setz dich. Aber nur fünf Minuten!"]],note:"Bald: Freundschaft mit 5 Herzen und fünf Geschichten von früher."},
  vigna:{who:"Don Vincenzo",lines:[["La vigna è chiusa. Non è per te… non ancora.","Der Weinberg ist zu. Er ist nicht für dich … noch nicht."]],
    open:[["La vigna era di Teresa. Adesso è anche tua.","Der Weinberg gehörte Teresa. Jetzt gehört er auch dir."]],note:"Öffnet sich, wenn Don Vincenzo dein Freund ist."}
};

/* ---------- Gelände: Tal unten, Hang nach Norden zum Vesuv ---------- */
const sstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function landRaw(x,z){
  const slope=Math.max(0,-z-6)*.2, waves=1.3*Math.sin(x*.07+1)*Math.cos(z*.06)*sstep(-6,-30,z);
  return slope+waves+.25*Math.sin(x*.3)*Math.sin(z*.25);
}
// Ebene Flächen für Hof, Haus und Weinberg-Terrassen
function landH(x,z){
  let h=landRaw(x,z);
  const flat=(cx,cz,r,y)=>{const k=1-sstep(r*.6,r,Math.hypot(x-cx,z-cz));h=h*(1-k)+y*k;};
  flat(1,2,24,0);
  flat(-30,-46,11,landRaw(-30,-46));
  // Weinberg: Stufen von 1,6 m Höhe
  if(x>16&&x<46&&z<-34&&z>-66){const k=sstep(16,19,x)*(1-sstep(43,46,x))*sstep(-66,-63,z)*(1-sstep(-37,-34,z));h=h*(1-k)+Math.round(h/1.6)*1.6*k;}
  return h;
}
const PATHS=[[[2,10],[-1,-6],[-8,-18],[-18,-30],[-26,-40]],[[-1,-6],[10,-22],[22,-34],[28,-40]],[[2,10],[4,40]]];
function pathDist(x,z){
  let d=1e9; PATHS.forEach(p=>{for(let i=0;i<p.length-1;i++){const [ax,az]=p[i],[bx,bz]=p[i+1],dx=bx-ax,dz=bz-az;
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));d=Math.min(d,Math.hypot(x-ax-t*dx,z-az-t*dz));}});
  return d;
}

/* ---------- Bausteine ---------- */
function k3add(key,geo,x,y,z,ry,rx){
  const m=new THREE.Matrix4().makeRotationY(ry||0); if(rx)m.multiply(new THREE.Matrix4().makeRotationX(rx)); m.setPosition(x,y,z);
  const g=geo.index?geo.toNonIndexed():geo.clone(); g.applyMatrix4(m); (K3.batch[key]=K3.batch[key]||[]).push(g);
}
const kBox=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const kCyl=(a,b,h,n)=>new THREE.CylinderGeometry(a,b,h,n||8);
function kMesh(geo,m,x,y,z,parent,ry){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);if(ry)o.rotation.y=ry;(parent||K3.scene).add(o);return o;}
function kGroup(id){const g=new THREE.Group();g.userData.place=id;K3.scene.add(g);K3.picks.push(g);return g;}
function kModel(name,x,z,r,parent,s){
  loadModel(name).then(m=>{if(!m)return;const o=m.clone(true);o.position.set(x,landH(x,z),z);o.rotation.y=r||0;if(s)o.scale.setScalar(s);(parent||K3.scene).add(o);K3.dirty=true;});
}
// Satteldach als dreieckiges Prisma (First entlang x), die Enden sind die Giebel
function roof(key,x,y,z,w,d,ry){
  const r=(d+.7)/1.732, g=new THREE.CylinderGeometry(r,r,w+.5,3,1,false,Math.PI/2);
  g.rotateZ(Math.PI/2); g.scale(1,.62,1); g.translate(0,.5*r*.62,0); g.rotateY(ry||0);
  k3add(key,g,x,y,z);
}
// Haus: Wände, Fenster mit grünen Läden auf der Vorderseite (nach Süden), Tür
// Mit tag ist das Haus innen hohl (vier Wände, Fliesenboden) und sein Dach ein eigenes Mesh, das beim Hineingehen verschwindet
function house(x,z,w,h,d,wallKey,ry,tag){
  const y=landH(x,z), c=Math.cos(ry||0), s=Math.sin(ry||0), at=(dx,dz)=>[x+dx*c+dz*s,z-dx*s+dz*c];
  if(tag)hollow(x,z,w,h,d,wallKey,ry,y);
  else k3add(wallKey,kBox(w,h+1,d),x,y+(h-1)/2,z,ry);
  roof(tag?"roof@"+tag:"roof",x,y+h,z,w,d,ry);
  const n=Math.max(1,Math.floor(w/3));
  for(let i=0;i<n;i++){const dx=-w/2+(i+.5)*w/n; if(n>1&&i===Math.floor(n/2))continue;
    const [px,pz]=at(dx,d/2+.03);
    k3add("glass",kBox(.8,1.1,.06),px,y+h*.62,pz,ry);
    [-.6,.6].forEach(o=>{const [qx,qz]=at(dx+o,d/2+.05);k3add("shutter",kBox(.38,1.15,.06),qx,y+h*.62,qz,ry);});}
  const [tx,tz]=at(n>1?-w/2+(Math.floor(n/2)+.5)*w/n:w/4,d/2+.04);
  k3add("door",kBox(1.1,2.1,.08),tx,y+1.05,tz,ry);
  return y;
}
// Hohle Wände (25 cm dick) von 1 m unter dem Boden bis zur Traufe, dazu ein Fliesenboden
function hollow(x,z,w,h,d,key,ry,y){
  const t=.25, H=h+1, yc=y+(h-1)/2, c=Math.cos(ry||0), s=Math.sin(ry||0), at=(dx,dz)=>[x+dx*c+dz*s,z-dx*s+dz*c];
  [[0,d/2-t/2,w,t],[0,-d/2+t/2,w,t],[w/2-t/2,0,t,d-2*t],[-w/2+t/2,0,t,d-2*t]].forEach(([dx,dz,bw,bd])=>{const [px,pz]=at(dx,dz);k3add(key,kBox(bw,H,bd),px,yc,pz,ry);});
  k3add("tiles",kBox(w-2*t,.08,d-2*t),x,y+.04,z,ry);
}
// Möbel in einem gedrehten Haus: Position relativ zur Hausmitte
function inner(x,z,ry,y){const c=Math.cos(ry||0), s=Math.sin(ry||0);
  return (key,geo,dx,dy,dz,r)=>k3add(key,geo,x+dx*c+dz*s,y+dy,z-dx*s+dz*c,(ry||0)+(r||0));}
function tree(x,z,kind,rnd){
  const y=landH(x,z);
  if(kind==="cypress"){k3add("trunk",kCyl(.15,.2,1,6),x,y+.5,z);k3add("cypress",kCyl(.1,.9,6,7),x,y+3.8,z);}
  else if(kind==="olive"){k3add("trunk",kCyl(.18,.3,1.6,6),x,y+.8,z);
    [[0,0,0],[.7,.3,.3],[-.6,.2,-.4]].forEach(([dx,dy,dz])=>k3add("olive",kCyl(1.1,.9,.9,7),x+dx,y+2+dy,z+dz,rnd()*3));}
  else {k3add("trunk",kCyl(.2,.28,2.6,6),x,y+1.3,z);k3add(rnd()<.5?"leaf":"leaf2",kCyl(2.2,1.2,1.1,8),x,y+3,z);}
  k3add("shadow",flatPlaneK(4,4),x,y+.04,z);
}
const flatPlaneK=(w,d)=>{const g=new THREE.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);return g;};
function fence(pts,key){
  for(let i=0;i<pts.length-1;i++){const [ax,az]=pts[i],[bx,bz]=pts[i+1],L=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.round(L/2)),r=Math.atan2(bx-ax,bz-az)+Math.PI/2;
    for(let k=0;k<=n;k++){const x=ax+(bx-ax)*k/n,z=az+(bz-az)*k/n;k3add(key,kBox(.12,1,.12),x,landH(x,z)+.5,z);}
    for(let k=0;k<n;k++){const x=ax+(bx-ax)*(k+.5)/n,z=az+(bz-az)*(k+.5)/n,y=landH(x,z);
      [.45,.85].forEach(h=>k3add(key,kBox(L/n,.08,.06),x,y+h,z,r));}}
}
function cow(x,z,r,g){
  const o=new THREE.Group(), y=landH(x,z), W=c3mat(0xf3eee2), B=c3mat(0x2b2620), P=c3mat(0xe7a6a0);
  kMesh(kBox(1.7,.85,.75),W,0,1.05,0,o); kMesh(kBox(.6,.5,.78),B,.2,1.2,0,o); kMesh(kBox(.5,.5,.5),W,1.05,1.35,0,o);
  kMesh(kBox(.2,.25,.4),P,1.35,1.22,0,o); kMesh(kBox(.15,.25,.08),B,1.05,1.65,.2,o); kMesh(kBox(.15,.25,.08),B,1.05,1.65,-.2,o);
  [[.6,.25],[.6,-.25],[-.6,.25],[-.6,-.25]].forEach(([dx,dz])=>kMesh(kBox(.18,.65,.18),W,dx,.33,dz,o));
  const tail=kMesh(kBox(.06,.6,.06),B,-.88,.85,0,o);
  o.position.set(x,y,z); o.rotation.y=r; g.add(o); K3.anim.push(t=>{tail.rotation.x=Math.sin(t*2.2+x)*.35;});
}
function hen(x,z,g,p){
  const o=new THREE.Group(), y=landH(x,z);
  kMesh(kBox(.36,.3,.26),c3mat(p%2?0xf3eee2:0xb5683a),0,.3,0,o); kMesh(kBox(.16,.2,.16),c3mat(p%2?0xf3eee2:0xb5683a),.2,.5,0,o);
  kMesh(kBox(.06,.1,.08),c3mat(0xd8402f),.22,.64,0,o); kMesh(kBox(.08,.05,.06),c3mat(0xe5a33a),.31,.5,0,o);
  kMesh(kBox(.04,.15,.04),c3mat(0xe5a33a),0,.08,.06,o); kMesh(kBox(.04,.15,.04),c3mat(0xe5a33a),0,.08,-.06,o);
  o.position.set(x,y,z); o.rotation.y=p*1.7; g.add(o);
  K3.anim.push(t=>{const k=Math.max(0,Math.sin(t*3+p*2));o.rotation.z=-k*.5;o.position.x=x+Math.sin(t*.4+p)*.6;});
}
// Ein Beet: Erde und Reihen mit Pflanzen (Tomaten an Stäben, Salat, Basilikum, Zucchini)
function bed(x,z,kind,w,d){
  const y=landH(x,z); w=w||3.2; d=d||1.5;
  k3add("soil",kBox(w,.3,d),x,y+.15,z);
  for(let i=0;i<4;i++){const px=x-w/2+.4+i*(w-.8)/3;
    [-d/4,d/4].forEach(dz=>{
      if(kind==="tomato"){k3add("stake",kBox(.05,1.2,.05),px,y+.9,z+dz);k3add("leaf2",kBox(.35,.7,.35),px,y+.75,z+dz);k3add("tomato",kBox(.14,.14,.14),px+.13,y+.85,z+dz+.1);k3add("tomato",kBox(.12,.12,.12),px-.1,y+.6,z+dz-.12);}
      else if(kind==="basil"){k3add("basil",kCyl(.22,.15,.3,6),px,y+.45,z+dz);}
      else if(kind==="zucchini"){k3add("leaf",kCyl(.35,.2,.25,6),px,y+.42,z+dz);k3add("zucchini",kBox(.4,.1,.1),px+.1,y+.33,z+dz+.15,.4);}
      else {k3add("leaf2",kCyl(.2,.12,.22,6),px,y+.4,z+dz);}
    });}
}

/* ---------- Die Landschaft bauen ---------- */
function landInit(){
  if(K3.ok!==null)return K3.ok;
  try{
    if(!window.THREE)throw 0;
    const r=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});
    r.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5)); r.setClearColor(0xcfe6f0);
    r.domElement.className="loc-canvas"; K3.r=r; K3.ok=true;
  }catch(e){K3.ok=false;return false;}
  const T=THREE, sc=new T.Scene(); K3.scene=sc; sc.fog=new T.Fog(0xcfe6f0,190,560);
  K3.cam=new T.PerspectiveCamera(40,1,.5,700); K3.tgt=new T.Vector3(0,4,-22);
  sc.add(new T.HemisphereLight(0xfff1dc,0x6d7a4c,1.9));
  const sun=new T.DirectionalLight(0xffe2b8,1.6); sun.position.set(50,70,40); sc.add(sun);
  const fill=new T.DirectionalLight(0xc6d8ff,.4); fill.position.set(-40,25,-10); sc.add(fill);
  buildLand(); landPointers(K3.r.domElement);
  addEventListener("resize",()=>{if(K3.host&&K3.host.isConnected)landResize();});
  return true;
}
function buildLand(){
  const T=THREE, rnd=seeded(77);
  // Gelände mit Farben je Punkt: Wiese, trockenes Gras am Hang, Feldwege
  const G=new T.PlaneGeometry(300,300,160,160); G.rotateX(-Math.PI/2);
  const p=G.attributes.position, col=new Float32Array(p.count*3), c=new T.Color(), c2=new T.Color();
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i)-60, h=landH(x,z); p.setXYZ(i,x,h,z);
    const pd=pathDist(x,z), dry=sstep(-20,-90,z);
    c.set(0x8fb35a).lerp(c2.set(0xb3a865),dry*.7); c.offsetHSL(0,0,(rnd()-.5)*.035);
    if(x>17&&x<45&&z<-35&&z>-65)c.lerp(c2.set(0x9a7a52),.35);
    if(pd<1.8)c.lerp(c2.set(0xc9a978),1-sstep(1,1.8,pd));
    col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
  G.setAttribute("color",new T.BufferAttribute(col,3)); G.computeVertexNormals();
  sc3(new T.Mesh(G,new T.MeshLambertMaterial({vertexColors:true})));
  // Der Vesuv hinten, groß, mit Krater
  const ves=new T.CylinderGeometry(14,120,70,28,4,true), vp=ves.attributes.position, vr=seeded(5);
  for(let i=0;i<vp.count;i++){const y=vp.getY(i);if(y>-34&&y<34){const k=1+(vr()-.5)*.07;vp.setXYZ(i,vp.getX(i)*k,y+(vr()-.5)*1.6,vp.getZ(i)*k);}}
  ves.computeVertexNormals();
  sc3(kMesh(ves,c3mat(0x7d6f5a,{side:T.DoubleSide}),-10,52,-230));
  const cr=new T.Mesh(new T.CircleGeometry(14,24),c3mat(0x5d5446)); cr.rotation.x=-Math.PI/2; cr.position.set(-10,86.5,-230); sc3(cr);
  // Rauchwölkchen über dem Vesuv (ganz leicht)
  buildMasseria(rnd); buildVincenzo(rnd); buildVigna(rnd);
  // Bäume verstreut: Olivenhaine im Tal, Pinien und Zypressen am Hang
  for(let i=0;i<90;i++){const x=(rnd()-.5)*200, z=40-rnd()*150;
    if(pathDist(x,z)<4||Math.hypot(x-1,z-2)<22||Math.hypot(x+30,z+46)<12||(x>12&&x<50&&z<-30&&z>-70))continue;
    tree(x,z,z>-20?(rnd()<.6?"olive":"pine"):(rnd()<.5?"cypress":"pine"),rnd);}
  // Steinmauern an den Feldern
  [[[-60,22],[-24,20]],[[26,22],[70,26]]].forEach(([[ax,az],[bx,bz]])=>{const n=Math.round(Math.hypot(bx-ax,bz-az)/2);
    for(let k=0;k<n;k++){const x=ax+(bx-ax)*(k+.5)/n,z=az+(bz-az)*(k+.5)/n;k3add("stone",kBox(2.05,.7,.6),x,landH(x,z)+.3,z,Math.atan2(bx-ax,bz-az)+Math.PI/2);}});
  // Alles Gesammelte zu Meshes
  const M={roof:c3mat(0xc4673f),gable:c3mat(0xb0583a),glass:c3mat(0x34424a),shutter:c3mat(0x3e6b4b),door:c3mat(0x6b4126),
    wallW:c3mat(0xf4ead2),wallY:c3mat(0xf0d39a),wallB:c3mat(0xa5553a),stone:c3mat(0xb8ab93),stoneD:c3mat(0x9a8e78),
    trunk:c3mat(0x7a5a3a),leaf:c3mat(0x5f9147),leaf2:c3mat(0x7aa65a),olive:c3mat(0x8a9a6a),cypress:c3mat(0x3f6b3a),
    soil:c3mat(0x6b4a2e),stake:c3mat(0xa08058),tomato:c3mat(0xd8402b),basil:c3mat(0x3f9a45),zucchini:c3mat(0x3d7a2f),
    wood:c3mat(0x8a5a36),woodD:c3mat(0x5c3a22),hay:c3mat(0xe2c25e),iron:c3mat(0x2b2f2c),grape:c3mat(0x5a2a5a),vine:c3mat(0x5f8a3a),
    smoke:c3mat(0xe9e9e4),tiles:c3mat(0xc98a5e),plaster:c3mat(0xf6efe0),cloth:c3mat(0xd8402f),linen:c3mat(0xf3eee2),
    fire:c3mat(0xffa040,{emissive:0xc0501a}),soot:c3mat(0x2b2620),copper:c3mat(0xc07a4a),bottle:c3mat(0x2f5a2f),frame:c3mat(0xc9a14a),
    photo:c3mat(0xe9dcc0),milk:c3mat(0xd9dcd8),
    shadow:new T.MeshBasicMaterial({map:tex("blob"),transparent:true,depthWrite:false})};
  Object.entries(K3.batch).forEach(([k,geos])=>{const [base,tag]=k.split("@"), o=new T.Mesh(c3merge(geos),M[base]||c3mat(0xff00ff));
    if(k==="shadow")o.renderOrder=-1; K3.scene.add(o); if(tag)(K3.roofs[tag]=K3.roofs[tag]||[]).push(o);});
  K3.batch={};
}
const sc3=o=>{K3.scene.add(o);return o;};
// La Masseria: Bauernhaus, Stall, Heuballen, Beete, Kühe und Hühner, Brunnen
function buildMasseria(rnd){
  const g=kGroup("masseria");
  house(-5,-3,11,5.4,7,"wallW",0,"masseria"); casaInside(-5,-3);
  house(9,-4,7,4.2,6,"wallB",0,"stalla"); stallaInside(9,-4);
  k3add("woodD",kBox(2.6,2.8,.1),9,landH(9,-1)+1.4,-.95);
  // Pergola vor dem Haus mit Tisch
  [[-9,1.2],[-1,1.2],[-9,3.2],[-1,3.2]].forEach(([x,z])=>k3add("wood",kBox(.14,2.6,.14),x,1.3,z));
  k3add("wood",kBox(8.4,.12,.14),-5,2.62,1.2); k3add("wood",kBox(8.4,.12,.14),-5,2.62,3.2);
  for(let x=-9;x<=-1;x+=1)k3add("leaf",kBox(.7,.12,2.2),x,2.72,2.2);
  kModel("tisch",-5,2.2,0,g);
  // Heuballen und Karren
  [[14.5,-1],[15.5,1],[14.4,1.4]].forEach(([x,z],i)=>{const h=kCyl(.7,.7,1.2,10);h.rotateZ(Math.PI/2);k3add("hay",h,x,landH(x,z)+.7+(i===2?1.2:0),z-(i===2?.8:0),.3);});
  // Brunnen
  k3add("stone",kCyl(.9,1,.9,10),3,.45,6); k3add("wood",kBox(.12,1.8,.12),2.2,1.3,6); k3add("wood",kBox(.12,1.8,.12),3.8,1.3,6);
  k3add("roof",kBox(2.2,.15,1.4),3,2.25,6);
  // Gemüsegarten: sechs Beete mit Zaun
  [["tomato",-8,9],["tomato",-4,9],["basil",0,9],["zucchini",-8,12],["salad",-4,12],["basil",0,12]].forEach(([k,x,z])=>bed(x,z,k));
  fence([[-10.2,7.2],[-10.2,14],[2.2,14],[2.2,7.2],[-3,7.2]],"wood");
  // Weide mit Kühen hinter dem Stall, Hühner auf dem Hof
  fence([[13,-8],[13,-15],[24,-15],[24,-8],[18,-8]],"wood");
  cow(16,-11,.6,g); cow(20.5,-12.5,-2.4,g);
  for(let i=0;i<5;i++)hen(5+(i%3)*1.4,1+Math.floor(i/3)*1.3,g,i);
  // Schild am Weg
  const s=signMesh("MASSERIA",3.2,.8,"#6b4126","#f6e3a6"); s.position.set(4.6,landH(4.6,9)+1.6,9.2); g.add(s);
  k3add("wood",kBox(.12,1.6,.12),4.6,landH(4.6,9)+.8,9.1);
  // unsichtbare Tippfläche über dem ganzen Hof
  kMesh(kBox(30,4,26),new THREE.MeshBasicMaterial({visible:false}),2,2,0,g);
}
// Das Haus von Don Vincenzo: klein, aus Stein, oben am Berg. Garten, Pergola mit Trauben, Bank, er selbst, seine alte Vespa
function buildVincenzo(rnd){
  const g=kGroup("vincenzo"), x=-30, z=-48, y=house(x,z,6.5,3.6,5,"stone",.25,"vincenzo");
  const ch=kBox(.7,1.8,.7); k3add("stoneD@vincenzo",ch,x+2,y+4.6,z-1); vincenzoInside(x,z,.25,y);
  for(let i=0;i<5;i++){const m=kMesh(kBox(.5,.5,.5),c3mat(0xe9e9e4,{transparent:true,opacity:.8}),x+2,y+5.5,z-1,g);K3.smoke.push({o:m,p:i/5,x:x+2,y:y+5.5,z:z-1});}
  // Pergola mit Weinlaub und Trauben (er war Winzer)
  const px=x-.5, pz=z+4.8, py=landH(px,pz);
  [[-2.6,-1],[2.6,-1],[-2.6,1.2],[2.6,1.2]].forEach(([dx,dz])=>k3add("wood",kBox(.14,2.5,.14),px+dx,py+1.25,pz+dz));
  for(let dx=-2.6;dx<=2.6;dx+=.8)k3add("vine",kBox(.7,.14,2.6),px+dx,py+2.55,pz+.1);
  for(let i=0;i<9;i++)k3add("grape",kCyl(.14,.05,.32,5),px-2.3+i*.58,py+2.3,pz-.6+(i%3)*.7);
  // Bank und Don Vincenzo davor
  k3add("wood",kBox(1.8,.1,.5),px+1,py+.5,pz+.4); k3add("wood",kBox(1.8,.6,.08),px+1,py+.8,pz+.15);
  [[.2,.6],[1.8,.6],[.2,.2],[1.8,.2]].forEach(([dx,dz])=>k3add("wood",kBox(.08,.5,.08),px+dx,py+.25,pz+dz));
  vincenzoFigure(px+.6,pz+.55,g);
  // Kleiner Garten mit Tomaten und Steinmäuerchen
  bed(x-5.5,z+2.5,"tomato",2.6,1.4); bed(x-5.5,z+5,"basil",2.6,1.4);
  [[x-7.5,z+1],[x-7.5,z+7],[x-2.8,z+7]].reduce((a,b)=>{const L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.round(L/1.2);
    for(let k=0;k<n;k++){const sx=a[0]+(b[0]-a[0])*(k+.5)/n,sz=a[1]+(b[1]-a[1])*(k+.5)/n;k3add("stone",kBox(1.25,.55,.5),sx,landH(sx,sz)+.25,sz,Math.atan2(b[0]-a[0],b[1]-a[1])+Math.PI/2);}return b;});
  // Seine alte Vespa von 1955 und ein Schild: Betreten verboten
  kModel("vespa-epoca",x+4.2,z+3.4,-.9,g);
  const s=signMesh("VIETATO ENTRARE!",2.6,.55,"#f3eee2","#b8322a"); s.position.set(x+3.2,landH(x+3.2,z+8)+1.3,z+8.05); s.rotation.y=.2; g.add(s);
  k3add("wood",kBox(.1,1.3,.1),x+3.2,landH(x+3.2,z+8)+.65,z+8);
  // Zypressen um das Haus: einsam
  [[x-6,z-4],[x+5.5,z-3.5],[x-9,z+.5],[x+7,z-1]].forEach(([tx,tz])=>tree(tx,tz,"cypress",rnd));
  kMesh(kBox(18,6,16),new THREE.MeshBasicMaterial({visible:false}),x,y+2,z+2,g);
}
// Don Vincenzo: alter Mann mit Schiebermütze (coppola), Weste, Schnurrbart und Stock. Wackelt grantig mit dem Kopf.
function vincenzoFigure(x,z,g){
  const o=new THREE.Group(), y=landH(x,z), skin=c3mat(0xd9a07a);
  kMesh(kBox(.34,.5,.34),c3mat(0x4a4038),-.05,.75,.18,o); // Beine (sitzend)
  kMesh(kBox(.36,.18,.5),c3mat(0x4a4038),0,.55,.35,o);
  kMesh(kBox(.46,.62,.32),c3mat(0xf0ebe0),0,1.1,0,o);   // Hemd
  kMesh(kBox(.5,.5,.34),c3mat(0x6b5a40),0,1.12,0,o);    // Weste
  const head=new THREE.Group(); head.position.set(0,1.62,0); o.add(head);
  kMesh(kBox(.32,.34,.3),skin,0,0,0,head);
  kMesh(kBox(.34,.12,.32),c3mat(0xeeeeee),0,-.02,-.02,head);   // weiße Haare an den Seiten
  kMesh(kBox(.38,.1,.4),c3mat(0x4a4a48),0,.2,.04,head);        // Mütze
  kMesh(kBox(.24,.05,.05),c3mat(0xeeeeee),0,-.08,.16,head);    // Schnurrbart
  kMesh(kBox(.22,.04,.04),c3mat(0x3a3a3a),0,.08,.16,head);     // zusammengezogene Augenbrauen
  kMesh(kBox(.12,.48,.12),c3mat(0x6b5a40),.3,1.05,.12,o); kMesh(kBox(.12,.48,.12),c3mat(0x6b5a40),-.3,1.05,.12,o);
  kMesh(kBox(.05,1,.05),c3mat(0x5c3a22),.42,.5,.35,o);         // Stock
  o.position.set(x,y,z); o.rotation.y=.2; g.add(o);
  K3.anim.push(t=>{head.rotation.y=Math.sin(t*.9)*.35;head.rotation.z=Math.sin(t*1.7)*.05;});
}
// La Vigna: Terrassen mit Rebzeilen, Steinmauern, Tor (zu, bis Don Vincenzo dir vertraut), Cantina im Hang mit Fässern und Presse
function buildVigna(rnd){
  const g=kGroup("vigna");
  for(let z=-38;z>-64;z-=3.2){
    for(let x=19;x<43;x+=.5){const h=landH(x,z);
      if(Math.round(x*2)%4===0)k3add("wood",kBox(.08,1.5,.08),x,h+.75,z);
      k3add("vine",kBox(.52,.9,.45),x,h+1,z);
      if(rnd()<.35){const s=rnd()<.5?1:-1;k3add("grape",kCyl(.12,.04,.28,5),x,h+.6,z+s*.26);}}
    const wz=z+1.6;
    for(let x=18.5;x<44;x+=2)k3add("stone",kBox(2.05,1,.5),x+1,landH(x+1,wz)-.2,wz);
  }
  // Tor mit Steinpfeilern am Weg
  const gx=27, gz=-36, gy=landH(gx,gz);
  [-2,2].forEach(dx=>{k3add("stone",kBox(.8,2.6,.8),gx+dx,gy+1.3,gz);k3add("stoneD",kBox(1,.25,1),gx+dx,gy+2.7,gz);});
  const gate=new THREE.Group(); gate.position.set(gx-1.6,gy,gz); g.add(gate);
  const im=c3mat(0x2b2f2c);
  for(let i=0;i<7;i++)kMesh(kBox(.06,1.9,.06),im,.25+i*.45,1.05,0,gate);
  kMesh(kBox(3.1,.08,.08),im,1.55,.3,0,gate); kMesh(kBox(3.1,.08,.08),im,1.55,1.95,0,gate);
  const lock=kMesh(kBox(.28,.32,.14),c3mat(0xd9a93a,{emissive:0x4a3410}),3.05,1.1,.1,gate);
  K3.gate={o:gate,lock};
  const s=signMesh("LA VIGNA",2.6,.7,"#5a2a5a","#f6e3a6"); s.position.set(gx,gy+3.3,gz+.05); g.add(s);
  // Cantina: Steinfassade in den Hang gebaut, Holztür mit Bogen, Fässer und Weinpresse davor
  const cx=38, cz=-66, cy=landH(cx,cz+2);
  hollow(cx,cz-.5,8,3.7,3,"stone",0,cy); cantinaInside(cx,cz-.5,cy);
  k3add("woodD",kBox(2,2.6,.1),cx,cy+1.3,cz+1.02); k3add("stoneD",kBox(2.6,.4,.2),cx,cy+2.8,cz+1.05);
  k3add("roof@cantina",kBox(8.4,.25,3.4),cx,cy+3.8,cz-.5);
  kModel("botti",cx-2.8,cz+2.2,0,g); kModel("botti",cx+2.8,cz+2.4,.4,g);
  // Weinpresse (il torchio): Bottich, Spindel, Balken
  const tx=cx+1.2, tz=cz+3.4, ty=landH(tx,tz);
  k3add("wood",kCyl(.7,.75,.9,12),tx,ty+.45,tz); k3add("grape",kCyl(.6,.6,.1,12),tx,ty+.88,tz);
  k3add("iron",kCyl(.08,.08,1.6,6),tx,ty+1.5,tz); k3add("woodD",kBox(1.6,.12,.12),tx,ty+2.1,tz);
  const cs=signMesh("CANTINA",2.2,.5,"#2b2620","#e9c46a"); cs.position.set(cx,cy+3.3,cz+1.04); g.add(cs);
  kMesh(kBox(30,5,34),new THREE.MeshBasicMaterial({visible:false}),31,landH(31,-50)+2,-50,g);
}
// Tor auf oder zu, je nach Freundschaft
function landGate(){
  const G=K3.gate; if(!G)return; const open=vignaOpen(); if(K3.gateOpen===open)return;
  K3.gateOpen=open; G.o.rotation.y=open?-1.6:0; G.lock.visible=!open; K3.dirty=true;
}

/* ---------- Innenräume ---------- */
// Bauernhaus: links Küche mit Kamin, langem Tisch und Kupfertöpfen, rechts Schlafzimmer, dazwischen eine Wand mit Durchgang
function casaInside(x,z){
  const y=landH(x,z), I=inner(x,z,0,y);
  I("plaster",kBox(.2,5,2.4),1,2.5,-1.9); I("plaster",kBox(.2,5,2.4),1,2.5,1.9);
  I("stone",kBox(2.4,2.2,.8),-3,1.1,-2.9); I("soot",kBox(1.4,1.1,.2),-3,.7,-2.5); I("fire",kBox(.8,.3,.3),-3,.3,-2.4);
  I("stone",kBox(1.2,3,.6),-3,3.2,-3); // Rauchfang
  I("wood",kBox(3.2,.12,1),-2.6,.85,.2); [[-1.4,-.3],[1.4,-.3],[-1.4,.7],[1.4,.7]].forEach(([dx,dz])=>I("woodD",kBox(.1,.8,.1),-2.6+dx,.4,.2+dz));
  I("cloth",kBox(3.3,.02,1.1),-2.6,.92,.2);
  [-.9,1.3].forEach(dz=>I("wood",kBox(3,.1,.35),-2.6,.48,.2+dz*.9));
  [-1.2,-.2,.8].forEach((dx,i)=>I(i===1?"tomato":"basil",kBox(.25,.2,.25),-2.6+dx,1,.2));
  I("wood",kBox(.5,2.2,1.6),-4.9,1.1,1.6); [.6,1.2,1.8].forEach(h=>[-.4,0,.4].forEach(dz=>I("copper",kCyl(.14,.12,.22,8),-4.75,h+.12,1.6+dz)));
  I("woodD",kBox(2,.5,1.4),3.2,.3,-1.6); I("linen",kBox(1.9,.18,1.3),3.2,.62,-1.6); I("cloth",kBox(1.9,.06,.8),3.2,.74,-1.3); I("woodD",kBox(2,1.1,.12),3.2,.6,-2.3);
  I("wood",kBox(1,1.6,.5),4.4,.8,2.4); I("tiles",kBox(1.6,.02,1),2.4,.1,1); // Kommode, Teppich
}
// Stall: Boxen mit Heu, Milchkannen, Leiter zum Heuboden
function stallaInside(x,z){
  const y=landH(x,z), I=inner(x,z,0,y);
  [-1.6,.4].forEach(dx=>I("wood",kBox(.12,1.2,2.6),dx,.6,-1.4));
  I("wood",kBox(5.6,1.2,.12),-.6,.6,-.1);
  [[-2.6,-1.6],[-.6,-1.6],[1.6,-1.8]].forEach(([dx,dz])=>I("hay",kBox(1.2,.5,1.4),dx,.25,dz));
  [[2.4,1.6],[2.8,1.2],[2.1,1.1]].forEach(([dx,dz])=>{I("milk",kCyl(.22,.25,.7,10),dx,.35,dz);I("milk",kCyl(.1,.1,.15,8),dx,.78,dz);});
  [-.15,.15].forEach(dx=>I("wood",kBox(.06,3.4,.06),-2.6+dx,1.7,2.2)); for(let k=0;k<6;k++)I("wood",kBox(.36,.05,.05),-2.6,.4+k*.55,2.2);
  I("hay",kBox(6.4,.15,2.2),0,3.2,-1.6); I("hay",kBox(2,.8,1.6),-1.6,3.7,-1.8);
}
// Haus von Don Vincenzo: Kamin, Sessel, Tisch mit Weinflasche, Foto von Teresa, schmales Bett, Regal mit Flaschen
function vincenzoInside(x,z,ry,y){
  const I=inner(x,z,ry,y);
  I("stoneD",kBox(1.8,1.8,.6),-1.6,.9,-2.05); I("soot",kBox(1,.8,.2),-1.6,.5,-1.7); I("fire",kBox(.5,.2,.2),-1.6,.2,-1.6);
  I("cloth",kBox(.8,.45,.8),-1.4,.25,-.6,.4); I("cloth",kBox(.8,.8,.2),-1.6,.6,-.95,.4); I("cloth",kBox(.15,.6,.8),-1.85,.5,-.5,.4); I("cloth",kBox(.15,.6,.8),-1,.5,-.7,.4);
  I("woodD",kBox(1,.06,.7),.1,.75,-.3); I("woodD",kBox(.08,.72,.08),.1,.37,-.3);
  I("bottle",kCyl(.06,.07,.32,8),.25,.95,-.3); I("bottle",kCyl(.025,.025,.1,6),.25,1.16,-.3); I("linen",kCyl(.05,.04,.1,8),-.1,.83,-.2);
  I("frame",kBox(.6,.75,.04),1.9,1.9,-2.2); I("photo",kBox(.46,.6,.02),1.9,1.9,-2.17);
  I("woodD",kBox(.9,.4,2),2.4,.22,.6); I("linen",kBox(.85,.14,1.9),2.4,.48,.6); I("cloth",kBox(.86,.05,1.1),2.4,.57,.9);
  I("wood",kBox(.4,1.8,1.4),-2.8,.9,1); [.5,1.1,1.6].forEach(h=>[-.45,-.15,.15,.45].forEach(dz=>I("bottle",kCyl(.05,.06,.3,6),-2.7,h+.15,1+dz)));
}
// Cantina: Fässer in Reihen, Weinregal mit Flaschen, Tisch zum Probieren
function cantinaInside(x,z,y){
  const I=inner(x,z,0,y);
  for(let i=0;i<5;i++){const g=kCyl(.55,.55,1.1,12);g.rotateX(Math.PI/2);I("wood",g,-3+i*1.25,.6,-.7);I("iron",(()=>{const r=kCyl(.57,.57,.08,12);r.rotateX(Math.PI/2);return r;})(),-3+i*1.25,.6,-.3);}
  I("woodD",kBox(1.4,1.8,.3),3,.9,.8); for(let r=0;r<4;r++)for(let k=0;k<4;k++){const b=kCyl(.05,.05,.3,6);b.rotateX(Math.PI/2);I("bottle",b,2.5+k*.32,.3+r*.42,.8);}
  I("wood",kBox(1,.08,.6),.6,.8,.8); I("woodD",kBox(.1,.8,.1),.6,.4,.8); I("bottle",kCyl(.06,.07,.3,8),.5,.99,.8);
}

/* ---------- Hineingehen und Hinausgehen ---------- */
// Wohin die Kamera beim Hineingehen fährt und welche Dächer dafür verschwinden
const LAND_VIEW={
  masseria:{x:-1,z:-3.5,rad:24,ph:.42,th:.25,roofs:["masseria","stalla"],it:"Dentro la masseria",de:"Im Bauernhaus und im Stall"},
  vincenzo:{x:-30,z:-48,rad:13,ph:.42,th:.45,roofs:["vincenzo"],it:"A casa di Don Vincenzo",de:"Bei Don Vincenzo zu Hause"},
  vigna:{x:38,z:-66.5,rad:12,ph:.36,th:.1,roofs:["cantina"],it:"Nella cantina",de:"Im Weinkeller und zwischen den Reben"}
};
const canEnter=id=>!!LAND_VIEW[id]&&(id!=="vigna"||vignaOpen());
function landRoofs(){Object.entries(K3.roofs).forEach(([t,ms])=>{const off=K3.inside&&LAND_VIEW[K3.inside].roofs.includes(t);ms.forEach(m=>m.visible=!off);});}
function landFly(to){
  K3.fly={t:0,a:{x:K3.tgt.x,z:K3.tgt.z,rad:K3.rad,ph:K3.ph,th:K3.th},b:to};
}
function landEnter(id){
  if(!canEnter(id))return;
  if(!K3.inside)K3.outside={x:K3.tgt.x,z:K3.tgt.z,rad:K3.rad,ph:K3.ph,th:K3.th};
  K3.inside=id; K3.msg=null; landRoofs(); sfx("door");
  const V=LAND_VIEW[id], h=K3.host, tall=h&&h.clientWidth<h.clientHeight; // hochkant: weiter weg, damit das ganze Haus ins Bild passt
  landFly(Object.assign({},V,{rad:V.rad*(tall?1.6:1)})); render();
}
function landExit(){
  K3.inside=null; landRoofs(); sfx("door"); if(K3.outside)landFly(K3.outside); render();
}
function landFlyStep(dt){
  const F=K3.fly; if(!F)return; F.t=Math.min(1,F.t+dt/1.2); const k=sstep(0,1,F.t), L=(p)=>F.a[p]+(F.b[p]-F.a[p])*k;
  K3.tgt.x=L("x"); K3.tgt.z=L("z"); K3.rad=L("rad"); K3.ph=L("ph"); K3.th=L("th"); if(F.t>=1)K3.fly=null;
}

/* ---------- Kamera, Zeichnen, Schilder ---------- */
function landCam(){
  const c=K3.cam,t=K3.tgt; K3.ph=Math.max(.35,Math.min(1.25,K3.ph)); K3.rad=Math.max(K3.inside?5:14,Math.min(K3.inside?50:220,K3.rad));
  t.x=Math.max(-60,Math.min(60,t.x)); t.z=Math.max(-75,Math.min(25,t.z)); t.y=Math.max(0,landH(t.x,t.z));
  c.position.set(t.x+K3.rad*Math.sin(K3.ph)*Math.sin(K3.th),t.y+K3.rad*Math.cos(K3.ph),t.z+K3.rad*Math.sin(K3.ph)*Math.cos(K3.th));
  c.lookAt(t);
}
const landSpot=(id,v)=>{const s=LAND_SPOTS[id];return v.set(s[0],landH(s[0],s[1])+s[2],s[1]);};
function landResize(){
  const h=K3.host; if(!h)return; const w=h.clientWidth||300, hh=h.clientHeight||300;
  K3.r.setSize(w,hh,false); K3.cam.aspect=w/hh; K3.cam.fov=w<hh?50:38; K3.cam.updateProjectionMatrix();
  // Beim ersten Mal so weit herauszoomen, dass alle drei Orte im freien Fenster zu sehen sind
  const W=K3.win=winBox(h.classList.contains("full3d")?h:null), key=w+"x"+hh+":"+W.y0.toFixed(2)+W.y1.toFixed(2);
  if(K3.fitted!==key&&!K3.inside){K3.fitted=key; K3.th=w<hh?0:.3; K3.tgt.set(0,0,-24);
    const v=new THREE.Vector3(), ids=Object.keys(LAND_SPOTS);
    const y0=W.y0+(W.y1-W.y0)*.08, y1=W.y1-(W.y1-W.y0)*.16, ym=(y0+y1)/2, yh=(y1-y0)/2;
    for(let k=0;k<3;k++){
      for(K3.rad=30;K3.rad<219;K3.rad+=2){landCam();K3.cam.updateMatrixWorld();
        if(ids.every(id=>{landSpot(id,v).project(K3.cam);return Math.abs(v.x)<.66&&Math.abs(v.y-ym)<yh;}))break;}
      let a=1e9,b=-1e9; ids.forEach(id=>{landSpot(id,v).project(K3.cam);a=Math.min(a,v.y);b=Math.max(b,v.y);});
      const dy=((a+b)/2-ym)*Math.tan(K3.cam.fov*Math.PI/360)*K3.rad/Math.cos(K3.ph);
      K3.tgt.x-=Math.sin(K3.th)*dy; K3.tgt.z-=Math.cos(K3.th)*dy;}}
}
function landPins(){
  const pins=K3.host&&K3.host.querySelectorAll(".city-pin"); if(!pins||!pins.length)return;
  const w=K3.host.clientWidth, h=K3.host.clientHeight, v=new THREE.Vector3();
  pins.forEach(el=>{landSpot(el.dataset.p,v).project(K3.cam);
    const W=K3.win||{y0:-1,y1:1}, on=v.z<1&&v.x>-1.15&&v.x<1.15&&v.y>W.y0-.02&&v.y<W.y1+.1;
    el.style.display=on?"":"none"; if(on)el.style.transform=`translate(${(v.x+1)/2*w}px,${(1-v.y)/2*h}px) translate(-50%,-100%)`;});
}
// Läuft nur, solange La campagna offen ist: Kühe, Hühner, Rauch aus dem Kamin, Don Vincenzo schüttelt den Kopf
function landLoop(now){
  K3.raf=0; if(!K3.host||!K3.host.isConnected||screen!=="campagna")return;
  K3.raf=requestAnimationFrame(landLoop);
  if(now-K3.last<33)return; const dt=Math.min(.1,(now-K3.last)/1000); K3.last=now; K3.t+=dt;
  landFlyStep(dt); K3.anim.forEach(f=>f(K3.t));
  K3.smoke.forEach(s=>{const k=(K3.t*.25+s.p)%1;s.o.position.set(s.x+k*1.2,s.y+k*3.2,s.z-k*.5);s.o.scale.setScalar(.5+k*1.6);s.o.material.opacity=.75*(1-k);});
  landCam(); K3.r.render(K3.scene,K3.cam); landPins();
}
function landMount(host){
  K3.host=host; if(!host||!landInit())return false;
  host.prepend(K3.r.domElement); landGate(); landResize(); landCam(); K3.r.render(K3.scene,K3.cam); landPins();
  if(!K3.raf){K3.last=0;K3.raf=requestAnimationFrame(landLoop);}
  return true;
}

/* ---------- Bildschirm ---------- */
function landPinsHTML(){
  return LAND_PLACES.map(p=>{const shut=p.id==="vigna"&&!vignaOpen();
    return `<button class="city-pin learn${shut?" shut":""}" data-act="lplace" data-p="${p.id}" aria-label="${p.it}, ${p.de}"><b>${shut?"🔒 ":""}${p.it}</b><small>${p.de}</small></button>`;}).join("");
}
function rCampagna(){
  const m=K3.msg, V=K3.inside&&LAND_VIEW[K3.inside];
  if(!cityCan()){$("#screen").innerHTML=`${head("La campagna","Am Vesuv")}<p class="note">3D geht auf diesem Gerät leider nicht.</p>`;return;}
  const place=id=>LAND_PLACES.find(p=>p.id===id).it;
  const bar=V?`<button class="sec" data-act="lexit">‹ Hinaus<small>zurück aufs Land</small></button>`
    :m&&canEnter(m.id)?`<button class="next" data-act="lenter" data-p="${m.id}">🚪 Hineingehen<small>${esc(place(m.id))}</small></button>`
    :m&&m.id==="vigna"?`<button class="sec" disabled>🔒 Verschlossen<small>erst als Freund von Don Vincenzo</small></button>`:"";
  $("#screen").innerHTML=`${head(V?V.it:"La campagna",V?V.de:"Am Vesuv · tippe auf einen Ort")}
    <div class="map city full3d${V?" inside":""}" id="land3d"><div class="city-pins">${V?"":landPinsHTML()}</div>
      ${m?`<div class="loc-msg land-msg"><b>${esc(m.who)}:</b> „${esc(m.it)}“<small>${esc(m.de)}</small><em>${esc(m.note)}</em></div>`
        :`<p class="loc-hint">${V?"Ein Finger dreht, zwei Finger zoomen: schau dich drinnen um.":"Ein Finger dreht, zwei Finger zoomen. Tippe auf den Bauernhof, das Haus oder den Weinberg."}</p>`}
    </div><div class="win3d"></div>${bar?`<div class="land-bar">${bar}</div>`:""}`;
  if(!landMount($("#land3d"))){$("#land3d").innerHTML=`<p class="note loc-no3d">3D geht auf diesem Gerät leider nicht.</p>`;}
}
// Ort antippen: wer dort ist, sagt etwas (Don Vincenzo meistens grantig)
function landTap(id){
  const L=LAND_SAY[id]; if(!L)return;
  const pool=id==="vigna"&&vignaOpen()?L.open:L.lines, n=K3.msg&&K3.msg.id===id?(K3.msg.n+1)%pool.length:0, [it,de]=pool[n];
  K3.msg={id,n,who:L.who,it,de,note:id==="vigna"&&vignaOpen()?"Bald: Weinlese, Keltern und Hauswein fürs Restaurant.":L.note};
  if(K3.inside&&K3.inside!==id){K3.inside=null;landRoofs();}
  sfx(id==="vigna"&&!vignaOpen()?"wrong":"select"); speak(it,L.who); render();
}
function landPointers(el){
  const pinchNow=()=>{const [a,b]=[...K3.ptrs.values()];return {d:Math.max(20,Math.hypot(a.x-b.x,a.y-b.y)),x:(a.x+b.x)/2,y:(a.y+b.y)/2};};
  el.addEventListener("pointerdown",e=>{el.setPointerCapture(e.pointerId);K3.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(K3.ptrs.size===2){K3.drag=null;K3.pinch=pinchNow();return;} K3.drag={x0:e.clientX,y0:e.clientY,moved:false};});
  el.addEventListener("pointermove",e=>{
    const p=K3.ptrs.get(e.pointerId); if(!p)return; const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY;
    if(K3.ptrs.size>=2&&K3.pinch){const n=pinchNow(),o=K3.pinch; K3.rad*=o.d/n.d;
      const s=K3.rad/500, c=Math.cos(K3.th), si=Math.sin(K3.th);
      K3.tgt.x-=(n.x-o.x)*s*c+(n.y-o.y)*s*si; K3.tgt.z-=-(n.x-o.x)*s*si+(n.y-o.y)*s*c; K3.pinch=n; return;}
    const D=K3.drag; if(!D)return; if(!D.moved&&Math.hypot(e.clientX-D.x0,e.clientY-D.y0)<9)return;
    D.moved=true; K3.th-=dx*.006; K3.ph-=dy*.005;
  });
  const up=e=>{K3.ptrs.delete(e.pointerId); if(K3.ptrs.size<2)K3.pinch=null;
    const D=K3.drag; K3.drag=null; if(!D||D.moved||K3.ptrs.size)return;
    const r=el.getBoundingClientRect(), rc=new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),K3.cam);
    const h=rc.intersectObjects(K3.picks,true)[0]; if(!h)return;
    let o=h.object; while(o&&!o.userData.place)o=o.parent; if(o)landTap(o.userData.place);};
  el.addEventListener("pointerup",up); el.addEventListener("pointercancel",up);
  el.addEventListener("wheel",e=>{e.preventDefault();K3.rad*=e.deltaY>0?1.1:.9;},{passive:false});
}
