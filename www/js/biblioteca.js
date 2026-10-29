/* La Biblioteca: Bücherregal mit gemeinfreien Klassikern (inhalt/libri.js) und dem Notizbuch.
   Lesen Seite für Seite: Wörter antippen wie im Gespräch, vorlesen lassen, Übersetzung aufdecken.
   Nach jedem Kapitel drei Fragen; beim ersten Bestehen gibt es Geld. Fortschritt in S.libri: {Buch-id: {done:[Kapitel …]}}. */
let LETTURA=null; // {b, c, p, tr, q, qi, ok, wrong, bad}
const LIBRO_PREMIO=5;
const libro=id=>LIBRI.find(b=>b.id===id);
const libDone=(id,c)=>!!(S.libri[id]&&S.libri[id].done.includes(c));
function rBiblio(){
  const shelf=LIBRI.map(b=>{const n=b.capitoli.filter((_,i)=>libDone(b.id,i)).length;
    return `<div class="libro"><div class="dorso" style="--c:${b.colore}"><b>${esc(b.titolo)}</b><small>${esc(b.autore)}</small></div>
      <div class="cap-list">${b.capitoli.map((c,i)=>{const open=i===0||libDone(b.id,i-1);
        return `<button class="cap${libDone(b.id,i)?" done":""}" data-act="leggi" data-b="${b.id}" data-c="${i}" ${open?"":'aria-disabled="true"'}>
          <span class="n">${i+1}</span><span><b>${esc(c.t)}</b><small>${esc(c.de)}${libDone(b.id,i)?" · gelesen ✓":open?` · +${LIBRO_PREMIO} €`:" · erst Kapitel "+i}</small></span></button>`;}).join("")}</div>
      <p class="note">${n}/${b.capitoli.length} Kapitel · ${esc(b.nota)}</p></div>`;}).join("");
  $("#screen").innerHTML=`${head("La Biblioteca","Bücher und Gedichte · tippe Wörter an")}
    <div class="biblio scroll">${shelf}${poesieShelf()}
      <button class="sec" data-act="book">Il mio quaderno<small>Dein Notizbuch mit den schweren Wörtern</small></button></div>`;
}
function startLettura(b,c){
  if(!libro(b)||(c>0&&!libDone(b,c-1)))return sfx("wrong");
  LETTURA={b,c,p:0,tr:false,q:null}; screen="lettura"; render();
}
function rLettura(){
  const L=LETTURA, B=libro(L.b), C=B.capitoli[L.c];
  if(L.q){
    const [q,ok,wr]=C.domande[L.q.i], opts=L.q.opts||(L.q.opts=shuffle([ok,...wr]));
    $("#screen").innerHTML=`${head(esc(C.t),`Domanda ${L.q.i+1} von ${C.domande.length}`)}
      <div class="lett"><p class="lett-q">${wordsHTML(q,true)}</p>
      <div class="opts">${opts.map((o,i)=>`<button class="opt${L.q.bad.includes(i)?" bad":""}${L.q.done&&o===ok?" good":""}" data-act="lq" data-i="${i}">${wordsHTML(o,false)}</button>`).join("")}</div>
      ${L.q.done?`<button class="next" data-act="lqnext">${L.q.i+1<C.domande.length?"Nächste Frage":"Fertig"}</button>`:""}</div>`;
    return;
  }
  if(L.end){
    $("#screen").innerHTML=`${head(esc(C.t),esc(B.titolo))}
      <div class="lett lett-end"><p class="hand gold big-hand">Bravo!</p><p>${L.reward?`Kapitel geschafft: <b>+${L.reward} €</b>`:"Kapitel nochmal gelesen."}</p>
      ${L.c+1<B.capitoli.length?`<button class="big" data-act="leggi" data-b="${B.id}" data-c="${L.c+1}">Weiterlesen<small>Kapitel ${L.c+2}: ${esc(B.capitoli[L.c+1].t)}</small></button>`:`<p class="note">Mehr Kapitel kommen bald.</p>`}
      <button class="sec" data-act="biblio">Zum Bücherregal</button></div>`;
    return;
  }
  const [it,de]=C.pagine[L.p], last=L.p===C.pagine.length-1;
  $("#screen").innerHTML=`${head(esc(C.t),`${esc(B.titolo)} · Seite ${L.p+1} von ${C.pagine.length}`)}
    <div class="lett"><div class="pagina"><p class="it">${wordsHTML(it,true)}</p>${L.tr?`<p class="de">${esc(de)}</p>`:""}</div>
    <div class="lett-tools"><button class="sec" data-act="lsay2">▶ Vorlesen</button><button class="sec" data-act="ltr" aria-pressed="${L.tr}">${L.tr?"Übersetzung aus":"Übersetzung"}</button></div>
    <div class="lett-nav"><button class="sec" data-act="lpag" data-d="-1" ${L.p?"":"disabled"}>‹ Zurück</button>
      <button class="next" data-act="lpag" data-d="1">${last?"Zu den Fragen":"Weiter ›"}</button></div></div>`;
}
function letturaPage(d){
  const L=LETTURA, C=libro(L.b).capitoli[L.c];
  if(d>0&&L.p===C.pagine.length-1){L.q={i:0,bad:[],done:false,miss:0};return render();}
  L.p=Math.max(0,Math.min(C.pagine.length-1,L.p+d)); L.tr=false; render();
}
function letturaAnswer(i){
  const L=LETTURA, C=libro(L.b).capitoli[L.c], Q=L.q, [q,ok]=C.domande[Q.i];
  if(Q.done)return; const o=Q.opts[i]; speak(o);
  if(o===ok){Q.done=true;sfx("right");}
  else{if(!Q.bad.includes(i))Q.bad.push(i);Q.miss++;sfx("wrong");}
  render();
}
function letturaNext(){
  const L=LETTURA, B=libro(L.b), C=B.capitoli[L.c];
  if(L.q.i+1<C.domande.length){L.q={i:L.q.i+1,bad:[],done:false};return render();}
  L.q=null; L.end=true; L.reward=0;
  const P=S.libri[B.id]||(S.libri[B.id]={done:[]});
  if(!P.done.includes(L.c)){P.done.push(L.c);L.reward=LIBRO_PREMIO;S.coins+=LIBRO_PREMIO;kasse(LIBRO_PREMIO,"Lesen");}
  save(); render();
}

/* ---------- Poesie: Kinderreime anhören, Reime ergänzen, Tag für Tag auswendig lernen ---------- */
// Stufe 0: Reimwort jeder zweiten Zeile fehlt · 1: jedes Zeilenende · 2: dazu ein Wort mitten in der Zeile · 3: auswendig (Stern)
let POESIA=null; // {id, line, quiz:{gaps,gi,bad,miss}|null, end}
const POESIA_PREMIO=5, POESIA_MAX=3;
const poesia=id=>POESIE.find(p=>p.id===id);
const poLvl=id=>(S.poesie[id]||{}).lvl||0;
const poWords=line=>line.match(/[A-Za-zÀ-ÖØ-öø-ÿ]+'?/g)||[];
function poesieShelf(){
  return `<div class="libro"><div class="dorso poe" style="--c:#7a5aa6"><b>Poesie</b><small>Kinderreime zum Auswendiglernen</small></div>
    <div class="cap-list">${POESIE.map(p=>{const l=poLvl(p.id), today=(S.poesie[p.id]||{}).day===S.day;
      return `<button class="cap${l>=POESIA_MAX?" done":""}" data-act="poesia" data-p="${p.id}"><span class="n">${l>=POESIA_MAX?"★":"♪"}</span>
        <span><b>${esc(p.titolo)}</b><small>${esc(p.de)} · ${l>=POESIA_MAX?"auswendig ✓":`Stufe ${l+1} von ${POESIA_MAX}${today?" · morgen weiter":""}`}</small></span></button>`;}).join("")}</div></div>`;
}
function startPoesia(id){if(!poesia(id))return;stopPoesia();POESIA={id,line:-1,quiz:null};screen="poesia";render();}
let poTimer=null;
function stopPoesia(){clearTimeout(poTimer);poTimer=null;}
// Alles vorlesen: Zeile für Zeile, die gesprochene Zeile leuchtet
function poesiaReadAll(i){
  const P=poesia(POESIA.id); stopPoesia(); if(i>=P.versi.length){POESIA.line=-1;return render();}
  POESIA.line=i; speak(P.versi[i][0]); render();
  poTimer=setTimeout(()=>{if(screen==="poesia"&&POESIA&&!POESIA.quiz)poesiaReadAll(i+1);},Math.max(1700,P.versi[i][0].length*95));
}
function poesiaGaps(P,lvl){
  const gaps=[];
  P.versi.forEach(([it],li)=>{const w=poWords(it);
    if(lvl>=1||li%2===1)gaps.push({li,wi:w.length-1});
    if(lvl>=2){const mid=w.findIndex((x,k)=>k>0&&k<w.length-1&&x.length>3);if(mid>0)gaps.push({li,wi:mid});}});
  return gaps.sort((a,b)=>a.li-b.li||a.wi-b.wi);
}
function startPoesiaQuiz(){
  const P=poesia(POESIA.id); stopPoesia();
  const all=[...new Set(P.versi.flatMap(([it])=>poWords(it)).filter(w=>w.length>2))];
  const gaps=poesiaGaps(P,Math.min(poLvl(P.id),POESIA_MAX-1)).map(g=>{const word=poWords(P.versi[g.li][0])[g.wi];
    return Object.assign(g,{word,opts:shuffle([word,...sample(all.filter(w=>w.toLowerCase()!==word.toLowerCase()),2)]),done:false});});
  POESIA.quiz={gaps,gi:0,bad:[],miss:0}; POESIA.line=-1; render();
}
function poesiaAnswer(i){
  const Q=POESIA.quiz, g=Q.gaps[Q.gi]; if(!g)return;
  if(g.opts[i]===g.word){g.done=true;sfx("right");speak(poesia(POESIA.id).versi[g.li][0]);Q.gi++;Q.bad=[];
    if(Q.gi>=Q.gaps.length)return poesiaEnd();}
  else{if(!Q.bad.includes(i))Q.bad.push(i);Q.miss++;sfx("wrong");}
  render();
}
// Höchstens eine Stufe pro Spieltag: Wiederholen mit Abstand bleibt besser hängen
function poesiaEnd(){
  const id=POESIA.id, P=S.poesie[id]||(S.poesie[id]={lvl:0,day:0}); let msg;
  if(P.lvl>=POESIA_MAX)msg="Du kannst es auswendig. Bravissimo!";
  else if(P.day===S.day)msg="Gut geübt! Die nächste Stufe gibt es am nächsten Spieltag.";
  else{P.lvl++;P.day=S.day;
    if(P.lvl>=POESIA_MAX){S.coins+=POESIA_PREMIO;kasse(POESIA_PREMIO,"Gedicht");msg=`Auswendig gelernt! ★ +${POESIA_PREMIO} €`;}
    else msg=`Geschafft! Am nächsten Spieltag geht es mit Stufe ${P.lvl+1} weiter, mit mehr Lücken.`;}
  POESIA.quiz=null; POESIA.end=msg; save(); render();
}
function rPoesia(){
  const Z=POESIA, P=poesia(Z.id), Q=Z.quiz;
  const lineHTML=(it,li)=>{
    if(!Q)return wordsHTML(it,true);
    let k=-1; return esc(it).replace(/[A-Za-zÀ-ÖØ-öø-ÿ]+'?/g,w=>{k++;const g=Q.gaps.find(x=>x.li===li&&x.wi===k);if(!g||g.done)return w;
      return `<span class="gap${Q.gaps[Q.gi]===g?" now":""}">${"_".repeat(Math.max(3,w.length))}</span>`;});
  };
  const cur=Q&&Q.gaps[Q.gi];
  $("#screen").innerHTML=`${head(esc(P.titolo),Q?`Reim ergänzen · Lücke ${Q.gi+1} von ${Q.gaps.length}`:`${esc(P.de)} · ${esc(P.autore)}`)}
    <div class="lett"><div class="pagina poesia">${P.versi.map(([it,de],li)=>`<div class="verso${Z.line===li?" on":""}">
        ${Q?"":`<button class="vplay" data-act="pline" data-i="${li}" aria-label="Zeile vorlesen">▶</button>`}<span><span class="it">${lineHTML(it,li)}</span>${Q||!Z.tr?"":`<small class="de">${esc(de)}</small>`}</span></div>`).join("")}</div>
      ${Z.end?`<p class="banner">${esc(Z.end)}</p>`:""}
      ${cur?`<div class="opts po-opts">${cur.opts.map((o,i)=>`<button class="opt${Q.bad.includes(i)?" bad":""}" data-act="pans" data-i="${i}">${esc(o)}</button>`).join("")}</div>`
        :`<div class="lett-tools three"><button class="sec" data-act="pall">▶ Vorlesen</button><button class="sec" data-act="ptr" aria-pressed="${!!Z.tr}">${Z.tr?"Deutsch aus":"Deutsch"}</button><button class="next" data-act="pquiz">${poLvl(P.id)>=POESIA_MAX?"Üben":"Reime ergänzen"}</button></div>`}
    </div>`;
}
