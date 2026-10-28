/* Klicks, Antippen, langes Drücken und Tastatur. */
/* ---------- Events ---------- */
let popTimer=null, pressTimer=null, suppressClick=false, lastTap={el:null,t:0};
// Einmal tippen zeigt die Übersetzung, zweimal tippen (oder lang drücken) legt das Wort ins Notizbuch.
function showWord(el,keep){
  const w=el.dataset.w, de=lookup(w); if(!de)return;
  const add=keep&&de!=="Name";
  const pop=$("#pop"); pop.innerHTML=`${esc(w)} = ${esc(de)}<small>${add?"✓ ins Notizbuch gelegt":de==="Name"?"":"Doppeltipp: ins Notizbuch"}</small>`; pop.hidden=false;
  const r=el.getBoundingClientRect(), pw=pop.offsetWidth;
  pop.style.left=Math.max(8,Math.min(innerWidth-pw-8,r.left+r.width/2-pw/2))+"px";
  pop.style.top=Math.max(8,r.top-pop.offsetHeight-8)+"px";
  clearTimeout(popTimer); popTimer=setTimeout(()=>{pop.hidden=true;},2600);
  if(add)note(w.toLowerCase(),de);
  if(de!=="Name"){if(G){G.seen=G.seen||new Set();G.seen.add(w.toLowerCase());G.tapped=G.tapped||new Set();G.tapped.add(w.toLowerCase());}}
  if(G&&screen==="play"){const st=curStep();if(st&&!st.done)st.peeked=true;}
  sfx(add?"right":"select"); save();
}
document.addEventListener("pointerdown",e=>{
  const w=e.target.closest(".opt .w"); if(!w)return;
  clearTimeout(pressTimer); pressTimer=setTimeout(()=>{suppressClick=true;showWord(w,true);},420);
});
["pointerup","pointercancel","pointermove"].forEach(ev=>document.addEventListener(ev,e=>{if(ev!=="pointermove"||Math.abs(e.movementX)+Math.abs(e.movementY)>6)clearTimeout(pressTimer);}));
document.addEventListener("contextmenu",e=>{if(e.target.closest(".opt,.w"))e.preventDefault();});
function handleClick(e){
  if(suppressClick){suppressClick=false;return;}
  const t=e.target.closest("[data-act]"); if(!t||t.disabled||t.getAttribute("aria-disabled")==="true")return;
  if(t.dataset.act==="word"){const now=Date.now(),dbl=lastTap.el===t&&now-lastTap.t<350;lastTap=dbl?{el:null,t:0}:{el:t,t:now};return showWord(t,dbl);}
  const a=t.dataset.act;
  if(a!=="opt"&&a!=="serve")sfx(a==="ing"||a==="qty"?"select":"click");
  if(a==="mute"){S.muted=!S.muted;initAudio();applyVolume();if(S.muted){try{speechSynthesis.cancel();}catch(e){}}else if(vol("music")>0)startMusic();save();return render();}
  if(a==="vol"){volOpen=!volOpen;return render();}
  if(a==="update"&&UPDATE){flushSave();location.href=UPDATE.url;return;}
  if(a==="start"){if(!S.setupDone){screen="setup";return render();}if(G&&!G.summary){screen="play";render();autoSpeak();return;}G=null;return startDay();}
  if(a==="home"||a==="quit"){if(screen==="summary")G=null;screen="home";return render();}
  if(a==="shop"){screen="shop";return render();}
  if(a==="map"){mapMsg="";screen="map";return render();}
  if(a==="place")return goPlace(t.dataset.p);
  if(a==="trip"){if(G&&!G.summary){screen="play";render();autoSpeak();return;}return startTrip(t.dataset.t);}
  if(a==="setup"){screen="setup";return render();}
  if(a==="setupCheck"){if(ROOM_ITEMS.every(i=>S.room.some(r=>r.id===i.id)))startSetupQuiz();return;}
  if(a==="ritem"){return quizAnswer(+t.dataset.i);}
  if(a==="qtip"){S.setupQuiz.showTip=true;return render();}
  if(a==="qidk"){const Q=S.setupQuiz,it=roomItem(S.room[Q.queue[Q.qi]].id);note(it.it,it.de);sfx("wrong");Q.flash=Q.queue[Q.qi];Q.flashOk=true;Q.queue.push(Q.queue[Q.qi]);Q.qi++;Q.wrong=0;Q.showTip=false;Q.revealed=false;render();showName(document.querySelector(`.ri[data-i="${Q.queue[Q.queue.length-1]}"]`),it);return;}
  if(a==="setupDone"){S.setupDone=true;S.setupQuiz=null;G=null;return startDay();}
  if(a==="vocab"){screen="vocab";if(S.vocabRun&&S.vocabRun.finished)S.vocabRun=null;return render();}
  if(a==="vlist"){if(S.vocabRun&&S.vocabRun.finished)S.vocabRun=null;else if(S.vocabRun)S.vocabRun.paused=true;screen="vocab";const R=S.vocabRun;S.vocabRun=null;S.vocabPaused=R&&!R.finished?R:S.vocabPaused;return render();}
  if(a==="vstart"){const d=t.dataset.d==="book"?"book":+t.dataset.d;if(S.vocabPaused&&S.vocabPaused.day===d&&!S.vocab.done[d]){S.vocabRun=S.vocabPaused;S.vocabPaused=null;screen="vocab";return render();}S.vocabPaused=null;return startVocab(d);}
  if(a==="vsay"){const R=S.vocabRun;return speak(vList(R)[R.queue[0].k].it);}
  if(a==="vopt"){const R=S.vocabRun;if(R.res==="ok")return;return vocabAnswer(R.opts[+t.dataset.i]);}
  if(a==="vtip"){S.vocabRun.showTip=true;return render();}
  if(a==="vidk"){const R=S.vocabRun,v=vList(R)[R.queue[0].k];note(v.it,v.de);R.missed=true;R.res="ok";R.msg=`Das heißt: ${v.it} = ${v.de}. Kommt gleich nochmal.`;if(R.queue[0].st===1)R.typed=v.it;else R.badAns=null;speak(v.it);return render();}
  if(a==="vnext")return vocabNext();
  if(a==="vacc"){const i=$("#vin");if(i&&!i.readOnly){i.value+=t.dataset.c;i.focus();}return;}
  if(a==="book"){screen="book";return render();}
  if(a==="sound"){S.sound=!S.sound;save();return render();}
  if(a==="sayit")return speak(t.dataset.t);
  if(a==="buy"){const i=SHOP.find(x=>x.id===t.dataset.id);if(i&&S.coins>=i.cost){S.coins-=i.cost;S.owned.push(i.id);sfx("coins");if(i.up)S.level=i.up;save();}return render();}
  if(a==="menu"){menuOpen=!menuOpen;return render();}
  if(!G)return;
  const st=curStep();
  if(a==="speak")return speak(st.it,speaker());
  if(a==="text"){st.showText=true;st.textShown=true;return render();}
  if(a==="next")return advance();
  if(st.done)return;
  if(a==="opt"){const i=+t.dataset.i;if(st.opts[i].ok){sfx("right");finish();if(st.phone)st.showText=true;}else{sfx("wrong");wrongAnswer(i);}return render();}
  if(a==="ing"){const k=t.dataset.k;st.cur.has(k)?st.cur.delete(k):st.cur.add(k);return render();}
  if(a==="qty"){st.curQty=Math.min(4,Math.max(1,st.curQty+ +t.dataset.d));return render();}
  if(a==="serve"){
    const same=st.cur.size===st.want.size&&[...st.want].every(k=>st.cur.has(k))&&(S.level===0||st.curQty===st.qty);
    if(same){sfx("right");finish();} else{sfx("wrong");wrongAnswer();[...new Set([...st.want,...st.cur])].filter(k=>st.want.has(k)!==st.cur.has(k)).forEach(k=>note(k,ING[k][0]));save();}
    return render();
  }
  if(a==="tip"){st.showTip=true;return render();}
  if(a==="idk"){giveUp();if(st.phone)st.showText=true;return render();}
}
document.addEventListener("click",e=>{handleClick(e);save();});
document.addEventListener("submit",e=>{if(e.target.id==="vform"){e.preventDefault();const R=S.vocabRun;if(R&&R.res!=="ok"){vocabAnswer($("#vin").value);save();}}});
document.addEventListener("keydown",e=>{const t=e.target.closest&&e.target.closest('[role="button"][data-act]');if(t&&(e.key==="Enter"||e.key===" ")){e.preventDefault();t.click();}});
$("#overlay").addEventListener("click",e=>{if(e.target.id==="overlay"){menuOpen=false;volOpen=false;render();}});
$("#overlay").addEventListener("input",e=>{
  const id=e.target.id;
  if(id==="v-auto"){S.sound=e.target.checked;save();return;}
  const key={"v-music":"music","v-sfx":"sfx","v-voice":"voice"}[id]; if(!key)return;
  S.vol[key]=+e.target.value/100; $("#"+id+"-o").textContent=e.target.value+" %";
  initAudio(); if(key==="music"&&vol("music")>0)startMusic(); applyVolume(); save();
});
$("#overlay").addEventListener("change",e=>{
  if(e.target.id==="v-sfx")sfx("right");
  if(e.target.id==="v-voice")speak("Ciao! Benvenuto in pizzeria.");
});
