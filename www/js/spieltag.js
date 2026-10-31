/* Ablauf eines Spieltags: Gäste, Trinkgeld, Fehler, Markt, Tagesabrechnung. */
/* ---------- Game flow ---------- */
let screen="home", G=null, menuOpen=false, volOpen=false, codeBox=null, pauseOpen=false, helpOpen=false;
function startDay(){
  const L=S.level, LV=LEVELS[L];
  G={guests:[],gi:0,si:0,earned:0,revenue:0,saved:0,stars:5,combo:0,maxCombo:0,used:new Set(),phase:"guest",banner:"",market:[],mi:0,firstTry:0,steps:0};
  const nG=LV.guests+fx("guest"); // Tische und Terrasse bringen mehr Gäste
  const phoneSlots=new Set(sample([...Array(nG).keys()].slice(1),LV.phones));
  const names=shuffle(NAMES);
  // Gestern neu freigeschaltete Pizza: heute bestellt sie garantiert jemand
  let force=S.newPz&&availPizze().find(p=>p.n===S.newPz); S.newPz=null;
  // Kreidetafel: der erste Gast nimmt den Piatto del giorno; Fotos von Neapel: ein Stammgast
  let daily=fx("daily")&&!force?pick(availPizze()):null;
  const regular=fx("regular")?pick([...Array(nG).keys()].filter(i=>!phoneSlots.has(i))):-1;
  for(let i=0;i<nG;i++){
    let steps;
    if(phoneSlots.has(i))steps=[LV.reserv&&Math.random()<.5?reservStep():phoneStep()];
    else{
      const ord=orderStep(L===0?0:L<=2?1:2,force||daily,!!daily&&!force); force=null; daily=null; let total=ord.price+fx("bill");
      // Stammgäste mit eigener Persönlichkeit: meist ihre eigenen Sätze (inhalt/gaeste.js)
      const P=PERS[names[i%names.length]], own=pool=>P&&Math.random()<.65?pickFresh(P[pool]):null;
      steps=[mcStep(own("greet")||pickFresh(GREET),"Was antwortest du?",{greet:true}),ord];
      if(LV.drinks){const di=pickFresh(DRINK);total+=DRINK_PRICE[DRINK.indexOf(di)]||0;steps.push(mcStep(di,"Was antwortest du?",{drink:true}));}
      if(!LV.talkChance||Math.random()<LV.talkChance)steps.push(mcStep(own("talk")||pickFresh(tierOf("caffe")>=2&&Math.random()<.35?BAR:pick(LV.talk)),"Was antwortest du?",{talk:true}));
      if(tierOf("caffe")&&Math.random()<.5){const cf=coffeeStep();total+=cf.price;steps.push(cf);}
      steps.push(billStep(total));
    }
    const bill=steps.reduce((a,x)=>a+(x.bill||0),0)||(phoneSlots.has(i)&&steps[0].price?steps[0].price+fx("delivery"):0);
    G.guests.push({name:phoneSlots.has(i)?"Telefono":names[i%names.length],mood:2,steps,tip:0,bill,phone:phoneSlots.has(i),regular:i===regular});
  }
  storyGuest();
  if(inspToday())G.guests.unshift({name:"Dottoressa Severini",mood:2,steps:sample(ISPEZIONE,4).map(m=>mcStep(m,"Was antwortest du?",{insp:true})),tip:0,bill:0,insp:true});
  G.market=sample(MARKET,2).map(m=>mcStep(m,"Was antwortest du?",{market:true}));
  const stall=stallStep(); if(stall)G.market.push(stall);
  screen="play"; render(); autoSpeak();
}
/* Geschichten über mehrere Tage (STORIES in inhalt/gaeste.js): ist heute ein Teil dran, kommt dessen Gast
   und bringt seine Sätze statt Begrüßung und Plauderei mit. Weiter geht es erst, wenn der Tag zu Ende gespielt ist. */
function storyNow(){
  if(!S.story){const nx=STORIES.find(s=>!S.storiesDone.includes(s.id));if(!nx||S.day<(S.storyNext||3))return null;S.story={id:nx.id,part:0,day:S.day};}
  const s=STORIES.find(x=>x.id===S.story.id);
  return s&&S.day>=S.story.day?{s,part:s.parts[S.story.part]}:null;
}
function storyGuest(){
  const now=storyNow(), idx=G.guests.map((g,i)=>i).filter(i=>!G.guests[i].phone);
  if(!now||!now.part||!idx.length)return;
  const g=G.guests[pick(idx)], who=now.part.who, twin=G.guests.find(x=>x!==g&&x.name===who);
  if(twin)twin.name=NAMES.find(n=>!G.guests.some(x=>x.name===n))||twin.name;
  g.name=who; g.story=now.s.id; g.regular=false;
  g.steps=[...now.part.lines.map(l=>mcStep(l,"Was antwortest du?")),...g.steps.filter(x=>!x.greet&&!x.talk)];
}
// Nach einem fertig gespielten Tag mit Geschichte: nächster Teil frühestens übermorgen, nächste Geschichte drei Tage später
function storyAdvance(){
  if(!S.story||!G.guests.some(g=>g.story===S.story.id))return;
  const s=STORIES.find(x=>x.id===S.story.id);
  if(S.story.part+1>=s.parts.length){S.storiesDone=[...S.storiesDone,s.id];S.story=null;S.storyNext=S.day+4;}
  else S.story={id:s.id,part:S.story.part+1,day:S.day+2};
}
// Gesundheitsamt: ab La Pizzeria etwa jeden fünften Tag, nie zwei Tage hintereinander (außer nach „bocciato“).
// Am Abend davor kommt ein Brief.
const inspToday=()=>S.level>=1&&S.inspDue===S.day;
function inspResult(g){
  const err=g.steps.filter(x=>x.wrong||x.gaveUp).length, res=err===0?"pass":err<=2?"cond":"fail";
  G.insp={res,err}; G.inspMoney=res==="pass"?15:res==="fail"?-20:0;
  return res==="pass"?"Promossa! Die Dottoressa gibt dir das Zertifikat: +15 € und drei Tage lang einen Stern mehr in der Bewertung."
    :res==="cond"?`Con riserva: ${err} ${err===1?"Fehler":"Fehler"}. Sie kommt in drei Tagen wieder.`
    :`Bocciata! ${err} Fehler, 20 € Strafe. Sie kommt morgen wieder.`;
}
const wday=d=>(d-1)%7, giorno=d=>GIORNI[wday(d)], isMarketDay=d=>MARKT_TAGE.includes(wday(d));
function nextMarketDay(d){for(let i=0;i<7;i++)if(isMarketDay(d+i))return d+i;return d;}
const curStep=()=>G.phase==="market"?G.market[G.mi]:G.guests[G.gi].steps[G.si];
const curGuest=()=>G.phase==="market"?null:G.guests[G.gi];
function autoSpeak(){const st=curStep();if(st&&(S.sound||st.phone)&&(!st.phone||!st.showText||S.sound))setTimeout(()=>speak(st.it,speaker()),250);}
// Wer gerade spricht (für die passende Stimme).
function speaker(){if(!G)return null;if(G.phase==="market")return "Signor Esposito";const g=curGuest();return g&&!g.phone?g.name:null;}

function wrongAnswer(i){
  const st=curStep(), g=curGuest();
  st.wrong++; if(i!==undefined)st.bad.push(i);
  if(st.wrong===1)G.stars=Math.max(1,G.stars-.5);
  if(g)g.mood=Math.max(0,g.mood-1);
  if(fx("piano")&&g&&!g.pianoUsed)g.pianoUsed=true; else G.combo=0; // Klavier: der erste Fehler pro Gast bricht die Combo nicht
  st.shake=true;
  if(st.kind==="mc")note(st.it,st.de);
  // Der Gast reagiert: erst verwirrt, bei schlechter Laune verärgert, jeder auf seine Art
  if(g&&!g.phone&&!st.insp){
    const P=PERS[g.name], pool=st.kind==="pizza"?HUH_PIZZA:((P&&P.huh)||HUH)[g.mood>=1?0:1], r=pick(pool.filter(x=>!st.react||x[0]!==st.react[0]))||pick(pool);
    st.react=r; collectWords(r[0],r[1],1); setTimeout(()=>speak(r[0],g.name),st.corDe?1500:300); // erst die eigene Antwort ausreden lassen
  }
}
function finish(){
  const st=curStep(), g=curGuest(), LV=LEVELS[S.level];
  st.done=true; G.steps++;
  const f=st.wrong===0?1:st.wrong===1?.5:.25;
  if(st.market){
    const sv=Math.max(1,Math.round(Math.round((G.revenue||0)*.35)*.25*f)); G.saved+=sv; st.fb=[st.wrong?"meh":"good",`Gut verhandelt! −${sv} € beim Einkauf`];
  }else{
    let base=LV.base*(st.kind==="pizza"?1.5:st.kind==="coffee"?1.2:st.phone?2:1)*f*(st.textShown?.5:1);
    let bonus=0;
    if(st.insp){st.fb=[st.wrong?"meh":"good",st.wrong?"Mh. La dottoressa prende appunti …":"Bene. La dottoressa annuisce."];if(st.wrong===0){G.firstTry++;learn(st.it);}collectStep(st);save();return;}
    if(st.wrong===0&&!st.peeked){G.combo+=st.drink&&fx("wine")?2:1;G.maxCombo=Math.max(G.maxCombo,G.combo);bonus=G.combo>=3?Math.min(Math.floor(G.combo/3),3):0;}
    // Pizza mit drei Sternen: +1 € Trinkgeld; jede fehlerfreie Pizza zählt für die Sterne
    let star="";
    if(st.named){const n=st.named;if(pzStars(n)>=3)bonus++;
      if(st.wrong===0&&!st.peeked){const before=pzStars(n);S.pz[n]={ok:((S.pz[n]||{}).ok||0)+1};if(pzStars(n)>before)star=` ★ ${cap(n)}: ${pzStars(n)}. Stern!`;}}
    const extra=(g&&g.regular?1.5:1)*(g&&/^Turista/.test(g.name)?1+fx("tourist"):1);
    // Ausflüge zahlen nur einmal pro Spieltag Trinkgeld (sonst könnte man sie endlos wiederholen)
    const tip=G.practice?0:Math.max(1,Math.round(base*mult()*extra*(S.boost&&!G.trip?S.boost.x:1)))+bonus;
    G.earned+=tip; if(g)g.tip+=tip; if(tip)kasse(tip,"Trinkgeld");
    st.fb=[st.wrong?"meh":"good",(st.wrong?"Geschafft! ":pick(["Perfetto! ","Bravo! ","Esatto! ","Benissimo! "]))+(tip?`+${tip} € Trinkgeld${bonus?` (Combo +${bonus})`:""}`:"Heute nur zum Üben, Trinkgeld gibt es am nächsten Spieltag wieder.")+(st.bill?` · Rechnung ${st.bill} €`:"")+star];
  }
  if(st.wrong===0){G.firstTry++;learn(st.it);}
  if(st.kind==="pizza")st.cur=new Set(st.want);
  if(st.kind==="coffee"){st.cur=[...st.want];st.curCup=st.cup;}
  if(!st.market||st.corDe)collectStep(st);
  save();
}
function giveUp(){
  const st=curStep(), g=curGuest();
  st.done=true; st.gaveUp=true; G.steps++;
  G.stars=Math.max(1,G.stars-1); G.combo=0; if(g)g.mood=0;
  if(st.kind==="pizza"){
    [...new Set([...st.want,...st.cur])].filter(k=>st.want.has(k)!==st.cur.has(k)).forEach(k=>note(k,ING[k][0]));
    st.cur=new Set(st.want); st.curQty=st.qty;
  }
  if(st.kind==="coffee"){note(st.named,st.want.join(" → ")+", "+st.cup);st.cur=[...st.want];st.curCup=st.cup;}
  note(st.it,st.de);
  collectStep(st);
  st.fb=["zero","Kein Problem, so wäre es richtig gewesen."+(st.bill?` Er zahlt trotzdem ${st.bill} €.`:"")];
  save();
}
function advance(){
  if(G.phase==="market"){ G.mi++; if(G.mi>=G.market.length){endDay();return;} }
  else{
    const g=G.guests[G.gi]; G.si++;
    if(G.si>=g.steps.length){
      G.revenue=(G.revenue||0)+(g.bill||0); if(!G.trip)kasse(g.bill,g.phone?"Lieferung":"Rechnung");
      G.banner=g.insp?inspResult(g):g.phone?(g.bill?`Lieferung notiert: ${g.bill} € + ${g.tip} € Trinkgeld`:`Reservierung notiert. +${g.tip} € Trinkgeld`):`${g.name} geht ${g.mood>=2?"glücklich":g.mood===1?"zufrieden":"etwas verwirrt"} und zahlt ${g.bill} € + ${g.tip} € Trinkgeld.`;
      G.gi++; G.si=0;
      if(G.gi>=G.guests.length&&G.trip){endTrip();return;}
      if(G.gi>=G.guests.length){
        if(!isMarketDay(S.day)){endDay();return;}
        G.phase="market";G.banner=`Feierabend! Heute ist ${giorno(S.day)[0]}, Markttag: jetzt noch Zutaten kaufen.`;}
    }else G.banner="";
  }
  render(); $("#screen").scrollTop=0; autoSpeak();
}
// Ausflug (Eisladen, Hafen): ein Gesprächspartner, ein paar Fragen, das Trinkgeld kommt direkt in die Kasse.
function startTrip(id){
  const T=TRIPS[id];
  G={guests:[{name:T.who,mood:2,steps:sample(T.pool,T.steps).map(m=>mcStep(m,"Was antwortest du?")),tip:0,bill:0}],gi:0,si:0,earned:0,revenue:0,saved:0,stars:5,combo:0,maxCombo:0,used:new Set(),phase:"guest",banner:"",market:[],mi:0,firstTry:0,steps:0,trip:id,practice:S.tripDay[id]===S.day};
  screen="play"; render(); autoSpeak();
}
function endTrip(){
  G.summary={trip:G.trip};
  G.seen=null;G.ex=null;G.wt=null;G.tapped=null;
  S.coins+=G.earned; if(!G.practice)S.tripDay[G.trip]=S.day; save();
  screen="summary"; render(); kasse(G.earned,"in die Kasse");
}
// Was heute noch zum Einkaufen da ist: Kasse plus heutige Einnahmen, minus was heute schon fest weggeht
function stallBudget(){return S.coins+(G.revenue||0)+G.earned+(G.saved||0)-Math.round((G.revenue||0)*.35*(1-fx("cheap")))-LEVELS[S.level].rent-(G.bought||0);}
function stallBuy(k,price){
  const st=curStep();
  if(!st||st.kind!=="stall"||hasIng(k)||!st.offer.includes(k)||stallBudget()<price)return;
  const before=new Set(availPizze().map(p=>p.n)), saved=ING[k][3]-price;
  S.ing.push(k); st.bought.push(k); G.bought=(G.bought||0)+price; learn(k); sfx("coins");
  const neu=availPizze().filter(p=>!before.has(p.n));
  if(neu.length){S.newPz=neu[0].n;G.banner=`Neu im Rezeptbuch: ${neu.map(p=>cap(p.n)).join(", ")}!`;}
  else G.banner=`${cap(k)} (${ING[k][0]}) gehört jetzt zu deiner Küche.`;
  if(saved>0)G.banner=`Für ${price} € statt ${ING[k][3]} € gekauft! `+G.banner;
  save();
}
/* Feilschen mit Signor Esposito: Er nennt seinen Preis auf Italienisch, du bietest weniger.
   Unter 70 % des Preises ist er beleidigt und verliert Geduld; sonst kommt er dir auf halbem Weg entgegen.
   Nach zwei Gegenangeboten oder ohne Geduld gilt sein letzter Preis. */
const HAG_OFFER=[["Facciamo {N}?","Sagen wir {D}?"],["Le do {N} euro.","Ich gebe Ihnen {D} Euro."],["{N} euro, va bene?","{D} Euro, in Ordnung?"]];
const fillN=(t,n)=>t.replace("{N}",numIt(n)).replace("{D}",n);
function hagSay(H,it,de){H.say=it;H.sayDe=de;collectWords(it,de,2);setTimeout(()=>speak(it,"Signor Esposito"),250);}
function hagOffers(H){
  const lo=H.last||0, cand=[Math.round(H.ask*.5),Math.max(H.min,Math.round(H.ask*.8)),H.ask-1].filter(n=>n>lo&&n>0&&n<H.ask);
  H.offers=shuffle([...new Set(cand)]).map(n=>{const [it,de]=pick(HAG_OFFER);return {n,t:fillN(it,n),de:fillN(de,n)};});
}
function hagStart(k){
  const st=curStep(); if(!st||st.kind!=="stall"||hasIng(k)||!st.offer.includes(k))return;
  st.asks=st.asks||{};
  const P=ING[k][3], H={k,ask:st.asks[k]||P,min:Math.ceil(P*.7),pat:2,rounds:0,last:0,over:!!st.asks[k]&&st.asks[k]<P,peek:false};
  st.hag=H;
  if(H.over)hagSay(H,`Di nuovo qui? Il prezzo resta ${numIt(H.ask)} euro.`,`Schon wieder da? Der Preis bleibt ${H.ask} Euro.`);
  else hagSay(H,`${cap(k)}? Per Lei, ${numIt(H.ask)} euro.`,`${ING[k][0]}? Für Sie ${H.ask} Euro.`);
  hagOffers(H); save();
}
function hagOffer(n){
  const st=curStep(), H=st&&st.hag; if(!H||H.over||!H.offers.some(o=>o.n===n))return;
  if(n<H.min){
    H.pat--; sfx("wrong");
    if(H.pat<=0){H.over=true;H.offers=[];hagSay(H,`Basta! ${cap(numIt(H.ask))} euro, prendere o lasciare.`,`Schluss! ${H.ask} Euro, nehmen oder lassen.`);}
    else{hagSay(H,`Ma scherza? Così ci rimetto! Il prezzo è ${numIt(H.ask)} euro.`,`Machen Sie Witze? So lege ich drauf! Der Preis ist ${H.ask} Euro.`);hagOffers(H);}
  }else{
    const c=Math.round((n+H.ask)/2);
    if(n>=H.ask-1||c-n<=1||H.rounds>=2){H.ask=n;hagSay(H,`Affare fatto! ${cap(numIt(n))} euro.`,`Abgemacht! ${n} Euro.`);return hagDeal();}
    H.ask=c; H.last=n; H.rounds++; sfx("select");
    if(H.rounds>=2){H.over=true;H.offers=[];hagSay(H,`Ultimo prezzo: ${numIt(c)} euro. Di più non posso.`,`Letzter Preis: ${c} Euro. Mehr geht nicht.`);}
    else{const [it,de]=pick([["Mmh… facciamo {N}.","Hm … sagen wir {D}."],["Va bene, per Lei {N} euro.","Na gut, für Sie {D} Euro."],["Non posso, ma {N} sì.","Das kann ich nicht, aber {D} schon."]]);hagSay(H,fillN(it,c),fillN(de,c));hagOffers(H);}
  }
  st.asks[H.k]=H.ask; save();
}
function hagDeal(){
  const st=curStep(), H=st&&st.hag; if(!H||stallBudget()<H.ask)return;
  stallBuy(H.k,H.ask);
  if(H.ask<ING[H.k][3])G.haggled=(G.haggled||0)+ING[H.k][3]-H.ask;
  st.it=H.say.startsWith("Affare")?H.say:"Affare fatto! Grazie e buona giornata.";
  st.de=H.say.startsWith("Affare")?H.sayDe:"Abgemacht! Danke und schönen Tag noch.";
  if(!H.say.startsWith("Affare"))speak(st.it,"Signor Esposito");
  st.hag=null; save();
}
function hagLeave(){
  const st=curStep(), H=st&&st.hag; if(!H)return;
  st.asks[H.k]=H.ask; st.hag=null;
  st.it="Come vuole. Altro?"; st.de="Wie Sie wollen. Sonst noch etwas?"; speak(st.it,"Signor Esposito"); save();
}
// Laufenden Spieltag verwerfen (Abbrechen): Zutaten vom Markt werden erst am Abend bezahlt,
// also gehen sie zurück an den Stand. Sonst gäbe es sie durch Abbrechen umsonst.
function dropDay(){
  if(G&&!G.summary&&!G.trip){
    const back=G.market.flatMap(st=>st.bought||[]);
    if(back.length){S.ing=S.ing.filter(k=>!back.includes(k));if(S.newPz&&!availPizze().some(p=>p.n===S.newPz))S.newPz=null;}
  }
  G=null;
}
function endDay(){
  const LV=LEVELS[S.level];
  if(S.cert>0){G.stars=Math.min(5,G.stars+1);S.cert--;} // Zertifikat vom Gesundheitsamt
  if(G.insp&&G.insp.res==="pass")S.cert=3;
  if(fx("critic"))G.stars=Math.min(5,G.stars+fx("critic")); // Goldener Ofen: Bewertung milder
  const rev=G.revenue||0, ing=Math.round(rev*.35*(1-fx("cheap"))), rent=LV.rent, buy=G.bought||0, net=rev+G.earned-ing-rent+G.saved-buy+(G.inspMoney||0);
  const d=new Date(), today=d.toLocaleDateString("sv-SE"); d.setDate(d.getDate()-1); const yest=d.toLocaleDateString("sv-SE");
  if(S.last!==today)S.streak=S.last===yest?S.streak+1:1;
  S.last=today;
  G.summary={ing,rent,net,buy,day:S.day};
  storyAdvance();
  S.vocab.days[S.day]=buildVocab(S.day);
  G.seen=null;G.ex=null;G.wt=null;G.tapped=null;
  if(S.boost&&--S.boost.days<=0)S.boost=null; // Truhen-Bonus gilt für einen Spieltag
  S.coins=Math.max(0,S.coins+net); S.day++;
  if(S.level>=1){const r=G.insp&&G.insp.res;
    if(r==="fail")S.inspDue=S.day; else if(r==="cond")S.inspDue=S.day+2; else if(r||!S.inspDue||S.inspDue<S.day)S.inspDue=S.day+rnd(3,5);}
  G.summary.letter=inspToday(); save();
  screen="summary"; render(); if(net>0)kasse(net,"Gewinn heute"); else sfx("coins");
}
