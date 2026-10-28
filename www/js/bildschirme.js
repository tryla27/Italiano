/* Alle Bildschirme zeichnen (Start, Spiel, Abrechnung, Shop, Notizbuch, Einstellungen). */
/* ---------- Render ---------- */
function render(){
  $("#overlay").hidden=!menuOpen&&!volOpen;
  $("#overlay").classList.toggle("top",volOpen);
  rTopbar();
  if(volOpen){
    const sl=(id,label,v)=>`<div class="vrow"><label for="${id}">${label}</label><input type="range" id="${id}" min="0" max="100" step="5" value="${Math.round(v*100)}" ${S.muted?"disabled":""}><output id="${id}-o">${Math.round(v*100)} %</output></div>`;
    $("#overlay").innerHTML=`<div class="sheet top${S.muted?" muted":""}" role="dialog" aria-label="Einstellungen"><h2>Impostazioni<small>Einstellungen</small></h2>
      <button class="mutebig${S.muted?" on":""}" data-act="mute" aria-pressed="${S.muted}">${ICON.off} ${S.muted?"Alles stumm · antippen für Ton":"Alles stumm schalten"}</button>
      ${sl("v-music","Musik",S.vol.music)}${sl("v-sfx","Geräusche",S.vol.sfx)}${canSpeak?sl("v-voice","Vorlese-Stimme",S.vol.voice):""}
      ${canSpeak?`<label class="vcheck"><input type="checkbox" id="v-auto" ${S.sound?"checked":""}> Gäste automatisch vorlesen</label>`:""}
      <button class="next" data-act="vol">Fertig</button></div>`;
  }
  else if(menuOpen)$("#overlay").innerHTML=`<div class="sheet" role="dialog" aria-label="Menù"><h2>Il Menù</h2>${MENU.map(m=>`<div class="mi"><b>${cap(m.n)} <span class="price">${m.p} €</span></b><div>${m.ing.join(", ")}</div></div>`).join("")}<p class="note">Plural: margherita → margherite, diavola → diavole. Bei „prosciutto e funghi“ bleibt der Name gleich.</p><button class="next" data-act="menu">Zurück zur Küche</button></div>`;
  ({home:rHome,play:rPlay,summary:rSummary,shop:rShop,map:rMap,book:rBook,setup:rSetup,vocab:rVocab})[screen]();
}
// Leiste oben links: Einstellungen und schnelles Stummschalten, auf jedem Bildschirm.
const ICON={
  gear:`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.6 7.6 0 0 0 1.7 1l.3 2.6h4l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg>`,
  on:`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  shop:`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 4h18l1 5a3 3 0 0 1-5 2 3 3 0 0 1-5 0 3 3 0 0 1-5 0 3 3 0 0 1-5-2z"/><path fill="currentColor" d="M4 12.5a4.5 4.5 0 0 0 2 .3V20h5v-5h2v5h5v-7.2a4.5 4.5 0 0 0 2-.3V22H4z"/></svg>`,
  map:`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2zm0 2.2 6 2v11.6l-6-2z"/></svg>`,
  off:`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`
};
function rTopbar(){
  $("#topbar").innerHTML=`<button class="tb" data-act="vol" aria-label="Einstellungen" aria-expanded="${volOpen}">${ICON.gear}</button>
    <button class="tb${S.muted?" on":""}" data-act="mute" aria-label="${S.muted?"Ton einschalten":"Alles stumm schalten"}" aria-pressed="${S.muted}">${S.muted?ICON.off:ICON.on}</button>`;
}
function rHome(){
  const L=LEVELS[S.level], owned=SHOP.filter(i=>S.owned.includes(i.id)&&!i.up);
  $("#screen").innerHTML=`
  <div class="sign"><span class="lvl">${L.it} · Napoli</span><h1>Pizzeria <span>Parola</span></h1><span class="lvl-de">Stufe ${S.level+1} von ${LEVELS.length} · ${L.de}</span></div>
  <p class="savenote">${cloudState==="cloud"?"☁ Spielstand in deinem Konto gesichert":"✓ Spielstand auf diesem Gerät gespeichert"}</p>
  ${UPDATE?`<button class="update" data-act="update">Neue Version ${esc(UPDATE.tag)} verfügbar · jetzt laden<small>Dein Spielstand bleibt erhalten</small></button>`:""}
  ${musicOn||vol("music")===0?"":`<p class="note" style="text-align:center;margin:0">♪ Tippe irgendwo auf den Bildschirm, dann startet die Musik.</p>`}
  ${!LADEN_EINRICHTEN?"":S.setupDone?roomHTML(false,false):`<div class="shelf"><span class="empty">Dein Laden ist noch leer. Richte ihn zuerst ein!</span></div>`}
  <div class="stats">
    <div class="stat"><b>${S.coins}</b><span>Euro</span></div>
    <div class="stat"><b>${S.day}</b><span>Tag</span></div>
    <div class="stat"><b>${S.streak}</b><span>Serie</span></div>
    <div class="stat"><b>${S.learned.length}</b><span>Gelernt</span></div>
  </div>
  ${G&&!G.summary
    ?`<button class="big" data-act="start">Avanti!<small>Weiterspielen · ${G.trip?`Ausflug ${esc(TRIPS[G.trip].de)}`:`Tag ${S.day}, ${G.phase==="market"?"Markt":`Gast ${G.gi+1} von ${G.guests.length}`}`}</small></button>`
    :S.setupDone?`<button class="big" data-act="start">Apri il locale!<small>Laden öffnen · Tag ${S.day}</small></button>`
    :`<button class="big" data-act="setup">Laden einrichten<small>Bevor die ersten Gäste kommen</small></button>`}
  ${S.setupDone?`<button class="mapbtn" data-act="map"><span class="mapthumb">${mapSVG()}</span><span class="maptxt">${ICON.map}<b>La mappa</b><small>Karte: Pizzeria, Markt, Eisladen, Hafen</small></span></button>`:""}
  <button class="vocabbtn" data-act="vocab">Vocabolario<small>${vocabStatus()}</small></button>
  <div class="${LADEN_EINRICHTEN?"row3":"row2"}"><button class="sec iconbtn" data-act="shop">${ICON.shop}Shop</button>${LADEN_EINRICHTEN?`<button class="sec" data-act="setup" ${S.setupDone?"":"disabled"}>Umstellen</button>`:""}<button class="sec" data-act="book">Notizbuch</button></div>
  <div class="how"><h3>So geht's</h3><ul>
    <li>Deine Gäste sprechen nur <b>Italienisch</b>. Wähle die richtige Antwort oder belege die Pizza.</li>
    <li>Einmal falsch? Dann erscheint ein <b>Tipp</b> zum Antippen.</li>
    <li>Das rote <b>✕</b> heißt „keine Ahnung“: Du siehst die Lösung, bekommst aber kein Trinkgeld.</li>
    <li>Deine Gäste zahlen ihre Rechnung, dazu Trinkgeld. Damit kaufst du Einrichtung und steigst auf.</li>
    <li>Wörter in der Sprechblase antippen zeigt die Übersetzung. Bei den Antworten: Wort lange drücken.</li>
  </ul></div>
  <div class="how"><h3>Deine Stufen</h3><ol class="lvls">${LEVELS.map((l,i)=>`<li class="${i<S.level?"done":i===S.level?"now":""}"><b>${l.it}</b> <span>${esc(l.neu)}</span></li>`).join("")}</ol>
  <p class="note" style="margin:6px 0 0">Aufsteigen kannst du im „Shop“, sobald du genug Geld hast.</p></div>`;
}
function rPlay(){
  const st=curStep(), g=curGuest(), mk=G.phase==="market", L=S.level;
  const who=mk?"Signor Esposito, Mercato":g.phone?"Telefono":g.name;
  const hideText=st.phone&&!st.showText&&!st.done;
  let bubble=hideText
    ?`<div class="phone-call"><div class="ring">Squilla il telefono! Hör genau zu.</div><div><button class="say" data-act="speak">▶ Anhören</button><button class="say" data-act="text">Text zeigen (halbes Trinkgeld)</button></div></div>`
    :`<div class="it">${wordsHTML(st.it,true)}</div>${canSpeak?`<button class="say" data-act="speak">▶ Nochmal hören</button>`:""}`;
  if(st.done)bubble+=`<div class="tr">${esc(st.de)}</div>`;
  let action="";
  if(st.kind==="mc"){
    action=`<div class="opts">${st.opts.map((o,i)=>{
      const cls=st.done&&o.ok?"ok":st.bad.includes(i)?"bad":"";
      const sub=st.done&&o.ok&&st.corDe?`<small>${esc(st.corDe)}</small>`:"";
      return `<button class="opt ${cls} ${st.shake&&st.bad[st.bad.length-1]===i?"shake":""}" data-act="opt" data-i="${i}" ${st.done||st.bad.includes(i)?'aria-disabled="true"':""}>${st.corDe?wordsHTML(o.t,false):esc(o.t)}${sub}</button>`;}).join("")}</div>`;
  }else{
    action=`<div class="kitchen"><div class="pz-wrap">${pizzaSVG(st.cur)}${L>0&&st.curQty>1?`<span class="qtyb">×${st.curQty}</span>`:""}</div>
      <div class="pz-side">${L>0?`<div class="stepper"><button data-act="qty" data-d="-1" aria-label="Weniger" ${st.done?"disabled":""}>−</button><b>${st.curQty}</b><button data-act="qty" data-d="1" aria-label="Mehr" ${st.done?"disabled":""}>+</button><span>Anzahl</span></div>`:""}
      <button class="menu-btn" data-act="menu">Il Menù</button></div></div>
      <div class="ings ${st.shake?"shake":""}">${Object.keys(ING).map(k=>`<button class="ing" data-act="ing" data-k="${k}" aria-pressed="${st.cur.has(k)}" ${st.done?"disabled":""}>${ingIcon(k)}${ING[k][0]}</button>`).join("")}</div>
      ${st.done?"":`<button class="serve" data-act="serve">Servire!</button>`}`;
  }
  const ctrl=st.done
    ?`<div class="fb ${st.fb[0]}">${esc(st.fb[1])}</div><button class="next" data-act="next">Avanti →</button>`
    :`${st.showTip?`<div class="tipbox"><b>Tipp:</b> ${st.tip}</div>`:""}
      <div class="ctrl">${st.wrong>0&&!st.showTip?`<button class="tipbtn" data-act="tip">Tipp anzeigen</button>`:`<span class="spacer"></span>`}
      <button class="idk" data-act="idk" aria-label="Keine Ahnung, Lösung zeigen">✕<small>K. Ahnung</small></button></div>`;
  $("#screen").innerHTML=`
    <div class="hud"><button class="quit" data-act="quit">Pause</button><span class="where">${mk?"Mercato":G.trip?esc(TRIPS[G.trip].it)+` ${G.si+1}/${G.guests[0].steps.length}`:`Gast ${G.gi+1}/${G.guests.length}`}</span>${starsHTML(G.stars)}<span class="money">€ ${G.earned+(G.revenue||0)}</span></div>
    ${G.combo>=2?`<div class="combo">Combo ×${G.combo}</div>`:""}
    ${G.banner?`<div class="banner">${esc(G.banner)}</div>`:""}
    <div class="stage">${stageHTML()}</div>
    <div class="scene solo"><div style="min-width:0"><div class="who">${esc(who)}</div><div class="bubble">${bubble}</div></div></div>
    <div class="task">${esc(st.task)}</div>
    ${action}${ctrl}`;
  st.shake=false;
}
function rSummary(){
  const sm=G.summary, rv=REVIEWS.find(r=>G.stars>=r[0]);
  if(sm.trip){const T=TRIPS[sm.trip];
    $("#screen").innerHTML=`<h2 class="t">${esc(T.it)}</h2><p class="note" style="margin:-8px 0 0">Ausflug zum ${esc(T.de)} beendet</p>
      <div class="panel" style="align-items:center">${starsHTML(G.stars)}<div class="review">${G.firstTry===G.steps?"Bravissimo!":G.firstTry>=G.steps/2?"Bene!":"Ci vediamo presto!"}<small>${G.firstTry} von ${G.steps} beim ersten Versuch richtig</small></div></div>
      <div class="panel"><div class="line total"><span>Trinkgeld vom Ausflug</span><span>+${G.earned} €</span></div></div>
      <button class="big" data-act="home">Weiter<small>Kasse: ${S.coins} €</small></button>`;
    return;}
  $("#screen").innerHTML=`
    <h2 class="t">Fine della giornata</h2><p class="note" style="margin:-8px 0 0">Ende von Tag ${sm.day}</p>
    <div class="panel" style="align-items:center">${starsHTML(G.stars)}<div class="review">„${esc(rv[1])}“<small>${esc(rv[2])}</small></div></div>
    <div class="panel">
      <div class="line"><span>Rechnungen der Gäste</span><span>+${G.revenue||0} €</span></div>
      <div class="line"><span>Trinkgeld</span><span>+${G.earned} €</span></div>
      <div class="line"><span>Zutaten vom Markt</span><span>−${sm.ing||0} €</span></div>
      <div class="line"><span>Miete</span><span>−${sm.rent||0} €</span></div>
      ${G.saved?`<div class="line"><span>Beim Handeln gespart</span><span>+${G.saved} €</span></div>`:""}
      <div class="line total"><span>Gewinn heute</span><span>${sm.net>=0?"+":""}${sm.net} €</span></div>
    </div>
    <div class="panel">
      <div class="line"><span>Beim ersten Versuch richtig</span><span>${G.firstTry} von ${G.steps}</span></div>
      <div class="line"><span>Beste Combo</span><span>×${G.maxCombo}</span></div>
      <div class="line"><span>Tage in Folge gespielt</span><span>${S.streak}</span></div>
    </div>
    <div class="panel"><div class="line"><span>Neue Vokabeln für dich</span><span>${(S.vocab.days[sm.day]||[]).length}</span></div><p class="note" style="margin:0">${(S.vocab.days[sm.day]||[]).slice(0,6).map(v=>esc(v.it)).join(", ")}</p></div>
    <button class="big" data-act="home">Weiter<small>Kasse: ${S.coins} €</small></button>`;
}
function rShop(){
  $("#screen").innerHTML=`<button class="back" data-act="home">← Zurück</button>
    <h2 class="t">Shop</h2><p class="note" style="margin:-6px 0 0">Du hast <b style="color:var(--gold)">${S.coins} €</b>. Jede Einrichtung bringt mehr Trinkgeld (jetzt ×${mult().toFixed(2)}). Gekaufte Sachen stellst du unter „Umstellen“ in deinen Laden.</p>
    <div class="items">${SHOP.filter(i=>!i.up||i.up>S.level||S.owned.includes(i.id)).map(i=>{
      const own=S.owned.includes(i.id)||(i.up&&S.level>=i.up), locked=i.lv>S.level;
      const btn=own?`<span class="owned">Gekauft</span>`:locked?`<span class="owned" style="color:var(--chalk-dim)">ab ${LEVELS[i.lv].it}</span>`:`<button class="buy" data-act="buy" data-id="${i.id}" ${S.coins<i.cost?"disabled":""}>${i.cost} €</button>`;
      return `<div class="item ${i.up?"up":""}"><span class="ic">${i.ic}</span><span class="nm">${esc(i.it)}<small>${esc(i.de)}${i.bonus?` · +${Math.round(i.bonus*100)} % Trinkgeld`:""}</small></span>${btn}</div>`;}).join("")}</div>`;
}
function rBook(){
  const e=Object.entries(S.book).sort((a,b)=>b[1].miss-a[1].miss);
  $("#screen").innerHTML=`<button class="back" data-act="home">← Zurück</button><h2 class="t">Il quaderno</h2>
    <p class="note" style="margin:-6px 0 0">Alles, was dir schwer gefallen ist oder was du nachgeschaut hast. Tippe einen Eintrag an, um ihn zu hören.</p>
    ${e.length?`<div class="items">${e.map(([it,v])=>`<div class="book-e" data-act="sayit" data-t="${esc(it)}" role="button" tabindex="0"><span class="i">${esc(it)}</span><span class="d">${esc(v.de)}</span><span class="m">${v.miss}×</span></div>`).join("")}</div>`
      :`<div class="panel"><p class="note" style="margin:0">Noch leer. Sobald du etwas falsch hast oder das rote ✕ drückst, landet es hier zum Wiederholen.</p></div>`}`;
}
