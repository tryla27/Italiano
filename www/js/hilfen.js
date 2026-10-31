/* Kleine Hilfsfunktionen: DOM, Zufall, Listen. */
/* ---------- Helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
const sample=(a,n)=>shuffle(a).slice(0,n);
const listIt=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" e "+a[a.length-1];
const listDe=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" und "+a[a.length-1];

/* Vollbild-3D: Die Szene liegt hinter dem ganzen Bildschirm, die Knöpfe schweben halbdurchsichtig darüber.
   Das leere Element .win3d hält den Platz frei, in dem man die Szene ungestört sieht. winBox() misst dieses
   Fenster, gibt es als Bildkoordinaten (-1 … 1, y nach oben) zurück und setzt --wt/--wb/--wl/--wr am Element
   (Abstand des Fensters zum Rand), damit Hinweise und Knöpfe in der Szene im Fenster bleiben. */
function winBox(host){
  const all={x0:-1,x1:1,y0:-1,y1:1}; if(!host)return all;
  const sp=host.parentNode&&host.parentNode.querySelector(".win3d"); if(!sp)return all;
  const H=host.getBoundingClientRect(), r=sp.getBoundingClientRect(); if(!H.width||!H.height||r.height<20)return all;
  const st=host.style; st.setProperty("--wt",Math.max(0,r.top-H.top)+"px"); st.setProperty("--wb",Math.max(0,H.bottom-r.bottom)+"px");
  st.setProperty("--wl",Math.max(0,r.left-H.left)+"px"); st.setProperty("--wr",Math.max(0,H.right-r.right)+"px");
  return {x0:(r.left-H.left)/H.width*2-1,x1:(r.right-H.left)/H.width*2-1,y1:1-(r.top-H.top)/H.height*2,y0:1-(r.bottom-H.top)/H.height*2};
}
