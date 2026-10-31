/* La città in 3D: die Karte als kleines Viertel von Neapel (three.js, wie das Restaurant).
   Häuser, Straßen, Bäume, Meer und Vesuv sind einfache Formen, gleiche Teile werden zu wenigen Meshes zusammengelegt,
   damit es auch auf alten Handys flüssig läuft. Dazu ein paar Modelle aus www/modelle/ (Vespa, Terrasse, Schirm, Boot).
   Ein Finger dreht, zwei Finger zoomen und verschieben. Orte antippen (Gebäude oder Schild) geht über goPlace() aus karte.js.
   Ohne WebGL zeigt rMap() die flache Karte. Meter: x nach Osten, z nach Süden (zum Meer), y nach oben. */
const C3={ok:null,r:null,scene:null,cam:null,host:null,tgt:null,th:-.12,ph:.92,rad:70,fitted:false,
  ptrs:new Map(),drag:null,pinch:null,raf:0,last:0,t:0,sea:null,boats:[],picks:[],batch:{}};
// Wo die Orte stehen: x, z und Höhe des Schilds über dem Boden
const CITY_SPOTS={pizzeria:[-5,-11,8.6],mercato:[8,-.5,5.2],gelateria:[14,12.2,5.4],porto:[-15,26,4.2],capri:[30,50,9],
  scuola:[7,-11.5,11.2],bar:[-6,12.2,5.2],biblioteca:[27,-1,11.4],forno:[-14.2,-11,8.8]};
const PIAZZA=[-11,14,-7,9];              // x0, x1, z0, z1
const PROM_Z=[10,18];                    // Uferpromenade, danach Kaimauer und Meer
const WALL_COLS=["#f0c987","#e8a38a","#f3e2bf","#d98c5f","#f6d7a6","#e9b9a4","#d9c38f"];

/* ---------- Bausteine ---------- */
const c3mat=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
function c3tex(w,h,draw){const t=canvasTex(w,h,draw);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
// Fassade: ein Fenster mit grünen Läden je Feld (3 m breit, 3,2 m hoch), in der Farbe des Hauses
function facadeTex(col){
  return c3tex(64,64,(g,w,h)=>{g.fillStyle=col;g.fillRect(0,0,w,h);
    g.fillStyle="rgba(0,0,0,.06)";g.fillRect(0,h-6,w,6);
    g.fillStyle="#3e6b4b";g.fillRect(14,14,8,34);g.fillRect(42,14,8,34);
    g.fillStyle="#34424a";g.fillRect(22,14,20,34);g.fillStyle="#5b7480";g.fillRect(22,14,20,8);
    g.fillStyle="#f6efe2";g.fillRect(18,48,28,4);
    g.fillStyle="rgba(60,40,30,.55)";g.fillRect(20,52,24,2);});
}
const STONE=()=>c3tex(128,128,(g,w)=>{g.fillStyle="#b8ab93";g.fillRect(0,0,w,w);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){g.fillStyle=["#c9bca3","#c2b49b","#d1c5ad","#bdae94"][(x*7+y*3)%4];g.fillRect(x*16+(y%2)*8+1,y*16+1,14,14);}});
const PIAZZA_TEX=()=>c3tex(128,128,(g,w)=>{g.fillStyle="#e2d6bd";g.fillRect(0,0,w,w);g.strokeStyle="#cbbd9f";g.lineWidth=3;
  for(let i=0;i<=4;i++){g.beginPath();g.moveTo(i*32,0);g.lineTo(i*32,w);g.moveTo(0,i*32);g.lineTo(w,i*32);g.stroke();}
  g.fillStyle="#d4c7aa";g.fillRect(0,0,32,32);g.fillRect(64,64,32,32);g.fillRect(64,0,32,32);g.fillRect(0,64,32,32);});
const SEA_TEX=()=>c3tex(128,128,(g,w)=>{g.fillStyle="#2f93bd";g.fillRect(0,0,w,w);
  g.strokeStyle="rgba(255,255,255,.28)";g.lineWidth=3;for(let i=0;i<6;i++){g.beginPath();const y=10+i*21,x=(i*37)%90;g.moveTo(x,y);g.quadraticCurveTo(x+12,y-6,x+24,y);g.stroke();}});
const awningTex=(a,b)=>c3tex(64,16,(g,w,h)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?b:a;g.fillRect(i*8,0,8,h);}});
// Schild mit Schrift (eigene Leinwand, Schrift wie im Spiel)
function signMesh(text,w,h,bg,fg){
  const c=document.createElement("canvas");c.width=512;c.height=Math.round(512*h/w);const g=c.getContext("2d");
  g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.strokeStyle=fg;g.lineWidth=10;g.strokeRect(10,10,c.width-20,c.height-20);
  g.fillStyle=fg;g.textAlign="center";g.textBaseline="middle";g.font=`${Math.round(c.height*.52)}px "Lilita One", system-ui, sans-serif`;
  g.fillText(text,c.width/2,c.height/2+4);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));
}
// Gleiche Teile sammeln (schon an ihren Platz gerückt) und am Ende zu einem Mesh je Material zusammenlegen
function c3add(key,geo,x,y,z,ry){
  const m=new THREE.Matrix4().makeRotationY(ry||0); m.setPosition(x,y,z);
  const g=geo.index?geo.toNonIndexed():geo.clone(); g.applyMatrix4(m); (C3.batch[key]=C3.batch[key]||[]).push(g);
}
function c3merge(geos){
  let n=0; geos.forEach(g=>n+=g.attributes.position.count);
  const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2); let o=0;
  geos.forEach(g=>{const c=g.attributes.position.count;P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);
    if(g.attributes.uv)U.set(g.attributes.uv.array,o*2); o+=c; g.dispose();});
  const G=new THREE.BufferGeometry();
  G.setAttribute("position",new THREE.BufferAttribute(P,3));G.setAttribute("normal",new THREE.BufferAttribute(N,3));G.setAttribute("uv",new THREE.BufferAttribute(U,2));
  return G;
}
// Quader, dessen Seiten-Texturen sich nach Metern wiederholen (Fenster pro 3 m × 3,2 m)
function wallBox(w,h,d){
  const g=new THREE.BoxGeometry(w,h,d), uv=g.attributes.uv;
  const su=[d/3,d/3,0,0,w/3,w/3], sv=[h/3.2,h/3.2,0,0,h/3.2,h/3.2];
  for(let f=0;f<6;f++)for(let k=0;k<4;k++){const i=f*4+k;uv.setXY(i,uv.getX(i)*su[f],uv.getY(i)*sv[f]);}
  return g;
}
const flatPlane=(w,d)=>{const g=new THREE.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);return g;};
function c3plane(w,d,m,x,y,z,rep){
  const g=flatPlane(w,d); if(rep){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/rep,uv.getY(i)*d/rep);}
  const o=new THREE.Mesh(g,m); o.position.set(x,y,z); C3.scene.add(o); return o;
}
function c3box(w,h,d,m,x,y,z,parent){const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);(parent||C3.scene).add(b);return b;}

/* ---------- Das Viertel bauen ---------- */
function cityInit(){
  if(C3.ok!==null)return C3.ok;
  try{
    if(!window.THREE)throw 0;
    const r=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});
    r.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5)); r.setClearColor(0xbfe1ee);
    r.domElement.className="loc-canvas"; C3.r=r; C3.ok=true;
  }catch(e){C3.ok=false;return false;}
  const T=THREE, sc=new T.Scene(); C3.scene=sc; sc.fog=new T.Fog(0xbfe1ee,110,260);
  C3.cam=new T.PerspectiveCamera(40,1,.5,400); C3.tgt=new T.Vector3(0,0,5);
  sc.add(new T.HemisphereLight(0xfff4e2,0x7d8a5c,1.9));
  const sun=new T.DirectionalLight(0xffeccc,1.5); sun.position.set(40,60,30); sc.add(sun);
  const fill=new T.DirectionalLight(0xc6d8ff,.4); fill.position.set(-30,20,-20); sc.add(fill);
  buildCity(); cityPointers(C3.r.domElement);
  addEventListener("resize",()=>{if(C3.host&&C3.host.isConnected)cityResize();});
  return true;
}
function buildCity(){
  const T=THREE, rnd=seeded(42);
  // Land, Straßenpflaster, Piazza, Promenade, Meer
  c3plane(420,268,c3mat(0xc9d48f),0,-.05,PROM_Z[1]-134);
  c3plane(84,48,c3mat(0xffffff,{map:STONE()}),0,0,-14,2.4);
  c3plane(PIAZZA[1]-PIAZZA[0],PIAZZA[3]-PIAZZA[2],c3mat(0xffffff,{map:PIAZZA_TEX()}),(PIAZZA[0]+PIAZZA[1])/2,.02,(PIAZZA[2]+PIAZZA[3])/2,4);
  c3plane(110,PROM_Z[1]-PROM_Z[0],c3mat(0xffffff,{map:STONE()}),0,0,(PROM_Z[0]+PROM_Z[1])/2,1.6);
  c3box(110,.9,.6,c3mat(0x9b8f7e),0,-.3,PROM_Z[1]+.3);
  const seaT=SEA_TEX(); C3.sea=seaT;
  c3plane(420,240,c3mat(0xffffff,{map:seaT}),0,-.6,PROM_Z[1]+120,6);
  // Strand im Osten
  c3plane(40,8,c3mat(0xead9a6),46,-.04,PROM_Z[0]+3);
  // Häuser in Reihen: Grundstücke 6 × 6 m, Straßen und Plätze bleiben frei
  const free=(x0,x1,z0,z1)=>{
    const over=(a)=>x0<a[1]&&x1>a[0]&&z0<a[3]&&z1>a[2];
    return ![[PIAZZA[0]-1,PIAZZA[1]+1,PIAZZA[2]-1,PIAZZA[3]+1],[-1.5,2.5,-60,0],[-21,-17,-60,PROM_Z[0]],[18,22,-60,PROM_Z[0]],[-60,60,-20,-16.5],
      [-10,-.5,-15,-7],[2.5,11.5,-15.5,-8],[-17.5,-11,-14.5,-7.5],[22.5,31.5,-5.5,4.5],[-60,60,PROM_Z[0]-.5,60],[30,60,-6,20]].some(over);
  };
  for(let gx=-42;gx<42;gx+=6)for(let gz=-38;gz<10;gz+=6){
    const x0=gx,x1=gx+6,z0=gz,z1=gz+6; if(!free(x0,x1,z0,z1))continue;
    if(Math.hypot(gx+3,gz+3)>44&&rnd()<.5)continue;
    const fl=2+Math.floor(rnd()*(Math.hypot(gx,gz)<26?4:2)), h=fl*3.2+.4, col=Math.floor(rnd()*WALL_COLS.length);
    const w=6-(rnd()<.2?1:0), d=6-(rnd()<.3?1:0);
    c3add("w"+col,wallBox(w,h,d),gx+3,h/2,gz+3);
    c3add(rnd()<.7?"roof":"roof2",new T.BoxGeometry(w+.25,.35,d+.25),gx+3,h+.17,gz+3);
    if(rnd()<.35)c3add("white",new T.BoxGeometry(1.2,1,1.2),gx+2+rnd()*2,h+.85,gz+2+rnd()*2); // Wassertank
    if(rnd()<.5)c3add("balcony",new T.BoxGeometry(w*.7,.15,.7),gx+3,4.6,gz+6.3); // Balkon nach Süden
    c3add("shadow",flatPlane(w+3,d+3),gx+3,.03,gz+3);
  }
  // Bäume: Pinien am Rand, Zypressen und Bäume an der Promenade
  const tree=(x,z,pine)=>{
    c3add("trunk",new T.CylinderGeometry(.18,.25,pine?3.4:1.6,6),x,pine?1.7:.8,z);
    if(pine)c3add(rnd()<.5?"leaf":"leaf2",new T.CylinderGeometry(2.6,1.4,1.2,8),x,3.8,z);
    else c3add(rnd()<.5?"leaf":"leaf2",new T.CylinderGeometry(0,1.2,3.6,7),x,3.2,z);
    c3add("shadow",flatPlane(4,4),x,.03,z);
  };
  for(let x=-40;x<=40;x+=8)if(Math.abs(x-14)>5&&Math.abs(x+6)>5)tree(x,PROM_Z[0]+.8,false);
  for(let i=0;i<70;i++){const a=rnd()*Math.PI*2,rr=48+rnd()*50,x=Math.cos(a)*rr,z=-20+Math.sin(a)*rr*.7;if(z>PROM_Z[0]-2&&x<38)continue;tree(x,z,rnd()<.6);}
  [[-9,4],[13,6],[-10,-5]].forEach(([x,z])=>tree(x,z,true));
  // Laternen an der Piazza
  [[-10,-6],[13,-6],[-10,8],[13,8],[0,PROM_Z[0]+.8]].forEach(([x,z])=>{c3add("iron",new T.CylinderGeometry(.08,.12,3.2,6),x,1.6,z);c3add("lamp",new T.BoxGeometry(.45,.45,.45),x,3.3,z);});
  // Brunnen in der Mitte der Piazza
  c3add("white",new T.CylinderGeometry(2.4,2.6,.6,16),-1,.3,1);
  c3add("water",new T.CylinderGeometry(2.1,2.1,.1,16),-1,.62,1);
  c3add("white",new T.CylinderGeometry(.35,.5,2,8),-1,1.6,1);
  c3add("white",new T.CylinderGeometry(1,.3,.4,10),-1,2.6,1);
  // Vesuv hinten links, mit Krater
  const ves=new T.CylinderGeometry(9,70,40,24,4,true), vp=ves.attributes.position, vr=seeded(5);
  for(let i=0;i<vp.count;i++){const y=vp.getY(i);if(y>-19&&y<19){const k=1+(vr()-.5)*.08;vp.setXYZ(i,vp.getX(i)*k,y+(vr()-.5)*1.2,vp.getZ(i)*k);}}
  ves.computeVertexNormals();
  const vm=new T.Mesh(ves,c3mat(0x8d8a6a,{side:T.DoubleSide})); vm.position.set(-60,19.6,-150); C3.scene.add(vm);
  const crater=new T.Mesh(new T.CircleGeometry(9,24),c3mat(0x5d5446)); crater.rotation.x=-Math.PI/2; crater.position.set(-60,38.5,-150); C3.scene.add(crater);
  // Hafen: Mole mit Poller, bunte Boote
  c3add("quay",new T.BoxGeometry(3.4,1,15),-15,-.1,PROM_Z[1]+7.5);
  c3add("quay",new T.BoxGeometry(11,1,3),-10.8,-.1,PROM_Z[1]+13.5);
  for(let z=PROM_Z[1]+2;z<PROM_Z[1]+14;z+=3)c3add("iron",new T.CylinderGeometry(.18,.22,.5,8),-13.5,.65,z);
  const bcol=[0xe5533f,0xf4c64f,0x2f78c4,0xf3eee2,0x3a9a4a];
  [[-21,22],[-9,26],[-20,31],[-4,34],[6,30],[18,27],[2,24]].forEach(([x,z],i)=>{
    const b=new T.Group(); c3box(1.4,.6,3.6,c3mat(bcol[i%bcol.length]),0,0,0,b); c3box(1.1,.12,3,c3mat(0xd9c8a6),0,.32,0,b);
    if(i%2)c3box(.08,2.6,.08,c3mat(0x6b4126),0,1.5,-.3,b);
    b.position.set(x,-.4,z); b.rotation.y=(i*1.3)%Math.PI; C3.scene.add(b); C3.boats.push({o:b,p:i*1.7});});
  // Capri: Insel draußen im Meer
  c3add("sand",new T.CylinderGeometry(13,14,1,12),30,-.5,50);
  const isl=new T.CylinderGeometry(4,12,7,10,2), ip=isl.attributes.position, ir=seeded(9);
  for(let i=0;i<ip.count;i++){const y=ip.getY(i);if(y>-3)ip.setXYZ(i,ip.getX(i)*(1+(ir()-.5)*.25),y+(ir()-.3)*1.2,ip.getZ(i)*(1+(ir()-.5)*.25));}
  isl.computeVertexNormals(); c3add("hill",isl,30,3.3,50);
  [[26,46],[33,45],[29,44]].forEach(([x,z])=>c3add("whitewall",new T.BoxGeometry(1.6,1.4,1.6),x,1.6,z));
  // Orte
  buildPizzeria(); buildMarket(); buildGelateria(); buildPort(); buildLearning();
  // Alles Gesammelte zu Meshes
  const M={roof:c3mat(0xc4673f),roof2:c3mat(0xe2d3b8),white:c3mat(0xf3eee2),whitewall:c3mat(0xfbf7ef),balcony:c3mat(0x6e4a32),
    trunk:c3mat(0x7a5a3a),leaf:c3mat(0x5f9147),leaf2:c3mat(0x7aa65a),iron:c3mat(0x2b2f2c),lamp:c3mat(0xffe3a6,{emissive:0x8a6a2a}),
    water:c3mat(0x5cb7d6),quay:c3mat(0xa49783),sand:c3mat(0xe6d39d),hill:c3mat(0x7f9a56),
    shadow:new T.MeshBasicMaterial({map:tex("blob"),transparent:true,depthWrite:false})};
  WALL_COLS.forEach((c,i)=>M["w"+i]=c3mat(0xffffff,{map:facadeTex(c)}));
  Object.entries(C3.batch).forEach(([k,geos])=>{const o=new T.Mesh(c3merge(geos),M[k]);if(k==="shadow")o.renderOrder=-1;C3.scene.add(o);});
  C3.batch={};
}
// Ort als Gruppe, damit Antippen den ganzen Ort trifft
function placeGroup(id){const g=new THREE.Group();g.userData.place=id;C3.scene.add(g);C3.picks.push(g);return g;}
function cityModel(name,x,y,z,r,parent,s){
  loadModel(name).then(m=>{if(!m)return;const o=m.clone(true);o.position.set(x,y,z);o.rotation.y=r||0;if(s)o.scale.setScalar(s);(parent||C3.scene).add(o);});
}
function buildPizzeria(){
  const g=placeGroup("pizzeria"), x=-5, z=-11.5;
  const wall=new THREE.Mesh(wallBox(9,7,6.5),c3mat(0xffffff,{map:facadeTex("#f4cf7a")})); wall.position.set(x,3.5,z); g.add(wall);
  c3box(9.3,.4,6.8,c3mat(0xc4673f),x,7.2,z,g);
  // Laden unten: dunkle Tür und Fenster, rot-weiß-grüne Markise, Schild
  c3box(8.6,2.6,.1,c3mat(0x3b2a20),x,1.3,z+3.27,g);
  c3box(1.6,2.3,.12,c3mat(0x6b4126),x,1.15,z+3.32,g);
  c3box(2.2,1.4,.12,c3mat(0xffd59a,{emissive:0x7a4a10}),x-2.8,1.5,z+3.32,g); c3box(2.2,1.4,.12,c3mat(0xffd59a,{emissive:0x7a4a10}),x+2.8,1.5,z+3.32,g);
  const aw=new THREE.Mesh(new THREE.BoxGeometry(8.8,.12,1.6),c3mat(0xffffff,{map:awningTex("#d8402f","#f3eee2")})); aw.position.set(x,2.9,z+4); aw.rotation.x=.35; g.add(aw);
  const s=signMesh("PIZZERIA",5.6,1.1,"#1b221f","#f4c64f"); s.position.set(x,3.85,z+3.3); g.add(s);
  cityModel("terrazza",x-1.2,0,z+6,0,g); cityModel("vespa",x+5.6,0,z+5.6,-.6,g); cityModel("pflanze",x-4.2,0,z+3.9,0,g);
}
function buildMarket(){
  const g=placeGroup("mercato"), cols=[["#3a9a4a","#f3eee2"],["#d8402f","#f3eee2"],["#f4c64f","#3a9a4a"],["#2f78c4","#f3eee2"]];
  const fruit=[0xd8402f,0xf4c64f,0x3a9a4a,0xe58a2f,0x8a3a6a];
  [[5,-3],[10.5,-3],[5,2.5],[10.5,2.5]].forEach(([x,z],i)=>{
    c3box(3.6,.9,1.8,c3mat(0x8a5a36),x,.45,z,g);
    for(let k=0;k<4;k++)c3box(.8,.25,1.4,c3mat(fruit[(i+k)%fruit.length]),x-1.3+k*.86,1.02,z,g);
    [[-1.7,-.8],[1.7,-.8],[-1.7,.8],[1.7,.8]].forEach(([dx,dz])=>c3box(.1,2.4,.1,c3mat(0x6b4126),x+dx,1.2,z+dz,g));
    const aw=new THREE.Mesh(new THREE.BoxGeometry(4,.1,2.4),c3mat(0xffffff,{map:awningTex(cols[i][0],cols[i][1])})); aw.position.set(x,2.45,z); aw.rotation.x=.12; g.add(aw);
    // Schild über jedem Stand und Kisten davor: hier gibt es alle Zutaten (mercato.js)
    const sg=signMesh(["VERDURA","LATTICINI","SALUMI","PESCE"][i],2.4,.5,cols[i][0],cols[i][1]); sg.position.set(x,2.95,z+1.05); g.add(sg);
    for(let k=0;k<2;k++){c3box(.7,.45,.5,c3mat(0xc99a5c),x-.9+k*1.8,.22,z+1.35,g);c3box(.6,.12,.4,c3mat(fruit[(i+k+2)%fruit.length]),x-.9+k*1.8,.5,z+1.35,g);}
  });
  const s=signMesh("MERCATO",3.4,.8,"#3a9a4a","#f3eee2"); s.position.set(7.75,3.3,-.25); g.add(s);
  c3box(.1,3.4,.1,c3mat(0x2b2f2c),7.75,1.7,-.3,g);
}
function buildGelateria(){
  const g=placeGroup("gelateria"), x=14, z=12.2;
  const k=new THREE.Mesh(wallBox(5,3,3),c3mat(0xffffff,{map:facadeTex("#f6c6d0")})); k.position.set(x,1.5,z); g.add(k);
  c3box(5.3,.3,3.3,c3mat(0xf3eee2),x,3.15,z,g);
  c3box(4,1,.1,c3mat(0xbfe8de,{emissive:0x3a6a60}),x,1.4,z+1.52,g);
  const aw=new THREE.Mesh(new THREE.BoxGeometry(5.2,.1,1.4),c3mat(0xffffff,{map:awningTex("#f39ab0","#bfe8de")})); aw.position.set(x,2.5,z+2); aw.rotation.x=.3; g.add(aw);
  const s=signMesh("GELATERIA",4.2,.8,"#f39ab0","#ffffff"); s.position.set(x,3.75,z+1.52); g.add(s);
  // Eistüte auf dem Dach
  c3box(.9,.9,.9,c3mat(0xf6e3a6),x,3.9,z,g); c3box(.8,.6,.8,c3mat(0xf39ab0),x,4.6,z,g);
  cityModel("ombrellone",x+4.5,0,z+1.5,0,g); cityModel("ombrellone",x-4.6,0,z+1.8,0,g);
}
function buildPort(){
  const g=placeGroup("porto");
  c3box(3.4,.3,15,new THREE.MeshBasicMaterial({visible:false}),-15,.2,PROM_Z[1]+7.5,g); // unsichtbare Tippfläche auf der Mole
  cityModel("barca",-11.5,-.45,PROM_Z[1]+6,Math.PI/2,g);
  const s=signMesh("PORTO",2.6,.8,"#2f78c4","#f3eee2"); s.position.set(-15,1.6,PROM_Z[1]+.9); g.add(s);
  c3box(.1,1.2,.1,c3mat(0x2b2f2c),-15,.6,PROM_Z[1]+.85,g);
}
// Lernorte: Scuola (Vokabeln), Bar (Memory), Biblioteca (Notizbuch), Forno (Rezepte)
function civic(id,x,z,w,d,h,col,sign,bg,fg){
  const g=placeGroup(id);
  const wall=new THREE.Mesh(wallBox(w,h,d),c3mat(0xffffff,{map:facadeTex(col)})); wall.position.set(x,h/2,z); g.add(wall);
  c3box(w+.3,.4,d+.3,c3mat(0xc4673f),x,h+.2,z,g);
  c3box(1.6,2.4,.12,c3mat(0x6b4126),x,1.2,z+d/2+.03,g);
  const s=signMesh(sign,Math.min(w-1,sign.length*.55+1.2),.9,bg,fg); s.position.set(x,3,z+d/2+.05); g.add(s);
  return g;
}
function buildLearning(){
  // Scuola mit Glockenturm, Fahne und Tafel davor
  let x=7,z=-11.75; const sc=civic("scuola",x,z,8,6,7,"#f3e2bf","SCUOLA","#2f4a3c","#f3eee2");
  c3box(1.8,2.2,1.8,c3mat(0xf3eee2),x,8.5,z-1,sc); c3box(2.1,.3,2.1,c3mat(0xc4673f),x,9.75,z-1,sc);
  const bell=new THREE.Mesh(new THREE.CylinderGeometry(.25,.5,.7,10),c3mat(0xd9a93a)); bell.position.set(x,8.8,z-.05); sc.add(bell);
  c3box(.08,3,.08,c3mat(0x2b2f2c),x-3.6,8.5,z+2.6,sc);
  [0x3a9a4a,0xf3eee2,0xd8402f].forEach((c,i)=>c3box(.4,.8,.04,c3mat(c),x-3.36+i*.4,9.5,z+2.6,sc));
  cityModel("lavagna",x+2.6,0,z+4.4,0,sc);
  // Forno mit Schornstein und Brotkisten
  x=-14.2;z=-11; const fo=civic("forno",x,z,5.5,5.5,6.4,"#e8a38a","FORNO","#6b4126","#f6e3a6");
  c3box(.9,2.6,.9,c3mat(0x9a4a32),x+1.4,7.5,z-1,fo);
  const aw=new THREE.Mesh(new THREE.BoxGeometry(5.4,.1,1.3),c3mat(0xffffff,{map:awningTex("#6b4126","#f6e3a6")})); aw.position.set(x,2.55,z+3.3); aw.rotation.x=.3; fo.add(aw);
  [-1.6,1.6].forEach(dx=>{c3box(1.1,.6,.8,c3mat(0x8a5a36),x+dx,.3,z+3.4,fo);c3box(.9,.2,.6,c3mat(0xd9a45a),x+dx,.7,z+3.4,fo);});
  // Bar am Hafen: Kiosk mit Tischen davor
  x=-6;z=12.2; const bar=placeGroup("bar");
  const k=new THREE.Mesh(wallBox(5,3,3),c3mat(0xffffff,{map:facadeTex("#bfe0d0")})); k.position.set(x,1.5,z); bar.add(k);
  c3box(5.3,.3,3.3,c3mat(0xf3eee2),x,3.15,z,bar);
  c3box(4,1,.1,c3mat(0xffe3a6,{emissive:0x6a4a10}),x,1.4,z+1.52,bar);
  const aw2=new THREE.Mesh(new THREE.BoxGeometry(5.2,.1,1.4),c3mat(0xffffff,{map:awningTex("#3a9a4a","#f3eee2")})); aw2.position.set(x,2.5,z+2); aw2.rotation.x=.3; bar.add(aw2);
  const s=signMesh("BAR",2.4,.8,"#1b221f","#f4c64f"); s.position.set(x,3.75,z+1.52); bar.add(s);
  cityModel("tischgruppe",x-1.4,0,z+3.6,0,bar); cityModel("tisch",x+2,0,z+3.8,0,bar);
  // Biblioteca: hell, mit Säulen und Stufen
  x=27;z=-1; const bi=civic("biblioteca",x,z,8,6.5,8,"#f6efe2","BIBLIOTECA","#7a4a2a","#f6efe2");
  c3box(8.4,.35,2.2,c3mat(0xe2d6bd),x,.17,z+4.3,bi); c3box(8.6,.5,2.2,c3mat(0xf3eee2),x,4.35,z+4.3,bi);
  [-3.4,-1.2,1.2,3.4].forEach(dx=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.28,.32,3.8,10),c3mat(0xf3eee2));c.position.set(x+dx,2.25,z+4.9);bi.add(c);});
}

/* ---------- Kamera, Zeichnen, Schilder ---------- */
function cityCam(){
  const c=C3.cam,t=C3.tgt; C3.ph=Math.max(.3,Math.min(1.22,C3.ph)); C3.rad=Math.max(18,Math.min(140,C3.rad));
  t.x=Math.max(-45,Math.min(45,t.x)); t.z=Math.max(-40,Math.min(50,t.z));
  c.position.set(t.x+C3.rad*Math.sin(C3.ph)*Math.sin(C3.th),t.y+C3.rad*Math.cos(C3.ph),t.z+C3.rad*Math.sin(C3.ph)*Math.cos(C3.th));
  c.lookAt(t);
}
function cityResize(){
  const h=C3.host; if(!h)return; const w=h.clientWidth||300, hh=h.clientHeight||300;
  C3.r.setSize(w,hh,false); C3.cam.aspect=w/hh; C3.cam.fov=w<hh?48:38; C3.cam.updateProjectionMatrix();
  // Beim ersten Mal so weit herauszoomen, dass alle Orte im Viertel zu sehen sind (Capri darf draußen bleiben)
  // Beim ersten Mal (und wenn sich die Größe ändert) so weit herauszoomen, dass alle Orte im freien Fenster
  // zwischen den Knöpfen zu sehen sind (Capri darf draußen bleiben); der Blickpunkt rückt in die Mitte des Fensters
  const W=C3.win=winBox(h.classList.contains("full3d")?h:null), key=w+"x"+hh+":"+W.y0.toFixed(2)+W.y1.toFixed(2);
  if(C3.fitted!==key){C3.fitted=key; C3.tgt.set(w<hh?5:0,0,w<hh?1:0);
    const v=new THREE.Vector3(), all=Object.entries(CITY_SPOTS).filter(([k])=>k!=="capri").map(([,s])=>s);
    const y0=W.y0+(W.y1-W.y0)*.12, y1=W.y1-(W.y1-W.y0)*.08, ym=(y0+y1)/2, yh=(y1-y0)/2;
    for(let k=0;k<3;k++){
      for(C3.rad=24;C3.rad<139;C3.rad+=2){cityCam();C3.cam.updateMatrixWorld();
        if(all.every(s=>{v.set(s[0],s[2],s[1]).project(C3.cam);return Math.abs(v.x)<.84&&Math.abs(v.y-ym)<yh;}))break;}
      // Mitte der Orte auf die Mitte des Fensters schieben (nur nach vorn/hinten)
      let a=1e9,b=-1e9; all.forEach(s=>{v.set(s[0],s[2],s[1]).project(C3.cam);a=Math.min(a,v.y);b=Math.max(b,v.y);});
      const dy=((a+b)/2-ym)*Math.tan(C3.cam.fov*Math.PI/360)*C3.rad/Math.cos(C3.ph);
      C3.tgt.x-=Math.sin(C3.th)*dy; C3.tgt.z-=Math.cos(C3.th)*dy;}}
}
function cityPins(){
  const pins=C3.host&&C3.host.querySelectorAll(".city-pin"); if(!pins)return;
  const w=C3.host.clientWidth, h=C3.host.clientHeight, v=new THREE.Vector3();
  pins.forEach(el=>{const s=CITY_SPOTS[el.dataset.p]; v.set(s[0],s[2],s[1]).project(C3.cam);
    const W=C3.win||{y0:-1,y1:1}, on=v.z<1&&v.x>-1.15&&v.x<1.15&&v.y>W.y0-.02&&v.y<W.y1+.1;
    el.style.display=on?"":"none"; if(on)el.style.transform=`translate(${(v.x+1)/2*w}px,${(1-v.y)/2*h}px) translate(-50%,-100%)`;});
}
// Läuft nur, solange die Karte offen ist: Wellen und schaukelnde Boote, höchstens 30 Bilder pro Sekunde
function cityLoop(now){
  C3.raf=0; if(!C3.host||!C3.host.isConnected||screen!=="map"&&screen!=="home")return;
  C3.raf=requestAnimationFrame(cityLoop);
  if(now-C3.last<33)return; const dt=Math.min(.1,(now-C3.last)/1000); C3.last=now; C3.t+=dt;
  C3.sea.offset.set(C3.t*.015,C3.t*.008);
  C3.boats.forEach(b=>{b.o.position.y=-.4+Math.sin(C3.t*1.4+b.p)*.08;b.o.rotation.z=Math.sin(C3.t*1.1+b.p)*.04;});
  cityCam(); C3.r.render(C3.scene,C3.cam); cityPins();
}
function cityMount(host){
  C3.host=host; if(!host||!cityInit())return false;
  host.prepend(C3.r.domElement); cityResize(); cityCam(); C3.r.render(C3.scene,C3.cam); cityPins();
  if(!C3.raf){C3.last=0;C3.raf=requestAnimationFrame(cityLoop);}
  return true;
}
// WebGL vorhanden? (einmal prüfen, ohne gleich die Stadt zu bauen)
function cityCan(){
  if(C3.ok!==null)return C3.ok;
  if(!window.THREE)return false;
  try{const c=document.createElement("canvas");return !!(c.getContext("webgl2")||c.getContext("webgl"));}catch(e){return false;}
}

/* ---------- Finger ---------- */
function cityPointers(el){
  const pinchNow=()=>{const [a,b]=[...C3.ptrs.values()];return {d:Math.max(20,Math.hypot(a.x-b.x,a.y-b.y)),x:(a.x+b.x)/2,y:(a.y+b.y)/2};};
  el.addEventListener("pointerdown",e=>{el.setPointerCapture(e.pointerId);C3.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(C3.ptrs.size===2){C3.drag=null;C3.pinch=pinchNow();return;} C3.drag={x0:e.clientX,y0:e.clientY,moved:false};});
  el.addEventListener("pointermove",e=>{
    const p=C3.ptrs.get(e.pointerId); if(!p)return; const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY;
    if(C3.ptrs.size>=2&&C3.pinch){const n=pinchNow(),o=C3.pinch; C3.rad*=o.d/n.d;
      const s=C3.rad/500, c=Math.cos(C3.th), si=Math.sin(C3.th);
      C3.tgt.x-=(n.x-o.x)*s*c+(n.y-o.y)*s*si; C3.tgt.z-=-(n.x-o.x)*s*si+(n.y-o.y)*s*c; C3.pinch=n; return;}
    const D=C3.drag; if(!D)return; if(!D.moved&&Math.hypot(e.clientX-D.x0,e.clientY-D.y0)<9)return;
    D.moved=true; C3.th-=dx*.006; C3.ph-=dy*.005;
  });
  const up=e=>{C3.ptrs.delete(e.pointerId); if(C3.ptrs.size<2)C3.pinch=null;
    const D=C3.drag; C3.drag=null; if(!D||D.moved||C3.ptrs.size)return;
    const r=el.getBoundingClientRect(), rc=new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),C3.cam);
    const h=rc.intersectObjects(C3.picks,true)[0]; if(!h)return;
    let o=h.object; while(o&&!o.userData.place)o=o.parent; if(o){goPlace(o.userData.place);save();}};
  el.addEventListener("pointerup",up); el.addEventListener("pointercancel",up);
  el.addEventListener("wheel",e=>{e.preventDefault();C3.rad*=e.deltaY>0?1.1:.9;},{passive:false});
}
