/* Neapel im 3D-Viertel: was die Stadt neapolitanisch macht (hängt an stadt3d.js, wie franco.js).
   - Häuser: Sockel aus grauem Piperno-Stein, Gesims über dem Erdgeschoss und oben (Cornicione), schmale Eisenbalkone
     vor jeder Fenstertür mit Blumentöpfen, Dachterrassen mit Brüstung und Pflanzen, Bogentüren der „bassi“ unten.
   - Wäscheleinen quer über die Gassen, mit bunter Wäsche.
   - Kirche mit Fassade aus Diamantquadern (wie Gesù Nuovo), gelb-grüner Majolika-Kuppel, Glockenturm,
     davor eine kleine Piazza mit Guglia (Prunksäule) und Palmen.
   - Castel dell'Ovo: Burg aus gelbem Tuffstein auf einer Insel vor der Promenade, mit Damm.
   - Il bosco: ein gemischter Wald westlich der Stadt (npForest).
   - Straßenschilder aus Marmor (Spaccanapoli, Via Toledo) und eine Edicola votiva (Heiligenbild an der Hauswand).
   buildCity() ruft napoliSite() (wo keine Häuser stehen), napoliHouse() für jedes Haus und am Ende napoliBuild().
   Gleiche Teile werden wie in stadt3d.js zu wenigen Meshes zusammengelegt. Eigener Zufall, damit sich sonst nichts verschiebt. */
const NP={batch:{},houses:[],rnd:seeded(1647)};
const NP_CHURCH=[-36,-24,-14,4];        // Kirche mit Piazzetta: x0, x1, z0, z1
const NP_CLOTH=["#f6f3ec","#e5533f","#2f78c4","#f4c64f","#7ab8d9","#f2a0b5","#3a9a4a","#ffffff"];

function np(key,geo,x,y,z,ry){
  const m=new THREE.Matrix4().makeRotationY(ry||0); m.setPosition(x,y,z);
  const g=geo.index?geo.toNonIndexed():geo.clone(); g.applyMatrix4(m); (NP.batch[key]=NP.batch[key]||[]).push(g);
}
const npBox=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const npPlane=(w,h)=>new THREE.PlaneGeometry(w,h);
// Teil an einer Hauswand: u entlang der Wand, v nach außen; ry = Richtung der Wand (0 = Süden)
function npAt(key,geo,cx,cz,ry,u,y,v){np(key,geo,cx+Math.cos(ry)*u+Math.sin(ry)*v,y,cz-Math.sin(ry)*u+Math.cos(ry)*v,ry);}

// Auf diesen Grundstücken stehen keine Wohnhäuser
function napoliSite(x0,x1,z0,z1){const s=NP_CHURCH;return x0<s[1]&&x1>s[0]&&z0<s[3]&&z1>s[2];}

/* ---------- Häuser ---------- */
function napoliHouse(cx,cz,w,d,h,n,balc){
  const R=NP.rnd, T=THREE;
  NP.houses.push({cx,cz,w,d,h,n,x0:cx-w/2,x1:cx+w/2,z0:cz-d/2,z1:cz+d/2});
  np("piperno",npBox(w+.06,1,d+.06),cx,.5,cz);                  // Sockel
  np("stucco",npBox(w+.12,.14,d+.12),cx,3.25,cz);               // Gesims über dem Erdgeschoss
  np("stucco",npBox(w+.32,.28,d+.32),cx,h-.1,cz);               // Cornicione
  // Dachterrasse mit Brüstung, Töpfen und manchmal einer Pergola
  if(R()<.65){const y=h+.35+.4;
    np("stucco",npBox(w+.2,.8,.15),cx,y,cz-d/2-.02); np("stucco",npBox(w+.2,.8,.15),cx,y,cz+d/2+.02);
    np("stucco",npBox(.15,.8,d+.2),cx-w/2-.02,y,cz); np("stucco",npBox(.15,.8,d+.2),cx+w/2+.02,y,cz);
    for(let k=0,m=1+Math.floor(R()*3);k<m;k++){const px=cx-w/2+.6+R()*(w-1.2), pz=cz+d/2-.6;
      np("pot",npBox(.45,.4,.45),px,h+.55,pz); np(R()<.5?"plant":"plant2",new T.CylinderGeometry(.35,.2,.7,6),px,h+1.1,pz);}
    if(R()<.3){const px=cx-w/4;[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>np("wood",npBox(.1,2,.1),px+a*1,h+1.35,cz+b*1));
      np("vine",npBox(2.4,.12,2.4),px,h+2.4,cz);}
  }
  // Wände: Süden immer mit Balkonen (wenn das Haus welche hat), Norden oft, Osten/Westen manchmal
  const faces=[[0,w,d/2,balc||R()<.4],[Math.PI,w,d/2,R()<.5],[Math.PI/2,d,w/2,R()<.3],[-Math.PI/2,d,w/2,R()<.3]];
  faces.forEach(([ry,L,off,has],fi)=>{
    // Fensterfelder: die Fassaden-Textur beginnt (von außen gesehen) an der linken Hauskante, je 3 m ein Fenster
    const B=[]; for(let u=1.5;u+.6<L;u+=3)B.push(u-L/2);
    if(has)for(let k=1;k<n;k++)B.forEach(u=>{
      if(R()<.12)return;
      const y=k*3.2+.62;
      npAt("slab",npBox(1.75,.12,.62),cx,cz,ry,u,y,off+.31);
      npAt("rail",npPlane(1.75,.85),cx,cz,ry,u,y+.48,off+.6);
      [-1,1].forEach(sd=>{const g=npPlane(.6,.85); g.rotateY(Math.PI/2);
        npAt("rail",g,cx,cz,ry,u+sd*.875,y+.48,off+.31);});
      if(R()<.35){const pu=u+(R()-.5)*1.1; npAt("pot",npBox(.28,.28,.28),cx,cz,ry,pu,y+.2,off+.42);
        npAt(R()<.45?"flower":"plant",new T.CylinderGeometry(.25,.12,.42,6),cx,cz,ry,pu,y+.52,off+.42);}
    });
    // Erdgeschoss zur Gasse: Bogentüren der „bassi“
    if(fi<2)B.forEach(u=>{if(R()<.4){const key=R()<.5?"door":"door2";
      npAt("stucco",npBox(1.5,2.5,.06),cx,cz,ry,u,1.2,off+.02);
      npAt(key,npBox(1.15,1.85,.08),cx,cz,ry,u,.93,off+.05);
      const a=new T.CylinderGeometry(.575,.575,.08,12,1,false,Math.PI/2,Math.PI); a.rotateX(Math.PI/2);
      npAt(key,a,cx,cz,ry,u,1.85,off+.05);}});
  });
}

/* ---------- Wäscheleinen über den Gassen ---------- */
function npLaundry(){
  const R=NP.rnd, H=NP.houses, T=THREE;
  const piece=(x,y,z,ry)=>{const t=R(), [w,h]=t<.3?[.5,.6]:t<.55?[1,.85]:t<.8?[.4,.5]:[.36,.75];
    np("c"+Math.floor(R()*NP_CLOTH.length),npPlane(w,h),x,y-h/2-.02,z,ry+(R()-.5)*.25);return w;};
  const line=(ax,az,bx,bz,y)=>{const L=Math.hypot(bx-ax,bz-az), ry=Math.atan2(-(bz-az),bx-ax);
    np("line",npBox(L,.03,.03),(ax+bx)/2,y,(az+bz)/2,ry);
    for(let s=.4+R()*.4;s<L-.5;){const f=s/L, w=piece(ax+(bx-ax)*f,y,az+(bz-az)*f,ry); s+=w+.1+R()*.5;}};
  let count=0;
  for(let i=0;i<H.length;i++)for(let j=0;j<H.length;j++){if(i===j)continue;
    const a=H[i], b=H[j];
    // b liegt östlich von a (Leine in x-Richtung) oder südlich (Leine in z-Richtung)
    [["x",b.x0-a.x1,Math.min(a.z1,b.z1)-Math.max(a.z0,b.z0)],["z",b.z0-a.z1,Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0)]].forEach(([ax,gap,ov])=>{
      if(gap<2.5||gap>12.5||ov<2)return;
      const between=H.some(c=>c!==a&&c!==b&&(ax==="x"?c.x0<b.x0&&c.x1>a.x1&&c.z0<Math.min(a.z1,b.z1)&&c.z1>Math.max(a.z0,b.z0)
                                              :c.z0<b.z0&&c.z1>a.z1&&c.x0<Math.min(a.x1,b.x1)&&c.x1>Math.max(a.x0,b.x0)));
      if(between||R()<.25)return;
      const top=Math.min(a.n,b.n)-1, lines=1+(R()<.4?1:0);
      for(let k=0;k<lines;k++){const fl=1+Math.floor(R()*top), y=fl*3.2+2.75;
        if(ax==="x"){const z=Math.max(a.z0,b.z0)+.8+R()*(ov-1.6); line(a.x1,z,b.x0,z,y);}
        else{const x=Math.max(a.x0,b.x0)+.8+R()*(ov-1.6); line(x,a.z1,x,b.z0,y);}
        count++;}
    });
  }
  return count;
}

/* ---------- Kirche mit Majolika-Kuppel, Piazzetta mit Guglia und Palmen ---------- */
function npTex(w,h,draw,rep){const t=canvasTex(w,h,draw);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rep)t.repeat.set(rep[0],rep[1]);return t;}
// Halbkugel (three-mini hat keine SphereGeometry)
function npDome(r,ws,hs){
  const P=[],N=[],U=[],I=[];
  for(let y=0;y<=hs;y++){const th=y/hs*Math.PI/2;
    for(let x=0;x<=ws;x++){const ph=x/ws*Math.PI*2, nx=Math.cos(ph)*Math.sin(th), ny=Math.cos(th), nz=-Math.sin(ph)*Math.sin(th);
      P.push(nx*r,ny*r,nz*r); N.push(nx,ny,nz); U.push(x/ws,1-y/hs);}}
  for(let y=0;y<hs;y++)for(let x=0;x<ws;x++){const a=y*(ws+1)+x, b=a+ws+1; I.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry(); g.setIndex(I);
  g.setAttribute("position",new THREE.Float32BufferAttribute(P,3)); g.setAttribute("normal",new THREE.Float32BufferAttribute(N,3)); g.setAttribute("uv",new THREE.Float32BufferAttribute(U,2));
  return g;
}
function npChurch(){
  const T=THREE, [sx0,sx1,sz0,sz1]=NP_CHURCH, cx=(sx0+sx1)/2, fz=-5;   // Fassade bei z = -5, schaut nach Süden
  const mesh=(geo,m,x,y,z,ry)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);if(ry)o.rotation.y=ry;C3.scene.add(o);return o;};
  // Diamantquader aus Piperno (wie die Fassade von Gesù Nuovo)
  const diamond=npTex(64,64,(g,w)=>{g.fillStyle="#9c978c";g.fillRect(0,0,w,w);
    for(let y=0;y<4;y++)for(let x=0;x<4;x++){const X=x*16,Y=y*16;
      g.fillStyle="#b9b4a8";g.beginPath();g.moveTo(X+1,Y+1);g.lineTo(X+15,Y+1);g.lineTo(X+8,Y+8);g.fill();
      g.fillStyle="#a7a296";g.beginPath();g.moveTo(X+1,Y+1);g.lineTo(X+8,Y+8);g.lineTo(X+1,Y+15);g.fill();
      g.fillStyle="#8a8579";g.beginPath();g.moveTo(X+15,Y+1);g.lineTo(X+15,Y+15);g.lineTo(X+8,Y+8);g.fill();
      g.fillStyle="#7c776c";g.beginPath();g.moveTo(X+1,Y+15);g.lineTo(X+15,Y+15);g.lineTo(X+8,Y+8);g.fill();}},[4,5]);
  const side=npTex(64,64,(g,w)=>{g.fillStyle="#f1e6cc";g.fillRect(0,0,w,w);g.fillStyle="#e2d4b4";g.fillRect(0,56,w,8);
    g.fillStyle="#3b4650";g.fillRect(24,14,16,30);g.beginPath();g.arc(32,14,8,Math.PI,0);g.fill();
    g.strokeStyle="#fbf6ea";g.lineWidth=3;g.strokeRect(22,14,20,32);},[4,3]);
  // Kuppel: gelb-grüne Majolika-Ziegel im Zickzack
  const maj=npTex(64,64,(g,w)=>{const c=["#f2c230","#3f8a4f","#f2c230","#2f6aa8"];
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){g.fillStyle=c[(y+(x+y)%2*2)%4];g.fillRect(x*8,y*8,8,8);}
    g.strokeStyle="rgba(0,0,0,.15)";for(let i=0;i<=8;i++){g.beginPath();g.moveTo(i*8,0);g.lineTo(i*8,w);g.stroke();}},[10,3]);
  const stuc=c3mat(0xf6f1e6), pip=c3mat(0x8f8a80), dark=c3mat(0x2b2a28);
  // Schiff mit Seitenwänden, Fassade, Portal, Dach
  mesh(new T.BoxGeometry(7,10,9),c3mat(0xffffff,{map:side}),cx,5,fz-4.5);
  mesh(new T.BoxGeometry(7.4,.4,9.4),stuc,cx,10.2,fz-4.5);
  mesh(new T.BoxGeometry(8,11,.6),[pip,pip,stuc,pip,c3mat(0xffffff,{map:diamond}),pip],cx,5.5,fz+.3);
  mesh(new T.BoxGeometry(8.4,.5,.9),stuc,cx,11.1,fz+.3);
  const ped=new T.CylinderGeometry(1,1,.5,3); ped.rotateX(Math.PI/2); ped.rotateZ(Math.PI); ped.scale(2.6,1.2,1);
  mesh(ped,stuc,cx,12.1,fz+.3);
  mesh(new T.BoxGeometry(3,4.6,.2),c3mat(0xfbf7ef),cx,2.3,fz+.62);
  mesh(new T.BoxGeometry(1.9,3.1,.2),c3mat(0x4a2e1e),cx,1.55,fz+.7);
  const arch=new T.CylinderGeometry(.95,.95,.2,14,1,false,Math.PI/2,Math.PI); arch.rotateX(Math.PI/2); mesh(arch,c3mat(0x4a2e1e),cx,3.1,fz+.7);
  const ros=new T.CylinderGeometry(.9,.9,.2,16); ros.rotateX(Math.PI/2); mesh(ros,c3mat(0xfbf7ef),cx,7.4,fz+.62);
  const ros2=new T.CylinderGeometry(.65,.65,.22,16); ros2.rotateX(Math.PI/2); mesh(ros2,c3mat(0x3b4650),cx,7.4,fz+.66);
  mesh(new T.BoxGeometry(7,.35,1.2),c3mat(0xd8d0c0),cx,.17,fz+1.2); mesh(new T.BoxGeometry(6,.35,.8),c3mat(0xd8d0c0),cx,.5,fz+1);
  // Querhaus und Kuppel hinten über der Vierung
  const kz=fz-7;
  mesh(new T.BoxGeometry(10,9,3.6),c3mat(0xffffff,{map:side.clone()}),cx,4.5,kz);
  mesh(new T.BoxGeometry(10.4,.4,4),stuc,cx,9.2,kz);
  mesh(new T.CylinderGeometry(3,3.1,2.6,20),c3mat(0xf1e6cc),cx,10.7,kz);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2; mesh(new T.BoxGeometry(.5,1.3,.1),c3mat(0x3b4650),cx+Math.sin(a)*3.06,10.7,kz+Math.cos(a)*3.06,a);}
  mesh(new T.CylinderGeometry(3.3,3.3,.3,20),stuc,cx,12.1,kz);
  mesh(npDome(3.15,24,8),c3mat(0xffffff,{map:maj}),cx,12.2,kz);
  mesh(new T.CylinderGeometry(.55,.6,1.2,10),stuc,cx,15.8,kz); mesh(new T.CylinderGeometry(0,.7,.8,10),c3mat(0xf2c230),cx,16.8,kz);
  mesh(new T.BoxGeometry(.08,.9,.08),c3mat(0xd9a93a),cx,17.6,kz); mesh(new T.BoxGeometry(.5,.08,.08),c3mat(0xd9a93a),cx,17.75,kz);
  // Glockenturm rechts neben der Kirche
  const tx=sx1-1.5, tz=fz-1.6;
  mesh(new T.BoxGeometry(2.4,15,2.4),c3mat(0xffffff,{map:npTex(64,64,(g,w)=>{g.fillStyle="#f1e6cc";g.fillRect(0,0,w,w);g.fillStyle="#e2d4b4";g.fillRect(0,0,w,3);},[1,5])}),tx,7.5,tz);
  mesh(new T.BoxGeometry(2.7,.3,2.7),stuc,tx,12.4,tz); mesh(new T.BoxGeometry(2.7,.3,2.7),stuc,tx,15.1,tz);
  [0,Math.PI/2,Math.PI,-Math.PI/2].forEach(a=>{mesh(new T.BoxGeometry(1,1.8,.1),dark,tx+Math.sin(a)*1.22,13.6,tz+Math.cos(a)*1.22,a);});
  const bell=new T.Mesh(new T.CylinderGeometry(.2,.45,.6,10),c3mat(0xd9a93a)); bell.position.set(tx,13.5,tz); C3.scene.add(bell);
  const pyr=new T.CylinderGeometry(0,1.7,2.4,4); pyr.rotateY(Math.PI/4); mesh(pyr,c3mat(0xc4673f),tx,16.45,tz);
  const clock=new T.CylinderGeometry(.45,.45,.06,16); clock.rotateX(Math.PI/2); mesh(clock,c3mat(0xfbf7ef),tx,11.2,tz+1.23);
  // Piazzetta vor der Kirche
  c3plane(sx1-sx0,sz1-fz-.2,c3mat(0xffffff,{map:PIAZZA_TEX()}),cx,.025,(fz+.2+sz1)/2,4);
  // Guglia: Prunksäule aus Piperno und Marmor mit goldener Figur
  const gx=cx, gz=(fz+sz1)/2+1.4;
  [[2.4,.5,2.4,.25,"piperno"],[1.8,2,1.8,1.5,"marble"],[1.3,2.4,1.3,3.7,"piperno"],[.9,2.6,.9,6.2,"marble"],[.55,2.4,.55,8.7,"marble"]]
    .forEach(([w,h,d,y,k])=>np(k,npBox(w,h,d),gx,y,gz));
  np("gold",new T.CylinderGeometry(.18,.3,.9,8),gx,10.35,gz); np("gold",frSphere(.18,8,6),gx,10.95,gz);
  np("shadow",flatPlane(4,4),gx,.03,gz);
  // Palmen an der Piazzetta
  [[sx0+1.4,sz1-1.4],[sx1-1.4,sz1-1.4],[sx0+1.4,fz+2.2]].forEach(([x,z],i)=>npPalm(x,z,i));
  // Laternen
  [[sx0+1.2,fz+1.2],[sx1-3.4,fz+1.2]].forEach(([x,z])=>{np("iron",new T.CylinderGeometry(.08,.12,3.2,6),x,1.6,z);np("lamp",npBox(.45,.45,.45),x,3.3,z);});
}
function npPalm(x,z,i){
  const T=THREE, h=5.5+(i%2)*1.2;
  for(let k=0;k<5;k++){const t=new T.CylinderGeometry(.16-k*.01,.2-k*.01,h/5+.05,6); np("palmtrunk",t,x+k*.08,h/10+k*h/5,z);}
  for(let k=0;k<7;k++){const f=new T.BoxGeometry(.5,.05,2.4); f.translate(0,0,1.2); f.rotateX(.45+(k%2)*.2); f.rotateY(k/7*Math.PI*2+i);
    np("palm",f,x+.4,h+.1,z);}
  np("shadow",flatPlane(4,4),x,.03,z);
}

/* ---------- Castel dell'Ovo auf seiner Insel ---------- */
function npCastle(){
  const T=THREE, x=-52, z=PROM_Z[1]+24;
  const tuff=npTex(64,64,(g,w)=>{g.fillStyle="#d4ae68";g.fillRect(0,0,w,w);
    for(let y=0;y<8;y++)for(let k=0;k<4;k++){g.fillStyle=["#dcb874","#cba25e","#d8b16c","#c79c58"][(k*3+y)%4];g.fillRect(k*16+(y%2)*8+1,y*8+1,14,6);}},[3,2]);
  const wall=c3mat(0xffffff,{map:tuff}), cap=c3mat(0xc79c58), dark=c3mat(0x2b2a28);
  const mesh=(geo,m,X,Y,Z)=>{const o=new T.Mesh(geo,m);o.position.set(X,Y,Z);C3.scene.add(o);return o;};
  // Felsen und Damm zur Promenade
  mesh(new T.CylinderGeometry(9.5,11,2,12),c3mat(0x8c8577),x,-.4,z);
  mesh(new T.BoxGeometry(3.2,.5,z-9-PROM_Z[1]+.5),wall,x,.55,(PROM_Z[1]+z-9)/2);
  for(let zz=PROM_Z[1]+1.5;zz<z-9;zz+=2.2){mesh(new T.BoxGeometry(3.2,1.2,.9),wall,x,-.1,zz);}
  // Mauern, Bastion zum Meer, hoher Turm
  mesh(new T.BoxGeometry(13,5,9),wall,x,3,z); mesh(new T.BoxGeometry(13.3,.3,9.3),cap,x,5.6,z);
  const bas=mesh(new T.CylinderGeometry(3.8,4.2,5,16),c3mat(0xffffff,{map:tuff.clone()}),x+4.5,3,z+4.6); bas.material.map.repeat.set(4,2);
  mesh(new T.BoxGeometry(5,9,5),wall,x-3.5,5,z-1.5); mesh(new T.BoxGeometry(5.3,.3,5.3),cap,x-3.5,9.6,z-1.5);
  mesh(new T.BoxGeometry(3,2,3),c3mat(0xf1e6cc),x+2.5,6.5,z-2); mesh(new T.BoxGeometry(3.3,.3,3.3),c3mat(0xc4673f),x+2.5,7.6,z-2);
  // Zinnen
  const mer=(X,Z,Y)=>np("tuffcap",npBox(.6,.6,.6),X,Y,Z);
  for(let k=-6;k<=6;k+=1.5){mer(x+k,z-4.5,6.05);mer(x+k,z+4.5,6.05);}
  for(let k=-3;k<=3;k+=1.5){mer(x-6.5,z+k,6.05);mer(x+6.5,z+k,6.05);}
  for(let k=-2;k<=2;k+=1.33){mer(x-3.5+k,z-4,10.05);mer(x-3.5+k,z+1,10.05);mer(x-6,z-1.5+k,10.05);mer(x-1,z-1.5+k,10.05);}
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;mer(x+4.5+Math.sin(a)*3.9,z+4.6+Math.cos(a)*3.9,5.8);}
  // Tor zum Damm, Fensterschlitze, Fahne
  mesh(new T.BoxGeometry(1.6,2.4,.1),dark,x,1.9,z-4.52);
  [-4,-1.5,1.5,4].forEach(k=>mesh(new T.BoxGeometry(.25,.9,.1),dark,x+k,3.6,z+4.52));
  [-1.2,1.2].forEach(k=>mesh(new T.BoxGeometry(.25,1,.1),dark,x-3.5+k,7.5,z+1.02));
  mesh(new T.BoxGeometry(.08,2.4,.08),dark,x-3.5,11.1,z-1.5);
  [0x3a9a4a,0xf3eee2,0xd8402f].forEach((c,i)=>mesh(new T.BoxGeometry(.5,.8,.04),c3mat(c),x-3.21+i*.5,11.8,z-1.5));
}

/* ---------- Straßenschilder aus Marmor und Edicola votiva ---------- */
function npPlaque(text,w){
  const c=document.createElement("canvas");c.width=512;c.height=Math.round(512*.55/w);const g=c.getContext("2d");
  g.fillStyle="#f4f1ea";g.fillRect(0,0,c.width,c.height);g.strokeStyle="#1b1b1b";g.lineWidth=6;g.strokeRect(12,12,c.width-24,c.height-24);
  g.fillStyle="#1b1b1b";g.textAlign="center";g.textBaseline="middle";g.font=`700 ${Math.round(c.height*.5)}px Georgia, "Times New Roman", serif`;
  g.fillText(text,c.width/2,c.height/2+3);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w,.55),new THREE.MeshBasicMaterial({map:t}));
}
function npSigns(){
  const H=NP.houses, T=THREE;
  const near=(f)=>H.filter(f).sort((a,b)=>Math.abs(a.cx)-Math.abs(b.cx))[0];
  // Spaccanapoli: die lange Querstraße (z um -18), Schild an einem Haus auf der Nordseite
  const a=near(h=>h.z1>-21.2&&h.z1<-19.5&&h.cx<-6&&h.cx>-16)||near(h=>h.z1>-21.2&&h.z1<-19.5);
  if(a){const p=npPlaque("SPACCANAPOLI",2.6);p.position.set(a.cx,3.95,a.z1+.05);C3.scene.add(p);}
  const a2=near(h=>h.z0>-17&&h.z0<-13&&h.cx>8&&h.cx<20);
  if(a2){const p=npPlaque("SPACCANAPOLI",2.6);p.position.set(a2.cx,3.95,a2.z0-.05);p.rotation.y=Math.PI;C3.scene.add(p);}
  // Via Toledo: die Straße nach Norden, Schild an der Westwand eines Hauses östlich davon
  const b=near(h=>h.x0>5&&h.x0<7.2&&h.z1<-20.5);
  if(b){const p=npPlaque("VIA TOLEDO",2.2);p.position.set(b.x0-.05,3.95,b.cz);p.rotation.y=-Math.PI/2;C3.scene.add(p);}
  // Edicola votiva: kleines Heiligenbild mit Lämpchen und Blumen an zwei Hausecken
  [H.find(h=>h.z1>-21.2&&h.z1<-19.5&&h.cx>8),H.find(h=>h.x1>-12.5&&h.x1<-11&&h.z1<-20.5)].forEach((h,i)=>{
    if(!h)return; const ry=i?Math.PI/2:0, cx=h.cx, cz=h.cz, off=i?h.w/2:h.d/2, u=i?-(h.d/2-.8):h.w/2-.8;
    npAt("stucco",npBox(.9,1.2,.2),cx,cz,ry,u,2.4,off+.1);
    npAt("niche",npBox(.62,.82,.06),cx,cz,ry,u,2.4,off+.21);
    npAt("marble",npBox(.22,.5,.04),cx,cz,ry,u,2.35,off+.25);
    npAt("gold",npBox(.32,.06,.06),cx,cz,ry,u,2.75,off+.25);
    npAt("stucco",npBox(1,.12,.35),cx,cz,ry,u,1.76,off+.17);
    npAt("flower",npBox(.7,.16,.22),cx,cz,ry,u,1.9,off+.2);
    npAt("candle",npBox(.1,.16,.1),cx,cz,ry,u+.32,1.92,off+.2);
  });
}

/* ---------- Il bosco: gemischter Wald westlich der Stadt ---------- */
// Pinien, Zypressen, Steineichen, Kastanien, Olivenbäume, Tannen, Birken und Ahorn in Herbstfarben,
// dazwischen Büsche, Felsen und ein Waldweg. Eigener Zufall, die übrigen Bäume bleiben, wo sie sind.
const NP_FOREST={x:-74,z:-30,rx:24,rz:30};
function npForest(){
  const R=seeded(77), T=THREE, F=NP_FOREST, ball=(r)=>frSphere(r,7,4);
  const inForest=(x,z)=>((x-F.x)/F.rx)**2+((z-F.z)/F.rz)**2<1;
  const onPath=(x,z)=>Math.abs(z-(F.z+Math.sin((x-F.x)/7)*5))<1.6;
  const kinds={
    pino:(x,z,s)=>{np("trunk",new T.CylinderGeometry(.18*s,.28*s,5*s,6),x,2.5*s,z);np(R()<.5?"leafD":"leaf",new T.CylinderGeometry(2.6*s,1.5*s,1.1*s,8),x,5.3*s,z);},
    cipresso:(x,z,s)=>{np("trunk",new T.CylinderGeometry(.12,.16,1,5),x,.5,z);np("leafD",new T.CylinderGeometry(0,.75*s,6.5*s,7),x,1+3.2*s,z);},
    quercia:(x,z,s)=>{np("trunk",new T.CylinderGeometry(.22*s,.32*s,2.4*s,6),x,1.2*s,z);
      [[0,3.4,0,1.7],[-1,3,.4,1.3],[1,3.1,-.3,1.35],[.2,4.2,.3,1.1]].forEach(([a,b,c,r])=>np("leafD",ball(r*s),x+a*s,b*s,z+c*s));},
    castagno:(x,z,s)=>{np("trunk",new T.CylinderGeometry(.25*s,.35*s,2.8*s,6),x,1.4*s,z);
      [[0,4,0,2],[-1.1,3.4,.5,1.4],[1.1,3.5,-.4,1.5]].forEach(([a,b,c,r])=>np(R()<.5?"leaf":"leaf2",ball(r*s),x+a*s,b*s,z+c*s));},
    ulivo:(x,z,s)=>{np("olivetrunk",new T.CylinderGeometry(.2*s,.38*s,1.6*s,6),x,.8*s,z);
      [[-.6,2,0,1.1],[.6,2.1,.2,1.15],[0,2.6,-.3,.95]].forEach(([a,b,c,r])=>{const g=ball(r*s);g.scale(1,.7,1);np("olive",g,x+a*s,b*s,z+c*s);});},
    abete:(x,z,s)=>{np("trunk",new T.CylinderGeometry(.15,.2,1.2*s,5),x,.6*s,z);
      [[2,2.2,1.8],[1.6,1.9,3.3],[1.1,1.6,4.6],[.6,1.3,5.7]].forEach(([r,h,y])=>np("fir",new T.CylinderGeometry(0,r*s,h*s,7),x,y*s,z));},
    betulla:(x,z,s)=>{np("birch",new T.CylinderGeometry(.1*s,.14*s,4*s,6),x,2*s,z);
      [[0,4.3,0,1],[-.4,3.6,.2,.8],[.4,3.8,-.2,.8]].forEach(([a,b,c,r])=>np("leafL",ball(r*s),x+a*s,b*s,z+c*s));},
    acero:(x,z,s)=>{np("trunk",new T.CylinderGeometry(.18*s,.26*s,2.4*s,6),x,1.2*s,z);const k=R()<.5?"autumn":"autumn2";
      [[0,3.5,0,1.6],[-.8,3,.5,1.1],[.8,3.1,-.4,1.2]].forEach(([a,b,c,r])=>np(k,ball(r*s),x+a*s,b*s,z+c*s));}
  };
  const names=Object.keys(kinds), w=[3,2,3,3,1.5,2,1.5,1.2], sum=w.reduce((a,b)=>a+b,0);
  const pick=()=>{let r=R()*sum;for(let i=0;i<names.length;i++){r-=w[i];if(r<0)return names[i];}return names[0];};
  let n=0;
  for(let i=0;i<400&&n<130;i++){
    const x=F.x+(R()*2-1)*F.rx, z=F.z+(R()*2-1)*F.rz; if(!inForest(x,z)||onPath(x,z))continue;
    // Olivenbäume lieber am Waldrand, Tannen lieber hinten (nach Norden)
    let k=pick(); const edge=((x-F.x)/F.rx)**2+((z-F.z)/F.rz)**2;
    if(k==="ulivo"&&edge<.5)k="castagno"; if(k==="abete"&&z>F.z+8)k="quercia";
    kinds[k](x,z,.8+R()*.5); np("shadow",flatPlane(4.5,4.5),x,.03,z); n++;
  }
  // Büsche, Felsen, Blumen und Pilze am Boden
  for(let i=0;i<70;i++){const x=F.x+(R()*2-1)*F.rx*1.1, z=F.z+(R()*2-1)*F.rz*1.1; if(onPath(x,z))continue;
    const t=R();
    if(t<.45){const g=ball(.5+R()*.5);g.scale(1,.7,1);np(R()<.5?"leaf2":"leafD",g,x,.3,z);}
    else if(t<.7){const g=new T.CylinderGeometry(.4+R()*.5,.7+R()*.6,.5+R()*.6,6);np("rock",g,x,.25,z,R()*3);}
    else if(t<.9){np(R()<.5?"flower":"flowerY",npBox(.7,.12,.7),x,.08,z,R()*3);}
    else{np("birch",new T.CylinderGeometry(.06,.07,.2,6),x,.1,z);np("mush",new T.CylinderGeometry(.03,.2,.14,8),x,.25,z);}
  }
  // Waldweg aus Erde
  for(let x=F.x-F.rx;x<F.x+F.rx;x+=1.5){const z=F.z+Math.sin((x-F.x)/7)*5; np("path",flatPlane(1.8,2.2),x,.02,z,-Math.cos((x-F.x)/7)*.7);}
  return n;
}

/* ---------- Alles bauen und zu Meshes zusammenlegen ---------- */
function napoliBuild(){
  const T=THREE;
  npLaundry(); npChurch(); npCastle(); npSigns(); npForest();
  const rail=canvasTex(64,32,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle="#26292a";g.fillRect(0,0,w,3);g.fillRect(0,h-3,w,3);
    for(let x=2;x<w;x+=6)g.fillRect(x,0,2,h);g.strokeStyle="#26292a";g.lineWidth=1.5;
    for(let x=5;x<w;x+=12){g.beginPath();g.arc(x+3,8,3,0,Math.PI*2);g.stroke();}});
  rail.wrapS=T.RepeatWrapping; rail.repeat.set(2,1);
  const M={piperno:c3mat(0x77736b),stucco:c3mat(0xf6f1e6),slab:c3mat(0xe2dccf),
    rail:new T.MeshLambertMaterial({map:rail,transparent:true,alphaTest:.5,side:T.DoubleSide}),
    pot:c3mat(0xb5583a),plant:c3mat(0x4f8a3c),plant2:c3mat(0x6fa64b),flower:c3mat(0xe0457b),wood:c3mat(0x7a5a3a),vine:c3mat(0x5f9147),
    door:c3mat(0x3d5a44),door2:c3mat(0x6b3f26),line:c3mat(0xe8e4dc),
    marble:c3mat(0xf1ede4),gold:c3mat(0xd9a93a,{emissive:0x4a3510}),niche:c3mat(0x2f5f9a),candle:c3mat(0xff6040,{emissive:0xa03018}),
    trunk:c3mat(0x7a5a3a),olivetrunk:c3mat(0x6e6252),birch:c3mat(0xeeeae0),leaf:c3mat(0x5f9147),leaf2:c3mat(0x7aa65a),leafD:c3mat(0x3f7238),leafL:c3mat(0x9cc46a),
    olive:c3mat(0x8fa27a),fir:c3mat(0x2f5a3a),autumn:c3mat(0xd9792f),autumn2:c3mat(0xc8452f),rock:c3mat(0x9a958a),flowerY:c3mat(0xf2d043),
    mush:c3mat(0xd8402f),path:c3mat(0xb59a6e),
    palmtrunk:c3mat(0x8a6a48),palm:new T.MeshLambertMaterial({color:0x4f8f3c,side:T.DoubleSide}),
    tuffcap:c3mat(0xc9a25c),iron:c3mat(0x2b2f2c),lamp:c3mat(0xffe3a6,{emissive:0x8a6a2a}),
    shadow:new T.MeshBasicMaterial({map:tex("blob"),transparent:true,depthWrite:false})};
  NP_CLOTH.forEach((c,i)=>M["c"+i]=new T.MeshLambertMaterial({color:c,side:T.DoubleSide}));
  Object.entries(NP.batch).forEach(([k,geos])=>{if(!geos.length)return;const o=new T.Mesh(c3merge(geos),M[k]);if(k==="shadow")o.renderOrder=-1;C3.scene.add(o);});
  NP.batch={};
}
