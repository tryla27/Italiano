/* Einrichtung: Möbel mit Ausbaustufen, ihre Boni und das Aufstellen auf dem Raster (8 × 6 Felder, von oben). */
const FURN=START_FURN.concat(SHOP.filter(i=>!i.up));
const furnById=id=>FURN.find(i=>i.id===id);
const ownsFurn=i=>!i.cost&&!i.up?true:S.owned.includes(i.id);
// Höchste Ausbaustufe einer Gruppe (Ofen, Theke, Tische, Kühlung, Kaffee); 0 = noch keine
function tierOf(grp){return FURN.filter(i=>i.grp===grp&&ownsFurn(i)).reduce((a,i)=>Math.max(a,i.tier),0);}
// Was im Laden steht: bei Gruppen nur die höchste Stufe, sonst jedes gekaufte Stück
function placedFurn(){
  const out=[];
  FURN.forEach(i=>{if(!ownsFurn(i))return; if(i.grp){if(i.tier===tierOf(i.grp))out.push(i);}else out.push(i);});
  return out;
}
const placeKey=i=>i.grp||i.id;
// Boni: Summe über alles Gekaufte (Ausbaustufen einer Gruppe zählen nur einmal mit ihrem stärksten Wert)
function fx(key){
  let sum=0; const best={};
  FURN.forEach(i=>{const v=i.fx&&i.fx[key]; if(!v||!ownsFurn(i))return;
    if(i.grp&&key!=="guest"){best[i.grp]=Math.max(best[i.grp]||0,v);}else sum+=v;});
  return sum+Object.values(best).reduce((a,v)=>a+v,0);
}
const TIP_CAP=.5; // alle Trinkgeld-Prozente zusammen höchstens +50 %
const mult=()=>1+Math.min(TIP_CAP,fx("tip"));

/* ---------- Raster ---------- */
const GW=8, GH=6, DOOR=[[3,5],[4,5]];
// Küchenwand oben (Ofen, Kaffee, Kühlung), Gastraum unten (Tische, Terrasse, Schirm)
const ZONE={forno:"wall",caffe:"wall",frigo:"wall",tavoli:"room",terrazza:"room",ombrellone:"room"};
function cellOk(key,x,y,ignore){
  if(x<0||y<0||x>=GW||y>=GH)return false;
  if(DOOR.some(([a,b])=>a===x&&b===y))return false;
  const z=ZONE[key]; if(z==="wall"&&y!==0)return false; if(z==="room"&&y<3)return false;
  return !Object.entries(S.place).some(([k,p])=>k!==ignore&&p[0]===x&&p[1]===y&&placedFurn().some(i=>placeKey(i)===k));
}
function autoPlace(key){
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(cellOk(key,x,y,key)){S.place[key]=[x,y];return;}
}
function ensurePlaced(){placedFurn().forEach(i=>{const k=placeKey(i),p=S.place[k];if(!p||!cellOk(k,p[0],p[1],k))autoPlace(k);});}
let placing=null; // {key, msg}: ausgewähltes Stück auf dem Raster
function boardHTML(){
  ensurePlaced();
  const at={}; placedFurn().forEach(i=>{const p=S.place[placeKey(i)];if(p)at[p[0]+","+p[1]]=i;});
  let h="";
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){
    const i=at[x+","+y], door=DOOR.some(([a,b])=>a===x&&b===y), sel=placing&&i&&placeKey(i)===placing.key;
    const ok=placing&&!i&&!door&&cellOk(placing.key,x,y,placing.key);
    const cls=["cell",y===0?"wall":y>=3?"room":"",door?"door":"",i?"has":"",sel?"sel":"",ok?"ok":""].join(" ");
    h+=i?`<button class="${cls}" data-act="fsel" data-k="${placeKey(i)}" aria-label="${esc(i.it)}">${i.ic}</button>`
      :`<button class="${cls}" data-act="fput" data-x="${x}" data-y="${y}" aria-label="Feld" ${door?"disabled":""}>${door?"🚪":""}</button>`;
  }
  const cur=placing&&placedFurn().find(i=>placeKey(i)===placing.key);
  const line=cur?`<div class="board-line"><b>${esc(cur.it)}</b> · ${esc(cur.de)}${placing.msg?`<small>${esc(placing.msg)}</small>`:`<small>Tippe ein grünes Feld, um es umzustellen.</small>`}</div>`
    :`<div class="board-line dim">Il locale · Tippe ein Möbelstück an: Wort hören und umstellen.</div>`;
  return `${line}<div class="board" role="grid" aria-label="Dein Laden">${h}</div>`;
}
function furnSelect(key){
  const i=placedFurn().find(x=>placeKey(x)===key); if(!i)return;
  placing=placing&&placing.key===key?null:{key,msg:""}; if(placing)speak(i.it);
}
function furnPut(x,y){
  if(!placing||!cellOk(placing.key,x,y,placing.key)){sfx("wrong");return;}
  S.place[placing.key]=[x,y]; sfx("click");
  const i=placedFurn().find(f=>placeKey(f)===placing.key); placing=null;
  if(i)learn(i.it);
}
// Nach dem Kauf: Signor Moretti fragt, wohin das neue Stück soll
function furnBought(i){
  const k=placeKey(i); delete S.place[k]; autoPlace(k); learn(i.it);
  placing={key:k,msg:`Signor Moretti: „Dove mettiamo ${i.it}?“ (Wohin stellen wir es?)`};
  speak(`Dove mettiamo ${i.it}?`,"Signor Moretti");
}
