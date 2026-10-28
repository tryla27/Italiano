/* Bausteine eines Spieltags: Fragen, Pizza-Bestellung, Telefon, Reservierung, Rechnung. */
/* ---------- Step builders ---------- */
// Falsche Antworten: jede einzeln zu 50 % eine passende Ablenkung zum Thema (aus dem Dialog selbst),
// zu 50 % eine zufällige richtige Antwort aus einem anderen Gespräch. Deutsch-Fragen bekommen deutsche.
let ANSWERS=null;
function answerPools(){
  if(ANSWERS)return ANSWERS;
  const all=[GREET,TALK,PROB,BILL,MARKET,DRINK,DIR,CRITIC,GELATERIA,PORTO].flat().filter(x=>Array.isArray(x)&&Array.isArray(x[4]));
  const ok=t=>!t.includes("{");
  ANSWERS={it:[...new Set(all.filter(x=>x[3]).map(x=>x[2]).filter(ok))],de:[...new Set(all.filter(x=>!x[3]).map(x=>x[2]).filter(ok))]};
  return ANSWERS;
}
function mixWrong(cor,wr,german){
  const theme=shuffle(wr), pool=shuffle(answerPools()[german?"de":"it"].filter(t=>t!==cor&&!wr.includes(t))), out=[];
  while(out.length<wr.length){
    const src=(Math.random()<.5&&pool.length)||!theme.length?pool:theme, t=src.shift();
    if(t===undefined)break; if(!out.includes(t))out.push(t);
  }
  return out;
}
function mcStep(item,task,extra){
  const [it,de,cor,corDe,wr,tip,q]=item;
  return Object.assign({kind:"mc",it,de,task:q||task,tip,corDe,opts:shuffle([{t:cor,ok:true},...mixWrong(cor,wr,!corDe).map(t=>({t,ok:false}))]),wrong:0,bad:[],done:false},extra||{});
}
function pickFresh(pool){const fresh=pool.filter(p=>!G.used.has(p[0]));const p=pick(fresh.length?fresh:pool);G.used.add(p[0]);return p;}

function orderStep(L){
  const ops=[["Vorrei","Ich hätte gern"],["Per me","Für mich"],["Allora, prendo","Also, ich nehme"],["Mi porta","Bringen Sie mir"]];
  const [op,opDe]=pick(ops);
  let qty=L===0?1:rnd(1,L===1?2:3), want, it, de, words=[], named=null, senza=null, con=null;
  const r=Math.random();
  const explicit=L===0||(L===1&&r>.75)||(L===2&&r>.85);
  if(explicit){
    const ex=sample(EXTRAS,rnd(1,L===0?2:3)); const base=Math.random()<.2?["mozzarella"]:["pomodoro","mozzarella"];
    const all=[...base,...ex]; want=new Set(all); words=all;
    it=`${op} ${QIT[qty]} ${qty>1?"pizze":"pizza"} con ${listIt(all)}, per favore.`;
    de=`${opDe} ${QDE[qty]} ${qty>1?"Pizzen":"Pizza"} mit ${listDe(all.map(k=>ING[k][0]))}, bitte.`;
  }else{
    named=pick(MENU); want=new Set(named.ing);
    const wantSenza=L===1?r>.45:(r<.3||(r>=.6&&r<.85)), wantCon=L===2&&r>=.3&&r<.85;
    if(wantSenza){senza=pick(named.ing.filter(k=>k!=="pomodoro"));want.delete(senza);words.push(senza);}
    if(wantCon){con=pick(EXTRAS.filter(k=>!named.ing.includes(k)));want.add(con);words.push(con);}
    const nm=qty>1?named.pl:named.n;
    it=`${op} ${QIT[qty]} ${nm}${senza?` senza ${senza}`:""}${con?`${senza?" ma":""} con ${con}`:""}, per favore.`;
    de=`${opDe} ${QDE[qty]} ${cap(named.n)}${senza?` ohne ${ING[senza][0]}`:""}${con?`${senza?", aber":""} mit ${ING[con][0]}`:""}, bitte.`;
  }
  let tip=words.length?`<b>Wörter:</b> ${words.map(w=>`${w} = ${ING[w][0]}`).join(", ")}.`:"";
  if(senza)tip+=` <b>senza</b> = ohne.`; if(con)tip+=` <b>con</b> = mit.`;
  if(named)tip+=` Was auf eine ${cap(named.n)} gehört, steht im Menù.`;
  if(L>0)tip+=` Anzahl: una = 1, due = 2, tre = 3.`;
  const each=named?named.p+(con?1:0):5+want.size;
  return {kind:"pizza",it,de,task:"Belege die Pizza und servier sie!",tip,want,qty,price:each*qty,cur:new Set(),curQty:1,wrong:0,done:false};
}
function phoneStep(){
  const q=rnd(1,4), p=pick(MENU), t=pick(TIMES), st=pick(STREETS), n=pick(NUMS);
  const pz=q===1?`una ${p.n}`:`${QIT[q]} ${p.pl}`;
  const it=`Pronto, pizzeria? Vorrei ordinare ${pz} per le ${t[0]}. L'indirizzo è ${st}, numero ${n[0]}.`;
  const de=`Hallo, Pizzeria? Ich möchte ${QDE[q]} ${cap(p.n)} für ${t[1]} Uhr bestellen. Die Adresse ist ${st} Nummer ${n[1]}.`;
  const kind=pick(["qty","time","num","pizza"]); let task,opts,tip;
  if(kind==="qty"){task="Wie viele Pizzen will er?";opts=[1,2,3,4].map(x=>({t:String(x),ok:x===q}));tip="Die Anzahl kommt direkt nach „ordinare“. una = 1, due = 2, tre = 3, quattro = 4.";}
  if(kind==="time"){task="Für wann ist die Bestellung?";opts=shuffle([t,...sample(TIMES.filter(x=>x!==t),3)]).map(x=>({t:x[1]+" Uhr",ok:x===t}));tip="Die Uhrzeit kommt nach „per le“. sette = 7, otto = 8, nove = 9, e mezza = halb, e un quarto = Viertel nach.";}
  if(kind==="num"){task="Welche Hausnummer?";opts=shuffle([n,...sample(NUMS.filter(x=>x!==n),3)]).map(x=>({t:"Nr. "+x[1],ok:x===n}));tip="Die Hausnummer kommt nach „numero“. due = 2, dieci = 10, dodici = 12, venti = 20, trenta = 30.";}
  if(kind==="pizza"){task="Welche Pizza will er?";opts=shuffle([p,...sample(MENU.filter(x=>x!==p),3)]).map(x=>({t:cap(x.n),ok:x===p}));tip="Hör auf das Wort nach der Anzahl. Plural: margherite, diavole, capricciose, ortolane.";}
  return {kind:"mc",phone:true,it,de,task,tip,opts,wrong:0,bad:[],done:false,showText:!canSpeak,price:p.p*q};
}
function reservStep(){
  const n=rnd(2,8), d=pick(DAYS), t=pick(TIMES), nm=pick(SURNAMES);
  const NW=["","","due","tre","quattro","cinque","sei","sette","otto"];
  const it=`Buonasera, vorrei prenotare un tavolo per ${NW[n]} persone, ${d[0]} sera alle ${t[0]}. A nome ${nm}.`;
  const de=`Guten Abend, ich möchte einen Tisch für ${n} Personen reservieren, ${d[1]}abend um ${t[1]} Uhr. Auf den Namen ${nm}.`;
  const kind=pick(["pers","day","time","name"]); let task,opts,tip;
  if(kind==="pers"){task="Für wie viele Personen?";const o=shuffle([n,...sample([2,3,4,5,6,7,8].filter(x=>x!==n),3)]);opts=o.map(x=>({t:x+" Personen",ok:x===n}));tip="Die Zahl steht vor „persone“. due 2, tre 3, quattro 4, cinque 5, sei 6, sette 7, otto 8.";}
  if(kind==="day"){task="An welchem Tag?";opts=shuffle([d,...sample(DAYS.filter(x=>x!==d),3)]).map(x=>({t:x[1],ok:x===d}));tip="Wochentage: lunedì Mo, martedì Di, mercoledì Mi, giovedì Do, venerdì Fr, sabato Sa, domenica So.";}
  if(kind==="time"){task="Um wie viel Uhr?";opts=shuffle([t,...sample(TIMES.filter(x=>x!==t),3)]).map(x=>({t:x[1]+" Uhr",ok:x===t}));tip="Die Uhrzeit kommt nach „alle“. sette = 7, otto = 8, nove = 9, e mezza = halb.";}
  if(kind==="name"){task="Auf welchen Namen?";opts=shuffle(SURNAMES.slice()).slice(0,4);if(!opts.includes(nm))opts[0]=nm;opts=shuffle(opts).map(x=>({t:x,ok:x===nm}));tip="Der Name kommt nach „a nome“ (auf den Namen).";}
  return {kind:"mc",phone:true,it,de,task,tip,opts,wrong:0,bad:[],done:false,showText:!canSpeak};
}

function billStep(total){
  const item=pickFresh(BILL);
  let w=total; while(w===total||w<1)w=total+pick([-3,-2,-1,1,2,3,10,-10]);
  const f=x=>x.replace("{N}",numIt(total)).replace("{D}",total).replace("{W}",numIt(w));
  return mcStep([f(item[0]),f(item[1]),f(item[2]),f(item[3]),item[4].map(f),f(item[5])],"Was antwortest du?",{bill:total});
}
