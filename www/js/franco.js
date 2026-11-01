/* Franco und seine Ape: ein Gemüsehändler, der morgens (bevor du die Pizzeria öffnest) mit seinem dreirädrigen
   Piaggio-Lieferwagen durchs 3D-Viertel fährt und mit dem Megafon „Cipolle! Patate! Meloni!“ ruft.
   Antippen: die Ape hält an und Franco verkauft dir Kisten aus dem Vorrat des Spiels (wie am Markt, mercato.js),
   dazu Kartoffeln und Melonen, die es nur bei ihm gibt. Er spricht mit eigener Stimme (tools/stimmen, "fr").
   Ton im Raum: Motor, Hupe und Megafon kommen von der Ape (WebAudio-Panner mit HRTF), die Kamera hört zu.
   Hängt an stadt3d.js: buildCity() ruft francoBuild(), cityLoop() ruft francoTick(), Antippen geht über francoTap(). */
const FR={g:null,hit:null,wheels:[],head:null,s:0,v:0,state:"drive",open:false,msg:null,shoutAt:6,shoutI:0,shouting:null,
  lastTick:0,snd:null,carry:0,camGo:0,horned:false};
const FR_SPEED=4.2;                 // m/s, gemütlich wie eine echte Ape
const FR_PATH=[[-19,-17.5],[20.5,-17.5],[20.5,9.4],[-19,9.4]]; // Runde: Querstraße, Ostseite, vor der Piazza, Westseite
const FR_GOODS=["patate","melone","cipolla","pomodoro","zucchine","peperoni"];
const FR_RABATT=.1;                 // direkt von der Ape: etwas günstiger als am Markt
// Megafon-Rufe (Italienisch, Deutsch) und was er im Gespräch sagt
const FR_SHOUT=[["Cipolle! Patate! Meloni!","Zwiebeln! Kartoffeln! Melonen!"],
  ["Meloni dolci come lo zucchero!","Melonen, süß wie Zucker!"],
  ["Patate novelle, cipolle di Tropea!","Neue Kartoffeln, Zwiebeln aus Tropea!"],
  ["È arrivato Franco! Frutta e verdura!","Franco ist da! Obst und Gemüse!"],
  ["Signora, scendete! Meloni, patate, cipolle!","Signora, kommt runter! Melonen, Kartoffeln, Zwiebeln!"]];
const FR_SAY={
  greet:[["Eccomi, eccomi! Che Le do? Tutto fresco di campagna!","Da bin ich! Was darf's sein? Alles frisch vom Land!"],
    ["Buongiorno! Oggi i meloni sono dolcissimi!","Guten Morgen! Heute sind die Melonen supersüß!"],
    ["Fermo qui! Patate, cipolle, meloni: cosa prende?","Ich halte hier! Kartoffeln, Zwiebeln, Melonen: was nehmen Sie?"]],
  bought:[["Ecco a Lei! Altro?","Bitte schön! Noch etwas?"],["Ottima scelta! Ci vuole altro?","Gute Wahl! Brauchen Sie noch etwas?"],
    ["Perfetto! Glielo metto nella cassa.","Perfekt! Ich lege es Ihnen in die Kiste."]],
  poor:[["Eh, mi dispiace, i soldi non bastano.","Oh, tut mir leid, das Geld reicht nicht."]],
  bye:[["Grazie! A domani, stessa ora!","Danke! Bis morgen, gleiche Zeit!"]]
};
// Neue Wörter für das Antippen (Übersetzung)
Object.assign(DICT,Object.fromEntries(Object.entries({cipolle:"Zwiebeln",patate:"Kartoffeln",patata:"Kartoffel",meloni:"Melonen",melone:"Melone",
  dolci:"süß (Plural)",zucchero:"Zucker",novelle:"neu, frisch geerntet",tropea:"Tropea (Stadt in Kalabrien)",arrivato:"angekommen",
  frutta:"Obst",verdura:"Gemüse",signora:"Frau, meine Dame",scendete:"kommt herunter",eccomi:"da bin ich",campagna:"Land (nicht Stadt)",
  dolcissimi:"sehr süß",fermo:"ich halte an, stehe still",prende:"nehmen Sie",soldi:"Geld",bastano:"reichen",stessa:"gleiche",
  ottima:"sehr gute",vuole:"braucht man",glielo:"es Ihnen",metto:"ich lege",nella:"in die",cassa:"Kiste, Kasse",lo:"den, das",
  oggi:"heute",sono:"sind",tutto:"alles",fresco:"frisch",altro:"noch etwas, anderes"}).filter(([k])=>!DICT[k])));
const frPrice=k=>Math.max(1,Math.round(mkPrice(k)*(1-FR_RABATT)));
// Morgens = vor dem Öffnen: solange heute kein Spieltag läuft, ist Franco unterwegs
const francoHere=()=>!(G&&!G.summary)&&S.setupDone!==false;

/* ---------- Die Ape bauen ---------- */
// Kugel (three-mini hat keine SphereGeometry)
function frSphere(r,ws,hs){
  ws=ws||12; hs=hs||8; const P=[],N=[],U=[],I=[];
  for(let y=0;y<=hs;y++){const v=y/hs, th=v*Math.PI;
    for(let x=0;x<=ws;x++){const u=x/ws, ph=u*Math.PI*2, nx=-Math.cos(ph)*Math.sin(th), ny=Math.cos(th), nz=Math.sin(ph)*Math.sin(th);
      P.push(nx*r,ny*r,nz*r); N.push(nx,ny,nz); U.push(u,1-v);}}
  for(let y=0;y<hs;y++)for(let x=0;x<ws;x++){const a=y*(ws+1)+x, b=a+ws+1;
    if(y)I.push(a,b,a+1); if(y<hs-1)I.push(b,b+1,a+1);}
  const g=new THREE.BufferGeometry(); g.setIndex(I);
  g.setAttribute("position",new THREE.Float32BufferAttribute(P,3)); g.setAttribute("normal",new THREE.Float32BufferAttribute(N,3)); g.setAttribute("uv",new THREE.Float32BufferAttribute(U,2));
  return g;
}
function francoBuild(){
  const T=THREE, g=new T.Group(), body=c3mat(0x8cc0d4), dark=c3mat(0x2b2f2c), wood=c3mat(0xb07a46), chrome=c3mat(0xd8dce0);
  const B=(w,h,d,m,x,y,z,p)=>c3box(w,h,d,m,x,y,z,p||g);
  // Räder: eins vorn, zwei hinten
  const wheel=(x,z)=>{const w=new T.Mesh(new T.CylinderGeometry(.3,.3,.18,14),dark); w.rotation.z=Math.PI/2; w.position.set(x,.3,z); g.add(w);
    const hub=new T.Mesh(new T.CylinderGeometry(.13,.13,.2,10),chrome); hub.rotation.z=Math.PI/2; hub.position.set(x,.3,z); g.add(hub); FR.wheels.push(w);};
  wheel(0,1.15); wheel(-.66,-.85); wheel(.66,-.85);
  // Fahrerhaus vorn: hellblau, große Scheibe, Scheinwerfer, Rückspiegel
  B(1.3,.18,2.9,dark,0,.55,0);                       // Rahmen
  B(1.3,1.25,1.05,body,0,1.25,.85);                  // Kabine
  B(1.36,.12,1.15,c3mat(0xf3eee2),0,1.93,.85);       // weißes Dach
  B(1.12,.62,.06,c3mat(0x34424a),0,1.45,1.39);       // Windschutzscheibe
  [-.66,.66].forEach(x=>B(.06,.5,.6,c3mat(0x34424a),x,1.5,.85));         // Seitenfenster
  B(.6,.6,.3,body,0,.75,1.3);                        // Bug über dem Vorderrad
  const lamp=new T.Mesh(new T.CylinderGeometry(.11,.11,.08,12),c3mat(0xfff4c8,{emissive:0x8a7a40})); lamp.rotation.x=Math.PI/2; lamp.position.set(0,1.02,1.47); g.add(lamp);
  [-.72,.72].forEach(x=>B(.05,.14,.1,dark,x,1.62,1.3));
  // Franco am Steuer: Hemd, Gesicht, Schnurrbart, blaue Schiebermütze
  const fr=new T.Group(); fr.position.set(.1,1.1,.75); g.add(fr);
  B(.5,.5,.32,c3mat(0x3a7ab8),0,.15,0,fr);
  const head=new T.Group(); head.position.set(0,.6,0); fr.add(head); FR.head=head;
  B(.32,.34,.3,c3mat(0xc98e64),0,0,0,head); B(.24,.06,.05,c3mat(0x2a2420),0,-.08,.16,head);
  B(.38,.1,.42,c3mat(0x2f4a7a),0,.2,.05,head);
  // Megafon auf dem Dach, nach vorn gerichtet
  B(.06,.3,.06,dark,0,2.1,.95);
  const horn=new T.Mesh(new T.CylinderGeometry(.06,.24,.55,14,1,true),c3mat(0xf3eee2,{side:T.DoubleSide})); horn.rotation.x=Math.PI/2; horn.position.set(0,2.3,1.05); g.add(horn);
  B(.16,.16,.22,c3mat(0xd8402f),0,2.3,.72);
  // Ladefläche mit niedrigen Holzwänden
  B(1.45,.1,1.75,wood,0,.7,-.62);
  [[-.7,0],[.7,0]].forEach(([x])=>B(.06,.32,1.75,wood,x,.9,-.62)); B(1.45,.32,.06,wood,0,.9,-1.48);
  // Kisten mit Ware: Melonen, Kartoffeln, Zwiebeln, Tomaten
  const sph=(r,col,x,y,z,sx,sy,sz)=>{const o=new T.Mesh(frSphere(r,10,7),c3mat(col)); o.position.set(x,y,z); o.scale.set(sx||1,sy||1,sz||1); g.add(o);};
  const crate=(x,z)=>B(.62,.28,.7,c3mat(0xd4a467),x,.9,z);
  crate(-.33,-.25); crate(.33,-.25); crate(-.33,-1.02); crate(.33,-1.02);
  [[-.45,-.1],[-.22,-.4],[-.45,-.4],[-.22,-.1]].forEach(([x,z])=>sph(.15,0xd9c27a,x,1.15,z,1.05,.95,1));          // Melonen
  for(let i=0;i<9;i++)sph(.07,0xc99a5a,.15+(i%3)*.16,1.1,-.38+Math.floor(i/3)*.14,1.3,.8,1);                       // Kartoffeln
  for(let i=0;i<9;i++)sph(.075,0xb0508a,-.5+(i%3)*.16,1.1,-1.16+Math.floor(i/3)*.14);                             // Zwiebeln
  for(let i=0;i<9;i++)sph(.075,0xd22a1a,.17+(i%3)*.16,1.1,-1.16+Math.floor(i/3)*.14,1,.85,1);                     // Tomaten
  // Gestreiftes Sonnendach auf vier Stangen
  [[-.68,-.02],[.68,-.02],[-.68,-1.44],[.68,-1.44]].forEach(([x,z])=>B(.05,1.05,.05,dark,x,1.25,z));
  const aw=new T.Mesh(new T.BoxGeometry(1.55,.06,1.65),c3mat(0xffffff,{map:awningTex("#3a9a4a","#f3eee2")})); aw.position.set(0,1.8,-.73); g.add(aw);
  // Schild an beiden Seiten
  [-1,1].forEach(sd=>{const s=signMesh("FRANCO",1.5,.32,"#f4c64f","#2f4a7a"); s.position.set(sd*.74,.95,-.62); s.rotation.y=sd*Math.PI/2; g.add(s);});
  const sh=new T.Mesh(flatPlane(2.6,4),new T.MeshBasicMaterial({map:tex("blob"),transparent:true,depthWrite:false})); sh.position.y=.04; sh.renderOrder=-1; g.add(sh);
  // Unsichtbare, große Tippfläche: die Ape fährt, so trifft man sie leichter
  const hit=new T.Mesh(new T.BoxGeometry(2.4,2.8,4),new T.MeshBasicMaterial({visible:false})); hit.position.y=1.2; g.add(hit);
  g.userData.franco=true; FR.hit=g; FR.g=g; C3.scene.add(g); C3.picks.push(g);
  frPlace(0);
}
// Länge der Runde und Punkt bei s Metern
const frLen=()=>FR_PATH.reduce((a,p,i)=>{const q=FR_PATH[(i+1)%FR_PATH.length];return a+Math.hypot(q[0]-p[0],q[1]-p[1]);},0);
function frAt(s){
  const L=frLen(); s=((s%L)+L)%L;
  for(let i=0;i<FR_PATH.length;i++){const p=FR_PATH[i], q=FR_PATH[(i+1)%FR_PATH.length], d=Math.hypot(q[0]-p[0],q[1]-p[1]);
    if(s<=d){const k=s/d;return {x:p[0]+(q[0]-p[0])*k,z:p[1]+(q[1]-p[1])*k,h:Math.atan2(q[0]-p[0],q[1]-p[1]),left:d-s};} s-=d;}
  return {x:FR_PATH[0][0],z:FR_PATH[0][1],h:0,left:1};
}
function frPlace(dt){
  const a=frAt(FR.s), g=FR.g;
  // In den Kurven sanft lenken: Blick auf einen Punkt 2,5 m voraus
  const b=frAt(FR.s+2.5), want=Math.atan2(b.x-a.x,b.z-a.z);
  let dh=want-g.rotation.y; dh=Math.atan2(Math.sin(dh),Math.cos(dh));
  g.rotation.y+=dt?dh*Math.min(1,dt*5):dh;
  g.position.set(a.x,0,a.z);
}

/* ---------- Ton: Motor, Hupe, Megafon im Raum ---------- */
// Zweitakter im Leerlauf: kurze Knall-Pulse (Rauschen + tiefer Schlag), als Schleife; schneller abspielen = Gas geben
function frEngineBuf(){
  const sr=AC.sampleRate, n=Math.round(sr*2), b=AC.createBuffer(1,n,sr), d=b.getChannelData(0), F=38, rnd=seeded(7);
  for(let p=0;p<F*2;p++){const t0=Math.round(p*sr/F), a=.65+rnd()*.35, ph=rnd()*6;
    for(let i=0;i<sr*.024&&t0+i<n;i++){const t=i/sr;
      d[t0+i]+=a*((rnd()*2-1)*Math.exp(-t/.004)*.7+Math.sin(2*Math.PI*85*t+ph)*Math.exp(-t/.011)+Math.sin(2*Math.PI*410*t)*Math.exp(-t/.006)*.35);}}
  return b;
}
function frPanner(out){
  const p=AC.createPanner(); p.panningModel="HRTF"; p.distanceModel="inverse"; p.refDistance=14; p.maxDistance=250; p.rolloffFactor=1.1;
  p.connect(out); return p;
}
function frPanPos(p,x,y,z){if(p.positionX){p.positionX.value=x;p.positionY.value=y;p.positionZ.value=z;}else p.setPosition(x,y,z);}
function frSound(){
  if(FR.snd||!AC)return FR.snd;
  const eng=frPanner(sfxGain), voice=AC.createGain(); voice.gain.value=1; voice.connect(AC.destination);
  const vp=frPanner(voice);
  const src=AC.createBufferSource(); src.buffer=frEngineBuf(); src.loop=true;
  const lp=AC.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=1400; lp.Q.value=2;
  const g=AC.createGain(); g.gain.value=0;
  src.connect(lp); lp.connect(g); g.connect(eng); src.start();
  FR.snd={eng,vp,voice,src,g}; return FR.snd;
}
// Lautstärke des Motors: 0, wenn die Stadt nicht zu sehen ist (anderer Bildschirm, Franco nicht unterwegs)
function frEngine(on,rate){
  const s=FR.snd; if(!s)return;
  s.g.gain.setTargetAtTime(on&&vol("sfx")>0?.55:0,AC.currentTime,on?.15:.08);
  s.src.playbackRate.setTargetAtTime(rate||1,AC.currentTime,.25);
}
setInterval(()=>{if(FR.snd&&performance.now()-FR.lastTick>300){frEngine(false);frStopShout();}},250);
// Hupe der Ape: zweimal kurz und quäkig
function frHorn(){
  const s=frSound(); if(!s||vol("sfx")<=0)return; const t=AC.currentTime+.02;
  [0,.22].forEach(d=>{const o=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain();o.type="square";o2.type="square";o.frequency.value=415;o2.frequency.value=520;
    g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.18*vol("sfx"),t+d+.01);g.gain.setValueAtTime(.18*vol("sfx"),t+d+.14);g.gain.linearRampToValueAtTime(0,t+d+.17);
    o.connect(g);o2.connect(g);g.connect(s.eng);o.start(t+d);o2.start(t+d);o.stop(t+d+.2);o2.stop(t+d+.2);});
}
// Megafon: Bandpass, kräftig verzerrt, etwas Hall vom Trichter; kommt aus dem Panner an der Ape
function frMegaChain(dst){
  const hp=AC.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=520;
  const pk=AC.createBiquadFilter(); pk.type="peaking"; pk.frequency.value=1900; pk.Q.value=1.1; pk.gain.value=9;
  const lp=AC.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=3600;
  const ws=AC.createWaveShaper(), c=new Float32Array(1024); for(let i=0;i<1024;i++){const x=i/511.5-1;c[i]=Math.tanh(x*4.5)/Math.tanh(4.5);} ws.curve=c; ws.oversample="2x";
  const pre=AC.createGain(); pre.gain.value=2.2; const post=AC.createGain(); post.gain.value=1.6;
  const dl=AC.createDelay(); dl.delayTime.value=.045; const fb=AC.createGain(); fb.gain.value=.22;
  pre.connect(hp); hp.connect(pk); pk.connect(ws); ws.connect(lp); lp.connect(post); post.connect(dst);
  lp.connect(dl); dl.connect(fb); fb.connect(dl); fb.connect(dst);
  return pre;
}
function frStopShout(){const s=FR.shouting; FR.shouting=null; if(s)s.src.forEach(x=>{try{x.stop();}catch(e){}});}
// Ruft einen Satz mit Francos Stimme durchs Megafon (nur mit Aufnahme; ohne Aufnahme bleibt es beim Motor)
async function frShout(t){
  const s=frSound(); if(!s||vol("voice")<=0)return false;
  const parts=recParts("fr",t)||recParts("m",t), v=recParts("fr",t)?"fr":"m"; if(!parts)return false;
  frStopShout(); const tok={src:[]}; FR.shouting=tok;
  try{
    const bufs=await Promise.all(parts.map(k=>recLoad(`stimmen/${v}/${k}.mp3`)));
    if(FR.shouting!==tok)return false;
    s.voice.gain.value=vol("voice")*1.15;
    const inp=frMegaChain(s.vp); let at=AC.currentTime+.12;
    // Klick und kurzes Pfeifen beim Einschalten des Megafons
    const o=AC.createOscillator(),og=AC.createGain(); o.frequency.value=2300; og.gain.setValueAtTime(0,at-.1); og.gain.linearRampToValueAtTime(.05,at-.07); og.gain.linearRampToValueAtTime(0,at); o.connect(og); og.connect(s.vp); o.start(at-.1); o.stop(at+.02);
    bufs.forEach(b=>{const x=AC.createBufferSource(); x.buffer=b; x.playbackRate.value=1.04; x.connect(inp); x.start(at); tok.src.push(x); at+=b.duration/1.04+.05;});
    tok.src[tok.src.length-1].onended=()=>{if(FR.shouting===tok)FR.shouting=null;};
    return true;
  }catch(e){return false;}
}
// Die Kamera ist das Ohr
function frListener(){
  const L=AC.listener, c=C3.cam, f=new THREE.Vector3(); c.getWorldDirection(f); const u=c.up;
  if(L.positionX){L.positionX.value=c.position.x;L.positionY.value=c.position.y;L.positionZ.value=c.position.z;
    L.forwardX.value=f.x;L.forwardY.value=f.y;L.forwardZ.value=f.z;L.upX.value=u.x;L.upY.value=u.y;L.upZ.value=u.z;}
  else{L.setPosition(c.position.x,c.position.y,c.position.z);L.setOrientation(f.x,f.y,f.z,u.x,u.y,u.z);}
}

/* ---------- Jedes Bild (aus cityLoop) ---------- */
function francoTick(dt){
  if(!FR.g)return;
  FR.lastTick=performance.now();
  const here=francoHere(); FR.g.visible=here;
  // Unsichtbar heißt auch: nicht antippbar (der Raycaster schaut nicht auf visible)
  const pi=C3.picks.indexOf(FR.g); if(here&&pi<0)C3.picks.push(FR.g); else if(!here&&pi>=0)C3.picks.splice(pi,1);
  if(!here){if(FR.open)francoClose(true);frEngine(false);frStopShout();frPin(false);return;}
  // Fahren, bremsen, stehen
  const target=FR.state==="drive"?FR_SPEED:0;
  FR.v+=(target-FR.v)*Math.min(1,dt*(FR.state==="drive"?.9:2.6));
  if(FR.state==="stopping"&&FR.v<.05){FR.v=0;FR.state="stop";}
  FR.s+=FR.v*dt; frPlace(dt);
  FR.wheels.forEach(w=>w.rotation.x+=FR.v*dt/.3);
  FR.g.position.y=Math.sin(C3.t*31)*.012*(.3+FR.v/FR_SPEED); // Zweitakter rüttelt
  if(FR.head)FR.head.rotation.y=FR.state==="stop"?Math.sin(C3.t*1.3)*.3+.6:Math.sin(C3.t*.7)*.15;
  // Kamera schwenkt sanft zur stehenden Ape
  if(FR.camGo>0){FR.camGo-=dt;const k=Math.min(1,dt*3);C3.tgt.x+=(FR.g.position.x-C3.tgt.x)*k;C3.tgt.z+=(FR.g.position.z-C3.tgt.z)*k;C3.rad+=(Math.min(C3.rad,42)-C3.rad)*k;}
  // Ton
  if(AC){const s=frSound(); frListener(); const p=FR.g.position;
    frPanPos(s.eng,p.x,.6,p.z); frPanPos(s.vp,p.x,2.3,p.z);
    frEngine(true,.72+.5*FR.v/FR_SPEED);
    if(FR.state==="drive"){FR.shoutAt-=dt; if(FR.shoutAt<=0){FR.shoutAt=8+Math.random()*5;
      const sh=FR_SHOUT[FR.shoutI++%FR_SHOUT.length]; FR.msg=sh; frShout(sh[0]);}}}
  frPin(true); frPanelKeep();
}
// Schild über der Ape (folgt ihr), zeigt den letzten Ruf
function frPin(on){
  const box=C3.host&&C3.host.querySelector(".city-pins"); if(!box)return;
  let el=box.querySelector(".fr-pin");
  if(!on||FR.open){if(el)el.style.display="none";return;}
  if(!el){el=document.createElement("button");el.className="city-pin fr-pin";el.setAttribute("aria-label","Franco mit seiner Ape: antippen zum Einkaufen");
    el.innerHTML=`<b>📣 Franco</b><small></small>`;el.addEventListener("click",e=>{e.stopPropagation();francoTap();});box.appendChild(el);}
  const v=new THREE.Vector3(FR.g.position.x,2.9,FR.g.position.z).project(C3.cam), w=C3.host.clientWidth, h=C3.host.clientHeight;
  const ok=v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1; el.style.display=ok?"":"none";
  if(ok)el.style.transform=`translate(${(v.x+1)/2*w}px,${(1-v.y)/2*h}px) translate(-50%,-100%)`;
  const sm=el.querySelector("small"), txt=FR.shouting&&FR.msg?FR.msg[0]:"Ape · Obst & Gemüse · antippen";
  if(sm.textContent!==txt)sm.textContent=txt;
}

/* ---------- Anhalten und verkaufen ---------- */
// Trifft der Tipp-Strahl die Ape? Dann anhalten (true), sonst geht der Tipp an die Orte
function francoHit(rc){
  if(!FR.g||!FR.g.visible||!francoHere()||!rc.intersectObject(FR.g,true).length)return false;
  francoTap(); return true;
}
function francoTap(){
  if(!francoHere()||!FR.g)return;
  if(FR.open)return;
  initAudio(); FR.open=true; FR.state="stopping"; FR.camGo=1.2; frStopShout(); sfx("select");
  const s=frSound(); if(s&&AC){const t=AC.currentTime; // Bremsen: Quietschen
    const o=AC.createOscillator(),g=AC.createGain();o.type="sawtooth";o.frequency.setValueAtTime(1500,t);o.frequency.linearRampToValueAtTime(1150,t+.5);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05*vol("sfx"),t+.05);g.gain.linearRampToValueAtTime(0,t+.55);o.connect(g);g.connect(s.eng);o.start(t);o.stop(t+.6);}
  frSay(pick(FR_SAY.greet),700);
}
function frSay(line,delay){
  FR.say=line; frPanel();
  setTimeout(()=>{if(FR.open&&FR.say===line)speak(line[0],"Franco");},delay||0);
}
function frBuy(k){
  const p=frPrice(k);
  if(!FR_GOODS.includes(k)||!ING[k])return;
  if(S.coins<p){sfx("wrong");return frSay(FR_SAY.poor[0]);}
  S.coins-=p; FR.note=addStock(k,KISTE); sfx("coins"); save();
  if(typeof rTopbar==="function")rTopbar();
  frSay(pick(FR_SAY.bought));
}
function francoClose(quiet){
  if(!FR.open)return;
  FR.open=false; FR.note=""; const p=C3.host&&C3.host.querySelector(".fr-panel"); if(p)p.remove();
  if(quiet){FR.state="drive";return;}
  const line=FR_SAY.bye[0]; FR.msg=line; speak(line[0],"Franco");
  setTimeout(()=>{if(!FR.open){frHorn();FR.state="drive";FR.shoutAt=5;}},1600);
}
function frPanelHTML(){
  const [it,de]=FR.say||FR_SAY.greet[0];
  return `<div class="fr-top"><span class="fr-face" aria-hidden="true">${face("Franco",2)}</span>
      <div class="bubble"><div class="who">Franco · con l'Ape</div><div class="it">${wordsHTML(it,true)}</div><div class="tr">${esc(de)}</div></div>
      <button class="fr-x" data-fr="bye" aria-label="Weiterfahren lassen">✕</button></div>
    <div class="fr-goods">${FR_GOODS.map(k=>{const p=frPrice(k), only=ING[k][2]>=9;
      return `<button class="fr-good${only?" only":""}" data-fr="buy" data-k="${k}" ${S.coins<p?"disabled":""} aria-label="Eine Kiste ${esc(ING[k][0])} für ${p} Euro">
        ${kisteImg(k)}<b>${k}</b><small>${esc(ING[k][0])}${only?" · nur hier":""}</small><small>Vorrat ${stockOf(k)}</small><span class="fr-price">+${KISTE} · ${p} €</span></button>`;}).join("")}</div>
    <p class="fr-info">Kasse <b>${S.coins} €</b> · 1 Kiste = ${KISTE} Portionen · direkt von der Ape ${FR_RABATT*100} % günstiger${FR.note?`<br><b>${esc(FR.note)}</b>`:""}</p>
    <button class="sec fr-bye" data-fr="bye">Arrivederci! <small>weiterfahren lassen</small></button>`;
}
function frPanel(){
  const host=C3.host; if(!host||!FR.open)return;
  let el=host.querySelector(".fr-panel");
  if(!el){el=document.createElement("div");el.className="fr-panel";el.setAttribute("role","dialog");el.setAttribute("aria-label","Franco verkauft Obst und Gemüse");
    el.addEventListener("click",e=>{const b=e.target.closest("[data-fr]");if(!b)return;e.stopPropagation();
      if(b.dataset.fr==="buy")frBuy(b.dataset.k); else{sfx("click");francoClose();}});
    ["pointerdown","pointerup","wheel"].forEach(ev=>el.addEventListener(ev,e=>e.stopPropagation()));
    host.appendChild(el);}
  el.innerHTML=frPanelHTML();
}
// Nach einem render() ist die Stadt neu eingehängt: Fenster wieder dazulegen
function frPanelKeep(){if(FR.open&&C3.host&&!C3.host.querySelector(".fr-panel"))frPanel();}
