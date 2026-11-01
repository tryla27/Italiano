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
  if(a==="mute"){S.muted=!S.muted;initAudio();applyVolume();if(S.muted)stopVoice();else if(vol("music")>0)startMusic();save();return render();}
  if(a==="vol"){volOpen=!volOpen;codeBox=null;return render();}
  if(a==="code-copy"){saveCode().then(c=>{codeBox={mode:"copy",text:c,msg:"Kopiert. Auf dem anderen Gerät unter Einstellungen → Code einfügen."};
    (navigator.clipboard?navigator.clipboard.writeText(c):Promise.reject()).catch(()=>{codeBox.msg="Halte den Code gedrückt und kopiere ihn.";render();});render();const b=$("#codebox");if(b)b.select();});return;}
  if(a==="code-paste"){codeBox={mode:"paste",text:""};render();const b=$("#codebox");if(b)b.focus();return;}
  if(a==="code-load"){const b=$("#codebox"),c=b?b.value:"";loadCode(c).then(ok=>{if(ok){codeBox=null;volOpen=false;screen=screen==="play"&&G?"play":"home";render();}else{codeBox={mode:"paste",text:c,msg:"Der Code passt nicht. Bitte ganz kopieren (fängt mit PP an)."};render();}});return;}
  if(a==="file-save"){saveFile().then(m=>{codeBox={mode:"file",msg:m};render();}).catch(()=>{codeBox={mode:"file",msg:"Speichern ging nicht. Nimm stattdessen „Code kopieren“."};render();});return;}
  if(a==="file-load"){const f=$("#savefile");if(f){f.value="";f.click();}return;}
  if(a==="update"&&UPDATE){flushSave();location.href=UPDATE.url;return;}
  if(a==="start"){if(!S.setupDone){screen="setup";return render();}if(G&&!G.summary){screen="play";render();autoSpeak();return;}return openDay();}
  if(a==="home"||a==="quit"){pauseOpen=false;volOpen=false;codeBox=null;if(screen==="summary")G=null;screen="home";return render();}
  if(a==="pause"){volOpen=!volOpen;pauseOpen=false;codeBox=null;return render();} // Pause und Einstellungen sind ein Menü
  if(a==="help"){helpOpen=!helpOpen;return render();}
  // Abbrechen ohne Belohnung: Trinkgeld und Tag kommen erst am Ende dazu, also einfach verwerfen
  if(a==="abort"){pauseOpen=false;volOpen=false;dropDay();screen="home";save();return render();}
  if(a==="vabort"){pauseOpen=false;volOpen=false;S.vocabRun=null;S.vocabPaused=null;screen="vocab";save();return render();}
  if(a==="shop"){screen="shop";return render();}
  if(a==="map"){mapMsg="";if(screen==="vocab"&&S.vocabRun&&S.vocabRun.finished)S.vocabRun=null;screen="map";return render();}
  if(a==="place")return goPlace(t.dataset.p);
  if(a==="lplace")return landTap(t.dataset.p);
  if(a==="lenter")return landEnter(t.dataset.p);
  if(a==="lexit")return landExit();
  if(a==="fbuy")return fornoBuy();
  if(a==="fsay")return fornoSay();
  if(a==="recipes"){volOpen=false;codeBox=null;menuOpen=true;return render();} // Rezeptbuch aus dem Spielermenü
  if(a==="trip"){if(G&&!G.summary){screen="play";render();autoSpeak();return;}return startTrip(t.dataset.t);}
  if(a==="setup"){screen="setup";return render();}
  if(a==="setupCheck"){if(ROOM_ITEMS.every(i=>S.room.some(r=>r.id===i.id)))startSetupQuiz();return;}
  if(a==="ritem"){return quizAnswer(+t.dataset.i);}
  if(a==="qtip"){S.setupQuiz.showTip=true;return render();}
  if(a==="qidk"){const Q=S.setupQuiz,it=roomItem(S.room[Q.queue[Q.qi]].id);note(it.it,it.de);sfx("wrong");Q.flash=Q.queue[Q.qi];Q.flashOk=true;Q.queue.push(Q.queue[Q.qi]);Q.qi++;Q.wrong=0;Q.showTip=false;Q.revealed=false;render();showName(document.querySelector(`.ri[data-i="${Q.queue[Q.queue.length-1]}"]`),it);return;}
  if(a==="setupDone"){S.setupDone=true;S.setupQuiz=null;G=null;return startDay();}
  if(a==="vocab"){screen="vocab";if(S.vocabRun&&S.vocabRun.finished)S.vocabRun=null;return render();}
  if(a==="vlist"){pauseOpen=false;volOpen=false;if(S.vocabRun&&S.vocabRun.finished)S.vocabRun=null;else if(S.vocabRun)S.vocabRun.paused=true;screen="vocab";const R=S.vocabRun;S.vocabRun=null;S.vocabPaused=R&&!R.finished?R:S.vocabPaused;return render();}
  if(a==="vcity"){pauseOpen=false;volOpen=false;if(S.vocabRun&&S.vocabRun.finished)S.vocabRun=null;else if(S.vocabRun)S.vocabRun.paused=true;screen="home";const R=S.vocabRun;S.vocabRun=null;S.vocabPaused=R&&!R.finished?R:S.vocabPaused;return render();}
  if(a==="vstart"){const d=t.dataset.d==="book"?"book":+t.dataset.d;if(S.vocabPaused&&S.vocabPaused.day===d&&!S.vocab.done[d]){S.vocabRun=S.vocabPaused;S.vocabPaused=null;screen="vocab";return render();}S.vocabPaused=null;return startVocab(d);}
  if(a==="vsay"){const R=S.vocabRun;return speak(vList(R)[R.queue[0].k].it);}
  if(a==="vopt"){const R=S.vocabRun;if(R.res==="ok")return;return vocabAnswer(R.opts[+t.dataset.i]);}
  if(a==="vtip"){S.vocabRun.showTip=true;return render();}
  if(a==="vidk"){const R=S.vocabRun,v=vList(R)[R.queue[0].k];note(v.it,v.de);R.missed=true;R.res="ok";R.msg=`Das heißt: ${v.it} = ${v.de}. Kommt gleich nochmal.`;if(R.queue[0].st===1)R.typed=v.it;else R.badAns=null;speak(v.it);return render();}
  if(a==="vnext")return vocabNext();
  if(a==="chestopen")return openChest();
  if(a==="chest")return chestTap();
  if(a==="vacc"){const i=$("#vin");if(i&&!i.readOnly){i.value+=t.dataset.c;i.focus();}return;}
  if(a==="book"){screen="book";return render();}
  if(a==="memo")return startMemo();
  if(a==="biblio"){LETTURA=null;stopPoesia();POESIA=null;screen="biblio";return render();}
  if(a==="leggi")return startLettura(t.dataset.b,+t.dataset.c);
  if(a==="lpag")return letturaPage(+t.dataset.d);
  if(a==="ltr"){LETTURA.tr=!LETTURA.tr;return render();}
  if(a==="lsay2"){const C=libro(LETTURA.b).capitoli[LETTURA.c];return speak(C.pagine[LETTURA.p][0]);}
  if(a==="lq")return letturaAnswer(+t.dataset.i);
  if(a==="lqnext")return letturaNext();
  if(a==="poesia")return startPoesia(t.dataset.p);
  if(a==="pline"){stopPoesia();POESIA.line=+t.dataset.i;speak(poesia(POESIA.id).versi[+t.dataset.i][0]);return render();}
  if(a==="pall")return poesiaReadAll(0);
  if(a==="ptr"){POESIA.tr=!POESIA.tr;return render();}
  if(a==="pquiz"){POESIA.end=null;return startPoesiaQuiz();}
  if(a==="pans")return poesiaAnswer(+t.dataset.i);
  if(a==="mflip")return memoFlip(+t.dataset.i);
  if(a==="sound"){S.sound=!S.sound;save();return render();}
  if(a==="sayit")return speak(t.dataset.t);
  if(a==="buy"){const i=SHOP.find(x=>x.id===t.dataset.id);if(i&&S.coins>=i.cost&&!S.owned.includes(i.id)){S.coins-=i.cost;S.owned.push(i.id);sfx("coins");if(i.up)S.level=i.up;else{furnBought(i);screen="locale";}save();}return render();}
  // 3D-Restaurant: öffnen, Name hören, drehen, einlagern, aus dem Lager aufstellen
  if(a==="locale"){screen="locale";return render();}
  if(a==="lopen"){sfx("door");if(G&&!G.summary&&!G.trip){screen="play";render();autoSpeak();return;}return openDay();}
  if(a==="lsay"){const I=L3.byKey[L3.sel];if(I)speak(I.it);return;}
  if(a==="lrot"){locRotate();return render();}
  if(a==="lstore"){locStore();return render();}
  if(a==="lhome"){locHome();return;}
  if(a==="ldone"){L3.sel=null;L3.msg="";req3d();L3.dirty=true;return render();}
  if(a==="lput"){locPut(t.dataset.k);return render();}
  if(a==="menu"){menuOpen=!menuOpen;return render();}
  if(a==="mkbank"){mkTab=t.dataset.b;mkMsg="";render();const B=BANCHE.find(b=>b.id===mkTab);if(B&&S.sound)speak(B.say[0],B.who);return;}
  if(a==="mkbuy"){mkBuy(t.dataset.k);return render();}
  if(a==="mkfill"){mkFill();return render();}
  if(!G)return;
  const st=curStep();
  if(a==="speak")return speak(st.hag?st.hag.say:st.it,speaker());
  if(a==="text"){st.showText=true;st.textShown=true;return render();}
  if(a==="next")return advance();
  if(a==="stallbuy"){hagStart(t.dataset.k);return render();}
  if(a==="hoffer"){hagOffer(+t.dataset.n);return render();}
  if(a==="hdeal"){hagDeal();return render();}
  if(a==="hleave"){hagLeave();return render();}
  if(a==="hpeek"){if(st.hag)st.hag.peek=true;return render();}
  if(a==="opt"&&st.done){if(st.corDe)speak(st.opts[+t.dataset.i].t);return;}
  if(st.done)return;
  // Italienische Antworten beim Antippen vorlesen
  if(a==="opt"){const i=+t.dataset.i;if(st.corDe)speak(st.opts[i].t);if(st.opts[i].ok){sfx("right");finish();if(st.phone)st.showText=true;}else{sfx("wrong");wrongAnswer(i);}return render();}
  if(a==="ing"){const k=t.dataset.k;st.cur.has(k)?st.cur.delete(k):st.cur.add(k);return render();}
  if(a==="cing"){const k=t.dataset.k,i=st.cur.indexOf(k);i>=0?st.cur.splice(i,1):st.cur.push(k);sfx("click");return render();}
  if(a==="cup"){st.curCup=t.dataset.k;sfx("click");return render();}
  if(a==="cserve"){
    const okIng=st.cur.join("|")===st.want.join("|"), okCup=st.curCup===st.cup;
    if(okIng&&okCup){sfx("right");finish();}
    else if(okIng){sfx("wrong");wrongAnswer();note(st.cup,CUPS[st.cup]);st.curCup=st.cup;finish();st.fb[1]=`Falsche Tasse: ${st.named} kommt in die ${st.cup}. `+st.fb[1];} // falsche Tasse kostet Trinkgeld, nicht die Bestellung
    else{sfx("wrong");wrongAnswer();note(st.named,st.want.join(" → "));save();}
    return render();
  }
  if(a==="qty"){st.curQty=Math.min(4,Math.max(1,st.curQty+ +t.dataset.d));return render();}
  if(a==="serve"){
    const same=st.cur.size===st.want.size&&[...st.want].every(k=>st.cur.has(k))&&(S.level===0||st.curQty===st.qty);
    if(same){sfx("right");finish();}
    else if(fx("oven")&&!G.ovenUsed){G.ovenUsed=true;sfx("wrong");st.shake=true;G.banner="Il forno ti salva! Diese falsche Pizza zählt nicht, versuch's nochmal.";}
    else{sfx("wrong");wrongAnswer();[...new Set([...st.want,...st.cur])].filter(k=>st.want.has(k)!==st.cur.has(k)).forEach(k=>note(k,ING[k][0]));save();}
    return render();
  }
  if(a==="tip"){st.showTip=true;return render();}
  if(a==="idk"){giveUp();if(st.phone)st.showText=true;return render();}
}
document.addEventListener("click",e=>{handleClick(e);save();});
document.addEventListener("submit",e=>{if(e.target.id==="vform"){e.preventDefault();const R=S.vocabRun;if(R&&R.res!=="ok"){vocabAnswer($("#vin").value);save();}}});
document.addEventListener("keydown",e=>{const t=e.target.closest&&e.target.closest('[role="button"][data-act]');if(t&&(e.key==="Enter"||e.key===" ")){e.preventDefault();t.click();}});
$("#overlay").addEventListener("click",e=>{if(e.target.id==="overlay"){menuOpen=false;volOpen=false;pauseOpen=false;helpOpen=false;codeBox=null;render();}});
/* Zurück-Knopf am Handy (und Wischen zurück im Browser): ein Eintrag im Verlauf fängt ihn ab.
   Android-App: Capacitor geht im Verlauf zurück, solange es einen gibt, sonst schließt sich die App. */
let backArmed=false;
function armBack(){
  if(backArmed||(screen==="home"&&!menuOpen&&!volOpen&&!pauseOpen&&!helpOpen))return;
  try{history.pushState({pp:1},"");backArmed=true;}catch(e){}
}
function goBack(){
  if(chestUI){chestTap();return;}
  if(volOpen||menuOpen||pauseOpen||helpOpen){volOpen=menuOpen=pauseOpen=helpOpen=false;codeBox=null;}
  else if(screen==="play"&&G&&!G.summary)volOpen=true;
  else if(screen==="vocab"&&S.vocabRun&&!S.vocabRun.finished)volOpen=true;
  else if(screen==="vocab"&&S.vocabRun){S.vocabRun=null;}
  else if(screen==="lettura"||screen==="poesia"){LETTURA=null;stopPoesia();POESIA=null;screen="biblio";}
  else if(screen!=="home"){if(screen==="summary")G=null;screen="home";}
  sfx("click"); render();
}
window.addEventListener("popstate",()=>{backArmed=false;goBack();});
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
// Spielstand-Datei ausgewählt: laden wie einen eingefügten Code
document.addEventListener("change",e=>{
  if(e.target.id!=="savefile"||!e.target.files[0])return;
  loadFile(e.target.files[0]).then(ok=>{codeBox={mode:"file",msg:ok?"Spielstand geladen ✓":"Diese Datei ist kein Spielstand von Parla Pizza!"};if(ok){screen=screen==="play"&&G?"play":"home";}render();});
});
