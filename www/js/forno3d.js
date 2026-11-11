/* Il vecchio forno: die alte Bäckerei im Viertel steht leer und ist zu verkaufen (three.js, gebaut wie campagna3d.js).
   In der Stadt (stadt3d.js, buildOldForno) hängt „Vendesi“ am Haus. Antippen führt hinein: ein leerer, staubiger Raum
   mit dem alten Ziegelofen, einer Theke unter einem Tuch, leeren Regalen, Kisten, Spinnweben und Licht durch die Läden.
   Ohne Decke und mit ausgeblendeten Wänden zur Kamera hin sieht man wie in ein Puppenhaus. Kaufen: FORNO_PREIS Euro,
   dann gehört das Haus dir (S.forno). Was hineinkommt, folgt später. Meter: x nach rechts, z nach vorn, y nach oben. */
const FORNO_PREIS=300;
const fornoMine=()=>!!S.forno;
const F3={ok:null,r:null,scene:null,cam:null,host:null,tgt:null,th:.5,ph:1.0,rad:13,
  ptrs:new Map(),drag:null,pinch:null,raf:0,last:0,t:0,walls:[],dust:[],beams:[],msg:0};
const FW=8, FD=7, FH=4.2; // Raum: Breite, Tiefe, Höhe
// Was der Makler sagt [Italienisch, Deutsch]
const FORNO_SAY=[
  ["Vendesi! Era il forno del quartiere. Adesso è vuoto.","Zu verkaufen! Das war die Bäckerei des Viertels. Jetzt steht sie leer."],
  ["Il forno a legna è vecchio, ma funziona ancora.","Der Holzofen ist alt, aber er funktioniert noch."],
  ["C'è molta polvere, ma la casa è bella.","Es ist sehr staubig, aber das Haus ist schön."]
];
const FORNO_MINE=[
  ["Complimenti! Il forno è tuo.","Glückwunsch! Die Bäckerei gehört dir."],
  ["È vuoto, ma è tuo. Cosa facciamo qui?","Sie ist leer, aber sie gehört dir. Was machen wir hier?"]
];

/* ---------- Texturen ---------- */
const fTex=(w,h,draw,rep)=>{const t=c3tex(w,h,draw);if(rep)t.repeat.set(rep[0],rep[1]);return t;};
// Alte Terrakotta-Fliesen mit Staub
const F_FLOOR=()=>fTex(128,128,(g,w)=>{const r=seeded(3);g.fillStyle="#a8735a";g.fillRect(0,0,w,w);
  for(let y=0;y<4;y++)for(let x=0;x<4;x++){g.fillStyle=["#b47c60","#a06a52","#ae7a5e","#9a6650"][(x*3+y)%4];g.fillRect(x*32+1,y*32+1,30,30);}
  for(let i=0;i<14;i++){g.fillStyle=`rgba(220,210,190,${.08+r()*.18})`;g.beginPath();g.arc(r()*w,r()*w,4+r()*14,0,7);g.fill();}},[3,3]);
// Putz, der abblättert: darunter Ziegel
const F_WALL=()=>fTex(128,128,(g,w)=>{const r=seeded(9);g.fillStyle="#e3cdb4";g.fillRect(0,0,w,w);
  g.fillStyle="rgba(120,90,60,.12)";g.fillRect(0,90,w,38);
  for(let i=0;i<5;i++){const x=r()*100,y=r()*90,bw=14+r()*22,bh=10+r()*14;g.fillStyle="#b0654a";g.fillRect(x,y,bw,bh);
    g.strokeStyle="#d7b9a0";g.lineWidth=1;for(let yy=y+4;yy<y+bh;yy+=5){g.beginPath();g.moveTo(x,yy);g.lineTo(x+bw,yy);g.stroke();}}
  g.fillStyle="rgba(80,70,50,.25)";for(let i=0;i<4;i++)g.fillRect(r()*w,r()*40,2,30+r()*40);},[2,1]);
const F_BRICK=()=>fTex(64,64,(g,w)=>{g.fillStyle="#cdb49a";g.fillRect(0,0,w,w);
  for(let y=0;y<8;y++)for(let x=0;x<4;x++){g.fillStyle=["#a45a3e","#b0664a","#94503a"][(x+y)%3];g.fillRect(x*16+(y%2)*8+1,y*8+1,14,6);}},[2,2]);

/* ---------- Raum bauen ---------- */
function fMesh(geo,m,x,y,z,ry,parent){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);if(ry)o.rotation.y=ry;(parent||F3.scene).add(o);return o;}
const fBox=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
function fornoInit(){
  if(F3.ok!==null)return F3.ok;
  try{
    if(!window.THREE)throw 0;
    const r=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});
    r.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5)); r.setClearColor(0x1d1a17);
    r.domElement.className="loc-canvas"; F3.r=r; F3.ok=true;
  }catch(e){F3.ok=false;return false;}
  const T=THREE, sc=new T.Scene(); F3.scene=sc;
  F3.cam=new T.PerspectiveCamera(45,1,.1,100); F3.tgt=new T.Vector3(0,1.2,0);
  sc.add(new T.HemisphereLight(0xffe9cc,0x4a3a2c,1.25));
  const sun=new T.DirectionalLight(0xffd9a0,1.1); sun.position.set(-6,8,6); sc.add(sun);
  const warm=new T.PointLight(0xffb070,.9,9); warm.position.set(-2.4,2.6,1.2); sc.add(warm);
  buildFornoRoom(); fornoPointers(F3.r.domElement);
  addEventListener("resize",()=>{if(F3.host&&F3.host.isConnected)fornoResize();});
  return true;
}
function buildFornoRoom(){
  const T=THREE, m=(c,o)=>c3mat(c,o), t=.2;
  const wallM=m(0xffffff,{map:F_WALL()}), brick=m(0xffffff,{map:F_BRICK()}), wood=m(0x7a5a3a), woodD=m(0x4f3524), woodL=m(0xa08058),
    dust=m(0xd9cfbf), soot=m(0x231d18), iron=m(0x3a3633), cloth=m(0xe6dfcf), basket=m(0xb08a52);
  // Boden mit einer dünnen Bodenplatte darunter (von außen sieht man das Fundament)
  const fl=new T.Mesh(new T.PlaneGeometry(FW,FD),m(0xffffff,{map:F_FLOOR()})); fl.rotation.x=-Math.PI/2; F3.scene.add(fl);
  fMesh(fBox(FW+2*t,.3,FD+2*t),m(0x6b5a48),0,-.16,0);
  // Vier Wände; jede weiß ihre Richtung nach innen und wird ausgeblendet, wenn die Kamera hinter ihr steht
  const wall=(w,x,z,ry,nx,nz,door)=>{const g=new T.Group();g.position.set(x,0,z);g.rotation.y=ry;F3.scene.add(g);
    if(door){const dw=1.4, side=(w-dw)/2;
      fMesh(fBox(side,FH,t),wallM,-(dw+side)/2,FH/2,0,0,g); fMesh(fBox(side,FH,t),wallM,(dw+side)/2,FH/2,0,0,g);
      fMesh(fBox(dw,FH-2.4,t),wallM,0,2.4+(FH-2.4)/2,0,0,g);
      [.6,1.2,1.8].forEach((y,i)=>{const b=fMesh(fBox(1.7,.2,.06),woodL,0,y,-.14,0,g);b.rotation.z=[.25,-.15,.1][i];});} // Bretter vor der Tür
    else fMesh(fBox(w,FH,t),wallM,0,FH/2,0,0,g);
    F3.walls.push({g,nx,nz,x,z});return g;};
  const back=wall(FW+2*t,0,-FD/2-t/2,0,0,1), front=wall(FW+2*t,0,FD/2+t/2,0,0,-1,true);
  const left=wall(FD,-FW/2-t/2,0,Math.PI/2,1,0), right=wall(FD,FW/2+t/2,0,Math.PI/2,-1,0);
  // Fenster rechts mit geschlossenen Läden, Licht fällt durch die Ritzen
  fMesh(fBox(1.6,1.6,.06),m(0x55624f),0,2.1,-.13,0,right); fMesh(fBox(1.8,.12,.3),m(0xd6cfc0),0,1.25,-.18,0,right);
  for(let i=0;i<3;i++){const b=new T.Mesh(fBox(.08,1.5,3.2),new T.MeshBasicMaterial({color:0xffe6b0,transparent:true,opacity:.12,depthWrite:false}));
    b.position.set(FW/2-1.4,1.35,-.4+i*.45);b.rotation.z=-.62;F3.scene.add(b);F3.beams.push(b);}
  // Der alte Holzofen aus Ziegeln an der Rückwand (Kuppel, dunkle Öffnung, Ruß)
  const ox=-1.8, oz=-FD/2+1.2;
  fMesh(fBox(2.6,1,2),brick,ox,.5,oz);
  // Kuppel aus übereinander gestapelten Ringen (three-mini hat keine Kugel)
  for(let i=0;i<5;i++){const a=i/5*Math.PI/2, b=(i+1)/5*Math.PI/2, R=1.25;
    const d=new T.Mesh(new T.CylinderGeometry(R*Math.cos(b),R*Math.cos(a),R*.8*(Math.sin(b)-Math.sin(a)),16),brick);
    d.scale.z=.82; d.position.set(ox,1+R*.8*(Math.sin(a)+Math.sin(b))/2,oz); F3.scene.add(d);}
  const mouth=new T.Mesh(new T.CircleGeometry(.42,14,0,Math.PI),soot); mouth.position.set(ox,1.02,oz+1.02); F3.scene.add(mouth);
  fMesh(fBox(1,.08,.3),m(0x8e8070),ox,1,oz+1.1); fMesh(fBox(.5,1.6,.5),brick,ox+.5,2.6,oz-.4); // Sims, Kaminrohr
  // Holzschaufel am Ofen und ein paar alte Scheite
  const pala=fMesh(fBox(.07,2.2,.07),woodL,ox+1.6,1.1,oz+1.2); pala.rotation.z=.18; fMesh(fBox(.5,.04,.45),woodL,ox+1.82,.08,oz+1.2);
  [0,1,2].forEach(i=>{const l=new T.Mesh(new T.CylinderGeometry(.08,.08,.7,6),wood);l.rotation.z=Math.PI/2;l.position.set(ox-1.1+i*.05,.1+(i===2?.15:0),oz+1.3+i*.17*(i===2?0:1));F3.scene.add(l);});
  // Theke unter einem Staubtuch
  fMesh(fBox(3,1,.8),woodD,1.2,.5,.6); fMesh(fBox(3.2,.06,1),wood,1.2,1.03,.6);
  const tuch=fMesh(fBox(2.4,.04,1.05),cloth,1.4,1.08,.6); tuch.rotation.y=.05; fMesh(fBox(2.4,.5,.03),cloth,1.4,.85,1.12);
  // Leere Regale an der linken Wand, ein Korb und zwei Gläser
  fMesh(fBox(.4,2.6,2.6),woodD,-FW/2+.25,1.3,.9);
  [.5,1.2,1.9,2.55].forEach(y=>fMesh(fBox(.42,.06,2.5),wood,-FW/2+.3,y,.9));
  fMesh(new T.CylinderGeometry(.22,.16,.2,10),basket,-FW/2+.3,1.33,.4); fMesh(new T.CylinderGeometry(.08,.08,.22,8),m(0x9ab5aa,{transparent:true,opacity:.6}),-FW/2+.3,2.04,1.5);
  // Kisten, ein umgefallener Stuhl, ein Sack
  [[2.6,-2.2,0],[3.2,-2.4,.3],[2.85,-2.3,0,.62]].forEach(([x,z,r,y])=>fMesh(fBox(.7,.55,.6),wood,x,(y||0)+.28,z,r));
  const stuhl=new T.Group(); fMesh(fBox(.45,.05,.45),woodL,0,.45,0,0,stuhl); fMesh(fBox(.45,.5,.05),woodL,0,.72,-.2,0,stuhl);
  [[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]].forEach(([a,b])=>fMesh(fBox(.05,.45,.05),woodL,a,.22,b,0,stuhl));
  stuhl.rotation.z=Math.PI/2; stuhl.rotation.y=.6; stuhl.position.set(-.6,.22,1.9); F3.scene.add(stuhl);
  const sack=new T.Mesh(new T.CylinderGeometry(.24,.34,.5,10),m(0xcdbb94)); sack.position.set(-.2,.26,-2.6); F3.scene.add(sack);
  // Spinnweben in den oberen Ecken und Staubhaufen
  const web=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.22,side:T.DoubleSide,depthWrite:false});
  [[-1,-1],[1,-1]].forEach(([sx,sz])=>{const g=new T.BufferGeometry();
    g.setAttribute("position",new T.Float32BufferAttribute([0,0,0, -sx*.55,0,0, 0,-.55,0, 0,0,-sz*.55, -sx*.55,0,0, 0,-.55,0],3));
    const o=new T.Mesh(g,web);o.position.set(sx*(FW/2-.02),FH-.02,sz*(FD/2-.02));F3.scene.add(o);});
  [[1,-1.4,.5],[-2.6,2.2,.35],[3.2,1.8,.4]].forEach(([x,z,r])=>{const o=new T.Mesh(new T.CircleGeometry(r,12),dust);o.rotation.x=-Math.PI/2;o.position.set(x,.01,z);F3.scene.add(o);});
  // Lampe ohne Schirm an einem Kabel
  fMesh(fBox(.02,1,.02),iron,.4,FH-.5,.2); fMesh(new T.CylinderGeometry(.06,.09,.16,8),m(0xf6e3a6,{emissive:0x6a5020}),.4,FH-1.05,.2);
  // Staubkörner im Licht
  const r=seeded(11), dg=fBox(.025,.025,.025), dm=new T.MeshBasicMaterial({color:0xfff0d0,transparent:true,opacity:.7,depthWrite:false});
  F3.dust=[]; for(let i=0;i<40;i++)F3.dust.push(fMesh(dg,dm,1+r()*3,.3+r()*2.6,-2+r()*3));
}

/* ---------- Kamera, Zeichnen ---------- */
function fornoCam(){
  const c=F3.cam, t=F3.tgt; F3.ph=Math.max(.35,Math.min(1.35,F3.ph)); F3.rad=Math.max(4,Math.min(20,F3.rad));
  c.position.set(t.x+F3.rad*Math.sin(F3.ph)*Math.sin(F3.th),t.y+F3.rad*Math.cos(F3.ph),t.z+F3.rad*Math.sin(F3.ph)*Math.cos(F3.th));
  c.lookAt(t);
  // Wände zwischen Kamera und Raum ausblenden, damit man hineinschauen kann
  F3.walls.forEach(w=>{w.g.visible=(c.position.x-w.x)*w.nx+(c.position.z-w.z)*w.nz>-.1;});
}
function fornoResize(){
  const h=F3.host; if(!h)return; const w=h.clientWidth||300, hh=h.clientHeight||300;
  F3.r.setSize(w,hh,false); F3.cam.aspect=w/hh; F3.cam.fov=w<hh?62:45; F3.cam.updateProjectionMatrix();
  F3.win=winBox(h.classList.contains("full3d")?h:null);
}
function fornoLoop(now){
  F3.raf=0; if(!F3.host||!F3.host.isConnected||screen!=="forno")return;
  F3.raf=requestAnimationFrame(fornoLoop);
  if(now-F3.last<33)return; const dt=Math.min(.1,(now-F3.last)/1000); F3.last=now; F3.t+=dt;
  F3.dust.forEach((o,i)=>{o.position.y+=dt*.05*(1+(i%3));if(o.position.y>3)o.position.y=.3;o.position.x+=Math.sin(F3.t+i)*dt*.03;});
  F3.beams.forEach((b,i)=>{b.material.opacity=.1+Math.sin(F3.t*.7+i)*.03;});
  fornoCam(); F3.r.render(F3.scene,F3.cam);
}
function fornoMount(host){
  F3.host=host; if(!host||!fornoInit())return false;
  host.prepend(F3.r.domElement); fornoResize(); fornoCam(); F3.r.render(F3.scene,F3.cam);
  if(!F3.raf){F3.last=0;F3.raf=requestAnimationFrame(fornoLoop);}
  return true;
}

/* ---------- Bildschirm ---------- */
function fornoGo(){F3.msg=0;F3.th=.5;F3.ph=1;F3.rad=13;screen="forno";render();fornoSpeak();}
function fornoSpeak(){const [it]=(fornoMine()?FORNO_MINE:FORNO_SAY)[F3.msg];speak(it,"Signor Russo");}
function rForno(){
  const mine=fornoMine(), pool=mine?FORNO_MINE:FORNO_SAY, [it,de]=pool[F3.msg%pool.length];
  if(!cityCan()){$("#screen").innerHTML=`${head("Il vecchio forno",mine?"Gehört dir":"Vendesi")}<p class="note">3D geht auf diesem Gerät leider nicht.</p>`+fornoBar(mine);return;}
  $("#screen").innerHTML=`${head("Il vecchio forno",mine?"Gehört dir · noch leer":`Steht leer · zu verkaufen`)}
    <div class="map city full3d inside" id="forno3d">
      <button class="loc-msg land-msg fo-msg" data-act="fsay"><b>${mine?"Signor Russo":"Signor Russo, Makler"}:</b> „${esc(it)}“<small>${esc(de)}</small>
        <em>${mine?"Was hier einmal hineinkommt, folgt später.":"Antippen: er erzählt mehr."}</em></button>
      <p class="loc-hint">Ein Finger dreht, zwei Finger zoomen: schau dich drinnen um.</p>
    </div><div class="win3d"></div>${fornoBar(mine)}`;
  if(!fornoMount($("#forno3d")))$("#forno3d").innerHTML=`<p class="note loc-no3d">3D geht auf diesem Gerät leider nicht.</p>`;
}
function fornoBar(mine){
  const miss=FORNO_PREIS-S.coins;
  return `<div class="land-bar"><button class="sec" data-act="home">‹ Hinaus<small>zurück in die Stadt</small></button>
    ${mine?`<button class="sec" disabled>🔑 Gehört dir<small>gekauft an Tag ${S.forno.day}</small></button>`
      :`<button class="next" data-act="fbuy" ${miss>0?"disabled":""}>Comprare · ${FORNO_PREIS} €<small>${miss>0?`dir fehlen noch ${miss} €`:"Haus kaufen"}</small></button>`}</div>`;
}
function fornoBuy(){
  if(fornoMine())return;
  if(S.coins<FORNO_PREIS){sfx("wrong");return render();}
  S.coins-=FORNO_PREIS; S.forno={day:S.day}; F3.msg=0; save(); sfx("coins"); render(); fornoSpeak();
}
function fornoSay(){const pool=fornoMine()?FORNO_MINE:FORNO_SAY;F3.msg=(F3.msg+1)%pool.length;sfx("select");render();fornoSpeak();}

/* ---------- Finger ---------- */
function fornoPointers(el){
  const pinchNow=()=>{const [a,b]=[...F3.ptrs.values()];return {d:Math.max(20,Math.hypot(a.x-b.x,a.y-b.y))};};
  el.addEventListener("pointerdown",e=>{el.setPointerCapture(e.pointerId);F3.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(F3.ptrs.size===2){F3.drag=null;F3.pinch=pinchNow();return;} F3.drag={moved:false};});
  el.addEventListener("pointermove",e=>{
    const p=F3.ptrs.get(e.pointerId); if(!p)return; const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY;
    if(F3.ptrs.size>=2&&F3.pinch){const n=pinchNow();F3.rad*=F3.pinch.d/n.d;F3.pinch=n;return;}
    if(!F3.drag)return; F3.drag.moved=true; F3.th-=dx*.006; F3.ph-=dy*.005;
  });
  const up=e=>{F3.ptrs.delete(e.pointerId);if(F3.ptrs.size<2)F3.pinch=null;if(!F3.ptrs.size)F3.drag=null;};
  el.addEventListener("pointerup",up); el.addEventListener("pointercancel",up);
  el.addEventListener("wheel",e=>{e.preventDefault();F3.rad*=e.deltaY>0?1.1:.9;},{passive:false});
}
