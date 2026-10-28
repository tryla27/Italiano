/* Einrichtung: Möbel mit Ausbaustufen und ihre Boni. Aufstellen im 3D-Restaurant (restaurant3d.js). */
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

/* ---------- Aufstellen ----------
   Früher ein Raster mit 8 × 6 Feldern (S.place, bleibt im Spielstand), jetzt das Restaurant in 3D: restaurant3d.js. */
// Nach dem Kauf: Signor Moretti fragt, wohin das neue Stück soll; es ist im 3D-Restaurant schon ausgewählt
function furnBought(i){
  learn(i.it);
  locNew(placeKey(i),`Signor Moretti: „Dove mettiamo ${i.it}?“ (Wohin stellen wir es?) Zieh es an seinen Platz.`);
  speak(`Dove mettiamo ${i.it}?`,"Signor Moretti");
}
