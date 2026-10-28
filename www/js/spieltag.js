/* Ablauf eines Spieltags: Gäste, Trinkgeld, Fehler, Markt, Tagesabrechnung. */
/* ---------- Game flow ---------- */
let screen="home", G=null, menuOpen=false, volOpen=false, codeBox=null, pauseOpen=false, helpOpen=false;
function startDay(){
  const L=S.level, LV=LEVELS[L];
  G={guests:[],gi:0,si:0,earned:0,revenue:0,saved:0,stars:5,combo:0,maxCombo:0,used:new Set(),phase:"guest",banner:"",market:[],mi:0,firstTry:0,steps:0};
  const phoneSlots=new Set(sample([...Array(LV.guests).keys()].slice(1),LV.phones));
  const names=shuffle(NAMES);
  for(let i=0;i<LV.guests;i++){
    let steps;
    if(phoneSlots.has(i))steps=[LV.reserv&&Math.random()<.5?reservStep():phoneStep()];
    else{
      const ord=orderStep(L===0?0:L<=2?1:2); let total=ord.price;
      steps=[mcStep(pickFresh(GREET),"Was antwortest du?"),ord];
      if(LV.drinks){const di=pickFresh(DRINK);total+=DRINK_PRICE[DRINK.indexOf(di)]||0;steps.push(mcStep(di,"Was antwortest du?"));}
      if(!LV.talkChance||Math.random()<LV.talkChance)steps.push(mcStep(pickFresh(pick(LV.talk)),"Was antwortest du?"));
      steps.push(billStep(total));
    }
    const bill=steps.reduce((a,x)=>a+(x.bill||0),0)||(phoneSlots.has(i)?steps[0].price||0:0);
    G.guests.push({name:phoneSlots.has(i)?"Telefono":names[i%names.length],mood:2,steps,tip:0,bill,phone:phoneSlots.has(i)});
  }
  G.market=sample(MARKET,2).map(m=>mcStep(m,"Was antwortest du?",{market:true}));
  screen="play"; render(); autoSpeak();
}
const wday=d=>(d-1)%7, giorno=d=>GIORNI[wday(d)], isMarketDay=d=>MARKT_TAGE.includes(wday(d));
function nextMarketDay(d){for(let i=0;i<7;i++)if(isMarketDay(d+i))return d+i;return d;}
const curStep=()=>G.phase==="market"?G.market[G.mi]:G.guests[G.gi].steps[G.si];
const curGuest=()=>G.phase==="market"?null:G.guests[G.gi];
function autoSpeak(){const st=curStep();if(st&&(S.sound||st.phone)&&(!st.phone||!st.showText||S.sound))setTimeout(()=>speak(st.it,speaker()),250);}
// Wer gerade spricht (für die passende Stimme).
function speaker(){if(G.phase==="market")return "Signor Esposito";const g=curGuest();return g&&!g.phone?g.name:null;}

function wrongAnswer(i){
  const st=curStep(), g=curGuest();
  st.wrong++; if(i!==undefined)st.bad.push(i);
  if(st.wrong===1)G.stars=Math.max(1,G.stars-.5);
  if(g)g.mood=Math.max(0,g.mood-1);
  G.combo=0; st.shake=true;
  if(st.kind==="mc")note(st.it,st.de);
}
function finish(){
  const st=curStep(), g=curGuest(), LV=LEVELS[S.level];
  st.done=true; G.steps++;
  const f=st.wrong===0?1:st.wrong===1?.5:.25;
  if(st.market){
    const sv=Math.max(1,Math.round(Math.round((G.revenue||0)*.35)*.25*f)); G.saved+=sv; st.fb=[st.wrong?"meh":"good",`Gut verhandelt! −${sv} € beim Einkauf`];
  }else{
    let base=LV.base*(st.kind==="pizza"?1.5:st.phone?2:1)*f*(st.textShown?.5:1);
    let bonus=0;
    if(st.wrong===0&&!st.peeked){G.combo++;G.maxCombo=Math.max(G.maxCombo,G.combo);bonus=G.combo>=3?Math.min(Math.floor(G.combo/3),3):0;}
    const tip=Math.max(1,Math.round(base*mult()*(S.boost&&!G.trip?S.boost.x:1)))+bonus;
    G.earned+=tip; if(g)g.tip+=tip; kasse(tip,"Trinkgeld");
    st.fb=[st.wrong?"meh":"good",(st.wrong?"Geschafft! ":pick(["Perfetto! ","Bravo! ","Esatto! ","Benissimo! "]))+`+${tip} € Trinkgeld${bonus?` (Combo +${bonus})`:""}`+(st.bill?` · Rechnung ${st.bill} €`:"")];
  }
  if(st.wrong===0){G.firstTry++;learn(st.it);}
  if(st.kind==="pizza")st.cur=new Set(st.want);
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
      G.banner=g.phone?(g.bill?`Lieferung notiert: ${g.bill} € + ${g.tip} € Trinkgeld`:`Reservierung notiert. +${g.tip} € Trinkgeld`):`${g.name} geht ${g.mood>=2?"glücklich":g.mood===1?"zufrieden":"etwas verwirrt"} und zahlt ${g.bill} € + ${g.tip} € Trinkgeld.`;
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
  G={guests:[{name:T.who,mood:2,steps:sample(T.pool,T.steps).map(m=>mcStep(m,"Was antwortest du?")),tip:0,bill:0}],gi:0,si:0,earned:0,revenue:0,saved:0,stars:5,combo:0,maxCombo:0,used:new Set(),phase:"guest",banner:"",market:[],mi:0,firstTry:0,steps:0,trip:id};
  screen="play"; render(); autoSpeak();
}
function endTrip(){
  G.summary={trip:G.trip};
  G.seen=null;G.ex=null;G.wt=null;G.tapped=null;
  S.coins+=G.earned; save();
  screen="summary"; render(); kasse(G.earned,"in die Kasse");
}
function endDay(){
  const LV=LEVELS[S.level];
  const rev=G.revenue||0, ing=Math.round(rev*.35), rent=LV.rent, net=rev+G.earned-ing-rent+G.saved;
  const d=new Date(), today=d.toLocaleDateString("sv-SE"); d.setDate(d.getDate()-1); const yest=d.toLocaleDateString("sv-SE");
  if(S.last!==today)S.streak=S.last===yest?S.streak+1:1;
  S.last=today;
  G.summary={ing,rent,net,day:S.day};
  S.vocab.days[S.day]=buildVocab(S.day);
  G.seen=null;G.ex=null;G.wt=null;G.tapped=null;
  if(S.boost&&--S.boost.days<=0)S.boost=null; // Truhen-Bonus gilt für einen Spieltag
  S.coins=Math.max(0,S.coins+net); S.day++; save();
  screen="summary"; render(); if(net>0)kasse(net,"Gewinn heute"); else sfx("coins");
}
