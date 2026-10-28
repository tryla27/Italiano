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
