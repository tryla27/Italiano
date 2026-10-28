/* Belohnungs-Truhe („il forziere“): nach jedem zum ersten Mal bestandenen Vokabeltag.
   Drei Belohnungen: Einrichtung (Deko), Boni, Euro; etwas Besonderes mit 4 % pro Belohnung. */
const DEKO=[
  {id:"sedia",ic:"🪑",it:"la sedia",de:"Stuhl"},
  {id:"pianta",ic:"🪴",it:"la pianta",de:"Pflanze"},
  {id:"fiori",ic:"💐",it:"il vaso di fiori",de:"Blumenvase"},
  {id:"lampada",ic:"💡",it:"la lampada",de:"Lampe"},
  {id:"quadro",ic:"🖼️",it:"il quadro",de:"Bild"},
  {id:"orologio",ic:"🕰️",it:"l'orologio",de:"Uhr"},
  {id:"candela",ic:"🕯️",it:"la candela",de:"Kerze"},
  {id:"specchio",ic:"🪞",it:"lo specchio",de:"Spiegel"},
  {id:"limoni",ic:"🍋",it:"il cesto di limoni",de:"Korb mit Zitronen"},
  {id:"tovaglia",ic:"🧺",it:"la tovaglia",de:"Tischdecke"},
  {id:"bottiglie",ic:"🍾",it:"le bottiglie",de:"Flaschen"},
  {id:"tappeto",ic:"🟥",it:"il tappeto",de:"Teppich"}
];
const RARI=[
  {id:"pulcinella",ic:"🎭",it:"la maschera di Pulcinella",de:"Pulcinella-Maske",rare:true},
  {id:"corno",ic:"🌶️",it:"il corno portafortuna",de:"Glückshorn aus Neapel",rare:true},
  {id:"presepe",ic:"🏘️",it:"il presepe napoletano",de:"Neapolitanische Krippe",rare:true},
  {id:"mandolino_oro",ic:"🪕",it:"il mandolino d'oro",de:"Goldene Mandoline",rare:true},
  {id:"vespa_epoca",ic:"🛵",it:"la Vespa d'epoca",de:"Oldtimer-Vespa",rare:true}
];
const decoById=id=>DEKO.concat(RARI).find(d=>d.id===id);
// Eine Belohnung würfeln. Reihenfolge: 4 % besonders, 20 % Bonus, 36 % Euro, sonst Einrichtung.
function rollReward(){
  const r=Math.random();
  if(r<.04)return {kind:"rare",id:pick(RARI).id};
  if(r<.24)return {kind:"boost",x:pick([1.25,1.5]),days:1};
  if(r<.60){const base=8+S.level*6+Math.floor(Math.random()*11), sack=Math.random()<.12;return {kind:"euro",n:sack?base*4:base,sack};}
  return {kind:"deko",id:pick(DEKO).id};
}
function applyReward(w){
  if(w.kind==="euro")S.coins+=w.n;
  else if(w.kind==="boost"){const b=S.boost; S.boost={x:Math.max(w.x,b?b.x:1),days:(b?b.days:0)+w.days};}
  else{S.deko[w.id]=(S.deko[w.id]||0)+1;const d=decoById(w.id);if(d)learn(d.it);}
}
function rewardCard(w){
  if(w.kind==="euro")return {ic:w.sack?"💰":"🪙",it:w.sack?"un sacco di soldi!":"monete",de:`+${w.n} € in die Kasse`,cls:w.sack?"gold":""};
  if(w.kind==="boost")return {ic:"🍀",it:"che fortuna!",de:`Trinkgeld ×${w.x} am nächsten Spieltag`,cls:"boost"};
  const d=decoById(w.id)||DEKO[0];
  return {ic:d.ic,it:d.it,de:d.rare?`${d.de} · selten!`:`${d.de} · für deine Pizzeria`,cls:d.rare?"rare":""};
}
// Truhe öffnen: Ablauf in Phasen. Das Sprite-Sheet (6 × 4 Bilder, 16 fps) kommt aus Blender:
// Bild 0–8 wackeln, 8–10 ducken, 10–12 aufspringen, 12–23 nachfedern. Ab Bild 11: Licht, Funken.
const CHEST_FPS=16, CHEST_LIT=11, CHEST_LAST=23;
let chestUI=null;
function chestFrame(n){const sp=$("#chest .sprite");if(sp)sp.style.backgroundPosition=`${(n%6)*20}% ${Math.floor(n/6)*100/3}%`;}
function openChest(){
  if(!S.chest)return;
  chestUI={phase:"zu",items:null,shown:0,f:0,timer:null};
  const el=$("#chest"); el.hidden=false;
  el.innerHTML=`<div class="chest-stage phase-zu" data-act="chest" role="dialog" aria-label="Truhe">
    <div class="rays"></div><h2>Il forziere</h2>
    <div class="chest-box"><div class="beam"></div><div class="shadow"></div><div class="sprite" role="img" aria-label="Truhe"></div><div class="sparks">${"<i></i>".repeat(14)}</div></div>
    <div class="cardslot"></div><p class="chest-hint">Tippe, um die Truhe zu öffnen!</p></div>`;
  // Warten: alle zwei Sekunden einmal wackeln
  let tick=0; chestFrame(0);
  chestUI.timer=setInterval(()=>{tick=(tick+1)%32; chestFrame(tick<=8?tick:0);},1000/CHEST_FPS);
}
function chestStage(phase){const st=$("#chest .chest-stage");if(st){st.className=`chest-stage phase-${phase}`;}chestUI.phase=phase;}
function showCard(){
  const C=chestUI, w=C.items[C.shown++], c=rewardCard(w);
  sfx(w.kind==="rare"?"rare":"reveal");
  $("#chest .cardslot").innerHTML=`<div class="rcard pop ${c.cls}"><span class="ic">${c.ic}</span><b>${esc(c.it)}</b><small>${esc(c.de)}</small></div>`;
  $("#chest .chest-hint").textContent=C.shown<C.items.length?`Tippe für die nächste (${C.shown}/${C.items.length})`:"Tippe für die Übersicht";
}
function chestTap(){
  const C=chestUI; if(!C)return;
  if(C.phase==="zu"){
    C.items=[rollReward(),rollReward(),rollReward()];
    C.items.forEach(applyReward); S.chest=null; save();
    clearInterval(C.timer); chestStage("auf"); $("#chest .chest-hint").textContent="";
    sfx("chestopen");
    let f=0; C.timer=setInterval(()=>{
      chestFrame(f); if(f===CHEST_LIT)chestStage("lit");
      if(++f>CHEST_LAST){clearInterval(C.timer);C.timer=setTimeout(()=>{if(chestUI!==C)return;chestStage("karten");showCard();},350);}
    },1000/CHEST_FPS);
    return;
  }
  if(C.phase==="karten"){if(C.shown<C.items.length)showCard();else chestDone();return;}
  if(C.phase==="fertig"){chestUI=null;$("#chest").hidden=true;$("#chest").innerHTML="";render();}
}
function chestDone(){
  const C=chestUI; chestStage("fertig");
  const card=(w,i)=>{const c=rewardCard(w);return `<div class="rcard ${c.cls}" style="--i:${i}"><span class="ic">${c.ic}</span><b>${esc(c.it)}</b><small>${esc(c.de)}</small></div>`;};
  $("#chest .cardslot").innerHTML=`<div class="rlist">${C.items.map(card).join("")}</div><button class="big" data-act="chest">Grazie!<small>Kasse: ${S.coins} €</small></button>`;
  $("#chest .chest-hint").textContent="";
}
