/* Il Mercato in der 3D-Stadt: fünf Stände, an denen es jede Zutat des Spiels gibt.
   Gekauft wird in Kisten (KISTE Portionen), bezahlt sofort aus der Kasse. Jede Pizza verbraucht eine Portion
   von jeder ihrer Zutaten; Gäste bestellen nur, was im Vorrat ist (schritte.js). Markttag: alles 20 % günstiger. */
let mkTab="verdura", mkMsg="";
const MK_RABATT=.2;
// Kistenpreis heute: Kühlschrank macht billiger, am Markttag (mercoledì, sabato) gibt es Rabatt
const mkPrice=k=>Math.max(1,Math.round(ING[k][3]*(1-fx("cheap"))*(isMarketDay(S.day)?1-MK_RABATT:1)));
// Ungefähr so viele Pizzen backt man an einem Spieltag dieser Stufe
function dayPizze(){
  const LV=LEVELS[S.level], q=S.level===0?1:S.level<=2?1.5:2;
  return Math.ceil((LV.guests+fx("guest")-LV.phones)*q+LV.phones*2.5);
}
// Wie viele Portionen von jeder Zutat für einen Spieltag reichen: nach Anteil an den Pizzen, die man backen kann
function mkTargets(){
  const menu=availPizze(), P=dayPizze(), t={};
  if(!menu.length)return t;
  menu.forEach(p=>p.ing.forEach(k=>{t[k]=(t[k]||0)+1;}));
  Object.keys(t).forEach(k=>{t[k]=Math.max(4,Math.ceil(P*t[k]/menu.length*1.3));});
  return t;
}
// Einkaufsliste zum Auffüllen: {Zutat: Kisten}, das Knappste zuerst
function mkList(){
  const t=mkTargets();
  return Object.keys(t).filter(k=>stockOf(k)<t[k]).sort((a,b)=>stockOf(a)/t[a]-stockOf(b)/t[b])
    .map(k=>({k,n:Math.ceil((t[k]-stockOf(k))/KISTE)}));
}
const mkListCost=()=>mkList().reduce((a,x)=>a+x.n*mkPrice(x.k),0);
// Reicht der Vorrat für mindestens eine Pizza?
const kitchenEmpty=()=>!cookPizze(1).length;
// Knapp: eine Zutat der eigenen Pizzen reicht nicht mehr für einen Tag
const stockLow=()=>mkList().length>0;
// Notnagel gegen Sackgassen: Küche leer und kein Geld für die günstigste Pizza → die Händler schenken
// je eine Kiste der fehlenden Zutaten dieser Pizza. Gibt true zurück, wenn geholfen wurde.
function mkRescue(){
  if(!kitchenEmpty())return false;
  const miss=p=>p.ing.filter(k=>stockOf(k)<1), cost=p=>miss(p).reduce((a,k)=>a+mkPrice(k),0);
  const best=availPizze().sort((a,b)=>cost(a)-cost(b))[0];
  if(!best||S.coins>=cost(best))return false;
  miss(best).forEach(k=>addStock(k,KISTE));
  mkMsg=`Die Händler helfen dir aus: je eine Kiste für die ${cap(best.n)}, geschenkt. Verdiene damit neues Geld!`;
  save(); return true;
}
function mkBuy(k){
  const p=mkPrice(k); if(!ING[k]||S.coins<p){sfx("wrong");return false;}
  S.coins-=p; mkMsg=addStock(k,KISTE); sfx("coins"); save(); if(typeof mk3Hop==="function")mk3Hop(k); return true;
}
// Alles auffüllen, was für einen Spieltag fehlt (so weit das Geld reicht). Gibt die ausgegebenen Euro zurück.
function mkFill(){
  let spent=0;
  mkList().forEach(({k,n})=>{for(let i=0;i<n;i++){const p=mkPrice(k);if(S.coins<p)return;S.coins-=p;spent+=p;addStock(k,KISTE);}});
  if(spent){mkMsg=`Aufgefüllt für ${spent} €. Der Vorrat reicht für einen Spieltag.`;sfx("coins");}
  else mkMsg=S.coins<1&&mkList().length?"Dafür reicht das Geld gerade nicht.":"Dein Vorrat reicht schon für einen Spieltag.";
  save(); return spent;
}
// Zum Markt: außerhalb eines laufenden Spieltags immer offen; am Markttag nach Feierabend gehört er zum Spieltag
function mkGo(){
  if(G&&!G.summary&&!G.trip&&G.phase==="market"){screen="play";render();autoSpeak();return;}
  if(G&&!G.summary){mapMsg="Dein Spieltag läuft noch: erst fertig spielen, dann einkaufen.";sfx("wrong");return render();}
  if(G&&G.summary)G=null;
  mapMsg=""; mkMsg=""; if(typeof mk3Enter==="function")mk3Enter(); screen="mercato"; sfx("door"); render();
  const B=BANCHE.find(b=>b.id===mkTab); if(B&&S.sound)setTimeout(()=>speak(B.say[0],B.who),300);
}
function mkCard(k){
  const n=stockOf(k), p=mkPrice(k), neu=!hasIng(k);
  const pz=PIZZE.filter(x=>x.ing.includes(k));
  const use=pz.length?`für ${pz.map(x=>cap(x.n)).join(", ")}`:"als Extra-Belag";
  return `<div class="card mk-card${neu?" neu":""}${n<4&&!neu?" low":""}">${kisteImg(k)}<b>${k}</b><small>${esc(ING[k][0])} · ${esc(use)}</small>
    <span class="mk-stock">${neu?"neu":`im Vorrat: <b>${n}</b>`}</span>
    <button class="buy" data-act="mkbuy" data-k="${k}" ${S.coins<p?"disabled":""} aria-label="Eine Kiste ${esc(ING[k][0])} für ${p} Euro">+${KISTE} · ${p} €</button></div>`;
}
// Begehbar in 3D (markt3d.js), ohne WebGL der flache Markt
function rMercato(){return cityCan()?rMercato3D():rMercato2D();}
function rMercato2D(){
  const B=BANCHE.find(b=>b.id===mkTab)||BANCHE[0], md=isMarketDay(S.day), list=mkList(), cost=mkListCost(), kisten=list.reduce((a,x)=>a+x.n,0);
  const esp=B.who==="Signor Esposito"?{name:"Signor Esposito",mood:2}:null;
  $("#screen").innerHTML=`${head("Il Mercato",md?`Markttag: alles ${MK_RABATT*100} % günstiger`:"Zutaten für deine Küche")}
    <div class="stage mk-stage">${(imageScene("mercato",esp,false,"Markt",crowdLayer("mercato"))||sceneMarket()).replace('<svg class="stage-svg"','<svg class="stage-svg" preserveAspectRatio="xMidYMid slice"')}</div>
    <div class="mk-tabs" role="tablist">${BANCHE.map(b=>`<button class="chip${b===B?" on":""}" role="tab" aria-selected="${b===B}" data-act="mkbank" data-b="${b.id}"><span aria-hidden="true">${b.ic}</span> ${esc(b.it)}</button>`).join("")}</div>
    <div class="bubble mk-say"><div class="who">${esc(B.who)}</div><div class="it">${wordsHTML(B.say[0],true)}</div><div class="tr">${esc(B.say[1])}</div></div>
    <p class="note mk-info">Kasse <b>${S.coins} €</b> · 1 Kiste = ${KISTE} Portionen · jede Pizza braucht 1 Portion pro Zutat${mkMsg?`<br><b class="mk-msg">${esc(mkMsg)}</b>`:""}</p>
    <div class="cards scroll mk-list">${B.ing.map(mkCard).join("")}</div>
    <button class="big mk-fill" data-act="mkfill" ${!kisten||S.coins<Math.min(...list.map(x=>mkPrice(x.k)))?"disabled":""}>${kisten?"Vorrat auffüllen":"Vorrat reicht"}<small>${kisten?`${kisten} ${kisten===1?"Kiste":"Kisten"} für einen Spieltag · ${cost} €`:`genug für etwa ${dayPizze()} Pizzen`}</small></button>`;
}
