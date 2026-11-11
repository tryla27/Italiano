/* Il Bar am Hafen: Burger und Getränke. Der Wirt ist Ciccio, ein richtig dicker Imbissbuden-Typ mit
   fleckigem Unterhemd, Goldkette und Kappe verkehrt herum; er steht auch im 3D-Viertel neben seinem Kiosk (barBuild). Du bestellst auf Italienisch,
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

// Ciccio als Bild: Imbissbuden-Typ mit Riesenbauch im fleckigen Unterhemd, Goldkette, Bartstoppeln,
// rote Kappe verkehrt herum, Schweißtropfen und Grillzange
function ciccioSVG(mood){
  const mouth=mood>=2?"M41 64 Q50 71 59 64":"M42 66 L58 66";
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <ellipse cx="50" cy="106" rx="52" ry="36" fill="#e2a77e"/>
    <path d="M26 100 Q24 80 34 76 L66 76 Q76 80 74 100 Z" fill="#f4f1ea"/>
    <ellipse cx="50" cy="104" rx="30" ry="24" fill="#f4f1ea"/>
    <path d="M34 76 L36 70 M66 76 L64 70" stroke="#f4f1ea" stroke-width="5"/>
    <circle cx="42" cy="92" r="4" fill="#d9a23a" opacity=".55"/><circle cx="58" cy="97" r="3" fill="#b5532f" opacity=".5"/><circle cx="51" cy="86" r="2" fill="#8a6a3a" opacity=".45"/>
    <path d="M37 76 Q50 88 63 76" stroke="#e9c34a" stroke-width="2.6" fill="none"/>
    <ellipse cx="50" cy="75" rx="27" ry="10" fill="#d89a70"/>
    <ellipse cx="50" cy="51" rx="33" ry="28" fill="#e2a77e"/>
    <circle cx="17" cy="52" r="5" fill="#d89a70"/><circle cx="83" cy="52" r="5" fill="#d89a70"/>
    <path d="M24 58 Q30 78 50 79 Q70 78 76 58 Q70 70 50 71 Q30 70 24 58Z" fill="#1d1d1d" opacity=".22"/>
    <path d="M18 34 Q20 14 50 13 Q80 14 82 34 Z" fill="#c8322a"/>
    <path d="M16 34 Q50 28 84 34 L84 37 Q50 31 16 37Z" fill="#9c241e"/>
    <path d="M44 14 Q50 4 56 14" fill="none" stroke="#9c241e" stroke-width="5"/>
    <circle cx="40" cy="47" r="2.8" fill="#1d1d1d"/><circle cx="60" cy="47" r="2.8" fill="#1d1d1d"/>
    <path d="M34 41 L45 43 M66 41 L55 43" stroke="#1d1d1d" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="50" cy="54" rx="5.5" ry="4.5" fill="#cf8c62"/>
    <circle cx="29" cy="58" r="6" fill="#e74c3c" opacity=".35"/><circle cx="71" cy="58" r="6" fill="#e74c3c" opacity=".35"/>
    <path d="M37 61 Q50 57 63 61 Q50 64 37 61Z" fill="#1d1d1d"/>
    <path d="${mouth}" stroke="#5a2a20" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M76 38 q3 5 0 7 q-3 -2 0 -7Z" fill="#8fd0ef"/>
  </svg>`;
}
// Ciccio im 3D-Viertel: steht neben seinem Kiosk an der Promenade, Riesenbauch im fleckigen Unterhemd,
// nackte Arme, Goldkette, Kappe verkehrt herum, Grillzange in der Hand
function barBuild(){
  if(typeof frSphere!=="function")return;
  const T=THREE, g=new T.Group(), sk=c3mat(0xe2a77e), vest=c3mat(0xf4f1ea), dark=c3mat(0x2b2f2c), cap=c3mat(0xc8322a);
  const ball=(r,m,x,y,z,sx,sy,sz)=>{const o=new T.Mesh(frSphere(r,14,10),m);o.position.set(x,y,z);o.scale.set(sx||1,sy||1,sz||1);g.add(o);return o;};
  [-.2,.2].forEach(dx=>{c3box(.26,.62,.28,c3mat(0x4a5a78),dx,.31,0,g);c3box(.3,.12,.4,c3mat(0xf3f3f3),dx,.06,.05,g);}); // Jeans, Turnschuhe
  ball(.64,vest,0,1.12,0,1.12,1,1.08);            // Riesenbauch im Unterhemd
  [[.2,1.25,.6,0xd9a23a],[-.25,.95,.62,0xb5532f],[.05,.8,.66,0x8a6a3a]].forEach(([x,y,z,c])=>ball(.07,c3mat(c),x,y,z,1,1,.3)); // Flecken
  ball(.42,vest,0,1.62,0,1.15,.7,1);              // Brust
  [-1,1].forEach(s=>{ball(.16,sk,s*.55,1.7,0,1.2,.8,1);const a=ball(.16,sk,s*.68,1.35,0,1,1.7,1);a.rotation.z=s*.35;ball(.13,sk,s*.78,1.0,.05);}); // nackte Arme
  c3box(.04,.04,.5,c3mat(0xb9bfc4),.8,.95,.3,g);                 // Grillzange
  const chain=new T.Mesh(new T.CylinderGeometry(.2,.2,.035,16,1,true),c3mat(0xe9c34a,{emissive:0x5a4410,side:T.DoubleSide}));
  chain.position.set(0,1.82,.17); chain.rotation.x=1.2; g.add(chain);    // Goldkette
  ball(.12,sk,0,1.85,.02,1.6,.8,1.4);             // Doppelkinn
  ball(.3,sk,0,2.05,0,1.05,1,1);
  ball(.29,c3mat(0x3a3530,{transparent:true,opacity:.35}),0,1.98,.03,1.04,.7,1.02); // Bartstoppeln
  c3box(.3,.06,.06,c3mat(0x1d1d1d),0,1.97,.28,g); // Schnurrbart
  [-.1,.1].forEach(dx=>c3box(.05,.05,.02,c3mat(0x1d1d1d),dx,2.1,.29,g));
  ball(.06,c3mat(0xcf8c62),0,2.02,.3);
  ball(.31,cap,0,2.2,0,1.06,.55,1.06);            // Kappe
  c3box(.3,.04,.26,cap,0,2.22,-.36,g);            // Schirm nach hinten
  g.position.set(-9.6,0,13.3); g.scale.setScalar(1.25); g.rotation.y=.25;
  C3.scene.add(g); C3.picks.push(g); g.userData.place="bar"; // antippen = zur Bar
  c3add("shadow",flatPlane(2.4,2.4),-9.6,.03,13.3);
}

