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
  $("#screen").innerHTML=`${head("La Biblioteca","Bücher lesen · tippe Wörter an")}
    <div class="biblio scroll">${shelf}
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
