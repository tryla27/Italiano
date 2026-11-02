/* Il Bar am Hafen: hier gibt es nur Getränke. Totò steht hinter der Theke; du bestellst auf Italienisch,
   er antwortet und kassiert. (Memory spielt man am Tisch auf der Piazza, tavolo.js.)
   Öffnen über goPlace("bar") aus karte.js, Bestellen über data-act="bardrink". */
const BAR_WHO="Totò";
CHARS[BAR_WHO]={skin:"#d39b6e",hair:"#1d1d1d",style:"short",shirt:"#f6f1e6",tie:"#1b221f",mus:1};
// k (italienisch), Deutsch, Symbol, Preis €, Bestellung
const BAR_MENU=[
  ["caffè","Espresso","☕",1,"Un caffè, per favore."],
  ["cappuccino","Cappuccino","☕",2,"Un cappuccino, per favore."],
  ["caffè freddo","Eiskaffee","🧋",2,"Un caffè freddo, per favore."],
  ["spremuta d'arancia","frisch gepresster Orangensaft","🍊",3,"Una spremuta d'arancia, per favore."],
  ["limonata","Limonade","🍋",2,"Una limonata, per favore."],
  ["granita al limone","Zitronen-Granita","🍧",2,"Una granita al limone, per favore."],
  ["tè freddo","Eistee","🧊",2,"Un tè freddo, per favore."],
  ["acqua minerale","Mineralwasser","💧",1,"Un'acqua minerale, per favore."]
];
const BAR_SAY={
  hello:[["Buongiorno! Cosa Le preparo?","Guten Tag! Was darf ich Ihnen machen?"],["Ciao! Cosa prendi?","Hallo! Was nimmst du?"]],
  served:[["Ecco a Lei! {p} euro, grazie.","Bitte schön! {p} Euro, danke."],["Subito! Ecco qua: {p} euro.","Sofort! Bitte: {p} Euro."],
    ["Prego, buona bevuta! {p} euro.","Bitte, zum Wohl! {p} Euro."]],
  poor:[["Mi dispiace, i soldi non bastano.","Tut mir leid, das Geld reicht nicht."]]
};
const euro=p=>p===1?"un":String(p); // „un euro“, „due euro“ …
let BARB=null;
function barOpen(){BARB={say:pick(BAR_SAY.hello),me:null,got:null};screen="bar";render();setTimeout(()=>{if(screen==="bar")speak(BARB.say[0],BAR_WHO);},300);}
function barOrder(k){
  const d=BAR_MENU.find(x=>x[0]===k); if(!d||!BARB)return;
  BARB.me=d[4];
  if(S.coins<d[3]){BARB.say=pick(BAR_SAY.poor);BARB.got=null;sfx("wrong");}
  else{const s=pick(BAR_SAY.served);BARB.say=[s[0].replace("{p}",euro(d[3])).replace(/^(\w+[!,] )un /,"$1Un "),s[1].replace("{p}",d[3])];BARB.got=d;
    S.coins-=d[3];sfx("coins");save();}
  render(); speak(d[4]);
  const B=BARB; setTimeout(()=>{if(BARB===B&&screen==="bar")speak(B.say[0],BAR_WHO);},1900);
}
function rBar(){
  if(!BARB)BARB={say:pick(BAR_SAY.hello),me:null,got:null};
  const B=BARB, s=B.say;
  $("#screen").innerHTML=`${head("Il bar","Getränke bestellen · ${S.coins} €")}
    <div class="tav-top"><div class="tav-npc"><div class="tav-face on">${face(BAR_WHO,B.got||!B.me?2:1)}</div>
      <button class="tav-say" data-act="sayit" data-t="${esc(s[0])}">${esc(s[0])}<small>${esc(s[1])}</small></button></div></div>
    ${B.me?`<p class="note memo-line">Du: <b>${esc(B.me)}</b></p>`:""}
    ${B.got?`<div class="bar-got" aria-label="${esc(B.got[0])}">${B.got[2]}</div>`:""}
    <div class="bar-menu">${BAR_MENU.map(d=>`<button class="bar-d${S.coins<d[3]?" poor":""}" data-act="bardrink" data-k="${esc(d[0])}"><i>${d[2]}</i><span><b>${esc(d[0])}</b><small>${esc(d[1])}</small></span><em>${d[3]} €</em></button>`).join("")}</div>`;
}
