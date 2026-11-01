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
 "Dottoressa Severini":{f:1,skin:"#efc4a2",hair:"#2b2420",style:"bun",shirt:"#f4f4f0",lips:"#a8323e",glasses:"square",tie:"#2f6b8f"},
 "Signor Marino":{skin:"#c68657",hair:"#e8e8e8",style:"short",shirt:"#2f5f9a",beard:1},
 "Signor Esposito":{skin:"#e0a87e",hair:"#3a2416",style:"cap",cap:"#2f6b3a",shirt:"#2f6b3a",bigmus:1}
};
// Kleidung für die ganzen Körper (szenen.js bodyFigure)
const OUTFIT={
 "Signora Rossi":{low:"dress",shoe:"#5a1f3a",bag:"#b8865a"},
 "Signor Bianchi":{low:"pants",legs:"#5d6670",shoe:"#3a2a1e",belt:1,jacket:"#47536a"},
 "Giulia":{low:"pants",legs:"#4a6fa5",shoe:"#f3f3f3"},
 "Marco":{low:"pants",legs:"#36507a",shoe:"#2a2a2a",short:1},
 "Nonna Pina":{low:"skirt",long:1,legs:"#6b5a7a",shoe:"#4a3a2a",cardigan:"#c4a8dc",bag:"#7a4a2a"},
 "Dottor Ferri":{low:"pants",legs:"#2f3540",shoe:"#1d1d1d",coat:"#fbfbf7"},
 "Sofia":{low:"dress",shoe:"#c9a44a"},
 "Zio Gennaro":{low:"pants",legs:"#6b4a2b",shoe:"#2a1d14",belly:1,braces:"#7a2a1f",short:1},
 "Chiara":{low:"skirt",legs:"#222",shoe:"#222"},
 "Turista Klaus":{low:"shorts",legs:"#d8c79a",shoe:"#8a5a2a",socks:1,camera:1,short:1},
 "Professoressa Conte":{low:"skirt",legs:"#2d3e6b",shoe:"#5a1f2a",jacket:"#2d3e6b",books:1},
 "Matteo":{low:"pants",legs:"#3a4a6a",shoe:"#e74c3c",hoodie:1},
 "Signor Moretti":{low:"pants",legs:"#4a3a2a",shoe:"#2a1d14",vest:"#4a3420",belt:1},
 "Signora Lucia":{low:"skirt",legs:"#c46a85",shoe:"#f3f3f3",apron:1,short:1},
 "Dottoressa Severini":{low:"skirt",legs:"#34495e",shoe:"#1d1d1d",coat:"#fbfbf7",books:1},
 "Signor Marino":{low:"pants",legs:"#1f3355",shoe:"#2a1d14",stripes:1},
 "Signor Esposito":{low:"pants",legs:"#4a3a2a",shoe:"#2a1d14",belly:1,apron:1,short:1}
};
// Kleine Bilder der Zutaten für die Knöpfe beim Pizza-Belegen, jeweils in der Farbe der Zutat.
function ingIcon(k){
  const c=ING[k][1], o=`stroke="#1e2420" stroke-width="1.2"`;
  const d={
    pomodoro:`<circle cx="12" cy="13.5" r="8" fill="${c}" ${o}/><path d="M12 6 l-3-2 M12 6 l3-2 M12 6 l0-3" stroke="#3f9a45" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="11" r="1.6" fill="#fff" opacity=".5"/>`,
    mozzarella:`<circle cx="12" cy="13" r="8" fill="${c}" ${o}/><path d="M7 15 q5 4 10 0" stroke="#d9d0bc" stroke-width="1.5" fill="none"/><circle cx="9" cy="10" r="1.8" fill="#fff"/>`,
    basilico:`<path d="M12 3 C20 6 21 15 12 21 C3 15 4 6 12 3Z" fill="${c}" ${o}/><path d="M12 5 V19 M12 10 l3-2 M12 14 l-3-2" stroke="#2a6a30" stroke-width="1.2" fill="none"/>`,
    funghi:`<path d="M3 12 Q4 4 12 4 Q20 4 21 12Z" fill="${c}" ${o}/><rect x="9" y="12" width="6" height="8" rx="2" fill="#efe3cf" ${o}/><circle cx="9" cy="8" r="1.3" fill="#e9d8c0"/><circle cx="15" cy="7.5" r="1" fill="#e9d8c0"/>`,
    prosciutto:`<path d="M3 15 Q5 6 12 7 Q19 4 21 11 Q19 19 11 18 Q5 20 3 15Z" fill="${c}" ${o}/><path d="M5 15 Q8 10 12 11 Q17 9 19 12" stroke="#fbeeee" stroke-width="2" fill="none"/>`,
    salame:`<circle cx="12" cy="12" r="9" fill="${c}" ${o}/><circle cx="9" cy="9" r="1.3" fill="#f3d6cf"/><circle cx="15" cy="10" r="1" fill="#f3d6cf"/><circle cx="11" cy="15" r="1.2" fill="#f3d6cf"/><circle cx="16" cy="15" r="1" fill="#f3d6cf"/>`,
    olive:`<ellipse cx="12" cy="12" rx="6.5" ry="8.5" fill="${c}" stroke="#9aa39a" stroke-width="1.2"/><ellipse cx="12" cy="12" rx="2.2" ry="3" fill="#6a6a5a"/><ellipse cx="9.5" cy="8" rx="1.3" ry="2" fill="#fff" opacity=".35"/>`,
    cipolla:`<circle cx="12" cy="12" r="8.5" fill="none" stroke="${c}" stroke-width="3"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="${c}" stroke-width="2.4"/>`,
    peperoni:`<path d="M7 8 Q12 5 17 8 Q20 15 15 21 Q12 22 9 21 Q4 15 7 8Z" fill="${c}" ${o}/><path d="M12 7 V3 l2 -1" stroke="#3f9a45" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M9 11 Q8 15 10 18" stroke="#fff" stroke-width="1.2" fill="none" opacity=".5"/>`,
    tonno:`<path d="M2 12 Q8 5 15 9 L21 5 L20 12 L21 19 L15 15 Q8 19 2 12Z" fill="${c}" ${o}/><circle cx="6.5" cy="11" r="1.1" fill="#1e2420"/>`,
    carciofi:`<path d="M12 3 Q18 7 17 14 Q15 20 12 21 Q9 20 7 14 Q6 7 12 3Z" fill="${c}" ${o}/><path d="M12 8 Q15 11 14 15 M12 8 Q9 11 10 15 M8 12 Q12 14 16 12" stroke="#5f7a35" stroke-width="1.2" fill="none"/><path d="M12 21 v2" stroke="#5f7a35" stroke-width="2"/>`,
    rucola:`<path d="M12 21 L12 12 M12 21 C4 18 3 13 6 11 L5 9 L8 9 L7 6 L10 7 L11 3 L13 7 L16 6 L15 9 L18 9 L17 11 C21 13 20 18 12 21Z" fill="${c}" ${o}/><path d="M12 20 V8" stroke="#2f5a1a" stroke-width="1.2"/>`,
    aglio:`<path d="M12 3 Q13 6 16 8 Q21 12 18 18 Q15 21 12 21 Q9 21 6 18 Q3 12 8 8 Q11 6 12 3Z" fill="${c}" ${o}/><path d="M12 8 V20 M9 10 Q8 15 9.5 20 M15 10 Q16 15 14.5 20" stroke="#cbbfa6" stroke-width="1" fill="none"/>`,
    origano:`<path d="M12 21 V6" stroke="#4f6a2a" stroke-width="1.4"/><g fill="${c}" ${o}><ellipse cx="9" cy="8" rx="3" ry="2"/><ellipse cx="15" cy="10" rx="3" ry="2"/><ellipse cx="9" cy="13" rx="3" ry="2"/><ellipse cx="15" cy="16" rx="3" ry="2"/><ellipse cx="12" cy="5" rx="2" ry="2.6"/></g>`,
    olio:`<path d="M10 2 h4 v4 q4 2 4 7 v7 q0 2 -2 2 h-8 q-2 0 -2 -2 v-7 q0 -5 4 -7z" fill="${c}" ${o}/><rect x="9" y="12" width="6" height="5" rx="1" fill="#fbf6ea"/><path d="M10 14.5 h4" stroke="#6f8a3a" stroke-width="1.2"/>`,
    acciughe:`<path d="M2 12 Q10 7 18 11 L22 8 L21 12 L22 16 L18 13 Q10 17 2 12Z" fill="${c}" ${o}/><path d="M5 12 H17" stroke="#c8c3bf" stroke-width="1"/><circle cx="5" cy="11" r=".9" fill="#1e2420"/>`,
    capperi:`<g fill="${c}" ${o}><circle cx="8" cy="9" r="4"/><circle cx="16" cy="10" r="4"/><circle cx="12" cy="16" r="4"/></g><g fill="#a8b870"><circle cx="7" cy="8" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="11" cy="15" r="1"/></g>`,
    zucchine:`<circle cx="12" cy="12" r="9" fill="${c}" ${o}/><circle cx="12" cy="12" r="6.5" fill="#e8efc0"/><g fill="#c9d58a"><circle cx="10" cy="10" r=".9"/><circle cx="14" cy="11" r=".9"/><circle cx="12" cy="14" r=".9"/></g>`,
    melanzane:`<path d="M15 5 Q21 9 19 16 Q16 22 9 20 Q3 17 6 11 Q8 7 12 7 Q13 5 15 5Z" fill="${c}" ${o}/><path d="M13 7 l2 -4 l2 1 l-1 3 Q17 8 15 8Z" fill="#3f9a45"/><ellipse cx="9" cy="13" rx="1.5" ry="3" fill="#fff" opacity=".25"/>`,
    gorgonzola:`<path d="M3 17 L12 5 L21 17Z" fill="${c}" ${o}/><g fill="#5f8fa8"><circle cx="11" cy="12" r="1.2"/><circle cx="14" cy="14" r="1"/><circle cx="9" cy="15" r="1"/><path d="M12 9 l1 2" stroke="#5f8fa8"/></g>`,
    parmigiano:`<path d="M3 17 L12 5 L21 17Z" fill="${c}" ${o}/><path d="M3 17 L21 17 L21 19 L3 19Z" fill="#c99a3a" ${o}/><g fill="#e3c060"><circle cx="11" cy="13" r=".8"/><circle cx="14" cy="15" r=".8"/></g>`,
    fontina:`<path d="M3 17 L12 5 L21 17Z" fill="${c}" ${o}/><g fill="#d9bb6a"><circle cx="11" cy="12" r="1.6"/><circle cx="15" cy="15" r="1.3"/><circle cx="8" cy="15.5" r="1.1"/></g>`,
    scamorza:`<path d="M12 3 Q14 3 14 6 Q19 9 19 15 Q19 21 12 21 Q5 21 5 15 Q5 9 10 6 Q10 3 12 3Z" fill="${c}" ${o}/><path d="M9.5 6.5 Q12 8 14.5 6.5" stroke="#8a5a2a" stroke-width="1.4" fill="none"/><ellipse cx="9" cy="13" rx="1.5" ry="3" fill="#fff" opacity=".35"/>`,
    pecorino:`<path d="M3 17 L12 5 L21 17Z" fill="${c}" ${o}/><path d="M12 5 L21 17 L19 17 L11 6.3Z" fill="#8a6a3a"/><g fill="#d8cca0"><circle cx="10" cy="14" r=".7"/><circle cx="13" cy="12" r=".7"/></g>`,
    provola:`<circle cx="12" cy="13" r="8" fill="${c}" ${o}/><path d="M12 5 q-1 -2 1 -3 q2 1 1 3z" fill="#8a5a2a" ${o}/><path d="M6 15 q6 4 12 0" stroke="#b07a3a" stroke-width="1.4" fill="none"/><circle cx="9" cy="10" r="1.6" fill="#f6dfb0"/>`,
    crudo:`<path d="M3 15 Q5 6 12 7 Q19 4 21 11 Q19 19 11 18 Q5 20 3 15Z" fill="${c}" ${o}/><path d="M4 14 Q8 9 12 10 Q17 8 20 11" stroke="#fbeaea" stroke-width="2.4" fill="none"/>`,
    salsiccia:`<g fill="${c}" ${o}><circle cx="8" cy="9" r="4.5"/><circle cx="16" cy="11" r="4"/><circle cx="10" cy="17" r="4"/></g><g fill="#c98a6a"><circle cx="7" cy="8" r="1"/><circle cx="16" cy="10" r="1"/><circle cx="10" cy="16" r="1"/></g>`,
    friarielli:`<path d="M12 22 V9" stroke="#2a4a1a" stroke-width="1.6"/><path d="M12 12 C4 10 4 3 9 3 C11 3 12 6 12 9 C12 6 13 3 15 3 C20 3 20 10 12 12Z" fill="${c}" ${o}/><path d="M12 17 C7 17 5 13 7 12 C9 11 11 14 12 16" fill="${c}" ${o}/>`,
    ricotta:`<path d="M4 13 Q4 6 12 6 Q20 6 20 13 Q20 19 12 19 Q4 19 4 13Z" fill="${c}" ${o}/><path d="M7 11 q2 -2 4 0 M12 14 q2 -2 4 0 M8 15 q1 -1 2 0" stroke="#e3dccb" stroke-width="1.2" fill="none"/>`,
    cozze:`<path d="M5 19 Q2 9 10 3 Q14 2 15 6 Q19 14 13 21 Q8 22 5 19Z" fill="${c}" ${o}/><path d="M7 18 Q6 10 11 5" stroke="#5a6a8a" stroke-width="1.2" fill="none"/><ellipse cx="11" cy="14" rx="2.5" ry="3.5" fill="#f2a65a"/>`,
    gamberi:`<path d="M6 7 Q16 3 19 11 Q20 18 13 19 Q9 19 9 16 Q14 16 15 12 Q14 8 8 10Z" fill="${c}" ${o}/><path d="M12 15 Q15 14 15 11 M14 16 Q17 14 17 11" stroke="#fbd1b8" stroke-width="1" fill="none"/><path d="M9 16 l-4 3 l1 -4z" fill="${c}" ${o}/>`,
    prezzemolo:`<path d="M12 22 V12" stroke="#2a5a2a" stroke-width="1.6"/><g fill="${c}" ${o}><circle cx="12" cy="7" r="4"/><circle cx="7" cy="10" r="3.5"/><circle cx="17" cy="10" r="3.5"/><circle cx="9" cy="5" r="2.5"/><circle cx="15" cy="5" r="2.5"/></g>`,
    bufala:`<circle cx="12" cy="13" r="8.5" fill="${c}" ${o}/><path d="M12 4.5 q-1 -2 1 -2.5 q2 0 1 2.5z" fill="${c}" ${o}/><path d="M7 15 q5 4 10 0" stroke="#e6dfcc" stroke-width="1.5" fill="none"/><circle cx="9" cy="10" r="1.8" fill="#fff"/>`
  }[k]||`<circle cx="12" cy="12" r="7" fill="${c}"/>`;
  return `<svg class="ing-ic" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
}
// Gerenderte Holzkiste voller Ware (tools/kisten/kisten.py); fehlt das Bild, das gezeichnete Symbol
const kisteImg=k=>`<span class="kiste-wrap">${ingIcon(k)}<img class="kiste" src="bilder/kisten/${k}.webp" alt="" loading="lazy" decoding="async" onload="this.parentNode.classList.add('ok')" onerror="this.remove()"></span>`;
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
  if(c.style==="cap")h+=`<path d="M22 44 Q50 14 78 44 Z" fill="${c.cap}"/><rect x="20" y="41" width="60" height="6" rx="3" fill="rgba(0,0,0,.25)"/>`;
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
      if(k==="olio"){if(j<3)s+=`<path d="M${x-14} ${y} q7 -6 14 0 t14 0" fill="none" stroke="${c}" stroke-width="2.4" opacity=".75" stroke-linecap="round"/>`;}
      else if(k==="origano"||k==="capperi"){for(let q=0;q<3;q++)s+=`<circle cx="${x+q*5-5}" cy="${y+(q%2)*4}" r="${k==="capperi"?3:1.6}" fill="${c}"/>`;}
      else if(k==="aglio")s+=`<ellipse cx="${x}" cy="${y}" rx="3.5" ry="2.5" transform="rotate(${rot} ${x} ${y})" fill="${c}" stroke="#cbbfa6"/>`;
      else if(k==="gorgonzola"||k==="parmigiano"||k==="fontina"||k==="ricotta"||k==="bufala"||k==="scamorza"||k==="pecorino"||k==="provola")s+=`<ellipse cx="${x}" cy="${y}" rx="${k==="bufala"?12:8}" ry="${k==="bufala"?10:6}" fill="${c}"/>${k==="gorgonzola"?`<circle cx="${x}" cy="${y}" r="1.6" fill="#5f8fa8"/>`:""}`;
      else if(k==="zucchine")s+=`<circle cx="${x}" cy="${y}" r="7" fill="${c}"/><circle cx="${x}" cy="${y}" r="5" fill="#e8efc0"/>`;
      else if(k==="gamberi")s+=`<path d="M${x-7} ${y-3} q10 -5 12 3 q0 6 -7 6" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" transform="rotate(${rot} ${x} ${y})"/>`;
      else if(k==="cozze")s+=`<ellipse cx="${x}" cy="${y}" rx="8" ry="5" transform="rotate(${rot} ${x} ${y})" fill="${c}"/><ellipse cx="${x}" cy="${y}" rx="4" ry="2.5" transform="rotate(${rot} ${x} ${y})" fill="#f2a65a"/>`;
      else if(k==="basilico"||k==="rucola"||k==="prezzemolo"||k==="friarielli")s+=`<ellipse cx="${x}" cy="${y}" rx="${k==="rucola"?9:8}" ry="${k==="rucola"?3:5}" transform="rotate(${rot} ${x} ${y})" fill="${c}"/>`;
      else if(k==="olive")s+=`<circle cx="${x}" cy="${y}" r="5" fill="${c}"/><circle cx="${x}" cy="${y}" r="2" fill="#c93a24"/>`;
      else if(k==="cipolla")s+=`<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${c}" stroke-width="2.5"/>`;
      else if(k==="peperoni")s+=`<path d="M${x-8} ${y} q8 -8 16 0" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" transform="rotate(${rot} ${x} ${y})"/>`;
      else if(k==="salame"||k==="salsiccia")s+=`<circle cx="${x}" cy="${y}" r="9" fill="${c}"/><circle cx="${x-3}" cy="${y-2}" r="1.6" fill="#f3d0c0"/><circle cx="${x+3}" cy="${y+3}" r="1.6" fill="#f3d0c0"/>`;
      else if(k==="funghi")s+=`<path d="M${x-7} ${y} a7 7 0 0 1 14 0 z" fill="${c}"/><rect x="${x-2}" y="${y}" width="4" height="5" fill="#e8d8c0"/>`;
      else s+=`<ellipse cx="${x}" cy="${y}" rx="8" ry="5.5" transform="rotate(${rot} ${x} ${y})" fill="${c}"/>`;
    }});
  return s+`</svg>`;
}
// Tasse oder Glas mit den Zutaten als Schichten (unten zuerst)
const CUP_SHAPE={tazzina:[100,80,70],tazza:[136,100,96],"tazza grande":[150,122,112],bicchiere:[88,150,78],bicchierino:[80,100,70],coppa:[150,110,60],coppetta:[150,72,104]};
function cupSVG(cup,layers){
  const [w,h,bw]=CUP_SHAPE[cup]||CUP_SHAPE.tazza, x0=96-w/2, y0=172-h, glass=/bicch|coppa/.test(cup);
  const clip=`M${x0} ${y0} L${x0+w} ${y0} L${96+bw/2} 172 L${96-bw/2} 172 Z`;
  let s=`<svg viewBox="0 0 200 200" class="pz cup" aria-hidden="true"><defs><clipPath id="cupc"><path d="${clip}"/></clipPath></defs>
    <ellipse cx="96" cy="178" rx="${Math.min(96,w/2+16)}" ry="8" fill="#e8e1d2"/>`;
  const n=layers.length, lh=n?(h-8)/Math.max(n,2):0;
  s+=`<g clip-path="url(#cupc)"><rect x="0" y="0" width="200" height="200" fill="${glass?"#dfeef3":"#fbf8f1"}" opacity="${glass?.35:1}"/>`;
  layers.forEach((k,i)=>{s+=`<rect x="0" y="${172-(i+1)*lh}" width="200" height="${lh+.5}" fill="${COF_ING[k][1]}"/>`;});
  s+=`</g><path d="${clip}" fill="none" stroke="#3a3030" stroke-width="3"/>`;
  if(!glass)s+=`<path d="M${x0+w-4} ${y0+12} q22 4 16 26 q-4 14 -${10+bw/10} 12" fill="none" stroke="#3a3030" stroke-width="5"/>`;
  return s+`<text x="96" y="197" font-size="15" text-anchor="middle" fill="#cfc6b4" font-family="Nunito,sans-serif">${esc(cup)}</text></svg>`;
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
