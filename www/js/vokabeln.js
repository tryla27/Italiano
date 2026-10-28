/* Vokabeltrainer nach Tagen: auswählen, dann selbst schreiben. */
/* ---------- Vokabeln nach Tagen ---------- */
const PROPER=new Set("toledo umberto garibaldi tribunali roma milano napoli sorrento capri luca rossi corso".split(" "));
const STOP=new Set("a al all' alla alle c' che ci con d' da dal dalla dei del della di dov' e è i il in io l' la le lo ma mi ne nel nell' nelle per si sì un un' una sono no non lei me mio mia ecco po' qui là lì sul sulla poi molto tanto troppo ho fa sta sto era suo nostra nostre gliene questa qual quale ogni mai".split(" "));
function collectWords(text,de,weight){
  if(!G||!text)return;
  G.seen=G.seen||new Set(); G.ex=G.ex||{}; G.wt=G.wt||{};
  (text.match(/[A-Za-zÀ-ÖØ-öø-ÿ]+'?/g)||[]).forEach(w=>{
    const k=w.toLowerCase(), d=DICT[k];
    if(!d||STOP.has(k)||PROPER.has(k))return;
    if(/^\d+$/.test(d)&&+d>20)return;
    G.seen.add(k); if(!G.ex[k])G.ex[k]=[text,de||""]; G.wt[k]=(G.wt[k]||0)+(weight||1);
  });
}
function collectStep(st){
  if(st.kind==="pizza"){collectWords(st.it,st.de,1);[...st.want].forEach(k=>collectWords(k,ING[k][0],1));return;}
  collectWords(st.it,st.de,st.wrong||st.gaveUp?3:1);
  if(st.corDe){const c=st.opts.find(o=>o.ok);if(c)collectWords(c.t,st.corDe,st.wrong||st.gaveUp?3:1);}
}
function buildVocab(dayN){
  const before=new Set(); Object.entries(S.vocab.days).forEach(([d,l])=>{if(+d<dayN)l.forEach(v=>before.add(v.it));});
  const wt=(G&&G.wt)||{}, tapped=(G&&G.tapped)||new Set();
  let cand=[...((G&&G.seen)||[])].filter(k=>!before.has(k)).sort((a,b)=>((tapped.has(b)?10:0)+(wt[b]||0))-((tapped.has(a)?10:0)+(wt[a]||0)));
  let list=cand.slice(0,12).map(k=>({it:k,de:DICT[k],ex:(G.ex&&G.ex[k])||null}));
  if(dayN===1&&S.room)ROOM_ITEMS.slice(0,6).forEach(i=>list.push({it:i.it,de:i.de,ex:null}));
  if(list.length<5){ // zu wenig Neues: schwierige alte Wörter wiederholen
    Object.entries(S.book).sort((a,b)=>b[1].miss-a[1].miss).forEach(([it,v])=>{if(list.length<8&&it.split(" ").length<=2&&!list.some(x=>x.it===it))list.push({it,de:v.de,ex:null});});
  }
  return list;
}
const stripArt=s=>s.replace(/^(il|lo|la|i|gli|le|un|uno|una)\s+/,"").replace(/^(l'|un')/,"");
const norm=s=>stripArt(s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’`]/g,"'").replace(/[^a-z' ]/g," ").replace(/\s+/g," ").trim());
function lev(a,b){const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>[i,...Array(n).fill(0)]);for(let j=1;j<=n;j++)d[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n];}
function vocabUnlocked(d){return d===1||!!S.vocab.done[d-1];}
function vocabStatus(){
  const days=Object.keys(S.vocab.days).map(Number).sort((a,b)=>a-b);
  if(!days.length)return "Deine Vokabeln kommen nach dem ersten Spieltag";
  const open=days.find(d=>!S.vocab.done[d]);
  if(!open)return `Alle ${days.length} ${days.length===1?"Tag":"Tage"} gelernt ✓`;
  return vocabUnlocked(open)?`Tag ${open}: ${S.vocab.days[open].length} Wörter warten`:`Tag ${open} wartet`;
}
function startVocab(d){
  const list=S.vocab.days[d]; if(!list||!vocabUnlocked(d))return;
  S.vocabRun={day:d,queue:shuffle(list.map((_,k)=>({k,st:0}))).map((q,i)=>({...q,dir:i%2?"de":"it"})),total:list.length,mastered:0,wrong:0,showTip:false,res:null,typed:"",opts:null,missed:false};
  prepVocabQ(); screen="vocab"; render();
}
function prepVocabQ(){
  const R=S.vocabRun, q=R.queue[0]; if(!q)return;
  R.wrong=0;R.showTip=false;R.res=null;R.typed="";R.missed=false;R.msg="";
  if(q.st===0){
    // Abwechselnd: Italienisch → Deutsch oder Deutsch → Italienisch
    const list=S.vocab.days[R.day], v=list[q.k], f=q.dir==="de"?"it":"de";
    let pool=list.filter((x,i)=>i!==q.k&&x[f]!==v[f]).map(x=>x[f]);
    if(pool.length<3)pool=pool.concat(f==="de"?Object.values(DICT).filter(x=>!/^\d+$/.test(x)&&x!==v.de):Object.keys(DICT).filter(x=>x!==v.it&&!STOP.has(x)));
    R.opts=shuffle([v[f],...sample([...new Set(pool)],3)]);
  }else R.opts=null;
}
function vocabAnswer(ans){
  const R=S.vocabRun, q=R.queue[0], v=S.vocab.days[R.day][q.k];
  let ok=false;
  if(q.st===0){ok=ans===(q.dir==="de"?v.it:v.de);}
  else{
    const a=ans.trim(), want=v.it;
    if(!a)return;
    if(stripArt(a.toLowerCase())===stripArt(want.toLowerCase())){ok=true;R.msg="";}
    else if(norm(a)===norm(want)){ok=true;R.msg=`Richtig! Achte auf die Schreibweise: ${want}`;}
    else if(norm(want).length>=5&&lev(norm(a),norm(want))<=1){ok=true;R.msg=`Fast perfekt! Richtig geschrieben: ${want}`;}
    R.typed=a;
  }
  if(ok){sfx("right");R.res="ok";speak(v.it);}
  else{sfx("wrong");R.wrong++;R.missed=true;R.res="bad";R.badAns=ans;note(v.it,v.de);}
  render();
}
function vocabNext(){
  const R=S.vocabRun, q=R.queue.shift();
  if(R.missed){R.queue.push({k:q.k,st:q.st,dir:q.dir==="de"?"it":"de"});}
  else if(q.st===0){const pos=Math.min(R.queue.length,2+Math.floor(Math.random()*Math.max(1,R.queue.length-1)));R.queue.splice(pos,0,{k:q.k,st:1,dir:q.dir});}
  else R.mastered++;
  if(!R.queue.length){S.vocab.done[R.day]=true;R.finished=true;sfx("coins");render();return;}
  prepVocabQ(); render(); const nq=R.queue[0]; if(nq.st===0&&nq.dir!=="de")setTimeout(()=>speak(S.vocab.days[R.day][nq.k].it),200);
}
function rVocab(){
  const R=S.vocabRun;
  if(R&&R.finished){
    $("#screen").innerHTML=`<h2 class="t">Bravissimo!</h2><div class="panel" style="align-items:center;text-align:center"><div class="review">Tag ${R.day} geschafft ✓<small>Alle ${R.total} Wörter sitzen.</small></div></div>
      ${S.vocab.days[R.day+1]?`<button class="big" data-act="vstart" data-d="${R.day+1}">Weiter mit Tag ${R.day+1}<small>${S.vocab.days[R.day+1].length} Wörter</small></button>`:`<p class="note">Die Vokabeln für Tag ${R.day+1} bekommst du, sobald du Spieltag ${R.day+1} gespielt hast.</p>`}
      <button class="sec" data-act="vlist">Zur Übersicht</button>`;
    return;
  }
  if(R){
    const q=R.queue[0], v=S.vocab.days[R.day][q.k];
    const pct=Math.round(R.mastered/R.total*100);
    let body="";
    if(q.st===0){
      const toIt=q.dir==="de", want=toIt?v.it:v.de;
      body=`<div class="vcard"><div class="label">${toIt?"Wie heißt auf Italienisch …":"Was heißt …"}</div><div class="vword${toIt?" de":""}">${esc(toIt?v.de:v.it)}</div>${canSpeak&&(!toIt||R.res==="ok")?`<button class="say" data-act="vsay">▶ Anhören</button>`:""}</div>
        <div class="opts">${R.opts.map((o,i)=>{const cls=R.res==="ok"&&o===want?"ok":R.res==="bad"&&o===R.badAns?"bad":"";return `<button class="opt ${cls}" data-act="vopt" data-i="${i}" ${R.res==="ok"?'aria-disabled="true"':""}>${esc(o)}</button>`;}).join("")}</div>`;
    }else{
      body=`<div class="vcard"><div class="label">Schreib auf Italienisch</div><div class="vword de">${esc(v.de)}</div></div>
        <form class="vform" id="vform"><input id="vin" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="auf Italienisch …" value="${R.res==="ok"?esc(R.typed):R.res==="bad"?esc(R.badAns||""):""}" ${R.res==="ok"?"readonly":""}>
        ${R.res==="ok"?"":`<button class="serve" type="submit">Prüfen</button>`}</form>
        <div class="accents">${["à","è","é","ì","ò","ù","'"].map(c=>`<button type="button" data-act="vacc" data-c="${c}">${c}</button>`).join("")}</div>
        ${R.res==="bad"?`<div class="fb zero">Nicht ganz („${esc(R.badAns)}“). Versuch's nochmal!</div>`:""}`;
    }
    const tip=q.st===0?(v.ex?`Kam so vor: „${esc(v.ex[0])}“ – ${esc(v.ex[1])}`:q.dir==="de"?`Fängt an mit „${esc(v.it.slice(0,2))}…“`:`Hör es dir nochmal an.`):`Fängt an mit „${esc(v.it.slice(0,Math.min(3,Math.ceil(v.it.length/3))))}…“ und hat ${v.it.length} Zeichen.`;
    const ctrl=R.res==="ok"
      ?`<div class="fb good">${esc(R.msg||pick(["Esatto!","Bravo!","Perfetto!","Giusto!"]))}</div><button class="next" data-act="vnext">Avanti →</button>`
      :`${R.showTip?`<div class="tipbox"><b>Tipp:</b> ${tip}</div>`:""}
        <div class="ctrl">${R.wrong>0&&!R.showTip?`<button class="tipbtn" data-act="vtip">Tipp anzeigen</button>`:`<span class="spacer"></span>`}
        <button class="idk" data-act="vidk" aria-label="Keine Ahnung">✕<small>K. Ahnung</small></button></div>`;
    $("#screen").innerHTML=`<div class="hud"><button class="quit" data-act="vlist">Pause</button><span class="where">Vokabeln Tag ${R.day}</span><span class="money">${R.mastered}/${R.total}</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <p class="note" style="margin:0">${q.st===0?(q.dir==="de"?"Runde 1: Deutsch → Italienisch":"Runde 1: Italienisch → Deutsch"):"Runde 2: selbst schreiben"} · Falsche Wörter kommen wieder, bis alle sitzen.</p>
      ${body}${ctrl}`;
    if(q.st===1&&R.res!=="ok"){const i=$("#vin");if(i)setTimeout(()=>{try{i.focus();i.setSelectionRange(i.value.length,i.value.length);}catch(e){}},50);}
    return;
  }
  const days=Object.keys(S.vocab.days).map(Number).sort((a,b)=>a-b);
  $("#screen").innerHTML=`<button class="back" data-act="home">← Zurück</button><h2 class="t">Vocabolario</h2>
    <p class="note" style="margin:-6px 0 0">Jeder Spieltag bringt neue Wörter aus deinen Gesprächen. Erst auswählen, dann selbst schreiben. Was falsch ist, kommt wieder, bis alles sitzt.</p>
    ${days.length?`<div class="items">${days.map(d=>{const done=S.vocab.done[d],un=vocabUnlocked(d),l=S.vocab.days[d];
      return `<div class="item vday ${done?"done":un?"open":"locked"}"><span class="ic">${done?"✓":un?"▶":"🔒"}</span><span class="nm">Tag ${d}<small>${l.slice(0,4).map(v=>esc(v.it)).join(", ")}${l.length>4?" …":""}</small></span>
      ${un?`<button class="buy" data-act="vstart" data-d="${d}">${done?"Nochmal":"Lernen"}</button>`:`<span class="owned" style="color:var(--chalk-dim)">erst Tag ${d-1}</span>`}</div>`;}).join("")}</div>`
      :`<div class="panel"><p class="note" style="margin:0">Noch keine Vokabeln. Spiel deinen ersten Tag in der Pizzeria, dann sammle ich hier alle Wörter, die vorkamen.</p></div>`}`;
}
