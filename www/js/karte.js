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
  return `<svg class="map-svg" viewBox="0 0 400 540" role="img" aria-label="Karte">${DEFS}
    <image href="bilder/karte.webp" width="400" height="540"/>
    <g transform="translate(360 40)"><circle r="18" fill="#1b221f" opacity=".75"/><path d="M0-13 L5 0 L0 13 L-5 0Z" fill="#f3eee2"/><path d="M0-13 L5 0 L-5 0Z" fill="#e5533f"/><text y="-21" text-anchor="middle" class="mp-de" style="fill:#1b221f">N</text></g>
    ${PLACES.map(pin).join("")}</svg>`;
}
// Karte als 3D-Viertel (stadt3d.js); ohne WebGL die flache Karte
function rMap(){
  const city=cityCan();
  const pins=PLACES.map(p=>{const open=placeOpen(p);
    return `<button class="city-pin${open?"":" shut"}" data-act="place" data-p="${p.id}" aria-label="${p.it}, ${p.de}${open?"":" (geschlossen)"}"><b>${open?"":"🔒 "}${p.it}</b><small>${p.de}</small></button>`;}).join("");
  $("#screen").innerHTML=`${head("La mappa",city?"Il quartiere · tippe auf einen Ort":"Karte · tippe auf einen Ort")}
    ${city?`<div class="map city" id="city3d"><div class="city-pins">${pins}</div>
      <p class="loc-hint">Ein Finger dreht, zwei Finger zoomen und verschieben.</p></div>`:`<div class="map">${mapSVG()}</div>`}
    ${mapMsg?`<p class="banner">${esc(mapMsg)}</p>`:""}`;
  if(city&&!cityMount($("#city3d")))render(); // WebGL ging doch nicht: flache Karte
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
