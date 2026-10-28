/* Laden einrichten per Drag-and-drop und anschließende Abfrage der Namen. */
/* ---------- Laden einrichten (Drag-and-drop) ---------- */
const RI=(s)=>`<svg viewBox="0 0 64 64" aria-hidden="true">${s}</svg>`;
const ROOM_ITEMS=[
 {id:"porta",it:"la porta",de:"die Tür",w:13,multi:0,svg:RI('<rect x="16" y="4" width="32" height="58" rx="2" fill="#7a4a26"/><rect x="21" y="9" width="22" height="18" rx="2" fill="#9fd3e6"/><rect x="21" y="32" width="22" height="24" rx="2" fill="#5e3818"/><circle cx="42" cy="38" r="2.5" fill="#f4c64f"/>')},
 {id:"vetrina",it:"la vetrina",de:"das Schaufenster",w:22,multi:0,svg:RI('<rect x="2" y="16" width="60" height="44" rx="2" fill="#e6ad5e"/><rect x="6" y="20" width="52" height="36" fill="#9fd3e6"/><path d="M2 6h60v10H2z" fill="#e5533f"/><path d="M8 6v10M20 6v10M32 6v10M44 6v10M56 6v10" stroke="#f3eee2" stroke-width="5"/><circle cx="32" cy="44" r="8" fill="#d99a4e"/><circle cx="32" cy="44" r="6" fill="#c93a24"/>')},
 {id:"forno",it:"il forno",de:"der Ofen",w:19,multi:0,svg:RI('<path d="M4 60 Q4 10 32 10 Q60 10 60 60 Z" fill="#b8562f"/><path d="M10 60 Q10 18 32 18 Q54 18 54 60Z" fill="#d06a3a" opacity=".6"/><path d="M20 60 Q20 38 32 38 Q44 38 44 60 Z" fill="#1b1410"/><path d="M26 60 Q28 48 32 52 Q34 44 38 60Z" fill="#f4a63c"/><rect x="28" y="2" width="8" height="10" fill="#7a3a20"/>')},
 {id:"bancone",it:"il bancone",de:"die Theke",w:26,multi:0,svg:RI('<rect x="2" y="24" width="60" height="8" rx="2" fill="#e6c9a0"/><rect x="4" y="32" width="56" height="28" fill="#8a5a32"/><path d="M18 32v28M32 32v28M46 32v28" stroke="#6b4426" stroke-width="2"/>')},
 {id:"cassa",it:"la cassa",de:"die Kasse",w:10,multi:0,svg:RI('<rect x="8" y="30" width="48" height="28" rx="4" fill="#6f7b84"/><rect x="18" y="10" width="28" height="18" rx="3" fill="#2f3a40"/><rect x="21" y="13" width="22" height="10" fill="#7fe08a"/><g fill="#d8dde0"><rect x="14" y="36" width="8" height="6"/><rect x="28" y="36" width="8" height="6"/><rect x="42" y="36" width="8" height="6"/><rect x="14" y="46" width="8" height="6"/><rect x="28" y="46" width="8" height="6"/><rect x="42" y="46" width="8" height="6"/></g>')},
 {id:"tavolo",it:"il tavolo",de:"der Tisch",w:16,multi:4,svg:RI('<rect x="12" y="34" width="4" height="26" fill="#6b4426"/><rect x="48" y="34" width="4" height="26" fill="#6b4426"/><ellipse cx="32" cy="32" rx="30" ry="9" fill="#f3eee2"/><path d="M8 30h8v6H8zM24 30h8v6h-8zM40 30h8v6h-8zM56 30h4v6h-4z" fill="#e5533f"/><ellipse cx="32" cy="27" rx="7" ry="2.5" fill="#fbf6ea"/>')},
 {id:"sedia",it:"la sedia",de:"der Stuhl",w:9,multi:6,svg:RI('<rect x="16" y="4" width="32" height="6" rx="2" fill="#8a5a32"/><rect x="16" y="4" width="5" height="34" fill="#8a5a32"/><rect x="43" y="4" width="5" height="34" fill="#8a5a32"/><rect x="12" y="34" width="40" height="7" rx="2" fill="#a8703f"/><rect x="14" y="40" width="5" height="22" fill="#6b4426"/><rect x="45" y="40" width="5" height="22" fill="#6b4426"/>')},
 {id:"lampadario",it:"il lampadario",de:"die Lampe",w:10,multi:2,svg:RI('<path d="M32 0v20" stroke="#3a3a3a" stroke-width="2"/><path d="M14 40 L24 20 H40 L50 40 Z" fill="#2f6b3a"/><ellipse cx="32" cy="42" rx="10" ry="5" fill="#ffe08a"/><path d="M20 48 L12 60 M32 50 V62 M44 48 L52 60" stroke="#ffe08a" stroke-width="2" opacity=".7"/>')},
 {id:"pianta",it:"la pianta",de:"die Pflanze",w:10,multi:3,svg:RI('<path d="M20 44h24l-4 18H24z" fill="#c0603a"/><path d="M32 44 Q16 30 14 12 Q28 20 32 44 Q36 18 50 10 Q48 32 32 44 Q30 26 32 4 Q36 24 32 44" fill="#4f9a45"/>')},
 {id:"frigorifero",it:"il frigorifero",de:"der Kühlschrank",w:11,multi:0,svg:RI('<rect x="14" y="2" width="36" height="60" rx="4" fill="#e9eef0"/><path d="M14 24h36" stroke="#b9c3c8" stroke-width="2"/><rect x="42" y="8" width="3" height="12" rx="1" fill="#8a969c"/><rect x="42" y="30" width="3" height="16" rx="1" fill="#8a969c"/>')},
 {id:"insegna",it:"l'insegna",de:"das Schild",w:20,multi:0,svg:RI('<path d="M18 2v10M46 2v10" stroke="#3a3a3a" stroke-width="2"/><rect x="2" y="12" width="60" height="26" rx="5" fill="#1b221f" stroke="#f4c64f" stroke-width="3"/><text x="32" y="31" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="14" fill="#e5533f">PIZZA</text>')}
];
const ITEMBY=Object.fromEntries(ROOM_ITEMS.map(i=>[i.id,i]));
function roomItem(id){
  if(ITEMBY[id])return ITEMBY[id];
  const sh=SHOP.find(x=>"shop:"+x.id===id);
  return sh?{id,it:sh.it,de:sh.de,w:11,multi:0,emoji:sh.ic}:null;
}
const itemArt=it=>it.emoji?`<span class="emo">${it.emoji}</span>`:it.svg;
function paletteItems(){
  const base=ROOM_ITEMS.slice();
  SHOP.filter(i=>S.owned.includes(i.id)&&!i.up).forEach(i=>base.push(roomItem("shop:"+i.id)));
  return base.map(it=>{const n=S.room.filter(r=>r.id===it.id).length, max=it.multi||1;return {it,n,left:max-n};});
}
function roomHTML(interactive,quiz){
  return `<div class="room${interactive?" edit":""}" id="room"><div class="wall"></div><div class="floor"></div>
    ${(S.room||[]).map((r,i)=>{const it=roomItem(r.id);if(!it)return"";
      return `<div class="ri" ${quiz?`data-act="ritem"`:""} data-i="${i}" style="left:${r.x}%;top:${r.y}%;width:${it.w}%;z-index:${Math.round(r.y)+(r.id==="lampadario"||r.id==="insegna"?100:0)}">${itemArt(it)}</div>`;}).join("")}
  </div>`;
}
const MORETTI="Signor Moretti";
function rSetup(){
  if(!S.room)S.room=[];
  const Q=S.setupQuiz;
  if(Q&&!S.setupDone){ // Abfrage
    const target=S.room[Q.queue[Q.qi]], it=target&&roomItem(target.id);
    const done=Q.qi>=Q.queue.length;
    $("#screen").innerHTML=`
      <div class="scene"><div class="av">${face(MORETTI,2)}</div><div style="min-width:0"><div class="who">${MORETTI}, il proprietario</div>
      <div class="bubble"><div class="it">${done?wordsHTML("Perfetto! Il locale è pronto. Buon lavoro!",true):wordsHTML(`Tocca ${it.it}!`,true)}</div>
      ${done?`<div class="tr">Perfekt! Der Laden ist fertig. Viel Erfolg!</div>`:Q.revealed?`<div class="tr">Tippe ${esc(it.de)} an!</div>`:""}</div></div></div>
      <div class="task">${done?"Fertig eingerichtet!":`Zeig mir … (${Q.qi+1} von ${Q.queue.length})`}</div>
      ${roomHTML(false,!done)}
      ${done?`<button class="big" data-act="setupDone">Apri il locale!<small>Jetzt kommen die ersten Gäste</small></button>`
       :`${Q.showTip?`<div class="tipbox"><b>Tipp:</b> ${esc(it.it)} = ${esc(it.de)}</div>`:""}
        <div class="ctrl">${Q.wrong>0&&!Q.showTip?`<button class="tipbtn" data-act="qtip">Tipp anzeigen</button>`:`<span class="spacer"></span>`}
        <button class="idk" data-act="qidk" aria-label="Keine Ahnung">✕<small>K. Ahnung</small></button></div>`}`;
    if(Q.flash!=null){const el=document.querySelector(`.ri[data-i="${Q.flash}"]`);if(el)el.classList.add(Q.flashOk?"hit":"miss");Q.flash=null;}
    return;
  }
  const pal=paletteItems(), missing=ROOM_ITEMS.filter(i=>!S.room.some(r=>r.id===i.id));
  const next=missing[0];
  $("#screen").innerHTML=`
    ${S.setupDone?`<button class="back" data-act="home">← Fertig</button>`:""}
    <div class="scene"><div class="av">${face(MORETTI,2)}</div><div style="min-width:0"><div class="who">${MORETTI}, il proprietario</div>
    <div class="bubble"><div class="it">${S.setupDone?wordsHTML("Cambia pure tutto come vuoi!",true):next?wordsHTML(`Benvenuto! Metti ${next.it} nel locale.`,true):wordsHTML("Bravo! Ora controlliamo i nomi.",true)}</div>
    <div class="tr">${S.setupDone?"Stell ruhig alles um, wie du willst!":next?`Willkommen! Stell ${esc(next.de)} in den Laden.`:"Bravo! Jetzt prüfen wir die Namen."}</div></div></div></div>
    <div class="task">${S.setupDone?"Laden umstellen":"Richte deinen Laden ein"}</div>
    <p class="note" style="margin:-8px 0 0">Zieh die Sachen von unten in den Raum. Raus ziehen = entfernen. Antippen = Name hören.</p>
    ${roomHTML(true,false)}
    <div class="pal">${pal.map(p=>`<div class="pi${p.left<=0?" used":""}" data-id="${p.it.id}"><div class="pia">${itemArt(p.it)}</div><b>${esc(p.it.it)}</b>${S.setupDone||S.day>1?"":`<small>${esc(p.it.de)}</small>`}${(p.it.multi||1)>1?`<i>${p.n}/${p.it.multi}</i>`:""}</div>`).join("")}</div>
    ${!S.setupDone?`<button class="big" data-act="setupCheck" ${missing.length?'disabled style="opacity:.45"':""}>Fertig!<small>${missing.length?`Noch ${missing.length} ${missing.length===1?"Sache":"Sachen"} fehlen`:"Jetzt prüft der Vermieter die Namen"}</small></button>`:""}`;
}
let drag=null;
function ghostAt(x,y){const g=$("#ghost");g.style.left=x+"px";g.style.top=y+"px";}
document.addEventListener("pointerdown",e=>{
  if(screen!=="setup"||(S.setupQuiz&&!S.setupDone))return;
  const pi=e.target.closest(".pi"), ri=e.target.closest(".room.edit .ri");
  if(!pi&&!ri)return;
  if(pi&&pi.classList.contains("used")){showName(pi,roomItem(pi.dataset.id));return;}
  const id=pi?pi.dataset.id:S.room[+ri.dataset.i].id, it=roomItem(id); if(!it)return;
  drag={id,from:pi?"pal":"room",idx:ri?+ri.dataset.i:-1,sx:e.clientX,sy:e.clientY,moved:false,el:pi||ri};
  const g=$("#ghost"); g.innerHTML=itemArt(it); g.style.width=Math.max(48,($("#room").offsetWidth*it.w/100))+"px"; ghostAt(e.clientX,e.clientY);
  e.preventDefault();
});
document.addEventListener("pointermove",e=>{
  if(!drag)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>6){drag.moved=true;$("#ghost").hidden=false;if(drag.from==="room")drag.el.style.opacity=".25";}
  if(drag.moved)ghostAt(e.clientX,e.clientY);
});
document.addEventListener("pointerup",e=>{
  if(!drag)return;
  const d=drag; drag=null; $("#ghost").hidden=true;
  if(!d.moved){showName(d.el,roomItem(d.id));return;}
  const r=$("#room").getBoundingClientRect();
  const inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
  if(inside){
    const x=Math.round((e.clientX-r.left)/r.width*1000)/10, y=Math.round((e.clientY-r.top)/r.height*1000)/10;
    if(d.from==="pal")S.room.push({id:d.id,x,y}); else{S.room[d.idx].x=x;S.room[d.idx].y=y;}
    sfx("select");
    if(d.from==="pal"&&!S.setupDone){const it=roomItem(d.id);speak(it.it);}
  }else if(d.from==="room"){S.room.splice(d.idx,1);sfx("click");}
  save(); render();
});
document.addEventListener("pointercancel",()=>{if(drag){drag=null;$("#ghost").hidden=true;render();}});
function showName(el,it){
  if(!it||!el)return;
  const pop=$("#pop"); pop.innerHTML=`${esc(it.it)}<small>${esc(it.de)}</small>`; pop.hidden=false;
  const r=el.getBoundingClientRect(), pw=pop.offsetWidth;
  pop.style.left=Math.max(8,Math.min(innerWidth-pw-8,r.left+r.width/2-pw/2))+"px";
  pop.style.top=Math.max(8,r.top-pop.offsetHeight-8)+"px";
  clearTimeout(popTimer); popTimer=setTimeout(()=>{pop.hidden=true;},2200);
  speak(it.it);
}
function startSetupQuiz(){
  const idx=[...new Set(S.room.map(r=>r.id))].filter(id=>ITEMBY[id]).map(id=>S.room.findIndex(r=>r.id===id));
  S.setupQuiz={queue:shuffle(idx).slice(0,7),qi:0,wrong:0,showTip:false,revealed:false};
  render(); const Q=S.setupQuiz; setTimeout(()=>speak(`Tocca ${roomItem(S.room[Q.queue[0]].id).it}!`,MORETTI),250);
}
function quizAnswer(i){
  const Q=S.setupQuiz, want=Q.queue[Q.qi], it=roomItem(S.room[want].id);
  const ok=S.room[i].id===S.room[want].id;
  Q.flash=i; Q.flashOk=ok;
  if(ok){sfx("right");learn(it.it);Q.qi++;Q.wrong=0;Q.showTip=false;Q.revealed=false;
    render(); if(Q.qi<Q.queue.length){const nx=roomItem(S.room[Q.queue[Q.qi]].id);setTimeout(()=>speak(`Tocca ${nx.it}!`,MORETTI),500);}}
  else{sfx("wrong");Q.wrong++;note(it.it,it.de);render();}
}
