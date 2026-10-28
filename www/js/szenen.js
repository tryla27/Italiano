/* Umgebungen als gezeichnete Bilder: Pizzeria (Blick hinter dem Tresen), Markt, Eisladen, Hafen.
   Jede Szene ist ein SVG 400×200. Die Figur (Gast, Händler) wird in die Szene gesetzt. */

// Figur in der Szene: Gesicht aus grafik.js, groß, hinter Tresen/Theke abgeschnitten.
function figure(svg,x,y,size,cls){
  return `<g class="fig ${cls||""}" style="transform-origin:${x+size/2}px ${y+size*.6}px"><svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 100 100">${svg.replace(/^<svg[^>]*>|<\/svg>$/g,"")}</svg></g>`;
}
// Ganze Figur mit Körper, Armen und Beinen (100×250, Füße unten bei y=240). Kopf = Gesicht aus grafik.js.
// Die Klassen leg/arm schwingen per CSS, solange die Figur die Klasse "walk" trägt.
function bodyFigure(name,mood){
  const c=CHARS[name]||CHARS.Marco, o=OUTFIT[name]||{low:"pants",legs:"#3d3d48",shoe:"#2a1d14"};
  const top=c.shirt==="hawaii"?"#1f9fb0":c.shirt, sk=c.skin;
  const over=o.jacket||o.coat||o.cardigan||o.vest;
  let b="";
  // Hals sitzt im Kopf-Teil unten
  // Beine
  const leg=(x,k)=>{
    let g="";
    if(o.low==="pants")g+=`<rect x="${x}" y="146" width="16" height="88" rx="7" fill="${o.legs}"/>`;
    else if(o.low==="shorts")g+=`<rect x="${x+1.5}" y="170" width="13" height="64" rx="6" fill="${sk}"/><rect x="${x}" y="146" width="16" height="36" rx="6" fill="${o.legs}"/>`;
    else g+=`<rect x="${x+2}" y="170" width="12" height="64" rx="6" fill="${o.long?o.legs:sk}"/>`;
    if(o.socks)g+=`<rect x="${x+1.5}" y="222" width="13" height="10" fill="#fff"/>`;
    g+=`<path d="M${x-2} 238 Q${x-2} 228 ${x+8} 228 Q${x+19} 228 ${x+19} 238 Z" fill="${o.shoe}"/>`;
    return `<g class="leg ${k}">${g}</g>`;
  };
  b+=leg(33,"l")+leg(51,"r");
  // Rock / Kleid unten
  if(o.low==="skirt")b+=`<path d="M28 140 L72 140 L${o.long?82:78} ${o.long?214:186} Q50 ${o.long?220:192} ${o.long?18:22} ${o.long?214:186} Z" fill="${o.long?c.shirt==="hawaii"?"#555":"#7a6a8a":o.legs}"/>`;
  if(o.low==="dress")b+=`<path d="M28 130 L72 130 L82 192 Q50 200 18 192 Z" fill="${top}"/><path d="M22 186 Q50 194 78 186" stroke="rgba(255,255,255,.35)" stroke-width="3" fill="none"/>`;
  // Arme (hinter dem Oberkörper)
  const arm=(x,k,side)=>{
    const sl=o.coat||o.jacket||o.cardigan||o.hoodie?(over||top):top, long=!o.short;
    let g=`<rect x="${x}" y="86" width="13" height="${long?56:34}" rx="6.5" fill="${sl}"/>`;
    if(!long)g+=`<rect x="${x+1}" y="116" width="11" height="28" rx="5.5" fill="${sk}"/>`;
    g+=`<circle cx="${x+6.5}" cy="146" r="6.5" fill="${sk}"/>`;
    if(side==="r"&&o.bag)g+=`<path d="M${x+2} 146 Q${x+6.5} 136 ${x+11} 146" stroke="${o.bag}" stroke-width="2" fill="none"/><rect x="${x-3}" y="146" width="19" height="16" rx="4" fill="${o.bag}"/>`;
    if(side==="l"&&o.books)g+=`<rect x="${x-2}" y="132" width="17" height="6" fill="#c0503f"/><rect x="${x-1}" y="138" width="16" height="6" fill="#e2b93b"/>`;
    return `<g class="arm ${k}">${g}</g>`;
  };
  b+=arm(15,"l","l")+arm(72,"r","r");
  // Oberkörper
  b+=o.belly?`<path d="M26 92 Q26 82 38 82 L62 82 Q74 82 74 92 Q84 124 72 150 Q50 160 28 150 Q16 124 26 92Z" fill="${top}"/>`
            :`<path d="M26 92 Q26 82 38 82 L62 82 Q74 82 74 92 L72 150 Q50 156 28 150 Z" fill="${top}"/>`;
  if(c.shirt==="hawaii")b+=`<circle cx="36" cy="112" r="4" fill="#f4d03f"/><circle cx="60" cy="122" r="4" fill="#e74c3c"/><circle cx="44" cy="136" r="4" fill="#f4d03f"/><circle cx="66" cy="104" r="3.5" fill="#e74c3c"/>`;
  if(o.stripes)for(let y=108;y<150;y+=9)b+=`<rect x="27" y="${y}" width="46" height="4" fill="#f3eee2"/>`;
  if(o.braces)b+=`<path d="M38 96 L36 150 M62 96 L64 150" stroke="${o.braces}" stroke-width="4"/>`;
  if(o.hoodie)b+=`<path d="M36 128 L64 128 L62 144 L38 144 Z" fill="rgba(0,0,0,.15)"/><path d="M45 104 L44 118 M55 104 L56 118" stroke="#f3eee2" stroke-width="1.5"/>`;
  if(o.apron)b+=`<path d="M32 108 L68 108 L70 180 Q50 184 30 180 Z" fill="#fbfbf7"/><rect x="40" y="134" width="20" height="12" rx="2" fill="#f1e4e8"/>`;
  if(o.coat)b+=`<path d="M24 92 Q24 82 36 82 L44 82 L46 200 L22 196 Z" fill="${o.coat}" stroke="#d8d4c8"/><path d="M76 92 Q76 82 64 82 L56 82 L54 200 L78 196 Z" fill="${o.coat}" stroke="#d8d4c8"/><rect x="62" y="104" width="8" height="10" rx="1" fill="#c9d4e0"/>`;
  if(o.jacket||o.cardigan)b+=`<path d="M24 92 Q24 82 36 82 L44 82 L46 154 L26 150 Z" fill="${over}"/><path d="M76 92 Q76 82 64 82 L56 82 L54 154 L74 150 Z" fill="${over}"/>`;
  if(o.vest)b+=`<path d="M28 92 Q28 84 38 84 L45 120 L44 150 L30 148 Z" fill="${o.vest}"/><path d="M72 92 Q72 84 62 84 L55 120 L56 150 L70 148 Z" fill="${o.vest}"/>`;
  if(o.belt)b+=`<rect x="28" y="144" width="44" height="6" fill="#2a1d14"/><rect x="47" y="144" width="6" height="6" fill="#c9a44a"/>`;
  if(o.camera)b+=`<path d="M38 92 L50 118 L62 92" stroke="#222" stroke-width="2" fill="none"/><rect x="41" y="114" width="18" height="12" rx="2" fill="#333"/><circle cx="50" cy="120" r="4" fill="#7ab"/>`;
  // Kopf ohne das Oberteil-Stück aus face(), dafür ein Hals
  const head=face(name,mood).replace(/^<svg[^>]*>|<\/svg>$/g,"").replace(/<rect x="2[24]" y="80"[^>]*\/>/,"").replace(/<circle cx="\d+" cy="(88|90|95)" r="4"[^>]*\/>/g,"");
  return `<svg viewBox="0 0 100 250" aria-hidden="true"><g class="bob"><rect x="43" y="70" width="14" height="18" rx="5" fill="${sk}"/>${b}${head}</g></svg>`;
}
// Figur mit Füßen an (x,y), Höhe h. cls z. B. "walk walkin" (kommt herein) oder "walk walkout" (geht).
function walker(name,mood,x,y,h,cls){
  const w=h*100/250;
  return `<g class="walker ${cls||""}" style="--x:${x}px;--y:${y}px"><svg x="${-w/2}" y="${-h*240/250}" width="${w}" height="${h}" viewBox="0 0 100 250">${bodyFigure(name,mood).replace(/^<svg[^>]*>|<\/svg>$/g,"")}</svg></g>`;
}
const stripes=(x,y,w,h,n,a,b)=>{let s="";for(let i=0;i<n;i++)s+=`<rect x="${x+i*w/n}" y="${y}" width="${w/n+.5}" height="${h}" fill="${i%2?b:a}"/>`;return s;};
const scallop=(x,y,w,n,a,b)=>{let s="";const r=w/n/2;for(let i=0;i<n;i++)s+=`<path d="M${x+i*2*r} ${y} a${r} ${r*.9} 0 0 0 ${2*r} 0z" fill="${i%2?b:a}"/>`;return s;};
const checker=(x,y,w,h,c,a,b)=>{let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${a}"/>`;for(let r=0;r*c<h;r++)for(let k=0;k*c<w;k++)if((r+k)%2)s+=`<rect x="${x+k*c}" y="${y+r*c}" width="${c}" height="${Math.min(c,h-r*c)}" fill="${b}"/>`;return s;};
function seagull(x,y,s){return `<path d="M${x-6*s} ${y} q${3*s} ${-4*s} ${6*s} 0 q${3*s} ${-4*s} ${6*s} 0" fill="none" stroke="#3a4a52" stroke-width="${1.4*s}" stroke-linecap="round"/>`;}
function vesuvio(x,y,w,c){return `<path d="M${x} ${y} L${x+w*.38} ${y-w*.28} Q${x+w*.45} ${y-w*.33} ${x+w*.52} ${y-w*.3} L${x+w*.58} ${y-w*.24} L${x+w} ${y}Z" fill="${c}"/>`;}
function facade(x,w,h,base,col,win){
  let s=`<rect x="${x}" y="${base-h}" width="${w}" height="${h}" fill="${col}"/><rect x="${x}" y="${base-h}" width="${w}" height="4" fill="rgba(0,0,0,.12)"/>`;
  for(let fy=base-h+12;fy<base-14;fy+=22)for(let fx=x+6;fx<x+w-10;fx+=16)s+=`<rect x="${fx}" y="${fy}" width="8" height="12" rx="1" fill="${win}"/><rect x="${fx-2}" y="${fy}" width="2" height="12" fill="#3f6b55"/><rect x="${fx+8}" y="${fy}" width="2" height="12" fill="#3f6b55"/>`;
  return s;
}
const DEFS=`<defs>
  <linearGradient id="sz-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4e8"/><stop offset="1" stop-color="#d8eef5"/></linearGradient>
  <linearGradient id="sz-eve" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3a35b"/><stop offset="1" stop-color="#fbe0a8"/></linearGradient>
  <linearGradient id="sz-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e3c4"/><stop offset="1" stop-color="#e2c79a"/></linearGradient>
  <linearGradient id="sz-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e8fb8"/><stop offset="1" stop-color="#1c5f86"/></linearGradient>
  <linearGradient id="sz-marble" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f3ea"/><stop offset="1" stop-color="#d9d2c4"/></linearGradient>
  <linearGradient id="sz-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6538"/><stop offset="1" stop-color="#6b4426"/></linearGradient>
  <linearGradient id="sz-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="rgba(220,245,255,.55)"/><stop offset="1" stop-color="rgba(160,210,230,.25)"/></linearGradient>
  <radialGradient id="sz-glow"><stop offset="0" stop-color="rgba(255,220,140,.55)"/><stop offset="1" stop-color="rgba(255,220,140,0)"/></radialGradient>
</defs>`;
const wrap=(inner,label)=>`<svg class="stage-svg" viewBox="0 0 400 200" role="img" aria-label="${label}">${DEFS}${inner}</svg>`;

/* Pizzeria: du stehst hinter dem Tresen und schaust zur Eingangstür. Gäste kommen durch die Tür herein. */
function scenePizzeria(guest,phone,enter){
  const sea=S.level>=4;
  let s=`<rect width="400" height="200" fill="url(#sz-wall)"/>`;
  s+=`<rect y="96" width="400" height="30" fill="#b8562f"/><rect y="96" width="400" height="3" fill="#d27a4e"/>`;
  // Fenster zur Straße (ab „Sul Mare“: Meerblick)
  s+=`<rect x="14" y="16" width="138" height="80" rx="3" fill="#5b3b24"/><svg x="20" y="22" width="126" height="68" viewBox="0 0 126 68"><rect width="126" height="68" fill="url(#sz-sky)"/>`;
  if(sea)s+=`${vesuvio(-10,44,80,"#8b8fb5")}<rect y="40" width="126" height="28" fill="url(#sz-sea)"/><path d="M60 50 h30 l-4 6 h-22z" fill="#fff"/><rect x="72" y="42" width="2" height="8" fill="#fff"/><path d="M74 42 l10 6 h-10z" fill="#e5533f"/>${seagull(30,18,1)}${seagull(44,12,.7)}`;
  else s+=`${vesuvio(50,42,90,"#9a93b8")}${facade(-4,40,46,68,"#e8b46a","#4a6a7a")}${facade(38,34,38,68,"#d9826a","#4a6a7a")}${facade(74,56,50,68,"#f0d28a","#4a6a7a")}<rect y="64" width="126" height="4" fill="#8a7f72"/>`;
  s+=`</svg><path d="M83 22v68M20 56h126" stroke="#5b3b24" stroke-width="4"/>`;
  s+=`<g opacity=".95">${stripes(20,70,126,20,14,"#e5533f","#f3eee2")}</g><rect x="20" y="69" width="126" height="2" fill="#7a4a26"/>`;
  s+=`<rect x="10" y="8" width="146" height="10" rx="2" fill="#2f6b3a"/><text x="83" y="16" font-family="Georgia,serif" font-size="8" font-weight="700" fill="#f4c64f" text-anchor="middle" letter-spacing="2">PIZZERIA PAROLA</text>`;
  // Tür mit Glas und Schild „Aperto“
  s+=`<rect x="196" y="22" width="60" height="104" rx="2" fill="#5b3b24"/><rect x="202" y="28" width="48" height="58" fill="url(#sz-sky)"/><rect x="202" y="28" width="48" height="58" fill="url(#sz-glass)"/>`;
  s+=`<rect x="202" y="90" width="48" height="32" fill="#7a4a26"/><circle cx="244" cy="98" r="2.5" fill="#f4c64f"/>`;
  s+=`<path d="M214 44 L226 36 L238 44" stroke="#3a3a3a" stroke-width="1" fill="none"/><rect x="211" y="44" width="30" height="12" rx="2" fill="#e5533f"/><text x="226" y="53" font-family="Arial,sans-serif" font-size="7" font-weight="800" fill="#fff" text-anchor="middle">APERTO</text>`;
  // Tafel mit Speisekarte, Weinregal
  s+=`<rect x="282" y="20" width="76" height="56" rx="3" fill="#7a4a26"/><rect x="286" y="24" width="68" height="48" fill="#1f2a25"/><text x="320" y="36" font-family="Georgia,serif" font-style="italic" font-size="9" fill="#f3eee2" text-anchor="middle">Il Menù</text>`;
  for(let i=0;i<4;i++)s+=`<rect x="292" y="${42+i*7}" width="${34+(i*13)%20}" height="1.6" fill="#cfd8d2"/><rect x="340" y="${42+i*7}" width="8" height="1.6" fill="#f4c64f"/>`;
  s+=`<rect x="366" y="30" width="30" height="3" fill="#5b3b24"/><rect x="366" y="58" width="30" height="3" fill="#5b3b24"/>`;
  for(let i=0;i<4;i++)s+=`<rect x="${368+i*7}" y="${16+(i%2)*2}" width="4" height="14" rx="1.5" fill="${["#5a1a2a","#2f5a2a","#5a1a2a","#3a2a1a"][i]}"/><rect x="${368+i*7}" y="${44}" width="4" height="14" rx="1.5" fill="${["#2f5a2a","#5a1a2a","#3a2a1a","#5a1a2a"][i]}"/>`;
  // Lampen mit warmem Licht
  [96,320].forEach(x=>{s+=`<circle cx="${x}" cy="40" r="40" fill="url(#sz-glow)"/><path d="M${x} 0v20" stroke="#3a3a3a" stroke-width="1.2"/><path d="M${x-10} 30 L${x-5} 20 H${x+5} L${x+10} 30Z" fill="#2f6b3a"/><ellipse cx="${x}" cy="30" rx="6" ry="2" fill="#ffe08a"/>`;});
  // Boden und Tische
  s+=checker(0,126,400,30,10,"#efe7d6","#2f3a35");
  [[120,128],[300,128]].forEach(([x,y])=>{s+=`<rect x="${x-2}" y="${y}" width="4" height="22" fill="#4a3020"/><ellipse cx="${x}" cy="${y}" rx="26" ry="6" fill="#f3eee2"/><path d="M${x-26} ${y} q26 10 52 0 v6 q-26 10 -52 0z" fill="#e5533f" opacity=".85"/><rect x="${x-34}" y="${y-14}" width="3" height="34" fill="#7a4a26"/><rect x="${x+31}" y="${y-14}" width="3" height="34" fill="#7a4a26"/><circle cx="${x+4}" cy="${y-6}" r="3" fill="#5a1a2a"/><rect x="${x+3}" y="${y-14}" width="2" height="8" fill="#2f5a2a"/>`;});
  s+=`<path d="M170 126 q-6-18 4-30 q-2 16 6 30z" fill="#4f9a45"/><rect x="164" y="122" width="16" height="12" rx="2" fill="#c0603a"/>`;
  // Gast (kommt durch die Tür) oder Telefon auf dem Tresen
  if(guest)s+=figure(guest,181,64,92,enter?"enter":"");
  // Tresen im Vordergrund
  s+=`<rect x="0" y="152" width="400" height="10" fill="url(#sz-marble)"/><rect x="0" y="160" width="400" height="3" fill="#bfb6a6"/><rect x="0" y="163" width="400" height="37" fill="url(#sz-wood)"/>`;
  for(let x=0;x<400;x+=50)s+=`<rect x="${x+4}" y="168" width="42" height="27" rx="2" fill="none" stroke="#5b3b24" stroke-width="2" opacity=".6"/>`;
  s+=`<rect x="20" y="136" width="44" height="6" rx="1" fill="#e6c9a0"/><rect x="22" y="142" width="40" height="5" fill="#d9b88a"/><rect x="20" y="147" width="44" height="6" rx="1" fill="#e6c9a0"/><text x="42" y="152" font-family="Arial" font-size="4.5" font-weight="800" fill="#b8562f" text-anchor="middle">PIZZA</text>`;
  s+=`<path d="M88 152 q-8-16 2-26 q4 12 4 26z M96 152 q2-18 12-22 q-4 12-6 22z" fill="#3f9a45"/><path d="M84 140 h20 l-3 13 h-14z" fill="#c0603a"/>`;
  s+=`<rect x="318" y="128" width="50" height="25" rx="3" fill="#6f7b84"/><rect x="328" y="112" width="30" height="16" rx="2" fill="#2f3a40"/><rect x="331" y="115" width="24" height="9" fill="#7fe08a"/><text x="343" y="122" font-family="monospace" font-size="6" fill="#1b221f" text-anchor="middle">€</text>`;
  for(let r=0;r<2;r++)for(let k=0;k<3;k++)s+=`<rect x="${324+k*13}" y="${133+r*8}" width="9" height="5" rx="1" fill="#d8dde0"/>`;
  if(phone)s+=`<g class="ring-phone"><rect x="220" y="134" width="40" height="18" rx="5" fill="#e5533f"/><path d="M216 132 q24-14 48 0 v6 h-10 v-4 q-14-6-28 0 v4 h-10z" fill="#c0392b"/><circle cx="240" cy="143" r="5" fill="#f3eee2"/></g><path class="ring-waves" d="M206 124 q-6 8 0 16 M274 124 q6 8 0 16" stroke="#e5533f" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  return wrap(s,"Pizzeria von hinter dem Tresen");
}

/* Markt: mehrere Stände mit Gemüse, Käse, Mehl und Oliven. */
function sceneMarket(){
  let s=`<rect width="400" height="200" fill="url(#sz-eve)"/>${vesuvio(240,92,170,"#c0907a")}`;
  s+=facade(-6,70,96,120,"#e8b46a","#5a6f7a")+facade(62,60,80,120,"#d98a72","#5a6f7a")+facade(120,80,104,120,"#f1d79a","#5a6f7a")+facade(198,56,86,120,"#c9a27e","#5a6f7a")+facade(252,70,70,120,"#e9c2a0","#5a6f7a")+facade(320,86,100,120,"#dfa86a","#5a6f7a");
  s+=`<path d="M0 28 Q100 48 200 30 T400 34" stroke="#3a3a3a" stroke-width=".8" fill="none"/>`;
  for(let i=0;i<14;i++){const x=i*30+8,y=28+Math.sin(i*1.1)*6+10*Math.sin(i*.45);s+=`<circle cx="${x}" cy="${y+4}" r="2.4" fill="#ffe08a"/>`;}
  s+=`<rect y="120" width="400" height="80" fill="#9a8e80"/>`;
  for(let r=0;r<5;r++)for(let k=0;k<22;k++)s+=`<rect x="${k*19+(r%2)*9-6}" y="${122+r*16}" width="16" height="13" rx="4" fill="${(r+k)%3?"#a99d8e":"#8f8475"}"/>`;
  const stall=(x,w,a,b,goods,label)=>{
    let t=`<rect x="${x+4}" y="62" width="4" height="78" fill="#5b3b24"/><rect x="${x+w-8}" y="62" width="4" height="78" fill="#5b3b24"/>`;
    t+=`<path d="M${x-4} 64 L${x+8} 44 H${x+w-8} L${x+w+4} 64Z" fill="${a}"/>`+stripes(x-4,58,w+8,8,8,a,b)+scallop(x-4,66,w+8,8,a,b);
    t+=`<rect x="${x+12}" y="46" width="${w-24}" height="10" rx="2" fill="#f3eee2"/><text x="${x+w/2}" y="53.5" font-family="Georgia,serif" font-size="6.5" font-weight="700" fill="#5b3b24" text-anchor="middle">${label}</text>`;
    t+=`<rect x="${x-2}" y="118" width="${w+4}" height="8" fill="#8a5a32"/><rect x="${x}" y="126" width="${w}" height="30" fill="#6b4426"/>`+goods;
    return t;
  };
  const crate=(x,y,c,n,r)=>{let t=`<rect x="${x}" y="${y+8}" width="34" height="14" fill="#c99a5c"/><path d="M${x} ${y+15}h34" stroke="#a87a40" stroke-width="1"/>`;for(let i=0;i<n;i++)t+=`<circle cx="${x+5+(i%5)*6}" cy="${y+6-(i>4?4:0)}" r="${r}" fill="${c}"/>`;return t;};
  let veg=crate(14,104,"#d8402b",9,3.6)+crate(52,104,"#f2c94c",9,3.4)+`<path d="M92 112 l4-10 4 10z M98 112 l4-12 4 12z" fill="#3f9a45"/>`;
  s+=stall(10,100,"#3f8f5a","#f3eee2",veg,"Frutta e verdura");
  let cheese=`<ellipse cx="300" cy="114" rx="14" ry="5" fill="#f2d48a"/><rect x="286" y="104" width="28" height="10" fill="#f2d48a"/><ellipse cx="300" cy="104" rx="14" ry="5" fill="#f7e2a6"/><circle cx="330" cy="110" r="8" fill="#fbf6ea"/><circle cx="346" cy="112" r="7" fill="#fbf6ea"/><circle cx="360" cy="110" r="8" fill="#fbf6ea"/><rect x="372" y="98" width="6" height="18" rx="3" fill="#a3262a"/><rect x="380" y="100" width="6" height="16" rx="3" fill="#a3262a"/>`;
  s+=stall(280,110,"#2f5f9a","#f3eee2",cheese,"Formaggi e salumi");
  let flour=`<path d="M138 118 q-2-18 10-20 q12 2 10 20z" fill="#efe6d2"/><text x="148" y="112" font-family="Arial" font-size="4" fill="#8a5a32" text-anchor="middle">FARINA</text><path d="M232 118 q-2-18 10-20 q12 2 10 20z" fill="#efe6d2"/><ellipse cx="190" cy="112" rx="12" ry="6" fill="#2a2a2a"/><ellipse cx="190" cy="110" rx="10" ry="4" fill="#4a5a2a"/><ellipse cx="214" cy="112" rx="9" ry="5" fill="#d9a35a"/>`;
  s+=stall(126,138,"#e5533f","#f3eee2","","Esposito · Alimentari");
  s+=figure(vendorFace(),150,52,90,"");
  s+=`<rect x="124" y="118" width="142" height="8" fill="#8a5a32"/><rect x="126" y="126" width="138" height="30" fill="#6b4426"/>`+flour;
  s+=`<rect x="236" y="96" width="22" height="14" rx="2" fill="#1f2a25"/><text x="247" y="105.5" font-family="Georgia" font-size="6" fill="#f3eee2" text-anchor="middle">€ 3/kg</text>`;
  return wrap(s,"Markt mit mehreren Ständen");
}

/* Eisladen: Theke mit Eissorten, die Verkäuferin dahinter. */
function sceneGelateria(person,enter){
  let s=`<rect width="400" height="200" fill="#cdeee0"/>`+stripes(0,0,400,70,20,"#cdeee0","#bfe6d4");
  s+=`<rect y="70" width="400" height="4" fill="#f3b6c4"/><rect x="120" y="10" width="160" height="34" rx="17" fill="#fbe3ea" stroke="#e98aa3" stroke-width="3"/><text x="200" y="33" font-family="Georgia,serif" font-style="italic" font-size="18" font-weight="700" fill="#d1497a" text-anchor="middle">Gelateria</text>`;
  s+=`<rect x="20" y="50" width="80" height="4" fill="#c99a6a"/><rect x="20" y="86" width="80" height="4" fill="#c99a6a"/>`;
  for(let i=0;i<5;i++)s+=`<path d="M${26+i*15} 50 l5-14 5 14z" fill="#e6b06a"/><path d="M${26+i*15} 86 l5-14 5 14z" fill="#e6b06a"/>`;
  s+=`<rect x="300" y="48" width="84" height="52" rx="4" fill="#fff"/><text x="342" y="60" font-family="Georgia" font-size="8" font-weight="700" fill="#d1497a" text-anchor="middle">Prezzi</text>`;
  [["1 gusto","2,50"],["2 gusti","3,50"],["3 gusti","4,50"],["+ panna","0,50"]].forEach(([a,b],i)=>s+=`<text x="308" y="${70+i*8}" font-family="Arial" font-size="6" fill="#3a3a3a">${a}</text><text x="376" y="${70+i*8}" font-family="Arial" font-size="6" fill="#3a3a3a" text-anchor="end">${b} €</text>`);
  s+=checker(0,100,400,30,10,"#fdf3f6","#f3c6d3");
  if(person)s+=figure(person,152,30,96,enter?"enter":"");
  s+=`<rect x="0" y="118" width="400" height="10" fill="#e98aa3"/><rect x="10" y="104" width="380" height="16" fill="url(#sz-glass)" stroke="#a9d6e6" stroke-width="1.5"/>`;
  const G=[["#a8cf6a","pistacchio"],["#f6a0b8","fragola"],["#7a4a2a","cioccolato"],["#f7e27a","limone"],["#fbf6ea","stracciatella"],["#f4c38a","nocciola"],["#c7a0e0","mirtillo"],["#ffd2a0","melone"]];
  G.forEach(([c,n],i)=>{const x=16+i*47;s+=`<rect x="${x}" y="128" width="42" height="26" fill="#d9dfe2"/><path d="M${x+3} 132 q6-12 18-8 q12-4 18 8 v6 h-36z" fill="${c}"/>${n==="stracciatella"?`<circle cx="${x+14}" cy="129" r="1.4" fill="#3a2a1a"/><circle cx="${x+24}" cy="131" r="1.4" fill="#3a2a1a"/>`:""}<rect x="${x+4}" y="141" width="34" height="9" rx="2" fill="#fff"/><text x="${x+21}" y="147.5" font-family="Arial" font-size="5.2" fill="#3a3a3a" text-anchor="middle">${n}</text>`;});
  s+=`<rect x="0" y="156" width="400" height="44" fill="#f3b6c4"/>`+stripes(0,160,400,40,25,"#f7c9d4","#f3b6c4");
  return wrap(s,"Eisladen mit Eistheke");
}

/* Hafen: Fähre nach Capri, Ticketschalter, Möwen und der Vesuv. */
function scenePorto(person,enter){
  let s=`<rect width="400" height="200" fill="url(#sz-sky)"/><circle cx="330" cy="30" r="16" fill="#ffe08a"/><circle cx="330" cy="30" r="26" fill="url(#sz-glow)"/>`;
  s+=vesuvio(-20,96,200,"#8b8fb5")+`<path d="M60 96 q20-4 40 0z" fill="#7a7ea5"/>`;
  s+=`<rect y="94" width="400" height="60" fill="url(#sz-sea)"/>`;
  for(let i=0;i<12;i++)s+=`<path d="M${(i*37)%400} ${104+(i*13)%44} q6-4 12 0" stroke="#bfe6f5" stroke-width="1.2" fill="none" opacity=".7"/>`;
  s+=`<g class="ferry"><path d="M40 118 h150 l-14 20 h-124z" fill="#f3eee2"/><rect x="40" y="124" width="150" height="4" fill="#2f5f9a"/><rect x="70" y="100" width="90" height="18" rx="3" fill="#fbf6ea"/>`;
  for(let i=0;i<7;i++)s+=`<rect x="${76+i*12}" y="105" width="7" height="6" rx="1" fill="#5aa0c8"/>`;
  s+=`<rect x="128" y="86" width="12" height="14" fill="#e5533f"/><rect x="128" y="86" width="12" height="3" fill="#1b221f"/><text x="115" y="136" font-family="Arial" font-size="7" font-weight="800" fill="#2f5f9a" text-anchor="middle">CAPRI</text></g>`;
  s+=seagull(220,40,1.4)+seagull(250,28,1)+seagull(190,58,.8);
  s+=`<rect y="150" width="400" height="50" fill="#a59c90"/><rect y="150" width="400" height="5" fill="#cfc7bb"/>`;
  for(let k=0;k<14;k++)s+=`<rect x="${k*30}" y="160" width="28" height="16" fill="none" stroke="#8f8679" stroke-width="1"/><rect x="${k*30+14}" y="177" width="28" height="16" fill="none" stroke="#8f8679" stroke-width="1"/>`;
  [30,120].forEach(x=>s+=`<rect x="${x}" y="140" width="12" height="16" rx="3" fill="#2f3a40"/><ellipse cx="${x+6}" cy="140" rx="8" ry="3" fill="#3f4a50"/>`);
  s+=`<path d="M42 146 q30 10 78 -2" stroke="#c9a46a" stroke-width="2.5" fill="none"/>`;
  // Ticketschalter
  s+=`<rect x="236" y="62" width="150" height="96" fill="#f1d79a"/><path d="M226 64 L246 44 H376 L396 64Z" fill="#2f5f9a"/>`+scallop(226,64,170,10,"#2f5f9a","#f3eee2");
  s+=`<rect x="262" y="50" width="98" height="12" rx="2" fill="#f3eee2"/><text x="311" y="59" font-family="Georgia,serif" font-size="8" font-weight="700" fill="#2f5f9a" text-anchor="middle">BIGLIETTERIA</text>`;
  s+=`<rect x="262" y="78" width="98" height="64" fill="#2b3a44"/>`;
  if(person)s+=`<svg x="262" y="78" width="98" height="64" viewBox="262 78 98 64">${figure(person,266,70,90,enter?"enter":"")}</svg>`;
  s+=`<rect x="262" y="78" width="98" height="64" fill="url(#sz-glass)"/><rect x="258" y="140" width="106" height="8" fill="#c9a46a"/><rect x="290" y="132" width="40" height="8" rx="4" fill="#1b221f"/>`;
  s+=`<rect x="366" y="88" width="16" height="40" rx="2" fill="#fff"/><text x="374" y="98" font-family="Arial" font-size="4" fill="#3a3a3a" text-anchor="middle">Capri</text><text x="374" y="104" font-family="Arial" font-size="4" fill="#3a3a3a" text-anchor="middle">10:15</text><text x="374" y="112" font-family="Arial" font-size="4" fill="#3a3a3a" text-anchor="middle">Ischia</text><text x="374" y="118" font-family="Arial" font-size="4" fill="#3a3a3a" text-anchor="middle">11:30</text>`;
  return wrap(s,"Hafen mit Fähre und Ticketschalter");
}

/* Gerenderte Hintergründe (www/bilder/umgebungen/, Hochformat 768×1344, siehe HERKUNFT.md).
   Das Bild wird auf 400 Breite gebracht (dann 700 hoch); oy = welcher Streifen von oben gezeigt wird.
   fig = Platz der Figur [x, y, Größe], clip = bis wohin sie sichtbar ist (z. B. Oberkante Tresen).
   stand = Gast mit ganzem Körper [x Mitte, y Füße, Höhe], steht auf dem Boden vor der Bar.
   Fehlt ein Eintrag (null), zeichnet szenen.js den Ort selbst. */
const SCENE_H=260;
const SCENE_IMG={
  pizzeria:{src:"bilder/umgebungen/pizzeria.webp",oy:390,stand:[62,250,206]},
  mercato:{src:"bilder/umgebungen/markt.webp",oy:250},
  gelateria:{src:"bilder/umgebungen/eisladen.webp",oy:300,fig:[150,30,100],clip:118},
  porto:{src:"bilder/umgebungen/hafen.webp",oy:250}
};
function imageScene(id,person,enter,label,extra){
  const I=SCENE_IMG[id]; if(!I)return null;
  let s=`<image href="${I.src}" x="0" y="${-I.oy}" width="400" height="700"/>`+(extra||"");
  if(person&&person.name&&I.stand){const [x,y,h]=I.stand;
    s+=(person.prev?walker(person.prev,2,x,y,h,"walk walkout"):"")+walker(person.name,person.mood,x,y,h,enter?"walk walkin":"");}
  else if(person&&I.fig){const [x,y,w]=I.fig;s+=`<clipPath id="sz-clip-${id}"><rect width="400" height="${I.clip}"/></clipPath><g clip-path="url(#sz-clip-${id})">${figure(person,x,y,w,enter?"enter2":"")}</g>`;}
  return `<svg class="stage-svg" viewBox="0 0 400 ${SCENE_H}" role="img" aria-label="${label}">${s}</svg>`;
}
// Passanten, die im Hintergrund vorbeilaufen (Markt: die Gasse herunter, Hafen: an der Promenade entlang).
function passersby(id){
  const who=sample(NAMES,2);
  if(id==="mercato")return who.map((n,i)=>walker(n,2,0,0,92,`walk street${i?" late":""}`)).join("");
  if(id==="porto")return who.map((n,i)=>walker(n,2,0,0,46,`walk quay${i?" late":""}`)).join("");
  return "";
}

// Passende Szene für den aktuellen Schritt; der Gast „kommt herein“, wenn er neu ist.
function stageHTML(){
  const mk=G.phase==="market", g=curGuest();
  if(mk)return imageScene("mercato",null,false,"Markt",passersby("mercato"))||sceneMarket();
  const enter=G.entered!==G.gi; G.entered=G.gi;
  const person=g&&!g.phone?face(g.name,g.mood):null;
  if(G.trip==="gelateria")return imageScene("gelateria",person,false,"Eisladen")||sceneGelateria(person,false);
  if(G.trip==="porto")return imageScene("porto",null,false,"Hafen",passersby("porto"))||scenePorto(person,false);
  // Pizzeria: der Gast läuft herein, der vorige geht zur gleichen Zeit hinaus.
  const prev=enter&&G.gi>0&&G.guests[G.gi-1], who=g&&!g.phone&&{name:g.name,mood:g.mood,prev:prev&&!prev.phone?prev.name:null};
  return (!(g&&g.phone)&&imageScene("pizzeria",who,enter,"Pizzeria"))||scenePizzeria(person,g&&g.phone,enter);
}
