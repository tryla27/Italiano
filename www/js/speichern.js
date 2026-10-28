/* Spielstand: speichern nach jeder Aktion (Gerät + Claude-Konto), laden, alte Stände übernehmen. */
/* ---------- Save state ---------- */
// Laden einrichten ist vorerst ausgeschaltet und wird später neu gebaut (Code in laden.js bleibt).
// Auf true setzen, um es wieder einzuschalten.
const LADEN_EINRICHTEN=false;
const S0={coins:0,level:0,owned:[],day:1,streak:0,last:"",book:{},learned:[],sound:true,vol:{music:.6,sfx:.8,voice:1},room:null,setupDone:!LADEN_EINRICHTEN,setupQuiz:null,vocab:{days:{},done:{}},vocabRun:null,muted:false};
let S=Object.assign({},S0,{vol:Object.assign({},S0.vol)});
/* Speichern: nach JEDER Aktion. Sofort auf dem Gerät, und zusätzlich in deinem Claude-Konto (falls verfügbar). */
const KEY="pizzeria-parola";
const enc=(k,v)=>v instanceof Set?{__set:[...v]}:v;
const dec=(k,v)=>v&&typeof v==="object"&&Array.isArray(v.__set)?new Set(v.__set):v;
let savedAt=0, lastBody="", dbRef=null, cloudState="local", writing=false, dirty=false, cloudTimer=null;
function stateBody(){return JSON.stringify({v:2,S,G,screen:(screen==="play"||screen==="summary")?screen:"home"},enc);}
function save(){
  let body; try{body=stateBody();}catch(e){return;}
  if(body===lastBody)return;
  lastBody=body; savedAt=Date.now();
  try{localStorage.setItem(KEY,JSON.stringify({savedAt,state:body}));}catch(e){}
  clearTimeout(cloudTimer); cloudTimer=setTimeout(cloudSave,400);
}
async function cloudSave(){
  if(!dbRef)return;
  if(writing){dirty=true;return;}
  writing=true;
  try{do{dirty=false;await dbRef.set({savedAt,state:lastBody});}while(dirty);cloudState="cloud";}
  catch(e){cloudState="local";}
  writing=false;
}
function applySave(raw){
  try{
    let o=JSON.parse(raw), at=0;
    if(o&&typeof o.state==="string"){at=o.savedAt||0;o=JSON.parse(o.state,dec);}
    if(!o)return false;
    if(!o.S&&o.coins!==undefined)o={S:o}; // alter Speicherstand
    if(!o.S)return false;
    S=Object.assign({},S0,o.S); S.vol=Object.assign({},S0.vol,o.S.vol||{});
    S.level=Math.min(S.level||0,LEVELS.length-1);
    if(!LADEN_EINRICHTEN){S.setupDone=true;S.setupQuiz=null;}
    G=o.G||null; screen=o.screen||"home"; if(screen!=="home"&&!G)screen="home";
    savedAt=at; lastBody=stateBody(); return true;
  }catch(e){return false;}
}
function flushSave(){save();clearTimeout(cloudTimer);cloudSave();}
window.addEventListener("pagehide",flushSave);
document.addEventListener("visibilitychange",()=>{if(document.hidden)flushSave();});
const mult=()=>1+SHOP.filter(i=>S.owned.includes(i.id)&&i.bonus).reduce((a,i)=>a+i.bonus,0);
function note(it,de){const e=S.book[it]||{de,miss:0};e.miss++;e.de=de;S.book[it]=e;}
function learn(it){if(!S.learned.includes(it))S.learned.push(it);}
/* Spielstand-Code: der ganze Spielstand als Text zum Kopieren, z. B. vom Android-Handy aufs iPhone.
   Komprimiert, wenn der Browser das kann (PP1), sonst nur Base64 (PP0). */
const b64=u8=>{let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode(...u8.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");};
const unb64=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");return Uint8Array.from(atob(s+"===".slice((s.length+3)%4)),c=>c.charCodeAt(0));};
async function pipe(u8,stream){return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(stream)).arrayBuffer());}
async function saveCode(){
  save(); const u8=new TextEncoder().encode(JSON.stringify({savedAt,state:lastBody}));
  if(window.CompressionStream){try{return "PP1."+b64(await pipe(u8,new CompressionStream("gzip")));}catch(e){}}
  return "PP0."+b64(u8);
}
async function loadCode(code){
  const m=String(code||"").replace(/\s+/g,"").match(/^PP([01])\.([A-Za-z0-9_-]+)$/); if(!m)return false;
  let u8; try{u8=unb64(m[2]); if(m[1]==="1")u8=await pipe(u8,new DecompressionStream("gzip"));}catch(e){return false;}
  const raw=new TextDecoder().decode(u8), before=lastBody;
  if(!applySave(raw))return false;
  try{localStorage.setItem(KEY+"-vorher",before);}catch(e){} // alter Stand als Notfall-Kopie
  savedAt=Date.now(); lastBody=""; flushSave(); return true;
}
// Browser bitten, den Spielstand nicht von selbst zu löschen (Safari, Chrome)
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{});}catch(e){}
