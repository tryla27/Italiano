/* Karte: alle Orte auf einen Blick. Antippen = Tür-Geräusch und sofort dorthin. */
const PLACES=[
  {id:"pizzeria",it:"La Pizzeria",de:"Spieltag",x:112,y:250,img:"bilder/umgebungen/pizzeria.webp",vb:"60 400 280 280"},
  {id:"mercato",it:"Il Mercato",de:"mittwochs + samstags",x:282,y:150,img:"bilder/umgebungen/markt.webp",vb:"60 300 280 280"},
  {id:"gelateria",it:"La Gelateria",de:"Ausflug",x:296,y:300,img:"bilder/umgebungen/eisladen.webp",vb:"60 380 280 280"},
  {id:"porto",it:"Il Porto",de:"Ausflug",x:150,y:402,img:"bilder/umgebungen/hafen.webp",vb:"60 300 280 280"},
  {id:"capri",it:"Capri",de:"bald mit dem Boot",x:336,y:448,locked:true}
];
function placeOpen(p){
  if(p.locked)return false;
  if(p.id==="mercato")return !!(G&&!G.summary&&G.phase==="market");
  return true;
}
function mapSVG(){
  const pin=p=>{
    const open=placeOpen(p), r=40, id=`mp-${p.id}`;
    const pic=p.img?`<clipPath id="${id}"><circle cx="${p.x}" cy="${p.y}" r="${r}"/></clipPath><g clip-path="url(#${id})"><svg x="${p.x-r}" y="${p.y-r}" width="${2*r}" height="${2*r}" viewBox="${p.vb}" preserveAspectRatio="xMidYMid slice"><image href="${p.img}" width="400" height="700"/></svg></g>`
      :`<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="#7fae6a"/><path d="M${p.x-26} ${p.y+14} Q${p.x-8} ${p.y-30} ${p.x+6} ${p.y-6} Q${p.x+16} ${p.y-26} ${p.x+28} ${p.y+14}Z" fill="#5c8f4a"/>`;
    return `<g class="place${open?"":" shut"}" data-act="place" data-p="${p.id}" role="button" tabindex="0" aria-label="${p.it}, ${p.de}${open?"":" (geschlossen)"}">
      <circle cx="${p.x}" cy="${p.y+4}" r="${r+5}" fill="rgba(0,0,0,.25)"/>${pic}
      <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${open?"none":"rgba(30,36,32,.55)"}" stroke="#f3eee2" stroke-width="4"/>
      ${open?"":`<g transform="translate(${p.x-9} ${p.y-12})"><rect y="9" width="18" height="14" rx="3" fill="#f3eee2"/><path d="M4 9V6a5 5 0 0 1 10 0v3" fill="none" stroke="#f3eee2" stroke-width="3"/></g>`}
      <rect x="${p.x-56}" y="${p.y+r+6}" width="112" height="34" rx="9" fill="#1b221f" stroke="${open?"#f4c64f":"#3c4842"}" stroke-width="2"/>
      <text x="${p.x}" y="${p.y+r+21}" text-anchor="middle" class="mp-it">${p.it}</text>
      <text x="${p.x}" y="${p.y+r+34}" text-anchor="middle" class="mp-de">${p.de}</text></g>`;
  };
  const road=(d)=>`<path d="${d}" fill="none" stroke="#e8d3a6" stroke-width="14" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff6e0" stroke-width="2" stroke-dasharray="6 7"/>`;
  let houses="";const rr=seeded(7);
  for(let i=0;i<26;i++){const x=20+rr()*360,y=40+rr()*330;if(PLACES.some(p=>Math.hypot(p.x-x,p.y-y)<70))continue;
    const c=["#e9b77a","#f0d39b","#e48a6a","#f3e0c0","#d9a07a"][i%5];houses+=`<rect x="${x}" y="${y}" width="16" height="12" fill="${c}"/><path d="M${x-2} ${y} L${x+8} ${y-7} L${x+18} ${y}Z" fill="#c0503f"/>`;}
  let trees="";for(let i=0;i<14;i++){const x=10+rr()*380,y=30+rr()*340;if(PLACES.some(p=>Math.hypot(p.x-x,p.y-y)<62))continue;trees+=`<circle cx="${x}" cy="${y}" r="7" fill="#6f9e58"/><circle cx="${x+4}" cy="${y-3}" r="5" fill="#86b46c"/>`;}
  return `<svg class="map-svg" viewBox="0 0 400 540" role="img" aria-label="Karte">${DEFS}
    <rect width="400" height="540" fill="#f1dfb8"/>
    ${vesuvio(-20,110,240,"#a9927a")}<path d="M60 52 q8-10 16 0" stroke="#d8d0c4" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M0 420 Q90 380 170 440 Q240 488 300 420 Q350 370 400 390 L400 540 L0 540Z" fill="url(#sz-sea)"/>
    <path d="M0 420 Q90 380 170 440 Q240 488 300 420 Q350 370 400 390" fill="none" stroke="#fff6e0" stroke-width="4" opacity=".7"/>
    <ellipse cx="336" cy="466" rx="58" ry="22" fill="#d9c79a"/>
    ${road("M112 250 Q200 210 282 150")}${road("M112 250 Q210 280 296 300")}${road("M112 250 Q120 330 150 402")}
    ${houses}${trees}
    <path d="M70 470 l18 0 l-9 -14z M110 500 l14 0 l-7 -11z" fill="#f3eee2" opacity=".8"/>
    <g transform="translate(360 40)"><circle r="18" fill="#1b221f" opacity=".75"/><path d="M0-13 L5 0 L0 13 L-5 0Z" fill="#f3eee2"/><path d="M0-13 L5 0 L-5 0Z" fill="#e5533f"/><text y="-21" text-anchor="middle" class="mp-de" style="fill:#1b221f">N</text></g>
    ${PLACES.map(pin).join("")}</svg>`;
}
function rMap(){
  $("#screen").innerHTML=`<button class="back" data-act="home">← Zurück</button>
    <h2 class="t">La mappa<small>Karte · tippe auf einen Ort</small></h2>
    <div class="map">${mapSVG()}</div>
    ${mapMsg?`<p class="banner">${esc(mapMsg)}</p>`:""}`;
}
let mapMsg="";
// Zum Ort gehen: Tür-Geräusch, dann sofort dort.
function goPlace(id){
  const p=PLACES.find(q=>q.id===id); if(!p)return;
  if(!placeOpen(p)){mapMsg=p.locked?"Capri erreichst du später mit dem eigenen Boot.":isMarketDay(S.day)?"Heute ist Markttag: der Markt öffnet nach dem letzten Gast.":`Markt ist nur mercoledì und sabato. Nächster Markttag: ${giorno(nextMarketDay(S.day))[0]}.`;sfx("wrong");return render();}
  mapMsg=""; sfx("door");
  if(id==="pizzeria"||id==="mercato"){if(G&&!G.summary&&!G.trip){screen="play";render();autoSpeak();return;}G=null;return startDay();}
  if(G&&!G.summary&&G.trip===id){screen="play";render();autoSpeak();return;}
  G=null;return startTrip(id);
}
