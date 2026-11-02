/* Il Bar am Hafen: Burger und Getränke. Der Wirt ist Ciccio, ein richtig dicker Kerl mit Schürze und
   Kochmütze; er steht auch im 3D-Viertel neben seinem Kiosk (barBuild). Du bestellst auf Italienisch,
   er antwortet und kassiert. Eis gibt es nur in der Gelateria. (Memory spielt man am Tisch, tavolo.js.)
   Öffnen über goPlace("bar") aus karte.js, Bestellen über data-act="bardrink". */
const BAR_WHO="Ciccio";
CHARS[BAR_WHO]={skin:"#e2a77e",hair:"#1d1d1d",style:"bald",shirt:"#f6f1e6",bigmus:1}; // für die Stimme (männlich)
// k (italienisch), Deutsch, Symbol, Preis €, Bestellung; erst die Burger, dann die Getränke
const BAR_FOOD=4;
const BAR_MENU=[
  ["hamburger","Hamburger","🍔",5,"Un hamburger, per favore."],
  ["cheeseburger","Cheeseburger","🍔",6,"Un cheeseburger, per favore."],
  ["doppio burger","doppelter Burger","🍔",8,"Un doppio burger, per favore."],
  ["patatine fritte","Pommes frites","🍟",3,"Le patatine fritte, per favore."],
  ["caffè","Espresso","☕",1,"Un caffè, per favore."],
  ["cappuccino","Cappuccino","☕",2,"Un cappuccino, per favore."],
  ["caffè freddo","Eiskaffee","🧋",2,"Un caffè freddo, per favore."],
  ["spremuta d'arancia","frisch gepresster Orangensaft","🍊",3,"Una spremuta d'arancia, per favore."],
  ["limonata","Limonade","🍋",2,"Una limonata, per favore."],
  ["tè freddo","Eistee","🧊",2,"Un tè freddo, per favore."],
  ["acqua minerale","Mineralwasser","💧",1,"Un'acqua minerale, per favore."]
];
const BAR_SAY={
  hello:[["Benvenuto da Ciccio! Hai fame?","Willkommen bei Ciccio! Hast du Hunger?"],["Ciao! Un bel burger? Cosa prendi?","Hallo! Ein schöner Burger? Was nimmst du?"],
    ["Buongiorno! Qui si mangia bene!","Guten Tag! Hier isst man gut!"]],
  served:[["Ecco a Lei! {p} euro, grazie.","Bitte schön! {p} Euro, danke."],["Subito! Ecco qua: {p} euro.","Sofort! Bitte: {p} Euro."],
    ["Prego! {p} euro. Buon appetito!","Bitte! {p} Euro. Guten Appetit!"]],
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
  $("#screen").innerHTML=`${head("Da Ciccio",`Burger und Getränke · ${S.coins} €`)}
    <div class="tav-top"><div class="tav-npc"><div class="tav-face ciccio on">${ciccioSVG(B.got||!B.me?2:1)}</div>
      <button class="tav-say" data-act="sayit" data-t="${esc(s[0])}">${esc(s[0])}<small>${esc(s[1])}</small></button></div></div>
    ${B.me?`<p class="note memo-line">Du: <b>${esc(B.me)}</b></p>`:""}
    ${B.got?`<div class="bar-got" aria-label="${esc(B.got[0])}">${B.got[2]}</div>`:""}
    <p class="bar-sec">Panini</p><div class="bar-menu">${BAR_MENU.slice(0,BAR_FOOD).map(barBtn).join("")}</div>
    <p class="bar-sec">Bevande</p><div class="bar-menu">${BAR_MENU.slice(BAR_FOOD).map(barBtn).join("")}</div>`;
}
const barBtn=d=>`<button class="bar-d${S.coins<d[3]?" poor":""}" data-act="bardrink" data-k="${esc(d[0])}"><i>${d[2]}</i><span><b>${esc(d[0])}</b><small>${esc(d[1])}</small></span><em>${d[3]} €</em></button>`;

// Ciccio als Bild: großer runder Bauch mit Schürze, Doppelkinn, Glatze, dicker Schnurrbart, Kochmütze
function ciccioSVG(mood){
  const mouth=mood>=2?"M41 63 Q50 71 59 63":"M42 66 L58 66";
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <ellipse cx="50" cy="104" rx="50" ry="34" fill="#f6f1e6"/>
    <ellipse cx="50" cy="108" rx="34" ry="28" fill="#fbfaf6" stroke="#d9d2c4" stroke-width="1.5"/>
    <path d="M30 86 Q50 80 70 86" stroke="#c94a3a" stroke-width="2" fill="none"/>
    <circle cx="44" cy="95" r="2.4" fill="#c94a3a" opacity=".55"/><circle cx="60" cy="99" r="1.8" fill="#d9a23a" opacity=".6"/>
    <ellipse cx="50" cy="75" rx="27" ry="10" fill="#d89a70"/>
    <ellipse cx="50" cy="51" rx="33" ry="28" fill="#e2a77e"/>
    <circle cx="17" cy="52" r="5" fill="#d89a70"/><circle cx="83" cy="52" r="5" fill="#d89a70"/>
    <path d="M22 46 Q24 36 30 34 M78 46 Q76 36 70 34" stroke="#1d1d1d" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M28 30 Q26 10 40 12 Q50 2 60 12 Q74 10 72 30 Z" fill="#fbfaf6" stroke="#d9d2c4" stroke-width="1.2"/>
    <rect x="28" y="26" width="44" height="8" rx="3" fill="#fbfaf6" stroke="#d9d2c4" stroke-width="1.2"/>
    <circle cx="40" cy="47" r="2.8" fill="#1d1d1d"/><circle cx="60" cy="47" r="2.8" fill="#1d1d1d"/>
    <path d="M35 41 Q40 39 45 41 M55 41 Q60 39 65 41" stroke="#1d1d1d" stroke-width="2" fill="none"/>
    <ellipse cx="50" cy="53" rx="5" ry="4" fill="#cf8c62"/>
    <circle cx="30" cy="57" r="6" fill="#e74c3c" opacity=".35"/><circle cx="70" cy="57" r="6" fill="#e74c3c" opacity=".35"/>
    <path d="M32 60 Q41 52 50 58 Q59 52 68 60 Q59 64 50 61 Q41 64 32 60Z" fill="#1d1d1d"/>
    <path d="${mouth}" stroke="#5a2a20" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`;
}
// Ciccio im 3D-Viertel: steht neben seinem Kiosk an der Promenade, mit Riesenbauch, Schürze und Kochmütze
function barBuild(){
  if(typeof frSphere!=="function")return;
  const T=THREE, g=new T.Group(), sk=c3mat(0xe2a77e), white=c3mat(0xf6f1e6), apron=c3mat(0xfbfaf6), dark=c3mat(0x2b2f2c);
  const ball=(r,m,x,y,z,sx,sy,sz)=>{const o=new T.Mesh(frSphere(r,14,10),m);o.position.set(x,y,z);o.scale.set(sx||1,sy||1,sz||1);g.add(o);return o;};
  [-.2,.2].forEach(dx=>{c3box(.26,.62,.28,c3mat(0x3a3f48),dx,.31,0,g);c3box(.28,.1,.38,dark,dx,.05,.05,g);});
  ball(.62,white,0,1.12,0,1.1,1,1.05);            // Riesenbauch im weißen Hemd
  ball(.55,apron,0,1.02,.12,1.02,.92,1);          // Schürze vorne drauf
  ball(.42,white,0,1.62,0,1.15,.7,1);             // breite Schultern
  [-1,1].forEach(s=>{const a=ball(.17,white,s*.66,1.35,0,1,1.6,1);a.rotation.z=s*.35;ball(.12,sk,s*.76,1.0,.05);});
  ball(.12,sk,0,1.85,.02,1.6,.8,1.4);             // Doppelkinn
  const head=ball(.3,sk,0,2.05,0,1.05,1,1);
  c3box(.34,.07,.06,c3mat(0x1d1d1d),0,1.96,.28,g); // Schnurrbart
  [-.1,.1].forEach(dx=>c3box(.05,.05,.02,c3mat(0x1d1d1d),dx,2.1,.29,g));
  ball(.06,c3mat(0xcf8c62),0,2.02,.3);
  const hat=new T.Mesh(new T.CylinderGeometry(.3,.26,.32,14),apron); hat.position.set(0,2.42,0); g.add(hat);
  ball(.24,apron,0,2.62,0,1.3,.7,1.3);            // Kochmütze oben bauschig
  g.position.set(-9.6,0,13.3); g.scale.setScalar(1.25); g.rotation.y=.25;
  C3.scene.add(g); C3.picks.push(g); g.userData.place="bar"; // antippen = zur Bar
  c3add("shadow",flatPlane(2.4,2.4),-9.6,.03,13.3);
}
