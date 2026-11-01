/* La città in 3D: die Karte als kleines Viertel von Neapel (three.js, wie das Restaurant).
   Häuser, Straßen, Bäume, Meer und Vesuv sind einfache Formen, gleiche Teile werden zu wenigen Meshes zusammengelegt,
   damit es auch auf alten Handys flüssig läuft. Dazu ein paar Modelle aus www/modelle/ (Vespa, Terrasse, Schirm, Boot).
   Ein Finger dreht, zwei Finger zoomen und verschieben. Orte antippen (Gebäude oder Schild) geht über goPlace() aus karte.js.
   Ohne WebGL zeigt rMap() die flache Karte. Meter: x nach Osten, z nach Süden (zum Meer), y nach oben. */
const C3={ok:null,r:null,scene:null,cam:null,host:null,tgt:null,th:-.12,ph:.92,rad:70,fitted:false,
  ptrs:new Map(),drag:null,pinch:null,raf:0,last:0,t:0,sea:null,boats:[],picks:[],batch:{}};
// Wo die Orte stehen: x, z und Höhe des Schilds über dem Boden
const CITY_SPOTS={pizzeria:[-5,-11,8.6],mercato:[8,-.5,5.2],gelateria:[14,12.2,5.4],porto:[-15,26,4.2],capri:[30,50,9],
  scuola:[7,-11.5,11.2],bar:[-6,12.2,5.2],biblioteca:[27,-1,11.4],forno:[-14.2,-11,8.8],campagna:[.5,-30,8]};
const PIAZZA=[-11,14,-7,9];              // x0, x1, z0, z1
const PROM_Z=[10,18];                    // Uferpromenade, danach Kaimauer und Meer
// Farben wie auf den Hängen von Neapel: Neapelgelb, Pompejanisch-Rot, Weiß, Rosa, Ocker, Pastellgrün
const WALL_COLS=["#f2c443","#d9573f","#f1ece2","#eab1a3","#e6a54a","#f6dca0","#cdd6b0","#e98a6a","#f4e3c3"];

/* ---------- Bausteine ---------- */
const c3mat=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
function c3tex(w,h,draw){const t=canvasTex(w,h,draw);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
// Fassade: je Feld (3 m breit, 3,2 m hoch) eine hohe Fenstertür mit weißem Stuckrahmen, Gesims darüber
// und grünen Persiane (Fensterläden mit Lamellen), wie an den Häusern in Neapel
function facadeTex(col){
  return c3tex(64,64,(g,w,h)=>{g.fillStyle=col;g.fillRect(0,0,w,h);
    g.fillStyle="rgba(0,0,0,.07)";g.fillRect(0,h-4,w,4);
    g.fillStyle="#f6f1e6";g.fillRect(17,9,30,46);g.fillRect(14,5,36,4);
    g.fillStyle="rgba(0,0,0,.18)";g.fillRect(14,9,36,1.5);
    g.fillStyle="#2f3d44";g.fillRect(21,13,22,41);g.fillStyle="#56707b";g.fillRect(21,13,22,9);
    g.fillStyle="#3f7a52";g.fillRect(10,13,10,41);g.fillRect(44,13,10,41);
    g.fillStyle="rgba(0,0,0,.22)";for(let y=16;y<53;y+=4){g.fillRect(10,y,10,1);g.fillRect(44,y,10,1);}});
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
    const fl=2+Math.floor(rnd()*(Math.hypot(gx,gz)<26?4:2)), col=Math.floor(rnd()*WALL_COLS.length);
    const w=6-(rnd()<.2?1:0), d=6-(rnd()<.3?1:0), rk=rnd()<.7?"roof":"roof2", tank=rnd()<.35?[rnd(),rnd()]:null, balc=rnd()<.5;
    if(typeof napoliSite==="function"&&napoliSite(x0,x1,z0,z1))continue; // hier stehen Kirche und Piazzetta (napoli.js)
    const n=fl+(Math.hypot(gx+3,gz+3)>15?1:0), h=n*3.2+.4; // ein Stockwerk mehr: Neapel ist eng und hoch
    c3add("w"+col,wallBox(w,h,d),gx+3,h/2,gz+3);
    // napoli.js baut Dach (Ziegel-Satteldach oder Dachterrasse mit Steinboden), Balkone und Gesimse
    if(!(typeof napoliHouse==="function"&&napoliHouse(gx+3,gz+3,w,d,h,n,balc,tank,col))){
      c3add(rk,new T.BoxGeometry(w+.25,.35,d+.25),gx+3,h+.17,gz+3);
      if(tank)c3add("white",new T.BoxGeometry(1.2,1,1.2),gx+2+tank[0]*2,h+.85,gz+2+tank[1]*2); // Wassertank
      if(balc)c3add("balcony",new T.BoxGeometry(w*.7,.15,.7),gx+3,4.6,gz+6.3);}
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
  if(typeof francoBuild==="function")francoBuild(); // Franco mit seiner Ape (franco.js)
  if(typeof napoliBuild==="function")napoliBuild(); // Wäscheleinen, Kirche mit Kuppel, Castel dell'Ovo (napoli.js)
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
  if(typeof napoliTileRoof==="function")napoliTileRoof(x,z,9,6.5,7,g,"#f4cf7a"); else c3box(9.3,.4,6.8,c3mat(0xc4673f),x,7.2,z,g);
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
// Gelateria: richtiger Laden mit Glasfront, drinnen Eistheke, Regal mit Waffeln und Preistafel.
// Von draußen sieht man durch die Scheibe hinein; beim Ausflug zeigt gelStage() den Blick über die Theke.
const GEL={x:14,z:12.2,w:7,d:4.4,h:3.8};
function gelTex(w,h,draw){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const GEL_FLAV=[["#a8cf6a","pistacchio"],["#f6a0b8","fragola"],["#6e4026","cioccolato"],["#f7e27a","limone"],
  ["#fbf6ea","stracciatella"],["#e2b07a","nocciola"],["#b98ad8","mirtillo"],["#ffc58f","melone"]];
function buildGelateria(){
  const T=THREE, g=placeGroup("gelateria"), {x,z,w,d,h}=GEL, z0=z-d/2, z1=z+d/2, x0=x-w/2;
  const wall=c3mat(0xffffff,{map:facadeTex("#f6c6d0")}), plain=c3mat(0xf6c6d0), white=c3mat(0xf6f1e6);
  // Hülle: Rückwand, Seiten, Pfeiler und Sturz vorn, Dach mit Gesims
  const wb=(W,H,D,X,Y,Z,m)=>{const o=new T.Mesh(wallBox(W,H,D),m||wall);o.position.set(X,Y,Z);g.add(o);return o;};
  wb(w,h,.25,x,h/2,z0+.125); wb(.25,h,d,x0+.125,h/2,z); wb(.25,h,d,x+w/2-.125,h/2,z);
  c3box(.55,h,.3,plain,x0+.27,h/2,z1-.15,g); c3box(.55,h,.3,plain,x+w/2-.27,h/2,z1-.15,g); c3box(w,.95,.3,plain,x,h-.47,z1-.15,g);
  c3box(w+.3,.3,d+.3,white,x,h+.15,z,g); c3box(w+.4,.18,.4,white,x,h-.95,z1+.05,g);
  c3box(w-1.1,.6,.32,c3mat(0x6f6c66),x,.3,z1-.15,g); // Sockel aus Piperno unter der Scheibe
  const glass=new T.Mesh(new T.PlaneGeometry(w-1.1,h-1.55),c3mat(0xbfe8f0,{transparent:true,opacity:.18,depthWrite:false}));
  glass.position.set(x,.6+(h-1.55)/2,z1-.2); g.add(glass);
  c3box(.08,h-1.55,.08,c3mat(0xe9e2d4),x-1,.6+(h-1.55)/2,z1-.18,g); c3box(.08,h-1.55,.08,c3mat(0xe9e2d4),x+1,.6+(h-1.55)/2,z1-.18,g);
  // Markise, Schild, Eistüte auf dem Dach
  const aw=new T.Mesh(new T.BoxGeometry(w+.2,.1,1.5),c3mat(0xffffff,{map:awningTex("#f39ab0","#fbf3f5")})); aw.position.set(x,h-.85,z1+.7); aw.rotation.x=.3; g.add(aw);
  const s=signMesh("GELATERIA",4.6,.7,"#f39ab0","#ffffff"); s.position.set(x,h-.45,z1+.02); g.add(s);
  const cone=new T.Mesh(new T.CylinderGeometry(.55,.05,1.3,10),c3mat(0xe2b07a)); cone.position.set(x+2.3,h+.95,z-.6); g.add(cone);
  [[0xf6a0b8,1.75],[0xa8cf6a,2.25]].forEach(([c,y])=>{const b=new T.Mesh(frSphere(.55,12,8),c3mat(c));b.position.set(x+2.3,h+y,z-.6);g.add(b);});
  // Innen: Wände mit Streifen in Mint, Decke, Fliesen in Rosa und Weiß
  const stripeT=gelTex(64,64,(c,W,H)=>{for(let i=0;i<8;i++){c.fillStyle=i%2?"#bfe6d4":"#d3f0e3";c.fillRect(i*8,0,8,H);}
    c.fillStyle="#f3b6c4";c.fillRect(0,H-10,W,10);}); stripeT.wrapS=T.RepeatWrapping; stripeT.repeat.set(5,1);
  const inner=c3mat(0xffffff,{map:stripeT});
  const inPlane=(W,H,X,Y,Z,ry,m)=>{const o=new T.Mesh(new T.PlaneGeometry(W,H),m||inner);o.position.set(X,Y,Z);o.rotation.y=ry;g.add(o);return o;};
  inPlane(w-.5,h-.3,x,(h-.3)/2,z0+.26,0); inPlane(d-.5,h-.3,x0+.26,(h-.3)/2,z,Math.PI/2); inPlane(d-.5,h-.3,x+w/2-.26,(h-.3)/2,z,-Math.PI/2);
  const ceil=new T.Mesh(new T.PlaneGeometry(w-.5,d-.4),c3mat(0xfbf3f5)); ceil.rotation.x=Math.PI/2; ceil.position.set(x,h-.31,z); g.add(ceil);
  const tile=gelTex(64,64,(c,W)=>{c.fillStyle="#fdf3f6";c.fillRect(0,0,W,W);c.fillStyle="#f0b9c9";c.fillRect(0,0,32,32);c.fillRect(32,32,32,32);});
  tile.wrapS=tile.wrapT=T.RepeatWrapping; tile.repeat.set(w/.8,d/.8);
  const fl=new T.Mesh(flatPlane(w-.5,d-.4),c3mat(0xffffff,{map:tile})); fl.position.set(x,.04,z); g.add(fl);
  // Rückwand: Schriftzug, Preistafel, Regale mit Waffeln, Lampen
  const logo=new T.Mesh(new T.PlaneGeometry(2.6,.7),new T.MeshBasicMaterial({map:gelTex(512,138,(c,W,H)=>{c.fillStyle="#fbe3ea";c.fillRect(4,4,W-8,H-8);
    c.strokeStyle="#e98aa3";c.lineWidth=8;c.strokeRect(8,8,W-16,H-16);c.fillStyle="#d1497a";c.font='italic 700 84px Georgia, serif';c.textAlign="center";c.textBaseline="middle";c.fillText("Gelateria",W/2,H/2+4);})}));
  logo.position.set(x,2.85,z0+.28); g.add(logo);
  const price=new T.Mesh(new T.PlaneGeometry(1.4,1.05),new T.MeshBasicMaterial({map:gelTex(280,210,(c,W,H)=>{c.fillStyle="#2b3a33";c.fillRect(0,0,W,H);
    c.strokeStyle="#c99a6a";c.lineWidth=10;c.strokeRect(5,5,W-10,H-10);c.fillStyle="#f6f1e6";c.font='italic 700 34px Georgia, serif';c.textAlign="center";c.fillText("Prezzi",W/2,46);
    c.font="24px Arial";[["1 gusto","2,50 €"],["2 gusti","3,50 €"],["3 gusti","4,50 €"],["+ panna","0,50 €"]].forEach(([a,b],i)=>{c.textAlign="left";c.fillText(a,24,86+i*32);c.textAlign="right";c.fillText(b,W-24,86+i*32);});})}));
  price.position.set(x+2.2,1.95,z0+.28); g.add(price);
  [1.55,2.05].forEach(y=>{c3box(1.6,.06,.3,c3mat(0xc99a6a),x-2.2,y,z0+.42,g);
    for(let i=0;i<6;i++){const c=new T.Mesh(new T.CylinderGeometry(.07,0,.26,8),c3mat(0xe2b07a));c.position.set(x-2.85+i*.26,y+.16,z0+.42);g.add(c);}});
  [-1.6,0,1.6].forEach(dx=>{c3box(.03,.5,.03,c3mat(0x2b2f2c),x+dx,h-.55,z+.2,g);const l=new T.Mesh(new T.CylinderGeometry(.12,.3,.25,12),c3mat(0xffe3a6,{emissive:0x8a6a2a}));l.position.set(x+dx,h-.85,z+.2);g.add(l);});
  // Eistheke (eigenes Objekt: gelStage() zeichnet sie zusätzlich allein, damit Signora Lucia dahinter steht)
  const ctr=new T.Group(); C3.scene.add(ctr); GEL.counter=ctr;
  const cz=z+.15; c3box(5.6,1,.8,c3mat(0xffffff,{map:tile.clone()}),x,.5,cz,ctr); c3box(5.7,.08,.9,c3mat(0xf6f1e6),x,1.02,cz,ctr);
  c3box(5.6,.12,.85,c3mat(0xe98aa3),x,.1,cz+.02,ctr);
  GEL_FLAV.forEach(([c,n],i)=>{const tx=x-2.45+i*.7;
    c3box(.6,.12,.55,c3mat(0xd9dfe2),tx,1.1,cz-.05,ctr);
    const sc=new T.Mesh(frSphere(.26,10,6),c3mat(c)); sc.scale.set(1,.32,.8); sc.position.set(tx,1.16,cz-.05); ctr.add(sc);
    const lab=new T.Mesh(new T.PlaneGeometry(.56,.14),new T.MeshBasicMaterial({map:gelTex(160,40,(q,W,H)=>{q.fillStyle="#fff";q.fillRect(0,0,W,H);q.fillStyle="#3a3a3a";q.font="22px Arial";q.textAlign="center";q.textBaseline="middle";q.fillText(n,W/2,H/2+1);})}));
    lab.position.set(tx,.86,cz+.41); ctr.add(lab);});
  const vit=new T.Mesh(new T.BoxGeometry(5.6,.42,.06),c3mat(0xd8f2fa,{transparent:true,opacity:.28,depthWrite:false})); vit.position.set(x,1.3,cz+.38); vit.rotation.x=-.45; ctr.add(vit);
  c3box(5.6,.04,.5,c3mat(0xd8f2fa,{transparent:true,opacity:.25,depthWrite:false}),x,1.5,cz-.02,ctr);
  // Draußen: Tische mit Schirmen auf der Promenade
  cityModel("ombrellone",x+w/2+1.6,0,z+1.5,0,g); cityModel("ombrellone",x0-1.6,0,z+1.8,0,g);
}
// Bild für den Ausflug (wie locStage im Restaurant): Blick vom Kunden über die Theke, Signora Lucia dahinter.
// Zwei Bilder: der ganze Laden und nur die Theke (durchsichtig), dazwischen setzt szenen.js die Figur.
function gelStage(){
  if(GEL.stage)return GEL.stage;
  if(!cityCan()||!cityInit()||!GEL.counter)return null;
  const T=THREE, r=C3.r, {x,z,d}=GEL, cam=new T.PerspectiveCamera(56,400/260,.1,40);
  cam.position.set(x,1.5,z+d/2-.3); cam.lookAt(x,1.38,z-d/2-.4); cam.updateMatrixWorld(true);
  const W=800, H=520, pr=r.getPixelRatio(); r.setPixelRatio(1); r.setSize(W,H,false);
  r.render(C3.scene,cam); const bg=r.domElement.toDataURL("image/jpeg",.86);
  const off=[]; C3.scene.children.forEach(o=>{if(!o.isLight&&o!==GEL.counter&&o.visible){o.visible=false;off.push(o);}});
  r.setClearColor(0x000000,0); r.render(C3.scene,cam); const fg=r.domElement.toDataURL("image/png");
  off.forEach(o=>o.visible=true); r.setClearColor(0xbfe1ee,1); r.setPixelRatio(pr);
  if(C3.host&&C3.host.isConnected)cityResize();
  const p=(X,Y,Z)=>{const v=new T.Vector3(X,Y,Z).project(cam);return [(v.x+1)/2*400,(1-v.y)/2*260];};
  const f=p(x-.3,0,z-.5), hd=p(x-.3,1.8,z-.5), size=(f[1]-hd[1])*250/240, top=p(x,1.02,z+.6)[1];
  // clip: unterhalb der Thekenkante wird die Figur abgeschnitten (sonst schauen unten die Beine hervor)
  GEL.stage={src:bg,fg,oy:0,h:260,stand:[Math.round(f[0]),Math.round(f[1]),Math.round(size)],clip:Math.round(top)};
  return GEL.stage;
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
  if(typeof napoliTileRoof==="function")napoliTileRoof(x,z,w,d,h,g,col); else c3box(w+.3,.4,d+.3,c3mat(0xc4673f),x,h+.2,z,g); // Ziegeldach
  c3box(1.6,2.4,.12,c3mat(0x6b4126),x,1.2,z+d/2+.03,g);
  const s=signMesh(sign,Math.min(w-1,sign.length*.55+1.2),.9,bg,fg); s.position.set(x,3,z+d/2+.05); g.add(s);
  return g;
}
function buildLearning(){
  // Scuola mit Glockenturm, Fahne und Tafel davor
  let x=7,z=-11.75; const sc=civic("scuola",x,z,8,6,7,"#f3e2bf","SCUOLA","#2f4a3c","#f3eee2");
  c3box(1.8,2.2,1.8,c3mat(0xf3eee2),x,8.5,z-1,sc); c3box(2.1,.3,2.1,c3mat(0xc4673f),x,9.75,z-1,sc);
  const bell=new THREE.Mesh(new THREE.CylinderGeometry(.25,.5,.7,10),c3mat(0xd9a93a)); bell.position.set(x,9.05,z-.05); sc.add(bell);
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
  // Wegweiser aufs Land (La campagna: Bauernhof, Don Vincenzo, Weinberg) am Ende der Querstraße Richtung Vesuv
  x=.5;z=-30; const ca=placeGroup("campagna");
  c3box(.14,3,.14,c3mat(0x6b4126),x,1.5,z,ca);
  const w1=signMesh("VESUVIO \u2192",2.6,.6,"#f3eee2","#6b4126"); w1.position.set(x,2.6,z+.09); ca.add(w1);
  const w2=signMesh("CAMPAGNA",2.2,.5,"#3a6b2a","#f6e3a6"); w2.position.set(x,2,z+.09); ca.add(w2);
  c3box(2.6,1.8,.1,new THREE.MeshBasicMaterial({visible:false}),x,2,z,ca);
  cityModel("vespa",x+2,0,z+.4,-.9,ca);
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
  const pins=C3.host&&C3.host.querySelectorAll(".city-pin[data-p]"); if(!pins)return;
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
  if(typeof francoTick==="function")francoTick(dt);
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
    if(typeof francoHit==="function"&&francoHit(rc))return; // die Ape zuerst, auch wenn ein Haus davor steht
    const h=rc.intersectObjects(C3.picks,true)[0]; if(!h)return;
    let o=h.object; while(o&&!o.userData.place)o=o.parent;
    if(o){goPlace(o.userData.place);save();}};
  el.addEventListener("pointerup",up); el.addEventListener("pointercancel",up);
  el.addEventListener("wheel",e=>{e.preventDefault();C3.rad*=e.deltaY>0?1.1:.9;},{passive:false});
}
