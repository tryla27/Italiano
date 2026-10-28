/* Gezeichnete Grafik: Gesichter der Gäste und die Pizza. */
/* ---------- Drawing ---------- */
function seeded(n){let s=n>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
// Jeder Gast sieht immer gleich aus.
const CHARS={
 "Signora Rossi":{f:1,skin:"#f1c7a5",hair:"#4a2c1a",style:"long",shirt:"#7d4fa0",lips:"#c0392b",ear:1},
 "Signor Bianchi":{skin:"#e8b896",hair:"#a8a8a8",style:"short",shirt:"#3a6ea5",mus:1},
 "Giulia":{f:1,skin:"#f5d6be",hair:"#d9b25a",style:"pony",shirt:"#2f8f86",lips:"#d9667a",ear:1},
 "Marco":{skin:"#d39b6e",hair:"#1d1d1d",style:"short",shirt:"#c0503f",beard:1},
 "Nonna Pina":{f:1,skin:"#f0c8a8",hair:"#d8d8d8",style:"bun",shirt:"#a587c4",lips:"#b9556a",glasses:"round",old:1},
 "Dottor Ferri":{skin:"#f1c7a5",hair:"#8f8f8f",style:"bald",shirt:"#e8e4da",glasses:"round",tie:"#2c4a7a"},
 "Sofia":{f:1,skin:"#f7dccb",hair:"#b8452a",style:"long",shirt:"#4f8f3e",lips:"#c94a5a",ear:1},
 "Zio Gennaro":{skin:"#c68657",hair:"#151515",style:"bald",shirt:"#e08a2c",bigmus:1},
 "Chiara":{f:1,skin:"#e0a87e",hair:"#111111",style:"bangs",shirt:"#e2b93b",lips:"#a8323e",ear:1},
 "Turista Klaus":{skin:"#f5cdb5",hair:"#e3c46b",style:"hat",shirt:"hawaii",glasses:"sun",sunburn:1},
 "Professoressa Conte":{f:1,skin:"#d8a27a",hair:"#5a3a22",style:"bob",shirt:"#2d3e6b",lips:"#b5485a",ear:1,glasses:"square"},
 "Matteo":{skin:"#8d5a3b",hair:"#2b1d14",style:"curly",shirt:"#5f8f4e"},
 "Signor Moretti":{skin:"#e0a87e",hair:"#5a5a5a",style:"short",shirt:"#6b4a2b",mus:1,glasses:"round"},
 "Signora Lucia":{f:1,skin:"#f1c7a5",hair:"#6b2f1a",style:"bun",shirt:"#f39bb3",lips:"#c94a5a",ear:1},
 "Signor Marino":{skin:"#c68657",hair:"#e8e8e8",style:"short",shirt:"#2f5f9a",beard:1}
};
function face(name,mood){
  const c=CHARS[name]||CHARS.Marco, hc=c.hair;
  let h="";
  // Haare hinten (lang)
  if(c.style==="long"||c.style==="bangs")h+=`<path d="M21 50 Q21 20 50 20 Q79 20 79 50 L82 92 Q50 98 18 92 Z" fill="${hc}"/>`;
  if(c.style==="bob")h+=`<path d="M22 50 Q22 21 50 21 Q78 21 78 50 L79 72 Q50 78 21 72 Z" fill="${hc}"/>`;
  if(c.style==="pony")h+=`<path d="M70 34 Q92 42 84 74 Q80 60 72 50 Z" fill="${hc}"/>`;
  // Oberteil
  if(c.shirt==="hawaii")h+=`<rect x="22" y="80" width="56" height="30" rx="20" fill="#1f9fb0"/><circle cx="34" cy="90" r="4" fill="#f4d03f"/><circle cx="52" cy="95" r="4" fill="#e74c3c"/><circle cx="66" cy="88" r="4" fill="#f4d03f"/>`;
  else h+=`<rect x="24" y="80" width="52" height="30" rx="20" fill="${c.shirt}"/>`;
  if(c.tie)h+=`<path d="M48 80 L52 80 L54 96 L50 100 L46 96 Z" fill="${c.tie}"/>`;
  // Kopf
  h+=`<circle cx="50" cy="52" r="26" fill="${c.skin}"/>`;
  if(c.ear)h+=`<circle cx="25" cy="60" r="2.6" fill="#f4c64f"/><circle cx="75" cy="60" r="2.6" fill="#f4c64f"/>`;
  // Haare vorne
  if(c.style==="long"||c.style==="pony"||c.style==="bob")h+=`<path d="M24 50 Q24 24 50 24 Q76 24 76 50 Q70 34 54 32 Q40 38 24 50Z" fill="${hc}"/>`;
  if(c.style==="bangs")h+=`<path d="M24 52 Q24 24 50 24 Q76 24 76 52 L74 42 Q50 36 26 42 Z" fill="${hc}"/>`;
  if(c.style==="short")h+=`<path d="M25 46 Q27 25 50 25 Q73 25 75 46 Q68 34 50 34 Q32 34 25 46Z" fill="${hc}"/>`;
  if(c.style==="curly")for(let i=0;i<7;i++)h+=`<circle cx="${28+i*7.3}" cy="${32-(i%2)*4}" r="7" fill="${hc}"/>`;
  if(c.style==="bun")h+=`<circle cx="50" cy="21" r="10" fill="${hc}"/><path d="M25 48 Q28 26 50 26 Q72 26 75 48 Q62 36 50 36 Q38 36 25 48Z" fill="${hc}"/>`;
  if(c.style==="bald")h+=`<path d="M25 50 Q26 41 31 38 M75 50 Q74 41 69 38" stroke="${hc}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if(c.style==="hat")h+=`<ellipse cx="50" cy="31" rx="36" ry="7" fill="#e9d8a6"/><path d="M32 31 Q34 12 50 12 Q66 12 68 31 Z" fill="#e9d8a6"/><rect x="32" y="25" width="36" height="5" fill="#c0503f"/>`;
  if(c.old)h+=`<path d="M36 44 Q41 42 46 44 M54 44 Q59 42 64 44" stroke="#b08060" stroke-width="1.2" fill="none"/>`;
  // Augen
  if(c.glasses==="sun")h+=`<rect x="31" y="45" width="16" height="10" rx="4" fill="#1d1d1d"/><rect x="53" y="45" width="16" height="10" rx="4" fill="#1d1d1d"/><path d="M47 49 L53 49" stroke="#1d1d1d" stroke-width="2"/>`;
  else{
    h+=`<circle cx="41" cy="51" r="3" fill="#1d1d1d"/><circle cx="59" cy="51" r="3" fill="#1d1d1d"/>`;
    if(c.f)h+=`<path d="M37 47 L39 48.5 M63 47 L61 48.5" stroke="#1d1d1d" stroke-width="1.4"/>`;
    if(c.glasses==="round")h+=`<g fill="none" stroke="#333" stroke-width="2"><circle cx="41" cy="51" r="7"/><circle cx="59" cy="51" r="7"/><path d="M48 51 L52 51"/></g>`;
    if(c.glasses==="square")h+=`<g fill="none" stroke="#7a2a2a" stroke-width="2"><rect x="33" y="45" width="15" height="11" rx="2"/><rect x="52" y="45" width="15" height="11" rx="2"/><path d="M48 50 L52 50"/></g>`;
  }
  h+=`<circle cx="34" cy="61" r="4.5" fill="${c.sunburn?"#e74c3c":"#e88"}" opacity="${c.sunburn?.45:.35}"/><circle cx="66" cy="61" r="4.5" fill="${c.sunburn?"#e74c3c":"#e88"}" opacity="${c.sunburn?.45:.35}"/>`;
  if(c.beard)h+=`<path d="M28 58 Q30 80 50 80 Q70 80 72 58 Q66 72 50 72 Q34 72 28 58Z" fill="${hc}" opacity=".85"/>`;
  if(c.mus)h+=`<path d="M41 61 Q50 57 59 61 Q50 64 41 61Z" fill="${hc}"/>`;
  if(c.bigmus)h+=`<path d="M36 62 Q43 55 50 60 Q57 55 64 62 Q57 66 50 63 Q43 66 36 62Z" fill="${hc}"/>`;
  const mouth=mood>=2?"M41 65 Q50 73 59 65":mood===1?"M42 67 L58 67":"M41 71 Q50 62 59 71";
  h+=`<path d="${mouth}" stroke="${c.lips||"#5a2a20"}" stroke-width="${c.lips?3.6:3}" fill="none" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${h}</svg>`;
}
function vendorFace(){return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="24" y="80" width="52" height="30" rx="20" fill="#2f6b3a"/><circle cx="50" cy="52" r="26" fill="#e0a87e"/><path d="M22 44 Q50 14 78 44 Z" fill="#2f6b3a"/><rect x="20" y="41" width="60" height="6" rx="3" fill="#24532d"/><circle cx="41" cy="53" r="3" fill="#1d1d1d"/><circle cx="59" cy="53" r="3" fill="#1d1d1d"/><path d="M38 62 Q44 58 50 62 Q56 58 62 62" stroke="#3a2416" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M41 68 Q50 75 59 68" stroke="#5a2a20" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;}

function pizzaSVG(set){
  let s=`<svg viewBox="0 0 200 200" class="pz" aria-hidden="true"><circle cx="100" cy="100" r="94" fill="#d99a4e"/><circle cx="100" cy="100" r="82" fill="#f1d7a2"/>`;
  if(set.has("pomodoro"))s+=`<circle cx="100" cy="100" r="79" fill="#c93a24"/>`;
  if(set.has("mozzarella"))[[70,72],[128,68],[100,108],[62,128],[136,128],[100,148],[100,52]].forEach(([x,y],i)=>s+=`<ellipse cx="${x}" cy="${y}" rx="${13+i%3*2}" ry="${10+i%2*3}" fill="#fbf6ea"/>`);
  EXTRAS.forEach((k,ki)=>{ if(!set.has(k))return; const r=seeded(ki*131+7), c=ING[k][1];
    for(let j=0;j<7;j++){const a=r()*Math.PI*2, d=14+r()*56, x=100+Math.cos(a)*d, y=100+Math.sin(a)*d, rot=Math.floor(r()*180);
      if(k==="basilico"||k==="rucola")s+=`<ellipse cx="${x}" cy="${y}" rx="${k==="rucola"?9:8}" ry="${k==="rucola"?3:5}" transform="rotate(${rot} ${x} ${y})" fill="${c}"/>`;
      else if(k==="olive")s+=`<circle cx="${x}" cy="${y}" r="5" fill="${c}"/><circle cx="${x}" cy="${y}" r="2" fill="#c93a24"/>`;
      else if(k==="cipolla")s+=`<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${c}" stroke-width="2.5"/>`;
      else if(k==="peperoni")s+=`<path d="M${x-8} ${y} q8 -8 16 0" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" transform="rotate(${rot} ${x} ${y})"/>`;
      else if(k==="salame")s+=`<circle cx="${x}" cy="${y}" r="9" fill="${c}"/><circle cx="${x-3}" cy="${y-2}" r="1.6" fill="#f3d0c0"/><circle cx="${x+3}" cy="${y+3}" r="1.6" fill="#f3d0c0"/>`;
      else if(k==="funghi")s+=`<path d="M${x-7} ${y} a7 7 0 0 1 14 0 z" fill="${c}"/><rect x="${x-2}" y="${y}" width="4" height="5" fill="#e8d8c0"/>`;
      else s+=`<ellipse cx="${x}" cy="${y}" rx="8" ry="5.5" transform="rotate(${rot} ${x} ${y})" fill="${c}"/>`;
    }});
  return s+`</svg>`;
}
// Kassen-Symbol, das kurz aufspringt, wenn Geld reinkommt (Trinkgeld, Rechnung, Tagesgewinn).
const KASSE_SVG=`<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="12" width="30" height="16" rx="3" fill="#2f3a40"/><rect x="13" y="15" width="24" height="9" rx="1" fill="#7fe08a"/><path d="M6 30h52l-4 22H10z" fill="#e6ad5e"/><rect x="4" y="50" width="56" height="10" rx="3" fill="#b8562f"/><g fill="#fbf6ea"><rect x="14" y="34" width="8" height="5" rx="1"/><rect x="26" y="34" width="8" height="5" rx="1"/><rect x="38" y="34" width="8" height="5" rx="1"/><rect x="14" y="42" width="8" height="5" rx="1"/><rect x="26" y="42" width="8" height="5" rx="1"/><rect x="38" y="42" width="8" height="5" rx="1"/></g><rect x="44" y="6" width="12" height="16" rx="2" fill="#fbf6ea" transform="rotate(12 50 14)"/><circle cx="52" cy="28" r="6" fill="#f4c64f" stroke="#c99a2a" stroke-width="1.5"/><text x="52" y="31" font-family="Arial" font-size="7" font-weight="800" fill="#7a5a10" text-anchor="middle">€</text></svg>`;
let kasseTimer=null;
function kasse(amount,label){
  if(!(amount>0))return;
  const k=$("#kasse"); clearTimeout(kasseTimer);
  k.innerHTML=`<div class="kasse-pop">${KASSE_SVG}<b>+${amount} €</b>${label?`<small>${esc(label)}</small>`:""}</div>`;
  sfx("kasse"); kasseTimer=setTimeout(()=>{k.innerHTML="";},1900);
}
function starsHTML(n){let h="";for(let i=1;i<=5;i++)h+=n>=i?"★":n>=i-.5?`<span class="half">★</span>`:`<span class="off">★</span>`;return `<span class="stars" aria-label="${n} von 5 Sternen">${h}</span>`;}
