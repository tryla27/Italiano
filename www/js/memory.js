/* Zutaten-Memory: Bild der Zutat und italienisches Wort als Paar finden. Einmal pro Spieltag gibt es Geld dafür. */
/* ---------- Memory ---------- */
let MEMO=null;
const MEMO_PAIRS=6;
// Eigene Zutaten zuerst; fehlen welche, kommen die vom nächsten Markt dazu
function memoPool(){
  const own=S.ing.filter(k=>ING[k]);
  if(own.length>=MEMO_PAIRS)return own;
  return own.concat(sample(Object.keys(ING).filter(k=>!own.includes(k)&&ING[k][2]<=S.level+1),MEMO_PAIRS-own.length));
}
// vs: am Tisch auf der Piazza gegen Nonno Peppe (tavolo.js), sonst allein
function startMemo(vs){
  const ks=sample(memoPool(),MEMO_PAIRS);
  MEMO={cards:shuffle(ks.flatMap(k=>[{k,pic:true},{k,pic:false}])),open:[],found:[],moves:0,miss:0,lock:false,done:false,reward:0};
  if(vs)Object.assign(MEMO,{vs:true,turn:"me",score:{me:0,ai:0},by:{},seen:{},say:null});
  screen="memo"; render();
  if(vs&&typeof tavSay==="function")tavSay("start");
}
function memoFlip(i,ai){
  const M=MEMO, c=M&&M.cards[i];
  if(!c||M.lock||M.done||M.open.includes(i)||M.found.includes(c.k))return;
  if(M.vs&&(M.turn==="ai")!==!!ai)return; // im Zweierspiel nur, wer dran ist
  M.open.push(i);
  if(M.vs&&typeof tavSee==="function")tavSee(i);
  if(!c.pic)speak(c.k); // das Wort beim Aufdecken vorlesen
  if(M.open.length<2){sfx("select");return render();}
  M.moves++;
  const [a,b]=M.open.map(j=>M.cards[j]);
  if(a.k===b.k){
    M.found.push(a.k); M.open=[]; sfx("right"); if(c.pic)speak(c.k);
    if(M.vs){M.score[M.turn]++;M.by[a.k]=M.turn;}
    if(!M.vs||M.turn==="me")learn(a.k);
    if(M.found.length===MEMO_PAIRS)memoEnd();
    else if(M.vs)tavPair(); // wer ein Paar findet, ist nochmal dran
    return render();
  }
  if(!M.vs||M.turn==="me")M.miss++;
  M.lock=true; sfx("wrong"); render();
  setTimeout(()=>{M.open=[];M.lock=false;if(MEMO!==M||screen!=="memo")return;
    if(M.vs)tavNext(); else render();},1100);
}
// Belohnung: einmal pro Spieltag, je weniger Fehlversuche desto mehr (3 bis 12 €)
function memoEnd(){
  const M=MEMO; M.done=true;
  if(M.vs)return tavEnd();
  if(S.memDay!==S.day){M.reward=Math.max(3,12-M.miss);S.coins+=M.reward;S.memDay=S.day;kasse(M.reward,"Memory");}
  save();
}
// Eine Karte; im Zweierspiel zeigt der Rand, wer das Paar gefunden hat
function memoCard(c,i){
  const M=MEMO, got=M.found.includes(c.k), up=got||M.open.includes(i), who=got&&M.vs?" by-"+M.by[c.k]:"";
    return `<button class="mcard${up?" up":""}${got?" found":""}${who}${c.pic?" pic":""}" data-act="mflip" data-i="${i}" aria-label="${up?esc(c.pic?ING[c.k][0]:c.k):`Karte ${i+1}`}">${
      !up?`<span class="back">P!</span>`:c.pic?ingIcon(c.k):`<b>${esc(c.k)}</b>`}${got?`<small>${esc(ING[c.k][0])}</small>`:""}</button>`;
}
function rMemo(){
  const M=MEMO;
  if(M.vs)return rTavolo();
  const card=memoCard;
  $("#screen").innerHTML=`${head("Memory","Finde Bild und Wort")}
    <p class="note memo-line">${M.done
      ?`Bravissimo! Alle Paare in ${M.moves} Zügen.${M.reward?` <b>+${M.reward} €</b>`:" Geld gibt es wieder am nächsten Spieltag."}`
      :`Paare ${M.found.length}/${MEMO_PAIRS} · Züge ${M.moves}${S.memDay===S.day?" · heute schon belohnt":""}`}</p>
    <div class="memo">${M.cards.map(card).join("")}</div>
    ${M.done?`<button class="big" data-act="memo">Ancora una volta!<small>Nochmal mit neuen Zutaten</small></button>`:""}`;
}
