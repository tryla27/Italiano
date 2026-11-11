/* Bausteine eines Spieltags: Fragen, Pizza-Bestellung, Telefon, Reservierung, Rechnung. */
/* ---------- Step builders ---------- */
// Falsche Antworten: jede einzeln zu 50 % eine passende Ablenkung zum Thema (aus dem Dialog selbst),
// zu 50 % eine zufällige richtige Antwort aus einem anderen Gespräch. Deutsch-Fragen bekommen deutsche.
let ANSWERS=null;
function answerPools(){
  if(ANSWERS)return ANSWERS;
  const all=[GREET,TALK,PROB,BILL,MARKET,DRINK,BAR,ISPEZIONE,DIR,CRITIC,GELATERIA,PORTO,PERS_ITEMS].flat().filter(x=>Array.isArray(x)&&Array.isArray(x[4]));
  const ok=t=>!t.includes("{");
  ANSWERS={it:[...new Set(all.filter(x=>x[3]).map(x=>x[2]).filter(ok))],de:[...new Set(all.filter(x=>!x[3]).map(x=>x[2]).filter(ok))],
    tr:Object.assign(Object.fromEntries(all.filter(x=>x[3]).map(x=>[x[2],x[3]])),WRONG_DE)};
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
// Deutsche Übersetzung einer Antwort; Zahlen (Rechnung) werden über {W} eingesetzt.
function deOf(t){
  const tr=answerPools().tr; if(tr[t])return tr[t];
  const n=(t.match(/\d+(?:,\d+)?/)||[])[0], k=n&&t.replace(n,"{W}");
  return k&&tr[k]?tr[k].replace("{W}",n):"";
}
function mcStep(item,task,extra){
  const [it,de,cor,corDe,wr,tip,q]=item;
  return Object.assign({kind:"mc",it,de,task:q||task,tip,corDe,opts:shuffle([{t:cor,ok:true,de:corDe},...mixWrong(cor,wr,!corDe).map(t=>({t,ok:false,de:corDe?deOf(t):""}))]),wrong:0,bad:[],done:false},extra||{});
}
function pickFresh(pool){const fresh=pool.filter(p=>!G.used.has(p[0]));const p=pick(fresh.length?fresh:pool);G.used.add(p[0]);return p;}

// Eigene Zutaten und was man damit backen kann. S.ing = schon einmal gekauft (kennt die Küche),
// S.lager = Portionen im Vorrat. Beim Planen eines Spieltags zählt G.left mit, was noch übrig ist.
const hasIng=k=>S.ing.includes(k);
// Rezepte schalten sich von selbst frei, sobald alle Zutaten in der Küche sind (keine Stufe, kein Geld)
const availPizze=()=>PIZZE.filter(p=>p.ing.every(hasIng));
const myExtras=()=>EXTRAS.filter(hasIng);
const stockOf=k=>S.lager[k]||0;
const leftOf=k=>G&&G.left?G.left[k]||0:stockOf(k);
const canCook=(ings,q)=>[...ings].every(k=>leftOf(k)>=(q||1));
const cookPizze=q=>availPizze().filter(p=>canCook(p.ing,q));
// Portionen für eine Bestellung zurücklegen; verbraucht werden sie am Abend (endDay)
function useStock(ings,q){if(!G||!G.left)return;[...ings].forEach(k=>{G.left[k]-=q;G.use[k]=(G.use[k]||0)+q;});}
// Sterne einer Pizza: einer je drei fehlerfreie Bestellungen, höchstens drei
const pzStars=n=>Math.min(3,Math.floor(((S.pz[n]||{}).ok||0)/3));
const recipe=p=>p.ing.map(k=>`${k} (${ING[k][0]})`).join(", ");

function orderStep(L,force,daily){
  const ops=[["Vorrei","Ich hätte gern"],["Per me","Für mich"],["Allora, prendo","Also, ich nehme"],["Mi porta","Bringen Sie mir"]];
  const [op,opDe]=pick(ops);
  let qty=L===0?1:rnd(1,L===1?2:3), want, it, de, words=[], named=null, senza=null, con=null;
  // Nur was der Vorrat hergibt: zur Not weniger Pizzen, ohne Vorrat gar keine Bestellung (null)
  if(force&&!canCook(force.ing,qty))qty=1;
  if(force&&!canCook(force.ing,qty))force=null;
  while(qty>1&&!cookPizze(qty).length&&!canCook(["pomodoro","mozzarella"],qty))qty--;
  const r=Math.random(), menu=cookPizze(qty), extras=myExtras().filter(k=>leftOf(k)>=qty);
  let base=Math.random()<.2||!canCook(["pomodoro"],qty)?["mozzarella"]:["pomodoro","mozzarella"];
  const canExplicit=extras.filter(k=>!base.includes(k)).length>0&&canCook(base,qty);
  if(!menu.length&&!canExplicit&&!force)return null;
  const explicit=!force&&canExplicit&&(!menu.length||(L===0&&r>.5)||(L===1&&r>.75)||(L===2&&r>.85));
  if(explicit){
    const ok=extras.filter(k=>!base.includes(k)), ex=sample(ok,rnd(1,Math.min(ok.length,L===0?2:3)));
    const all=[...base,...ex]; want=new Set(all); words=all;
    it=`${op} ${QIT[qty]} ${qty>1?"pizze":"pizza"} con ${listIt(all)}, per favore.`;
    de=`${opDe} ${QDE[qty]} ${qty>1?"Pizzen":"Pizza"} mit ${listDe(all.map(k=>ING[k][0]))}, bitte.`;
  }else{
    named=force||pick(menu); want=new Set(named.ing);
    const wantSenza=!force&&(L===1?r>.45:L===2&&(r<.3||(r>=.6&&r<.85))), wantCon=!force&&L===2&&r>=.3&&r<.85;
    const canCon=extras.filter(k=>!named.ing.includes(k));
    if(wantSenza){senza=pick(named.ing.filter(k=>k!=="pomodoro"));want.delete(senza);words.push(senza);}
    if(wantCon&&canCon.length){con=pick(canCon);want.add(con);words.push(con);}
    const nm=qty>1?named.pl:named.n;
    it=`${op} ${QIT[qty]} ${nm}${senza?` senza ${senza}`:""}${con?`${senza?" ma":""} con ${con}`:""}, per favore.`;
    de=`${opDe} ${QDE[qty]} ${cap(named.n)}${senza?` ohne ${ING[senza][0]}`:""}${con?`${senza?", aber":""} mit ${ING[con][0]}`:""}, bitte.`;
  }
  let tip=words.length?`<b>Wörter:</b> ${words.map(w=>`${w} = ${ING[w][0]}`).join(", ")}.`:"";
  if(senza)tip+=` <b>senza</b> = ohne.`; if(con)tip+=` <b>con</b> = mit.`;
  if(named)tip+=` <b>${cap(named.n)}:</b> ${recipe(named)}.`;
  if(L>0)tip+=` Anzahl: una = 1, due = 2, tre = 3.`;
  // Bis zum zweiten Stern steht das Rezept noch dabei, danach nur der Name
  const task=named&&(daily||pzStars(named.n)<2)?`Belege: ${named.ing.join(", ")}`:"Belege die Pizza und servier sie!";
  const each=named?named.p+(con?1:0):5+want.size;
  useStock(want,qty);
  return {kind:"pizza",it,de,task:daily?`Piatto del giorno! ${task}`:task,tip,want,qty,price:each*qty,cur:new Set(),curQty:1,wrong:0,done:false,named:named&&named.n};
}
// Markt-Stand von Signor Esposito am Markttag nach Feierabend: drei große Kisten (20 Portionen) zum Feilschen.
// Zuerst Zutaten, die man noch nie hatte (bis zur eigenen Stufe), dann was im Vorrat am knappsten ist.
const ESPO_KISTE=2*KISTE;
const espoPrice=k=>2*ING[k][3];
function stallStep(){
  const neu=Object.keys(ING).filter(k=>!hasIng(k)&&ING[k][2]<=S.level).sort((a,b)=>ING[a][2]-ING[b][2]||ING[a][3]-ING[b][3]);
  const low=S.ing.filter(k=>ING[k]&&PIZZE.some(p=>p.ing.includes(k)&&p.ing.every(hasIng))).sort((a,b)=>stockOf(a)-stockOf(b));
  const offer=[...neu,...low].slice(0,3);
  if(!offer.length)return null;
  return {kind:"stall",it:"Oggi ho prodotti freschissimi! Cosa prende?",de:"Heute habe ich ganz frische Ware! Was nehmen Sie?",task:`Große Kisten (${ESPO_KISTE} Portionen): Tippe auf den Preis und feilsche!`,offer,bought:[],neu:[],wrong:0,bad:[],done:true,fb:["good","Fertig mit Einkaufen?"]};
}
const pizzeWith=k=>PIZZE.filter(p=>p.ing.includes(k)&&p.ing.every(x=>x===k||hasIng(x)));
// Kaffee bestellen: Zutaten in der richtigen Reihenfolge und die passende Tasse
const myCaffe=()=>CAFFE.filter(c=>c.t<=tierOf("caffe"));
function coffeeStep(){
  const c=pick(myCaffe()), [op,opDe]=pick([["E per finire, un","Und zum Schluss einen"],["Mi fa un","Machen Sie mir einen"],["Prendo anche un","Ich nehme auch einen"],["Per me un","Für mich einen"]]);
  const it=`${op} ${c.n}, per favore.`, de=`${opDe} ${c.de}, bitte.`;
  const rec=`${c.ing.join(" → ")}, in die ${c.cup}`;
  const tip=`<b>${c.n}:</b> ${c.ing.map(k=>`${k} (${COF_ING[k][0]})`).join(" → ")}. Tasse: <b>${c.cup}</b> (${CUPS[c.cup]}). Die Reihenfolge zählt!`;
  return {kind:"coffee",it,de,task:pzStars(c.n)<2?`Bereite zu: ${rec}`:"Bereite den Kaffee zu und servier ihn!",tip,want:c.ing,cup:c.cup,cur:[],curCup:null,wrong:0,done:false,named:c.n,price:c.p};
}
function phoneStep(){
  let q=rnd(1,4); while(q>1&&!cookPizze(q).length)q--;
  const can=cookPizze(q); if(!can.length)return null;
  const p=pick(can), t=pick(TIMES), st=pick(STREETS), n=pick(NUMS); useStock(p.ing,q);
  const pz=q===1?`una ${p.n}`:`${QIT[q]} ${p.pl}`;
  const it=`Pronto, pizzeria? Vorrei ordinare ${pz} per le ${t[0]}. L'indirizzo è ${st}, numero ${n[0]}.`;
  const de=`Hallo, Pizzeria? Ich möchte ${QDE[q]} ${cap(p.n)} für ${t[1]} Uhr bestellen. Die Adresse ist ${st} Nummer ${n[1]}.`;
  const kind=pick(["qty","time","num","pizza"]); let task,opts,tip;
  if(kind==="qty"){task="Wie viele Pizzen will er?";opts=[1,2,3,4].map(x=>({t:String(x),ok:x===q}));tip="Die Anzahl kommt direkt nach „ordinare“. una = 1, due = 2, tre = 3, quattro = 4.";}
  if(kind==="time"){task="Für wann ist die Bestellung?";opts=shuffle([t,...sample(TIMES.filter(x=>x!==t),3)]).map(x=>({t:x[1]+" Uhr",ok:x===t}));tip="Die Uhrzeit kommt nach „per le“. sette = 7, otto = 8, nove = 9, e mezza = halb, e un quarto = Viertel nach.";}
  if(kind==="num"){task="Welche Hausnummer?";opts=shuffle([n,...sample(NUMS.filter(x=>x!==n),3)]).map(x=>({t:"Nr. "+x[1],ok:x===n}));tip="Die Hausnummer kommt nach „numero“. due = 2, dieci = 10, dodici = 12, venti = 20, trenta = 30.";}
  if(kind==="pizza"){task="Welche Pizza will er?";opts=shuffle([p,...sample(PIZZE.filter(x=>x!==p),3)]).map(x=>({t:cap(x.n),ok:x===p}));tip="Hör auf das Wort nach der Anzahl. Plural: margherite, diavole, capricciose, ortolane.";}
  return {kind:"mc",phone:true,it,de,task,tip,opts,wrong:0,bad:[],done:false,showText:!canSpeak,price:p.p*q};
}
function reservStep(){
  const n=rnd(2,8), d=pick(DAYS), t=pick(TIMES), nm=pick(SURNAMES);
  const NW=["","","due","tre","quattro","cinque","sei","sette","otto"];
  const it=`Buonasera, vorrei prenotare un tavolo per ${NW[n]} persone, ${d[0]} sera alle ${t[0]}. A nome ${nm}.`;
  const de=`Guten Abend, ich möchte einen Tisch für ${n} Personen reservieren, ${d[1]}abend um ${t[1]} Uhr. Auf den Namen ${nm}.`;
  const kind=pick(fx("agenda")?["pers","day","time"]:["pers","day","time","name"]); let task,opts,tip; // Reservierungsbuch: Name steht schon da
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
