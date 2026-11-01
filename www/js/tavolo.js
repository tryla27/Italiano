/* Il tavolo sulla piazza: ein Tisch mit Sonnenschirm auf der Piazza im 3D-Viertel. Dort sitzt Nonno Peppe,
   ein alter Herr aus dem Viertel, und spielt mit dir das Zutaten-Memory (memory.js) zu zweit:
   abwechselnd zwei Karten aufdecken, wer ein Paar findet, darf nochmal. Nonno Peppe merkt sich die Karten,
   die er sieht, aber nicht alle (TAV_MEM). Gewinnst du, gibt es einmal pro Spieltag Geld.
   Hängt an stadt3d.js: buildCity() ruft tavoloBuild(); Antippen geht über goPlace("tavolo") aus karte.js. */
const TAV={x:-5,z:-2.5,s:1.3}; // auf der Piazza zwischen Brunnen und Pizzeria; etwas größer, damit man es von oben sieht
const TAV_WHO="Nonno Peppe";
const TAV_MEM=.65;      // so wahrscheinlich merkt sich Nonno Peppe eine aufgedeckte Karte
const TAV_WAIT=950;     // ms zwischen seinen Karten
const TAV_PRIZE=10;     // € für einen Sieg, einmal pro Spieltag
CHARS[TAV_WHO]={skin:"#e3b48e",hair:"#f2f2f2",style:"cap",cap:"#6b5440",shirt:"#f3eee2",mus:1,glasses:"round",old:1};
// Was er sagt (Italienisch, Deutsch)
const TAV_SAY={
  start:[["Siediti! Giochiamo a memory? Comincia tu.","Setz dich! Spielen wir Memory? Du fängst an."],
    ["Una partita? Prego, comincia tu!","Eine Partie? Bitte, du fängst an!"]],
  you:[["Tocca a te!","Du bist dran!"],["Vai, tocca a te.","Los, du bist dran."],["Uffa! Tocca a te.","Mist! Du bist dran."]],
  me:[["Ora tocca a me.","Jetzt bin ich dran."],["Vediamo un po'...","Mal sehen ..."],["Peccato! Adesso gioco io.","Schade! Jetzt spiele ich."]],
  youPair:[["Complimenti! Una coppia!","Glückwunsch! Ein Paar!"],["Che memoria!","Was für ein Gedächtnis!"],["Bene! Gioca ancora.","Gut! Spiel nochmal."]],
  mePair:[["Eccola! Una coppia per me!","Da ist es! Ein Paar für mich!"],["Ah, me lo ricordavo!","Ah, das wusste ich noch!"],["Ancora io!","Nochmal ich!"]],
  win:[["Hai vinto tu! Complimenti!","Du hast gewonnen! Glückwunsch!"]],
  lose:[["Ho vinto io! Facciamo la rivincita?","Ich habe gewonnen! Machen wir eine Revanche?"]],
  draw:[["Pareggio! Siamo bravi tutti e due.","Unentschieden! Wir sind beide gut."]]
};
// Ein Ort im 3D-Viertel (Schild, Antippen) wie die Lernorte
PLACES.push({id:"tavolo",it:"Il Tavolo",de:"Memory zu zweit",city:1});
CITY_SPOTS.tavolo=[TAV.x,TAV.z,3];
CITY_GO.tavolo=()=>startMemo(true);

/* ---------- Tisch, Stühle und Nonno Peppe ---------- */
function tavoloBuild(){
  const T=THREE, pg=placeGroup("tavolo"), g=new T.Group(), x=0, z=0, B=(w,h,d,m,X,Y,Z,p)=>c3box(w,h,d,m,X,Y,Z,p||g);
  g.position.set(TAV.x,0,TAV.z); g.scale.setScalar(TAV.s); pg.add(g);
  const iron=c3mat(0x2b2f2c), wood=c3mat(0x8a5a36);
  // Runder Tisch mit rot-weiß karierter Decke
  const cloth=canvasTex(64,64,(q,w)=>{q.fillStyle="#f6f1e6";q.fillRect(0,0,w,w);q.fillStyle="rgba(200,60,48,.75)";
    for(let i=0;i<8;i+=2){q.fillRect(i*8,0,8,w);q.fillRect(0,i*8,w,8);}});
  const top=new T.Mesh(new T.CylinderGeometry(.75,.75,.06,20),c3mat(0xffffff,{map:cloth}));
  top.position.set(x,.76,z); g.add(top);
  const leg=new T.Mesh(new T.CylinderGeometry(.05,.05,.72,8),iron); leg.position.set(x,.38,z); g.add(leg);
  const foot=new T.Mesh(new T.CylinderGeometry(.32,.36,.05,12),iron); foot.position.set(x,.03,z); g.add(foot);
  // Memory-Karten auf dem Tisch: 3 × 4, ein paar schon aufgedeckt
  for(let r=0;r<3;r++)for(let c=0;c<4;c++){const up=(r*4+c)%5===1;
    B(.17,.012,.17,c3mat(up?0xf3eee2:0x2f3a35),x-.3+c*.2,.8,z-.2+r*.2);
    if(up)B(.07,.004,.07,c3mat([0xd8402f,0x3a9a4a,0xf4c64f][(r+c)%3]),x-.3+c*.2,.808,z-.2+r*.2);}
  // Zwei Stühle: Nonno Peppe sitzt im Norden und schaut zur Kamera, der Platz im Süden ist für dich frei
  const chair=(cz,dir)=>{B(.46,.05,.44,wood,x,.46,cz);B(.46,.5,.05,wood,x,.72,cz+dir*.2);
    [[-.2,-.18],[.2,-.18],[-.2,.18],[.2,.18]].forEach(([dx,dz])=>B(.04,.46,.04,iron,x+dx,.23,cz+dz));};
  chair(z-.95,-1); chair(z+.95,1);
  // Nonno Peppe: weißes Hemd, braune Weste, graue Hose, Schiebermütze, Brille, weißer Schnurrbart
  const p=new T.Group(); p.position.set(x,0,z-.95); g.add(p);
  const pants=c3mat(0x5a5f66), skin=c3mat(0xe3b48e), shirt=c3mat(0xf3eee2), vest=c3mat(0x6b4a2b), white=c3mat(0xf2f2f2);
  [-.11,.11].forEach(dx=>{B(.16,.14,.44,pants,dx,.55,.16,p);B(.14,.44,.14,pants,dx,.26,.36,p);B(.15,.07,.24,iron,dx,.04,.42,p);});
  B(.44,.52,.26,shirt,0,.86,-.02,p); B(.46,.4,.27,vest,0,.82,-.02,p);
  // Arme liegen auf dem Tisch
  [-1,1].forEach(s=>{B(.11,.34,.12,shirt,s*.27,.88,0,p);B(.11,.1,.36,shirt,s*.24,.76,.22,p);B(.1,.07,.1,skin,s*.2,.79,.43,p);});
  const head=new T.Group(); head.position.set(0,1.32,0); p.add(head);
  B(.12,.1,.12,skin,0,-.17,0,head);
  B(.3,.32,.28,skin,0,0,0,head); B(.32,.12,.24,white,0,-.02,-.05,head);  // Haarkranz an den Seiten
  B(.2,.05,.04,white,0,-.07,.15,head);                                     // Schnurrbart
  B(.06,.06,.04,skin,0,-.01,.16,head);                                     // Nase
  [-.07,.07].forEach(dx=>B(.09,.07,.02,c3mat(0x34424a,{transparent:true,opacity:.7}),dx,.04,.15,head)); // Brille
  B(.34,.09,.33,c3mat(0x6b5440),0,.18,.01,head); B(.3,.03,.12,c3mat(0x6b5440),0,.14,.2,head); // Mütze mit Schirm
  TAV.head=head;
  // Unsichtbare, große Tippfläche und Schatten
  B(2.2,2.2,2.8,new T.MeshBasicMaterial({visible:false}),x,1.1,z);
  c3add("shadow",flatPlane(3.6,3.6),TAV.x,.03,TAV.z);
}

/* ---------- Spiel zu zweit (Regeln in memory.js memoFlip) ---------- */
function tavSay(key,delay){
  const M=MEMO; if(!M)return; const s=pick(TAV_SAY[key]); M.say=s;
  setTimeout(()=>{if(MEMO===M&&screen==="memo")speak(s[0],TAV_WHO);},delay||0);
}
// Jede aufgedeckte Karte merkt er sich vielleicht
function tavSee(i){if(Math.random()<TAV_MEM)MEMO.seen[i]=true;}
// Paar gefunden: Lob oder Freude, und wer dran ist, spielt weiter
function tavPair(){
  const M=MEMO; tavSay(M.turn==="me"?"youPair":"mePair",900);
  if(M.turn==="ai")tavAi();
}
// Kein Paar: der andere ist dran
function tavNext(){
  const M=MEMO; M.turn=M.turn==="me"?"ai":"me";
  tavSay(M.turn==="me"?"you":"me"); render();
  if(M.turn==="ai")tavAi();
}
// Nonno Peppe spielt: erst ein bekanntes Paar, sonst eine neue Karte und dazu die passende, wenn er sie weiß
function tavAi(){
  const M=MEMO, live=()=>MEMO===M&&screen==="memo"&&!M.done&&M.turn==="ai";
  const left=()=>M.cards.map((c,i)=>i).filter(i=>!M.found.includes(M.cards[i].k)&&!M.open.includes(i));
  const known=i=>M.seen[i];
  const partner=i=>left().find(j=>j!==i&&known(j)&&M.cards[j].k===M.cards[i].k);
  const fresh=()=>{const L=left(), n=L.filter(i=>!known(i));return pick(n.length?n:L);};
  setTimeout(()=>{
    if(!live())return;
    let a=left().find(i=>known(i)&&partner(i)!==undefined); if(a===undefined)a=fresh();
    memoFlip(a,true);
    setTimeout(()=>{
      if(!live()||M.open.length!==1)return;
      let b=partner(a); if(b===undefined)b=fresh();
      memoFlip(b,true);
    },TAV_WAIT);
  },TAV_WAIT+300);
}
function tavEnd(){
  const M=MEMO, {me,ai}=M.score; M.result=me>ai?"win":me<ai?"lose":"draw";
  if(M.result==="win"&&S.tavDay!==S.day){M.reward=TAV_PRIZE;S.coins+=M.reward;S.tavDay=S.day;kasse(M.reward,"Tavolo");}
  tavSay(M.result,900); save();
}
function rTavolo(){
  const M=MEMO, {me,ai}=M.score, s=M.say;
  const mood=M.done?(M.result==="lose"?2:M.result==="win"?1:2):M.turn==="ai"?2:me>ai+1?1:2;
  const status=M.done
    ?`${M.result==="win"?"Du hast gewonnen":M.result==="lose"?"Nonno Peppe hat gewonnen":"Unentschieden"}: ${me} zu ${ai}.${M.reward?` <b>+${M.reward} €</b>`:M.result==="win"?" Geld gibt es wieder am nächsten Spieltag.":""}`
    :M.turn==="me"?`Du bist dran: deck zwei Karten auf.${S.tavDay===S.day?" · heute schon belohnt":""}`:"Nonno Peppe ist dran …";
  $("#screen").innerHTML=`${head("Il tavolo","Memory mit Nonno Peppe")}
    <div class="tav-top">
      <div class="tav-p${!M.done&&M.turn==="me"?" on":""}"><small>Tu</small><b>${me}</b></div>
      <div class="tav-npc"><div class="tav-face${!M.done&&M.turn==="ai"?" on":""}">${face(TAV_WHO,mood)}</div>
        ${s?`<button class="tav-say" data-act="sayit" data-t="${esc(s[0])}">${esc(s[0])}<small>${esc(s[1])}</small></button>`:""}</div>
      <div class="tav-p ai${!M.done&&M.turn==="ai"?" on":""}"><small>Nonno</small><b>${ai}</b></div>
    </div>
    <p class="note memo-line">${status}</p>
    <div class="memo tav${M.turn==="ai"&&!M.done?" wait":""}">${M.cards.map(memoCard).join("")}</div>
    ${M.done?`<button class="big" data-act="place" data-p="tavolo">La rivincita!<small>Noch eine Partie mit neuen Zutaten</small></button>`:""}`;
}
