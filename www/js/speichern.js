/* Spielstand: speichern nach jeder Aktion (Gerät + Claude-Konto), laden, alte Stände übernehmen. */
/* ---------- Save state ---------- */
// Laden einrichten ist vorerst ausgeschaltet und wird später neu gebaut (Code in laden.js bleibt).
// Auf true setzen, um es wieder einzuschalten.
const LADEN_EINRICHTEN=false;
const S0={coins:0,level:0,owned:[],day:1,streak:0,last:"",book:{},learned:[],sound:true,vol:{music:.6,sfx:.8,voice:1},room:null,setupDone:!LADEN_EINRICHTEN,setupQuiz:null,vocab:{days:{},done:{}},vocabRun:null,muted:false,deko:{},chest:null,boost:null,ing:START_ING,pz:{},newPz:null,place:{},inspDue:null,cert:0,memDay:0,story:null,storiesDone:[],storyNext:3,locale:{},libri:{},poesie:{},tripDay:{}};
// Listen und Objekte aus S0 kopieren, damit ein neues Spiel S0 nie verändert
const fresh0=s=>Object.assign(s,{vol:Object.assign({},S0.vol,s.vol||{}),ing:[...(s.ing||START_ING)],storiesDone:[...(s.storiesDone||[])],pz:Object.assign({},s.pz),deko:Object.assign({},s.deko),place:Object.assign({},s.place),locale:Object.assign({},s.locale),libri:JSON.parse(JSON.stringify(s.libri||{})),poesie:JSON.parse(JSON.stringify(s.poesie||{})),tripDay:Object.assign({},s.tripDay)});
let S=fresh0(Object.assign({},S0));
/* Speichern: nach JEDER Aktion. Sofort auf dem Gerät, und zusätzlich in deinem Claude-Konto (falls verfügbar). */
const KEY="pizzeria-parola";
const enc=(k,v)=>v instanceof Set?{__set:[...v]}:v;
const dec=(k,v)=>v&&typeof v==="object"&&Array.isArray(v.__set)?new Set(v.__set):v;
let savedAt=0, lastBody="", dbRef=null, cloudState="local", writing=false, dirty=false, cloudTimer=null;
/* Spielstand-Versionen: Jede Änderung am Aufbau bekommt eine Umwandlung von Version n auf n+1.
   Regeln: Felder nie umbenennen oder löschen, neue Felder bekommen Startwerte in S0.
   test/spielstaende/ hat ein Beispiel jeder alten Version; der Test lädt sie alle. */
const SAVE_V=4;
const MIGRATE={
  1:o=>({v:2,S:o.S||o,G:null,screen:"home"}),            // ganz alt: nur S ohne Hülle
  2:o=>{o.v=3;return o;},                                 // 3: Truhe, Deko, Bonus (Startwerte aus S0)
  3:o=>{if(!o.S.ing)o.S.ing=[...new Set([...START_ING,...OLD_ING])];o.v=4;return o;} // 4: eigene Zutaten; alte Stände behalten alle zwölf alten
};
function migrate(o){
  if(!o.v&&!o.S&&o.coins!==undefined)o={v:1,S:o};
  let v=o.v||1;
  while(v<SAVE_V&&MIGRATE[v]){o=MIGRATE[v](o);v=o.v;}
  return o;
}
function stateBody(){return JSON.stringify({v:SAVE_V,S,G,screen:(screen==="play"||screen==="summary")?screen:"home"},enc);}
function save(){
  let body; try{body=stateBody();}catch(e){return;}
  if(body===lastBody)return;
  lastBody=body; savedAt=Date.now();
  const rec=JSON.stringify({savedAt,state:body});
  try{localStorage.setItem(KEY,rec);}catch(e){}
  backupDaily(rec);
  clearTimeout(cloudTimer); cloudTimer=setTimeout(()=>{cloudSave();nativeSave();},400);
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
    o=migrate(o);
    if(!o.S)return false;
    S=fresh0(Object.assign({},S0,o.S));
    S.level=Math.min(S.level||0,LEVELS.length-1);
    if(!LADEN_EINRICHTEN){S.setupDone=true;S.setupQuiz=null;}
    G=o.G||null; screen=o.screen||"home"; if(screen!=="home"&&!G)screen="home";
    savedAt=at; lastBody=stateBody(); return true;
  }catch(e){return false;}
}
function flushSave(){save();clearTimeout(cloudTimer);cloudSave();nativeSave();}
/* Zweite Kopie im Handy selbst (Capacitor Preferences: Android SharedPreferences, iOS UserDefaults).
   Die räumt das System nicht auf wie den Browser-Speicher, und Android sichert sie im Google-Backup. */
const Prefs=()=>{try{return window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.Preferences;}catch(e){return null;}};
function nativeSave(){const P=Prefs();if(P&&lastBody)P.set({key:KEY,value:JSON.stringify({savedAt,state:lastBody})}).catch(()=>{});}
async function nativeLoad(){const P=Prefs();if(!P)return null;try{const r=await P.get({key:KEY});return r&&r.value;}catch(e){return null;}}
// Einmal am Tag eine Sicherheitskopie, falls der Hauptstand je kaputtgeht
function backupDaily(rec){
  const day=new Date().toLocaleDateString("sv-SE");
  try{if(localStorage.getItem(KEY+"-backup-tag")!==day){const old=localStorage.getItem(KEY);if(old)localStorage.setItem(KEY+"-backup",old);localStorage.setItem(KEY+"-backup-tag",day);}}catch(e){}
}
window.addEventListener("pagehide",flushSave);
document.addEventListener("visibilitychange",()=>{if(document.hidden)flushSave();});
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
/* Spielstand als Datei: in der App unter Dokumente/ParlaPizza, im Browser als Download.
   Die Datei enthält den Spielstand-Code und bleibt erhalten, auch wenn man die App deinstalliert. */
const Files=()=>{try{const C=window.Capacitor;return C&&C.isNativePlatform&&C.isNativePlatform()&&C.Plugins&&C.Plugins.Filesystem;}catch(e){return null;}};
async function saveFile(){
  const code=await saveCode(), name=`ParlaPizza-Spielstand-${new Date().toLocaleDateString("sv-SE")}.txt`, F=Files();
  if(F){await F.writeFile({path:"ParlaPizza/"+name,data:code,directory:"DOCUMENTS",encoding:"utf8",recursive:true});return `Gespeichert unter Dokumente › ParlaPizza › ${name}`;}
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([code],{type:"text/plain"})); a.download=name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  return `Heruntergeladen: ${name}`;
}
async function loadFile(file){try{return await loadCode(await file.text());}catch(e){return false;}}
// Browser bitten, den Spielstand nicht von selbst zu löschen (Safari, Chrome)
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{});}catch(e){}
