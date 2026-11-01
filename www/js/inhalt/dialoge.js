/* Alle Inhalte: Zutaten, Speisekarte, Gäste-Sätze, Stufen, Shop, Bewertungen.
   Neue Sätze hier eintragen (Muster siehe Kommentar über GREET). */
/* ---------- Content ---------- */
// Zutaten: [Deutsch, Farbe, Stufe (-1 = von Anfang an in der Küche), Preis einer Kiste am Markt (10 Portionen)]
// Jede Pizza verbraucht eine Portion von jeder ihrer Zutaten. Gekauft wird auf dem Markt (Il Mercato, mercato.js).
const ING={
  pomodoro:["Tomate","#d8402b",-1,7],mozzarella:["Mozzarella","#f6f0e2",-1,10],basilico:["Basilikum","#3f9a45",-1,4],
  aglio:["Knoblauch","#efe6d2",-1,4],origano:["Oregano","#6f8a3a",-1,4],olio:["Olivenöl","#d6b532",-1,6],
  salame:["Salami","#a3262a",0,13],
  prosciutto:["Kochschinken","#e79a9a",1,14],funghi:["Pilze","#b08d6a",1,10],carciofi:["Artischocken","#8aa357",1,13],
  olive:["Oliven","#2a2a2a",1,10],tonno:["Thunfisch","#c8a17f",1,14],cipolla:["Zwiebeln","#cfa6dc",1,6],
  acciughe:["Sardellen","#8f8a86",2,14],capperi:["Kapern","#7d8f4a",2,10],peperoni:["Paprika","#f2b134",2,8],
  zucchine:["Zucchini","#5d9a3f",2,8],melanzane:["Auberginen","#5b2f63",2,10],gorgonzola:["Gorgonzola","#e3e0c6",2,15],
  parmigiano:["Parmesan","#f1d98a",2,17],fontina:["Fontina","#f4e0a0",2,14],
  scamorza:["Scamorza","#e9b56a",2,13],pecorino:["Pecorino","#efe4bf",3,17],
  crudo:["Rohschinken","#c75a5a",3,20],rucola:["Rucola","#4f8a2a",3,7],salsiccia:["Bratwurst","#9c5a3a",3,15],
  friarielli:["Stielmus","#2f6b2a",3,11],ricotta:["Ricotta","#fbf8f0",3,13],provola:["Provola","#d9a55a",3,14],
  cozze:["Miesmuscheln","#2c2f3a",4,18],gamberi:["Garnelen","#f08a5a",4,22],prezzemolo:["Petersilie","#3a8a3a",4,4],
  bufala:["Büffelmozzarella","#fffdf6",4,21],
  // Stufe 9: gibt es nicht am Markt, nur bei Franco und seiner Ape (franco.js)
  patate:["Kartoffeln","#e3c27a",9,6],melone:["Melone","#f2a65a",9,9]
};
const KISTE=10; // Portionen pro Kiste
// Die Stände auf dem Markt: jede Zutat gibt es an genau einem Stand. say = Begrüßung [Italienisch, Deutsch]
const BANCHE=[
  {id:"verdura",it:"Frutta e verdura",ic:"🍅",who:"Signora Carmela",say:["Buongiorno! Pomodori freschi, appena raccolti!","Guten Tag! Frische Tomaten, gerade geerntet!"],
    ing:["pomodoro","basilico","aglio","cipolla","peperoni","zucchine","melanzane","funghi","carciofi","rucola","friarielli","prezzemolo"]},
  {id:"latticini",it:"Latticini",ic:"🧀",who:"Signora Lucia",say:["La mozzarella è di stamattina. Cosa Le do?","Der Mozzarella ist von heute Morgen. Was darf ich Ihnen geben?"],
    ing:["mozzarella","bufala","ricotta","gorgonzola","parmigiano","fontina","scamorza","pecorino","provola"]},
  {id:"salumi",it:"Salumeria",ic:"🥓",who:"Signor Peppe",say:["Salame, prosciutto, salsiccia: tutto buonissimo!","Salami, Schinken, Bratwurst: alles sehr lecker!"],
    ing:["salame","prosciutto","crudo","salsiccia"]},
  {id:"pesce",it:"Pescheria",ic:"🐟",who:"Zio Totò",say:["Pesce fresco del golfo! Guardi che gamberi!","Frischer Fisch aus dem Golf! Schauen Sie, was für Garnelen!"],
    ing:["tonno","acciughe","cozze","gamberi"]},
  {id:"alimentari",it:"Alimentari Esposito",ic:"🫒",who:"Signor Esposito",say:["Olio buono e olive di Gaeta. Prego!","Gutes Öl und Oliven aus Gaeta. Bitte sehr!"],
    ing:["olio","origano","olive","capperi"]}
];
const START_ING=Object.keys(ING).filter(k=>ING[k][2]<0);
// Ein neues Spiel startet mit einer Kiste von jeder Start-Zutat im Vorrat
const START_LAGER=Object.fromEntries(START_ING.map(k=>[k,KISTE]));
// Die zwölf Zutaten der alten Versionen: alte Spielstände behalten sie
const OLD_ING=["pomodoro","mozzarella","basilico","funghi","prosciutto","salame","olive","cipolla","peperoni","tonno","carciofi","rucola"];
const EXTRAS=Object.keys(ING).filter(k=>k!=="pomodoro"&&k!=="mozzarella");
// Alle Pizzen mit echtem Namen. lv = Stufe, ab der Gäste sie bestellen. Freigeschaltet ist eine Pizza,
// sobald man alle ihre Zutaten schon einmal gekauft hat; bestellt wird sie nur, wenn genug im Vorrat ist.
const PIZZE=[
  {n:"marinara",p:5,pl:"marinare",lv:0,ing:["pomodoro","aglio","origano","olio"]},
  {n:"margherita",p:6,pl:"margherite",lv:0,ing:["pomodoro","mozzarella","basilico","olio"]},
  {n:"bianca",p:6,pl:"bianche",lv:0,ing:["mozzarella","aglio","olio"]},
  {n:"diavola",p:8,pl:"diavole",lv:0,ing:["pomodoro","mozzarella","salame"]},
  {n:"prosciutto e funghi",p:9,pl:"prosciutto e funghi",lv:1,ing:["pomodoro","mozzarella","prosciutto","funghi"]},
  {n:"capricciosa",p:10,pl:"capricciose",lv:1,ing:["pomodoro","mozzarella","prosciutto","funghi","carciofi","olive"]},
  {n:"tonno e cipolla",p:8,pl:"tonno e cipolla",lv:1,ing:["pomodoro","mozzarella","tonno","cipolla"]},
  {n:"napoletana",p:8,pl:"napoletane",lv:2,ing:["pomodoro","mozzarella","acciughe","capperi","origano"]},
  {n:"ortolana",p:9,pl:"ortolane",lv:2,ing:["pomodoro","mozzarella","peperoni","zucchine","melanzane"]},
  {n:"quattro formaggi",p:10,pl:"quattro formaggi",lv:2,ing:["mozzarella","gorgonzola","parmigiano","fontina"]},
  {n:"zucchine e scamorza",p:9,pl:"zucchine e scamorza",lv:2,ing:["mozzarella","zucchine","scamorza"]},
  {n:"crudo e rucola",p:11,pl:"crudo e rucola",lv:3,ing:["pomodoro","mozzarella","crudo","rucola","parmigiano"]},
  {n:"salsiccia e friarielli",p:10,pl:"salsiccia e friarielli",lv:3,ing:["mozzarella","salsiccia","friarielli"]},
  {n:"cinque formaggi",p:12,pl:"cinque formaggi",lv:3,ing:["mozzarella","gorgonzola","parmigiano","fontina","pecorino"]},
  {n:"salsiccia e provola",p:11,pl:"salsiccia e provola",lv:3,ing:["pomodoro","provola","salsiccia","basilico"]},
  {n:"calzone",p:10,pl:"calzoni",lv:3,ing:["pomodoro","mozzarella","ricotta","salame"]},
  {n:"frutti di mare",p:12,pl:"frutti di mare",lv:4,ing:["pomodoro","aglio","cozze","gamberi","prezzemolo"]},
  {n:"bufalina",p:11,pl:"bufaline",lv:4,ing:["pomodoro","bufala","basilico"]}
];
const MENU=PIZZE; // alter Name, wird noch an einigen Stellen benutzt
const cap=s=>s.replace(/\b\w/g,c=>c.toUpperCase()).replace(/ (E|Di) /g,m=>m.toLowerCase());
const QIT=["","una","due","tre","quattro"], QDE=["","eine","zwei","drei","vier"];
function numIt(n){
  const u=["zero","uno","due","tre","quattro","cinque","sei","sette","otto","nove","dieci","undici","dodici","tredici","quattordici","quindici","sedici","diciassette","diciotto","diciannove"];
  const t=["","","venti","trenta","quaranta","cinquanta","sessanta","settanta","ottanta","novanta"];
  if(n<20)return u[n];
  if(n<100){const d=Math.floor(n/10),r=n%10;let w=t[d];if(r===1||r===8)w=w.slice(0,-1);return w+(r===0?"":r===3?"tré":u[r]);}
  if(n<200){const r=n-100;return r===0?"cento":(r===1||r===8||(r>=80&&r<90)?"cent":"cento")+numIt(r);}
  return u[Math.floor(n/100)]+"cento"+(n%100?numIt(n%100):"");
}

// [Italienisch, Deutsch, richtige Antwort, Antwort auf Deutsch, [falsche], Tipp, (Frage)]
const GREET=[
 ["Buonasera!","Guten Abend!","Buonasera! Prego, si accomodi.","Guten Abend! Bitte, nehmen Sie Platz.",["Buonanotte e arrivederci!","Il conto, per favore.","Sono le otto."],"Der Gast begrüßt dich am Abend. Grüß zurück und biete einen Platz an."],
 ["Buongiorno! Siete aperti?","Guten Tag! Haben Sie geöffnet?","Sì, siamo aperti! Prego.","Ja, wir haben geöffnet! Bitte sehr.",["Sì, sono di Napoli.","Due pizze, grazie.","No, non mi piace."],"aperto = geöffnet. Er will wissen, ob offen ist."],
 ["Ciao! Un tavolo per due, per favore.","Hallo! Einen Tisch für zwei, bitte.","Certo, da questa parte.","Natürlich, hier entlang.",["Sono due euro.","Ho due anni.","No, grazie, non ho fame."],"tavolo = Tisch. per due = für zwei Personen."],
 ["Salve! C'è posto per quattro?","Hallo! Gibt es Platz für vier?","Sì, c'è un tavolo libero vicino alla finestra.","Ja, es gibt einen freien Tisch am Fenster.",["Sono le quattro.","Quattro formaggi, subito!","Non parlo italiano."],"posto = Platz. Er fragt nach Platz für 4 Leute."],
 ["Buonasera, avete il menù in tedesco?","Guten Abend, haben Sie die Karte auf Deutsch?","Sì, eccolo!","Ja, hier ist sie!",["No, sono italiano.","Il tedesco è buono.","Sì, la pizza è calda."],"tedesco = deutsch. Er möchte die Speisekarte auf Deutsch."],
 ["Che profumo! Posso entrare?","Was für ein Duft! Darf ich reinkommen?","Certo, benvenuto!","Natürlich, willkommen!",["No, il profumo costa caro.","Sì, esco subito.","Mi chiamo Pizza."],"entrare = hereinkommen. profumo = Duft."],
 ["Buongiorno! Ho fame!","Guten Tag! Ich habe Hunger!","Allora è nel posto giusto!","Dann sind Sie hier genau richtig!",["Mi dispiace, sono stanco.","Fame? Che freddo!","Il bagno è a destra."],"fame = Hunger. Der Gast hat Hunger."],
 ["Buonasera! Siamo in cinque, avete un tavolo?","Guten Abend! Wir sind zu fünft, haben Sie einen Tisch?","Sì, prego, vi preparo il tavolo grande.","Ja, bitte, ich mache Ihnen den großen Tisch fertig.",["Sì, sono le cinque.","Cinque pizze margherita?","No, il tavolo è in cucina."],"siamo in cinque = wir sind zu fünft. tavolo = Tisch."],
 ["Ciao! Posso entrare con il mio cane?","Hallo! Darf ich mit meinem Hund reinkommen?","Certo, i cani sono i benvenuti!","Natürlich, Hunde sind willkommen!",["Il cane non mangia la pizza.","Sì, porto il conto.","Mi chiamo Cane."],"cane = Hund. entrare = hereinkommen."]
];
const TALK=[
 ["Che bella giornata oggi!","Was für ein schöner Tag heute!","Sì, c'è il sole!","Ja, die Sonne scheint!",["Sì, piove molto.","No, è notte.","Il conto è qui."],"giornata = Tag. Er findet das Wetter schön. Stimm zu!"],
 ["Sono di Milano, sono qui in vacanza.","Ich bin aus Mailand und hier im Urlaub.","Che bello! Benvenuto a Napoli.","Wie schön! Willkommen in Neapel.",["Mi dispiace, è chiuso.","Milano è una pizza.","Sono le dieci."],"vacanza = Urlaub. Er kommt aus Mailand."],
 ["Lei parla italiano molto bene!","Sie sprechen sehr gut Italienisch!","Grazie, sto imparando!","Danke, ich lerne gerade!",["No, non parlo.","Il conto è sul tavolo.","Sì, ho dodici anni."],"Ein Kompliment für dein Italienisch! imparare = lernen."],
 ["Lei è di qui?","Sind Sie von hier?","No, vengo dalla Germania.","Nein, ich komme aus Deutschland.",["Sì, qui c'è il bagno.","No, è di là.","Sono qui da due pizze."],"di qui = von hier. Er fragt, woher du kommst."],
 ["Questa pizza è buonissima!","Diese Pizza ist super lecker!","Grazie mille, è la ricetta di mia nonna.","Vielen Dank, das ist das Rezept meiner Oma.",["Mi scusi, è fredda.","Sì, è chiusa.","Prego, si accomodi."],"buonissima = sehr lecker. Bedank dich!"],
 ["Come si chiama Lei?","Wie heißen Sie?","Mi chiamo Luca, piacere!","Ich heiße Luca, freut mich!",["Si chiama margherita.","Chiamo un taxi.","Sto bene, grazie."],"chiamarsi = heißen. Er fragt nach deinem Namen."],
 ["Come sta oggi?","Wie geht es Ihnen heute?","Bene, grazie! E Lei?","Gut, danke! Und Ihnen?",["Sto in via Roma.","Oggi è lunedì.","Sono tre euro."],"Come sta? = Wie geht es Ihnen?"],
 ["Domani vado al mare. Cosa mi consiglia?","Morgen fahre ich ans Meer. Was empfehlen Sie?","Vada a Sorrento, è bellissima!","Fahren Sie nach Sorrent, es ist wunderschön!",["Domani è chiuso.","Consiglio il conto.","Il mare è in cucina."],"consigliare = empfehlen. mare = Meer."],
 ["Che bella musica! Chi canta?","Was für schöne Musik! Wer singt?","È una vecchia canzone napoletana.","Das ist ein altes neapolitanisches Lied.",["Canto la pizza.","La musica è fredda.","Sono le nove e mezza."],"canzone = Lied, cantare = singen."],
 ["È la prima volta che vengo qui.","Ich bin zum ersten Mal hier.","Benvenuto! Spero che torni presto.","Willkommen! Ich hoffe, Sie kommen bald wieder.",["La prima pizza è nel forno.","Sì, vengo anch'io.","No, è l'ultima volta."],"la prima volta = das erste Mal. tornare = zurückkommen."]
];
const PROB=[
 ["Scusi, dov'è il bagno?","Entschuldigung, wo ist die Toilette?","In fondo a destra.","Hinten rechts.",["Il bagno è buonissimo.","Sono le nove.","Con la carta, grazie."],"bagno = Toilette. Er fragt, wo sie ist."],
 ["La pizza è fredda!","Die Pizza ist kalt!","Mi scusi, gliene porto un'altra calda.","Entschuldigung, ich bringe Ihnen eine heiße.",["Grazie, molto gentile!","Sì, il ghiaccio è gratis.","Buon appetito!"],"freddo = kalt. Entschuldige dich!"],
 ["Fa troppo caldo qui dentro.","Es ist zu warm hier drin.","Apro subito la finestra.","Ich mache sofort das Fenster auf.",["Le porto una coperta.","Sì, la pizza è calda.","Chiudo la porta."],"Achtung: caldo = warm/heiß, nicht kalt!"],
 ["Scusi, c'è un errore nel conto.","Entschuldigung, die Rechnung hat einen Fehler.","Mi dispiace, controllo subito.","Tut mir leid, ich prüfe das sofort.",["Il conto è perfetto, ciao.","Errore? Che bello!","Due euro in più, grazie."],"errore = Fehler. Prüfe die Rechnung."],
 ["Avete il wifi?","Haben Sie WLAN?","Sì, la password è sul menù.","Ja, das Passwort steht auf der Karte.",["No, siamo chiusi.","Il wifi è piccante.","Sì, con funghi."],"Er fragt nach dem WLAN."],
 ["Dove posso parcheggiare la macchina?","Wo kann ich das Auto parken?","C'è un parcheggio dietro l'angolo.","Um die Ecke gibt es einen Parkplatz.",["La macchina è nel forno.","Parcheggio la pizza.","Sì, è aperta."],"macchina = Auto. parcheggiare = parken."],
 ["Sono allergico alle noci. È un problema?","Ich bin allergisch gegen Nüsse. Ist das ein Problem?","No, nelle nostre pizze non ci sono noci.","Nein, in unseren Pizzen sind keine Nüsse.",["Sì, metto più noci.","Allergico? Che bello.","Le noci costano due euro."],"noci = Nüsse. allergico = allergisch."],
 ["Possiamo sederci fuori?","Können wir draußen sitzen?","Sì, c'è un tavolo in terrazza.","Ja, auf der Terrasse ist ein Tisch frei.",["No, il forno è fuori.","Fuori piove pizza.","Sì, il bagno è fuori."],"fuori = draußen. sedersi = sich setzen."],
 ["Scusi, manca una forchetta.","Entschuldigung, es fehlt eine Gabel.","Gliela porto subito.","Ich bringe sie Ihnen sofort.",["La forchetta è buonissima.","Manca il sole oggi.","Sì, mangi con le mani."],"forchetta = Gabel. mancare = fehlen."],
 ["Il bambino ha bisogno di un seggiolone.","Das Kind braucht einen Hochstuhl.","Certo, lo prendo subito.","Natürlich, ich hole ihn sofort.",["Il bambino è molto alto.","Il seggiolone è nel forno.","Sì, è un bambino."],"seggiolone = Hochstuhl. avere bisogno di = brauchen."]
];
const BILL=[
 ["Il conto, per favore.","Die Rechnung, bitte.","Subito! Sono {N} euro.","Sofort! Das macht {D} Euro.",["Il conto è buonissimo.","Subito! Sono {W} euro.","Buongiorno, si accomodi."],"conto = Rechnung. Nenn ihm den richtigen Preis! Er hat {D} € verbraucht."],
 ["Quanto pago?","Wie viel zahle ich?","Sono {N} euro, grazie.","Das macht {D} Euro, danke.",["Paga il pane.","Sono {W} euro, grazie.","Sono di Napoli."],"quanto = wie viel. pagare = bezahlen. Seine Bestellung kostet {D} €."],
 ["Posso pagare con la carta?","Kann ich mit Karte zahlen?","Sì, certo!","Ja, natürlich!",["Pago io, grazie.","La pizza è di carta.","No, è un tavolo."],"carta = Karte. Er möchte mit Karte zahlen."],
 ["Grazie mille, arrivederci!","Vielen Dank, auf Wiedersehen!","Grazie a Lei, a presto!","Ich danke Ihnen, bis bald!",["Buongiorno, si accomodi.","Il bagno è a destra.","Vorrei un caffè."],"Der Gast verabschiedet sich. Verabschiede dich auch."],
 ["Era tutto perfetto! Le lascio la mancia.","Alles war perfekt! Ich lasse Ihnen Trinkgeld da.","Grazie mille, molto gentile!","Vielen Dank, sehr nett!",["Non mi piace la mancia.","Mancia una pizza?","Mi dispiace molto."],"mancia = Trinkgeld."],
 ["Un caffè e il conto, per favore.","Einen Kaffee und die Rechnung, bitte.","Certo, arriva subito!","Natürlich, kommt sofort!",["Il caffè è nel conto?","Sono le tre.","No, siamo al mare."],"Er möchte noch einen Kaffee und dann zahlen."],
 ["Mi porta il conto, per cortesia?","Bringen Sie mir bitte die Rechnung?","Ecco il conto: {N} euro.","Hier ist die Rechnung: {D} Euro.",["Ecco il conto: {W} euro.","Il conto è molto cortese.","Porto una pizza in più."],"per cortesia = bitte (höflich). Er hat {D} € verbraucht."],
 ["Posso pagare in contanti?","Kann ich bar bezahlen?","Certo, in contanti va benissimo.","Natürlich, bar ist bestens.",["No, solo con la pizza.","In contanti? Sono le dieci.","Conto i tavoli."],"in contanti = bar."]
];
const MARKET=[
 ["I pomodori costano tre euro al chilo.","Die Tomaten kosten drei Euro das Kilo.","3 €","",["13 €","30 €","2 €"],"tre = 3, tredici = 13, trenta = 30","Wie viel kostet ein Kilo Tomaten?"],
 ["La mozzarella fresca fa quindici euro.","Der frische Mozzarella kostet fünfzehn Euro.","15 €","",["5 €","50 €","14 €"],"quindici = 15, quattordici = 14, cinque = 5","Wie viel kostet der Mozzarella?"],
 ["Per tutto fanno venti euro.","Für alles macht das zwanzig Euro.","È un po' caro… facciamo quindici?","Das ist etwas teuer … sagen wir fünfzehn?",["Venti? Ne prendo il doppio!","Non ho fame, grazie.","Il conto, per favore."],"caro = teuer. Handeln = einen kleineren Preis vorschlagen.","Handle den Preis runter!"],
 ["Quanti chili di farina vuole?","Wie viele Kilo Mehl möchten Sie?","Cinque chili, per favore.","Fünf Kilo, bitte.",["Cinque euro di resto.","La farina è bianca.","Sono le cinque."],"farina = Mehl. Er fragt nach der Menge."],
 ["Il basilico è fresco di oggi!","Das Basilikum ist heute frisch!","Das Basilikum ist ganz frisch von heute","",["Das Basilikum ist heute teuer","Heute gibt es kein Basilikum","Das Basilikum ist von gestern"],"fresco = frisch, oggi = heute","Was sagt der Händler?"],
 ["Vuole anche le olive? Oggi sono in offerta.","Möchten Sie auch Oliven? Heute sind sie im Angebot.","Sì, grazie, ne prendo un chilo.","Ja, danke, ich nehme ein Kilo.",["No, le olive sono in vacanza.","Oggi è chiuso.","Sono allergico al mercato."],"in offerta = im Angebot."],
 ["Sono dodici euro e cinquanta.","Das macht zwölf Euro fünfzig.","12,50 €","",["2,50 €","20,50 €","12,15 €"],"dodici = 12, cinquanta = 50, quindici = 15","Wie viel musst du zahlen?"],
 ["Ecco il resto: tre euro.","Hier ist Ihr Wechselgeld: drei Euro.","Grazie, buona giornata!","Danke, schönen Tag noch!",["Tre pizze, subito!","Resto qui a dormire.","Il resto è freddo."],"il resto = das Wechselgeld."],
 ["Le melanzane oggi costano due euro al chilo.","Die Auberginen kosten heute zwei Euro das Kilo.","2 €","",["12 €","20 €","3 €"],"due = 2, dodici = 12, venti = 20","Wie viel kostet ein Kilo Auberginen?"],
 ["Vuole un sacchetto?","Möchten Sie eine Tüte?","No, grazie, ho la mia borsa.","Nein, danke, ich habe meine Tasche.",["Sì, un sacchetto di vino.","No, sono di Roma.","Il sacchetto è fresco di oggi."],"sacchetto = Tüte, borsa = Tasche."]
];
const TIMES=[["sette","19:00"],["sette e mezza","19:30"],["otto","20:00"],["otto e mezza","20:30"],["nove","21:00"],["nove e un quarto","21:15"]];
const NUMS=[["due",2],["tre",3],["sei",6],["dieci",10],["dodici",12],["tredici",13],["sedici",16],["venti",20],["ventitré",23],["trenta",30]];
const STREETS=["via Toledo","via Roma","piazza Garibaldi","via dei Tribunali","corso Umberto"];
const NAMES=["Signora Rossi","Signor Bianchi","Giulia","Marco","Nonna Pina","Dottor Ferri","Sofia","Zio Gennaro","Chiara","Turista Klaus","Professoressa Conte","Matteo"];

const DRINK=[
 ["Vorrei un bicchiere di vino rosso.","Ich hätte gern ein Glas Rotwein.","Un vino rosso, arriva subito!","Ein Rotwein, kommt sofort!",["Un vino bianco, arriva subito!","Una birra rossa, subito!","Un'acqua rossa? Certo!"],"rosso = rot, bianco = weiß, bicchiere = Glas."],
 ["Una birra alla spina, per favore.","Ein Bier vom Fass, bitte.","Certo, una birra alla spina.","Natürlich, ein Bier vom Fass.",["Certo, una spina di pesce.","Certo, una pizza alla birra.","Ecco il conto della birra."],"birra = Bier. alla spina = vom Fass."],
 ["Un'acqua naturale, senza ghiaccio.","Ein stilles Wasser, ohne Eis.","Ecco, acqua naturale senza ghiaccio.","Bitte, stilles Wasser ohne Eis.",["Ecco, acqua frizzante con ghiaccio.","Ecco, tanto ghiaccio!","Ecco, un tè freddo."],"naturale = still, frizzante = mit Kohlensäure, ghiaccio = Eis."],
 ["Cosa avete come dolce?","Was haben Sie als Nachtisch?","Abbiamo tiramisù e panna cotta.","Wir haben Tiramisu und Panna cotta.",["Abbiamo pane e sale.","Il dolce è il conto.","Dolce? Sì, sono le dieci."],"dolce = Nachtisch (auch: süß)."],
 ["Un caffè macchiato, per favore.","Einen Espresso mit etwas Milchschaum, bitte.","Un macchiato, subito!","Ein Macchiato, sofort!",["Un caffè con la pizza?","Il caffè è macchiato di pomodoro.","Un cappuccino gigante con panna!"],"macchiato = Espresso mit etwas Milchschaum."],
 ["Il tiramisù è fatto in casa?","Ist das Tiramisu hausgemacht?","Sì, lo fa mia nonna ogni mattina.","Ja, meine Oma macht es jeden Morgen.",["No, la casa è chiusa.","Sì, la casa è in via Roma.","Fatto? Non ancora, domani."],"fatto in casa = hausgemacht."],
 ["Un limoncello per finire!","Zum Abschluss einen Limoncello!","Ottima scelta, offre la casa!","Gute Wahl, geht aufs Haus!",["Finito, arrivederci.","Il limone è finito.","Per finire il conto, sì."],"per finire = zum Abschluss. offre la casa = geht aufs Haus."],
 ["Avete una spremuta d'arancia?","Haben Sie einen frisch gepressten Orangensaft?","Sì, spremuta fresca, arriva!","Ja, frisch gepresst, kommt!",["Sì, una pizza all'arancia.","No, l'arancia è blu.","Sì, un succo di pomodoro caldo."],"spremuta = frisch gepresster Saft, arancia = Orange."],
 ["Una caraffa di vino bianco per il tavolo.","Eine Karaffe Weißwein für den Tisch.","Ecco la caraffa di bianco della casa.","Hier ist die Karaffe Hausweißwein.",["Ecco la caraffa di rosso.","Una caraffa d'acqua calda?","Il tavolo è bianco, sì."],"caraffa = Karaffe, bianco = weiß, rosso = rot."]
];
const DRINK_PRICE=[5,4,2,5,2,5,0,3,8]; // gleiche Reihenfolge wie DRINK
// Kaffee wie in einer echten italienischen Bar. COF_ING: [Deutsch, Farbe]. Bei Kaffee zählt die Reihenfolge.
const COF_ING={"caffè":["Espresso","#4a2c1a"],"acqua calda":["heißes Wasser","#9fc6d8"],"latte caldo":["heiße Milch","#f2e9d8"],
  "schiuma":["Milchschaum","#fffaf0"],"cacao":["Kakao","#7a4a2a"],"zucchero":["Zucker","#e9e4da"],"ghiaccio":["Eis (Würfel)","#cfeaf5"],
  "grappa":["Grappa","#efe2a0"],"gelato":["Speiseeis","#f6e3b4"]};
const CUPS={tazzina:"Espressotasse",tazza:"Tasse","tazza grande":"große Tasse",bicchiere:"Glas",bicchierino:"kleines Glas",coppa:"Kelchglas",coppetta:"Schälchen"};
// t = Kaffeemaschinen-Stufe: 1 Moka, 2 Espressomaschine, 3 Siebträger
const CAFFE=[
  {n:"caffè",de:"Espresso",ing:["caffè"],cup:"tazzina",t:1,p:2},
  {n:"caffè lungo",de:"Espresso mit mehr Wasser",ing:["caffè","acqua calda"],cup:"tazzina",t:1,p:2},
  {n:"caffè americano",de:"Americano",ing:["caffè","acqua calda"],cup:"tazza",t:2,p:3},
  {n:"caffè macchiato",de:"Espresso mit etwas Milchschaum",ing:["caffè","schiuma"],cup:"tazzina",t:2,p:2},
  {n:"cappuccino",de:"Cappuccino",ing:["caffè","latte caldo","schiuma"],cup:"tazza",t:2,p:3},
  {n:"caffè latte",de:"Milchkaffee",ing:["latte caldo","caffè"],cup:"tazza grande",t:2,p:3},
  {n:"latte macchiato",de:"Latte macchiato",ing:["latte caldo","schiuma","caffè"],cup:"bicchiere",t:3,p:4},
  {n:"marocchino",de:"Marocchino",ing:["cacao","caffè","schiuma"],cup:"bicchierino",t:3,p:3},
  {n:"caffè corretto",de:"Espresso mit Grappa",ing:["caffè","grappa"],cup:"tazzina",t:3,p:4},
  {n:"caffè shakerato",de:"Geschüttelter Eiskaffee",ing:["caffè","zucchero","ghiaccio"],cup:"coppa",t:3,p:4},
  {n:"affogato",de:"Vanilleeis mit Espresso",ing:["gelato","caffè"],cup:"coppetta",t:3,p:4}
];
// Gespräche an der Bar (ab Espressomaschine)
const BAR=[
  ["Un cappuccino e un cornetto, per favore.","Einen Cappuccino und ein Hörnchen, bitte.","Subito! Il cornetto vuoto o alla crema?","Sofort! Das Hörnchen ohne Füllung oder mit Creme?",["Subito! Il cornetto con il tonno?","Il cappuccino è finito, mi dispiace.","Certo, una pizza cornetto."],"cornetto = Hörnchen, vuoto = leer (ohne Füllung), alla crema = mit Creme."],
  ["Un caffè macchiato, ma con latte freddo.","Einen Macchiato, aber mit kalter Milch.","Certo, macchiato freddo.","Natürlich, Macchiato kalt.",["Certo, latte caldo caldo.","Il caffè è freddo, mi dispiace.","Certo, un tè freddo."],"freddo = kalt, caldo = heiß."],
  ["Avete latte senza lattosio?","Haben Sie laktosefreie Milch?","Sì, abbiamo anche latte di soia.","Ja, wir haben auch Sojamilch.",["Sì, abbiamo tanto zucchero.","No, il latte è nel caffè.","Sì, la pizza è senza pomodoro."],"senza lattosio = laktosefrei, soia = Soja."],
  ["Un decaffeinato, per favore. Non dormo la notte!","Einen Entkoffeinierten, bitte. Ich schlafe nachts nicht!","Un deca, arriva!","Ein Entkoffeinierter, kommt!",["Un doppio caffè, arriva!","Buonanotte, signore!","Un caffè corretto, arriva!"],"decaffeinato (kurz deca) = entkoffeiniert."],
  ["Un'acqua frizzante con ghiaccio e limone.","Ein Sprudelwasser mit Eis und Zitrone.","Ecco a lei, con ghiaccio e limone.","Bitte sehr, mit Eis und Zitrone.",["Ecco a lei, acqua naturale calda.","Ecco, un gelato al limone.","Ecco, senza ghiaccio e senza limone."],"frizzante = mit Kohlensäure, ghiaccio = Eis(würfel), limone = Zitrone."],
  ["Che vino mi consiglia con la pizza?","Welchen Wein empfehlen Sie mir zur Pizza?","Il rosso della casa è ottimo.","Der Hausrotwein ist ausgezeichnet.",["La pizza della casa è chiusa.","Il vino è nel forno.","Consiglio un cappuccino."],"mi consiglia = empfehlen Sie mir, della casa = vom Haus, ottimo = ausgezeichnet."],
  ["Vorrei una birra.","Ich hätte gern ein Bier.","Piccola o media?","Klein oder mittel?",["Rossa o bianca? Di pizza?","Birra? Sono le otto di mattina!","La birra è finita ieri, domani."],"piccola = klein, media = mittel (0,4 l)."],
  ["One cappuccino, please! Sono le tre.","Einen Cappuccino, bitte! Es ist drei Uhr.","Un cappuccino adesso? Va bene…","Ein Cappuccino jetzt? Na gut …",["Un cappuccino? Sono le tre di notte!","No, il cappuccino è solo per i bambini.","Un caffè corretto, subito!"],"In Italien trinkt man Cappuccino nur morgens. adesso = jetzt. va bene = in Ordnung."],
  ["Un caffè al banco, per favore.","Einen Kaffee an der Theke, bitte.","Ecco, sono un euro e venti.","Bitte, das macht einen Euro zwanzig.",["Un caffè in banca? È chiusa.","Al banco non si beve.","Ecco una pizza al banco."],"al banco = an der Theke, im Stehen (billiger als am Tisch)."],
  ["Mi fa uno spritz, per favore?","Machen Sie mir einen Spritz, bitte?","Certo, con olive o patatine?","Natürlich, mit Oliven oder Chips?",["Certo, uno spritz di latte.","Lo spritz è finito ieri.","Uno sprint? Corro subito!"],"Zum Aperitivo gibt es kleine Snacks: olive = Oliven, patatine = Chips."]
];
const DIR=[
 ["Scusi, dov'è la spiaggia?","Entschuldigung, wo ist der Strand?","Vada dritto e poi giri a sinistra.","Gehen Sie geradeaus und dann links.",["La spiaggia è una pizza.","Vado a dormire.","Sì, è buonissima."],"spiaggia = Strand. dritto = geradeaus, a sinistra = links."],
 ["C'è una farmacia qui vicino?","Gibt es hier in der Nähe eine Apotheke?","Sì, a cento metri, sulla destra.","Ja, hundert Meter weiter rechts.",["Sì, vendiamo pizza.","No, sono in vacanza.","La farmacia è calda."],"farmacia = Apotheke, vicino = in der Nähe, a destra = rechts."],
 ["A che ora parte l'ultimo traghetto per Capri?","Wann fährt die letzte Fähre nach Capri?","Alle sei e mezza, dal porto.","Um halb sieben, vom Hafen.",["Capri è in via Roma.","Il traghetto è fritto.","Parte domani per Milano."],"traghetto = Fähre, ultimo = letzte, porto = Hafen."],
 ["Domani piove?","Regnet es morgen?","No, domani c'è il sole.","Nein, morgen scheint die Sonne.",["Sì, la pioggia è gratis.","No, domani è martedì.","Piove pizza!"],"piovere = regnen, domani = morgen."],
 ["Dove compro i biglietti per l'autobus?","Wo kaufe ich Busfahrkarten?","Dal tabaccaio, lì all'angolo.","Im Tabakladen, dort an der Ecke.",["Nell'autobus c'è la pizza.","I biglietti sono rossi.","Comprare? Domani."],"In Italien kauft man Bustickets oft im Tabakladen (tabaccaio)."],
 ["Quanto ci vuole a piedi fino al centro?","Wie lange braucht man zu Fuß ins Zentrum?","Circa dieci minuti.","Ungefähr zehn Minuten.",["Dieci euro a piede.","Il centro è chiuso.","Ho i piedi stanchi."],"a piedi = zu Fuß, quanto ci vuole = wie lange dauert es."],
 ["Dov'è la stazione dei treni?","Wo ist der Bahnhof?","Prenda la metro, sono due fermate.","Nehmen Sie die U-Bahn, es sind zwei Haltestellen.",["Il treno è nel forno.","La stazione è buonissima.","Due treni, per favore."],"stazione = Bahnhof, fermata = Haltestelle, metro = U-Bahn."],
 ["Che cosa posso visitare qui?","Was kann ich hier besichtigen?","Il duomo è bellissimo, e poi c'è il mare.","Der Dom ist wunderschön, und dann gibt es das Meer.",["Il duomo è una pizza.","Visito il dentista.","Qui? Sono le sette."],"visitare = besichtigen, il duomo = der Dom."]
];
const CRITIC=[
 ["Ho mangiato la migliore pizza della mia vita!","Ich habe die beste Pizza meines Lebens gegessen!","Grazie, è un grande onore!","Danke, das ist eine große Ehre!",["Mangiato? Domani mangio.","La vita è un conto.","Mi dispiace molto."],"ho mangiato = ich habe gegessen. migliore = beste."],
 ["Da quanto tempo fa il pizzaiolo?","Seit wann sind Sie Pizzabäcker?","Ho aperto la pizzeria tre anni fa.","Ich habe die Pizzeria vor drei Jahren eröffnet.",["Faccio la pizza alle tre.","Il tempo è bello.","Ho tre pizze."],"da quanto tempo = seit wann. tre anni fa = vor drei Jahren."],
 ["Qual è il segreto del suo impasto?","Was ist das Geheimnis Ihres Teigs?","Lo faccio riposare ventiquattro ore.","Ich lasse ihn 24 Stunden ruhen.",["Il segreto è nel bagno.","L'impasto è di Milano.","Riposo ventiquattro giorni."],"impasto = Teig, segreto = Geheimnis, riposare = ruhen."],
 ["Ieri sera siamo venuti, ma era chiuso.","Gestern Abend waren wir da, aber es war zu.","Mi dispiace, il lunedì siamo chiusi.","Tut mir leid, montags haben wir zu.",["Sì, ieri ho mangiato bene.","Venite ieri sera!","Chiuso? Che bella giornata."],"ieri sera = gestern Abend. siamo venuti = wir sind gekommen."],
 ["Posso fare una foto per il mio giornale?","Darf ich ein Foto für meine Zeitung machen?","Certo, sorrido!","Natürlich, ich lächle!",["La foto è nel forno.","Il giornale è fritto.","No, oggi è domenica."],"giornale = Zeitung, sorridere = lächeln."],
 ["Quale pizza mi consiglia di provare?","Welche Pizza empfehlen Sie mir?","Provi la capricciosa, è la nostra specialità.","Probieren Sie die Capricciosa, unsere Spezialität.",["Provo la pizza domani.","Consiglio il bagno.","Mi provi lei."],"provare = probieren, consigliare = empfehlen."],
 ["Avete mai vinto un premio?","Haben Sie schon einmal einen Preis gewonnen?","Sì, abbiamo vinto il premio della città!","Ja, wir haben den Preis der Stadt gewonnen!",["Il premio costa dieci euro.","Vinto? No, ho perso il treno.","Sì, abbiamo vino."],"vinto = gewonnen (von vincere). premio = Preis."],
 ["Quanti anni ha il suo forno?","Wie alt ist Ihr Ofen?","L'abbiamo costruito cinque anni fa.","Wir haben ihn vor fünf Jahren gebaut.",["Il forno ha fame.","Ho cinque pizze nel forno.","Costruisco domani."],"costruito = gebaut. cinque anni fa = vor fünf Jahren."],
 ["Ieri ho scritto un articolo su di voi.","Gestern habe ich einen Artikel über euch geschrieben.","Davvero? Che bella notizia, grazie!","Wirklich? Was für eine schöne Nachricht, danke!",["Scrivo la pizza domani.","L'articolo è nel forno.","Ieri il mare era chiuso."],"ho scritto = ich habe geschrieben. articolo = Artikel."]
];
const DAYS=[["lunedì","Montag"],["martedì","Dienstag"],["mercoledì","Mittwoch"],["giovedì","Donnerstag"],["venerdì","Freitag"],["sabato","Samstag"],["domenica","Sonntag"]];
const SURNAMES=["Rossi","Russo","Ricci","Romano","Rinaldi"];

// Stufen: was neu dazukommt, steht in "neu"
const LEVELS=[
 {it:"La Piccola Pizzeria",rent:8,de:"Kleine Pizzeria",guests:3,base:2,cost:12,phones:0,talk:[TALK],talkChance:.5,neu:"Begrüßen, einfache Pizzen, abkassieren"},
 {it:"La Pizzeria",rent:15,de:"Pizzeria",guests:4,base:3,cost:25,phones:1,talk:[TALK,PROB],neu:"Pizzen von der Karte, „senza“, Mengen, Probleme, Telefon"},
 {it:"La Trattoria",rent:25,de:"Trattoria",guests:4,base:4,cost:35,phones:1,talk:[TALK,PROB],drinks:true,neu:"Getränke und Nachtisch"},
 {it:"Il Ristorante",rent:35,de:"Ristorante",guests:5,base:5,cost:50,phones:2,talk:[PROB,TALK],drinks:true,reserv:true,neu:"„senza … ma con …“, Tischreservierungen am Telefon"},
 {it:"Sul Mare",rent:45,de:"Restaurant am Meer in Amalfi",guests:5,base:6,cost:65,phones:2,talk:[DIR,PROB],drinks:true,reserv:true,neu:"Touristen: Wegbeschreibungen, Wetter, Fähre"},
 {it:"Il Maestro",rent:60,de:"Meister-Pizzeria",guests:5,base:8,cost:80,phones:2,talk:[CRITIC,DIR],drinks:true,reserv:true,neu:"Restaurantkritiker und Zeitung, Vergangenheitsform"}
];
// Wochentage: Tag 1 ist ein Montag. Markt ist nur mittwochs und samstags.
const GIORNI=[["lunedì","Montag","lun"],["martedì","Dienstag","mar"],["mercoledì","Mittwoch","mer"],["giovedì","Donnerstag","gio"],["venerdì","Freitag","ven"],["sabato","Samstag","sab"],["domenica","Sonntag","dom"]];
const MARKT_TAGE=[2,5];
// Shop: Aufstiege (up) und Einrichtung. fx = Bonus (siehe einrichtung.js), txt = Bonus in Worten.
// Stücke mit grp gibt es in Ausbaustufen (tier); Stufe 1 hat man von Anfang an (START_FURN).
// Alte ids (basilico, tovaglie, forno, …) bleiben gleich, damit Gekauftes aus alten Spielständen erhalten bleibt.
const START_FURN=[
 {id:"forno1",grp:"forno",tier:1,ic:"🔥",it:"il forno elettrico",de:"Elektroofen",txt:"Backt einfache Pizzen"},
 {id:"bancone1",grp:"bancone",tier:1,ic:"🪵",it:"il bancone",de:"Theke aus Brettern",txt:"Hier zahlen die Gäste"},
 {id:"tavoli1",grp:"tavoli",tier:1,ic:"🪑",it:"il tavolo",de:"Plastiktisch",txt:"Ein Tisch für die ersten Gäste"},
 {id:"frigo1",grp:"frigo",tier:1,ic:"🧊",it:"la borsa frigo",de:"Kühlbox",txt:"Hält die Zutaten frisch"}
];
const SHOP=[
 {id:"tavoli2",grp:"tavoli",tier:2,ic:"🪑",it:"i tavoli di legno",de:"Zwei Holztische mit Tischdecken",cost:30,lv:0,fx:{guest:1},txt:"+1 Gast pro Tag"},
 {id:"basilico",ic:"🌿",it:"il basilico in vaso",de:"Basilikum im Topf",cost:20,lv:0,fx:{tip:.05},txt:"+5 % Trinkgeld"},
 {id:"lavagna",ic:"📋",it:"la lavagna",de:"Kreidetafel",cost:40,lv:0,fx:{daily:1},txt:"Ein Gast pro Tag nimmt den Piatto del giorno (Rezept steht dabei)"},
 {id:"moka",grp:"caffe",tier:1,ic:"☕",it:"la moka",de:"Moka-Kanne",cost:30,lv:0,fx:{coffee:1},txt:"Gäste bestellen Kaffee: caffè, caffè lungo"},
 {id:"mandolino",ic:"🎶",it:"il mandolino",de:"Musik vom Mandolinenspieler",cost:60,lv:0,fx:{tip:.05},txt:"+5 % Trinkgeld"},
 {id:"pizzeria",ic:"🏠",it:"La Pizzeria",de:"Aufsteigen: größere Pizzeria, mehr Gäste, Pizzen von der Karte, Telefon",cost:200,lv:0,up:1},
 {id:"forno",grp:"forno",tier:2,ic:"🔥",it:"il forno a legna",de:"Holzofen aus Ziegeln",cost:120,lv:1,fx:{oven:1},txt:"Eine falsche Pizza pro Tag zählt nicht"},
 {id:"frigo2",grp:"frigo",tier:2,ic:"🧊",it:"il frigorifero",de:"Kühlschrank",cost:90,lv:1,fx:{cheap:.15},txt:"Zutaten 15 % günstiger"},
 {id:"tovaglie",ic:"🧺",it:"le tovaglie a quadri",de:"Karierte Tischdecken",cost:40,lv:1,fx:{tip:.05},txt:"+5 % Trinkgeld"},
 {id:"vespa",ic:"🛵",it:"la Vespa",de:"Vespa für Lieferungen",cost:150,lv:1,fx:{delivery:1},txt:"+1 € auf jede Lieferung"},
 {id:"trattoria",ic:"🍷",it:"La Trattoria",de:"Aufsteigen: Getränke und Nachtisch",cost:450,lv:1,up:2},
 {id:"macchina",grp:"caffe",tier:2,ic:"☕",it:"la macchina del caffè",de:"Espressomaschine",cost:150,lv:2,fx:{coffee:2},txt:"Neu: americano, macchiato, cappuccino, caffè latte"},
 {id:"bancone2",grp:"bancone",tier:2,ic:"🪵",it:"il bancone con la vetrina",de:"Holztheke mit Glasvitrine",cost:100,lv:2,fx:{tip:.05},txt:"+5 % Trinkgeld"},
 {id:"botti",ic:"🛢️",it:"le botti di vino",de:"Weinfässer",cost:200,lv:2,fx:{wine:1},txt:"Getränke-Fragen zählen doppelt für die Combo"},
 {id:"foto",ic:"🖼️",it:"le foto di Napoli",de:"Fotos von Neapel",cost:120,lv:2,fx:{regular:1},txt:"Ein Stammgast pro Tag: +50 % Trinkgeld"},
 {id:"insegna",ic:"💡",it:"l'insegna luminosa",de:"Leuchtschild",cost:170,lv:2,fx:{tip:.05},txt:"+5 % Trinkgeld"},
 {id:"ristorante",ic:"⭐",it:"Il Ristorante",de:"Aufsteigen: Reservierungen, schwierigere Bestellungen",cost:800,lv:2,up:3},
 {id:"agenda",ic:"📒",it:"l'agenda",de:"Reservierungsbuch",cost:180,lv:3,fx:{agenda:1},txt:"Telefon: den Namen schreibst du gleich mit"},
 {id:"lampadari",ic:"✨",it:"i lampadari",de:"Kronleuchter",cost:300,lv:3,fx:{tip:.1},txt:"+10 % Trinkgeld"},
 {id:"pianoforte",ic:"🎹",it:"il pianoforte",de:"Klavier mit Live-Musik",cost:380,lv:3,fx:{piano:1},txt:"Der erste Fehler pro Gast bricht die Combo nicht"},
 {id:"tavoli3",grp:"tavoli",tier:3,ic:"🕯️",it:"i tavoli con le candele",de:"Vier Tische mit Kerzen",cost:250,lv:3,fx:{guest:1},txt:"+1 Gast pro Tag"},
 {id:"forno3",grp:"forno",tier:3,ic:"🔥",it:"il forno a cupola",de:"Kuppelofen mit Mosaik",cost:400,lv:3,fx:{oven:1,tip:.1},txt:"+10 % Trinkgeld, eine falsche Pizza pro Tag zählt nicht"},
 {id:"mare",ic:"🌊",it:"Sul Mare",de:"Aufsteigen: Umzug an die Amalfiküste, viele Touristen",cost:1300,lv:3,up:4},
 {id:"terrazza",ic:"🏖️",it:"la terrazza sul mare",de:"Terrasse mit Meerblick",cost:500,lv:4,fx:{guest:1},txt:"+1 Gast pro Tag"},
 {id:"ombrellone",ic:"⛱️",it:"l'ombrellone",de:"Sonnenschirm",cost:250,lv:4,fx:{tourist:.2},txt:"Touristen geben +20 % Trinkgeld"},
 {id:"barca",ic:"⛵",it:"la barca",de:"Eigenes Boot für Ausflügler",cost:620,lv:4,fx:{tip:.1},txt:"+10 % Trinkgeld"},
 {id:"frigo3",grp:"frigo",tier:3,ic:"🧊",it:"la vetrina frigo",de:"Kühltheke mit Glastür",cost:300,lv:4,fx:{cheap:.25},txt:"Zutaten 25 % günstiger"},
 {id:"leva",grp:"caffe",tier:3,ic:"☕",it:"la macchina a leva",de:"Siebträger aus Messing mit Milchdüse",cost:350,lv:4,fx:{coffee:3},txt:"Neu: latte macchiato, marocchino, corretto, shakerato, affogato"},
 {id:"bancone3",grp:"bancone",tier:3,ic:"🏛️",it:"il bancone di marmo",de:"Marmortheke",cost:350,lv:4,fx:{tip:.05},txt:"+5 % Trinkgeld"},
 {id:"maestro",ic:"👑",it:"Il Maestro",de:"Aufsteigen: Die berühmteste Pizzeria Italiens",cost:2000,lv:4,up:5},
 {id:"forno_oro",ic:"🏆",it:"il forno d'oro",de:"Goldener Ofen",cost:1000,lv:5,fx:{critic:.5},txt:"Die Bewertung am Abend fällt einen halben Stern besser aus"},
 {id:"stella",ic:"🌟",it:"la stella sulla porta",de:"Stern an der Tür",cost:800,lv:5,fx:{bill:1},txt:"+1 € auf jede Rechnung"}
];
const REVIEWS=[
 [4.5,"Ottimo! Torneremo sicuramente.","Hervorragend! Wir kommen bestimmt wieder."],
 [3.5,"Buono, ma il servizio era un po' lento.","Gut, aber der Service war etwas langsam."],
 [2.5,"Così così… la pizza era buona.","So lala … die Pizza war gut."],
 [0,"Mamma mia, che confusione!","Meine Güte, was für ein Durcheinander!"]
];

// Ausflüge: Eisladen und Hafen. Hier bist du selbst Kunde. Falsche Antworten klingen bewusst ähnlich.
const GELATERIA=[
 ["Ciao! Cono o coppetta?","Hallo! Waffel oder Becher?","Una coppetta, grazie.","Einen Becher, danke.",["Una cartolina, grazie.","Un cucchiaio, grazie.","Una coperta, grazie."],"cono = Waffel, coppetta = Becher."],
 ["Quanti gusti vuole?","Wie viele Sorten möchten Sie?","Due gusti, per favore.","Zwei Sorten, bitte.",["Due euro, per favore.","Alle due, per favore.","Per due persone, grazie."],"gusto = Geschmack, Eissorte. quanti = wie viele."],
 ["Che gusti desidera?","Welche Sorten wünschen Sie?","Pistacchio e limone.","Pistazie und Zitrone.",["Prosciutto e melone.","Pesce e limone.","Pane e pomodoro."],"Schau auf die Eistheke: Welche Sorten gibt es?"],
 ["Vuole la panna sopra?","Möchten Sie Sahne obendrauf?","Sì, un po' di panna, grazie.","Ja, ein bisschen Sahne, danke.",["Sì, un po' di pane, grazie.","Sì, un po' di pepe, grazie.","Sì, un po' di pasta, grazie."],"panna = Sahne, pane = Brot, pepe = Pfeffer."],
 ["Sono tre euro e cinquanta.","Das macht drei Euro fünfzig.","3,50 €","",["3,15 €","13,50 €","3,05 €"],"tre = 3, tredici = 13, cinquanta = 50, quindici = 15","Wie viel kostet dein Eis?"],
 ["Lo mangia qui o lo porta via?","Essen Sie es hier oder nehmen Sie es mit?","Lo porto via, grazie.","Ich nehme es mit, danke.",["Lo porto domani, grazie.","Lo mangio ieri, grazie.","Lo pago dopo, grazie."],"portare via = mitnehmen. qui = hier."],
 ["Mi dispiace, il cioccolato è finito.","Tut mir leid, die Schokolade ist aus.","Schokolade ist leider aus","",["Schokolade ist heute im Angebot","Schokolade gibt es nur im Becher","Schokolade ist ganz frisch"],"finito = aus, alle. mi dispiace = es tut mir leid.","Was sagt die Verkäuferin?"],
 ["Vuole assaggiare un gusto?","Möchten Sie eine Sorte probieren?","Sì, posso provare il pistacchio?","Ja, darf ich Pistazie probieren?",["Sì, posso pagare il pistacchio?","Sì, posso portare il pistacchio?","Sì, posso prenotare il pistacchio?"],"assaggiare = kosten, provare = probieren."],
 ["Vuole anche un biscotto?","Möchten Sie auch einen Keks?","Sì, un biscotto, grazie.","Ja, einen Keks, danke.",["Sì, un biglietto, grazie.","Sì, un bicchiere, grazie.","Sì, un bicchierino, grazie."],"biscotto = Keks, biglietto = Fahrkarte, bicchiere = Glas."],
 ["Grande, media o piccola?","Groß, mittel oder klein?","Piccola, per favore.","Klein, bitte.",["Piccante, per favore.","Pinoli, per favore.","Un piatto, per favore."],"piccola = klein, media = mittel, grande = groß."]
];
const PORTO=[
 ["Buongiorno! Dove vuole andare?","Guten Tag! Wohin möchten Sie fahren?","A Capri, per favore.","Nach Capri, bitte.",["Al caffè, per favore.","A cavallo, per favore.","A carte, per favore."],"andare = gehen, fahren. dove = wohin."],
 ["Solo andata o andata e ritorno?","Nur Hinfahrt oder hin und zurück?","Andata e ritorno, grazie.","Hin und zurück, danke.",["Andata e ristorante, grazie.","Arrivo e ritardo, grazie.","Andiamo al ritorno, grazie."],"andata = Hinfahrt, ritorno = Rückfahrt."],
 ["Il prossimo traghetto parte alle dieci e un quarto.","Die nächste Fähre fährt um Viertel nach zehn.","10:15 Uhr","",["10:45 Uhr","11:15 Uhr","10:04 Uhr"],"dieci = 10, e un quarto = Viertel nach.","Wann fährt die nächste Fähre?"],
 ["Il traghetto è in ritardo di venti minuti.","Die Fähre hat zwanzig Minuten Verspätung.","Sie hat 20 Minuten Verspätung","",["Sie fährt in 20 Minuten","Die Fahrt dauert 20 Minuten","Sie ist vor 20 Minuten gefahren"],"in ritardo = verspätet.","Was ist mit der Fähre?"],
 ["Quanti biglietti?","Wie viele Fahrkarten?","Due biglietti, per favore.","Zwei Fahrkarten, bitte.",["Due bicchieri, per favore.","Due bagagli, per favore.","Due biciclette, per favore."],"biglietto = Fahrkarte, bicchiere = Glas, bagaglio = Gepäck."],
 ["Ha bagagli grandi?","Haben Sie großes Gepäck?","No, solo uno zaino.","Nein, nur einen Rucksack.",["No, solo uno zio.","No, solo un bagno.","No, solo uno zucchino."],"bagagli = Gepäck, zaino = Rucksack."],
 ["La fermata dell'autobus è davanti al porto.","Die Bushaltestelle ist vor dem Hafen.","Vor dem Hafen","",["Hinter dem Hafen","Im Hafen","Weit weg vom Hafen"],"davanti = vor, dietro = hinter.","Wo ist die Bushaltestelle?"],
 ["Oggi il mare è un po' mosso.","Heute ist das Meer etwas unruhig.","Das Meer ist etwas unruhig","",["Das Meer ist ganz ruhig","Das Meer ist sehr kalt","Das Meer ist heute warm"],"mosso = bewegt, unruhig. calmo = ruhig.","Wie ist das Meer heute?"],
 ["Il viaggio dura circa cinquanta minuti.","Die Fahrt dauert ungefähr fünfzig Minuten.","Etwa 50 Minuten","",["Etwa 15 Minuten","Etwa 5 Minuten","Etwa 1 Stunde 50"],"cinquanta = 50, quindici = 15, cinque = 5. dura = dauert.","Wie lange dauert die Fahrt?"],
 ["Vuole sedersi dentro o fuori sul ponte?","Möchten Sie drinnen sitzen oder draußen an Deck?","Fuori, sul ponte, grazie.","Draußen an Deck, danke.",["Fuori, sul pane, grazie.","Fuori, sul monte, grazie.","Fuori, sul conto, grazie."],"dentro = drinnen, fuori = draußen, ponte = Deck."]
];
const TRIPS={
  gelateria:{it:"Gelateria",de:"Eisladen",ic:"🍨",who:"Signora Lucia",pool:GELATERIA,steps:4},
  porto:{it:"Il Porto",de:"Hafen",ic:"⛴️",who:"Signor Marino",pool:PORTO,steps:4}
};

// Übersetzungen der falschen Antworten: werden nach dem Antworten unter jeder Auswahl gezeigt
// und kommen mit ihren Wörtern in die Vokabeln. {W} steht für eine Zahl.
// Gesundheitsamt: Dottoressa Severini stellt vier dieser Fragen (Kühlung, Sauberkeit, Haltbarkeit, Kleidung, Allergene, Papiere)
const ISPEZIONE=[
  ["A che temperatura tenete il frigorifero?","Bei welcher Temperatur haltet ihr den Kühlschrank?","Tra zero e quattro gradi.","Zwischen null und vier Grad.",["A venti gradi, come la stanza.","Lo teniamo spento la notte.","Fa caldo, ma va bene."],"gradi = Grad. tra … e … = zwischen … und …"],
  ["Dove tenete la mozzarella?","Wo bewahrt ihr den Mozzarella auf?","In frigorifero, ben chiusa.","Im Kühlschrank, gut verschlossen.",["Sul bancone, al sole.","Nel forno, così è calda.","In tasca, dottoressa."],"in frigorifero = im Kühlschrank, ben chiusa = gut verschlossen."],
  ["Ogni quanto pulite la cucina?","Wie oft putzt ihr die Küche?","Tutti i giorni, dopo la chiusura.","Jeden Tag, nach Feierabend.",["Una volta al mese.","Quando viene lei!","Mai, è già pulita."],"pulire = putzen, tutti i giorni = jeden Tag."],
  ["Questo prosciutto è scaduto?","Ist dieser Schinken abgelaufen?","No, scade la settimana prossima.","Nein, er läuft nächste Woche ab.",["Sì, ma è ancora buono.","Non lo so, non leggo le date.","È scaduto ieri, ma solo un po'."],"scaduto = abgelaufen, scade = läuft ab, la settimana prossima = nächste Woche."],
  ["Dove scrivete le date di scadenza?","Wo schreibt ihr die Haltbarkeitsdaten hin?","Su ogni contenitore, con un'etichetta.","Auf jeden Behälter, mit einem Etikett.",["Non le scriviamo.","Sulla mano del cuoco.","Nel menù, per i clienti."],"la data di scadenza = das Haltbarkeitsdatum, l'etichetta = das Etikett."],
  ["Vi lavate le mani prima di lavorare?","Wascht ihr euch die Hände vor der Arbeit?","Certo, sempre, con acqua e sapone.","Natürlich, immer, mit Wasser und Seife.",["Solo la domenica.","No, le mani sono già pulite.","Sì, con il vino rosso."],"le mani = die Hände, il sapone = die Seife."],
  ["Dov'è il cappello da cuoco?","Wo ist die Kochmütze?","Eccolo, lo porto sempre in cucina.","Hier, ich trage sie in der Küche immer.",["A casa, fa troppo caldo.","Il cappello è per i turisti.","Lo uso per la pasta."],"il cappello da cuoco = die Kochmütze. lo porto = ich trage ihn."],
  ["Il grembiule è pulito?","Ist die Schürze sauber?","Sì, lo cambiamo ogni giorno.","Ja, wir wechseln sie jeden Tag.",["È rosso di pomodoro, va bene.","Non abbiamo grembiuli.","Lo laviamo a Natale."],"il grembiule = die Schürze, cambiare = wechseln."],
  ["Avete la lista degli allergeni?","Habt ihr die Allergenliste?","Sì, eccola, è sul menù.","Ja, hier ist sie, sie steht auf der Karte.",["Allergeni? Non esistono.","Solo per i turisti.","È nel forno, al caldo."],"gli allergeni = die Allergene, eccola = hier ist sie."],
  ["Un cliente è allergico alle noci. Cosa fate?","Ein Gast ist allergisch gegen Nüsse. Was macht ihr?","Controlliamo gli ingredienti e lo diciamo al cliente.","Wir prüfen die Zutaten und sagen es dem Gast.",["Togliamo le noci con le dita.","Niente, le noci sono buone.","Gli diamo un caffè."],"le noci = die Nüsse, controllare = prüfen."],
  ["Posso vedere la licenza?","Darf ich die Genehmigung sehen?","Certo, ecco la licenza e il registro.","Natürlich, hier sind Genehmigung und Register.",["La licenza è in vacanza.","Quale licenza?","Domani, forse."],"la licenza = die Genehmigung, posso vedere = darf ich sehen."],
  ["Avete il registro delle temperature?","Habt ihr das Temperaturprotokoll?","Sì, lo scriviamo ogni mattina.","Ja, wir schreiben es jeden Morgen.",["No, ci ricordiamo tutto.","Il registro è sporco.","Lo scrive il gatto."],"il registro = das Protokoll, ogni mattina = jeden Morgen."],
  ["Dove tenete i prodotti per pulire?","Wo bewahrt ihr die Putzmittel auf?","In un armadio separato, lontano dal cibo.","In einem eigenen Schrank, weit weg vom Essen.",["Vicino alla farina, è comodo.","Sotto il basilico.","Non li usiamo, solo acqua."],"lontano da = weit weg von, il cibo = das Essen, l'armadio = der Schrank."],
  ["Che cosa fate con l'olio vecchio?","Was macht ihr mit dem alten Öl?","Lo raccogliamo e lo porta via una ditta.","Wir sammeln es, und eine Firma holt es ab.",["Lo buttiamo nel lavandino.","Lo usiamo per un altro mese.","Lo vendiamo come olio nuovo."],"raccogliere = sammeln, la ditta = die Firma, il lavandino = das Spülbecken."],
  ["Il pavimento della cucina è bagnato. Perché?","Der Küchenboden ist nass. Warum?","L'abbiamo appena lavato, c'è il cartello.","Wir haben ihn gerade gewischt, das Schild steht da.",["Piove in cucina.","È il sugo, va bene così.","Il cuoco ha sete."],"appena = gerade eben, il pavimento = der Boden, il cartello = das Schild."]
];
const WRONG_DE_ISP=Object.assign({},{"A venti gradi, come la stanza.":"Bei zwanzig Grad, wie im Raum.","Lo teniamo spento la notte.":"Nachts lassen wir ihn aus.","Fa caldo, ma va bene.":"Es ist warm, aber das geht schon.",
 "Sul bancone, al sole.":"Auf der Theke, in der Sonne.","Nel forno, così è calda.":"Im Ofen, damit er warm ist.","In tasca, dottoressa.":"In der Tasche, Frau Doktor.",
 "Una volta al mese.":"Einmal im Monat.","Quando viene lei!":"Wenn Sie kommen!","Mai, è già pulita.":"Nie, sie ist schon sauber.",
 "Sì, ma è ancora buono.":"Ja, aber er ist noch gut.","Non lo so, non leggo le date.":"Weiß ich nicht, ich lese keine Daten.","È scaduto ieri, ma solo un po'.":"Gestern abgelaufen, aber nur ein bisschen.",
 "Non le scriviamo.":"Wir schreiben sie nicht auf.","Sulla mano del cuoco.":"Auf die Hand des Kochs.","Nel menù, per i clienti.":"In die Karte, für die Gäste.",
 "Solo la domenica.":"Nur sonntags.","No, le mani sono già pulite.":"Nein, die Hände sind schon sauber.","Sì, con il vino rosso.":"Ja, mit Rotwein.",
 "A casa, fa troppo caldo.":"Zu Hause, es ist zu warm.","Il cappello è per i turisti.":"Die Mütze ist für die Touristen.","Lo uso per la pasta.":"Ich nehme sie für die Nudeln.",
 "È rosso di pomodoro, va bene.":"Sie ist rot von Tomaten, passt schon.","Non abbiamo grembiuli.":"Wir haben keine Schürzen.","Lo laviamo a Natale.":"Wir waschen sie an Weihnachten.",
 "Allergeni? Non esistono.":"Allergene? Gibt es nicht.","Solo per i turisti.":"Nur für Touristen.","È nel forno, al caldo.":"Sie ist im Ofen, im Warmen.",
 "Togliamo le noci con le dita.":"Wir nehmen die Nüsse mit den Fingern raus.","Niente, le noci sono buone.":"Nichts, Nüsse sind gut.","Gli diamo un caffè.":"Wir geben ihm einen Kaffee.",
 "La licenza è in vacanza.":"Die Genehmigung ist im Urlaub.","Quale licenza?":"Welche Genehmigung?","Domani, forse.":"Morgen vielleicht.",
 "No, ci ricordiamo tutto.":"Nein, wir merken uns alles.","Il registro è sporco.":"Das Protokoll ist schmutzig.","Lo scrive il gatto.":"Das schreibt die Katze."});
const WRONG_DE={
"Buonanotte e arrivederci!":"Gute Nacht und auf Wiedersehen!","Il conto, per favore.":"Die Rechnung, bitte.","Sono le otto.":"Es ist acht Uhr.","Sì, sono di Napoli.":"Ja, ich bin aus Neapel.","Due pizze, grazie.":"Zwei Pizzen, danke.","No, non mi piace.":"Nein, das gefällt mir nicht.","Sono due euro.":"Das macht zwei Euro.","Ho due anni.":"Ich bin zwei Jahre alt.","No, grazie, non ho fame.":"Nein danke, ich habe keinen Hunger.","Sono le quattro.":"Es ist vier Uhr.",
"Quattro formaggi, subito!":"Vier Käse, sofort!","Non parlo italiano.":"Ich spreche kein Italienisch.","No, sono italiano.":"Nein, ich bin Italiener.","Il tedesco è buono.":"Das Deutsche ist gut.","Sì, la pizza è calda.":"Ja, die Pizza ist heiß.","No, il profumo costa caro.":"Nein, das Parfüm ist teuer.","Sì, esco subito.":"Ja, ich gehe sofort raus.","Mi chiamo Pizza.":"Ich heiße Pizza.","Mi dispiace, sono stanco.":"Tut mir leid, ich bin müde.","Fame? Che freddo!":"Hunger? Wie kalt!",
"Il bagno è a destra.":"Die Toilette ist rechts.","Sì, piove molto.":"Ja, es regnet viel.","No, è notte.":"Nein, es ist Nacht.","Il conto è qui.":"Die Rechnung ist hier.","Mi dispiace, è chiuso.":"Tut mir leid, es ist geschlossen.","Milano è una pizza.":"Mailand ist eine Pizza.","Sono le dieci.":"Es ist zehn Uhr.","No, non parlo.":"Nein, ich spreche nicht.","Il conto è sul tavolo.":"Die Rechnung liegt auf dem Tisch.","Sì, ho dodici anni.":"Ja, ich bin zwölf Jahre alt.",
"Sì, qui c'è il bagno.":"Ja, hier ist die Toilette.","No, è di là.":"Nein, es ist dort drüben.","Sono qui da due pizze.":"Ich bin seit zwei Pizzen hier.","Mi scusi, è fredda.":"Entschuldigung, sie ist kalt.","Sì, è chiusa.":"Ja, sie ist geschlossen.","Prego, si accomodi.":"Bitte, nehmen Sie Platz.","Si chiama margherita.":"Sie heißt Margherita.","Chiamo un taxi.":"Ich rufe ein Taxi.","Sto bene, grazie.":"Mir geht es gut, danke.","Sto in via Roma.":"Ich wohne in der Via Roma.",
"Oggi è lunedì.":"Heute ist Montag.","Sono tre euro.":"Das macht drei Euro.","Domani è chiuso.":"Morgen ist geschlossen.","Consiglio il conto.":"Ich empfehle die Rechnung.","Il mare è in cucina.":"Das Meer ist in der Küche.","Il bagno è buonissimo.":"Die Toilette ist sehr lecker.","Sono le nove.":"Es ist neun Uhr.","Con la carta, grazie.":"Mit Karte, danke.","Grazie, molto gentile!":"Danke, sehr freundlich!","Sì, il ghiaccio è gratis.":"Ja, das Eis ist gratis.",
"Buon appetito!":"Guten Appetit!","Le porto una coperta.":"Ich bringe Ihnen eine Decke.","Chiudo la porta.":"Ich schließe die Tür.","Il conto è perfetto, ciao.":"Die Rechnung ist perfekt, tschüss.","Errore? Che bello!":"Ein Fehler? Wie schön!","Due euro in più, grazie.":"Zwei Euro mehr, danke.","No, siamo chiusi.":"Nein, wir haben geschlossen.","Il wifi è piccante.":"Das WLAN ist scharf.","Sì, con funghi.":"Ja, mit Pilzen.","La macchina è nel forno.":"Das Auto ist im Ofen.",
"Parcheggio la pizza.":"Ich parke die Pizza.","Sì, è aperta.":"Ja, sie ist offen.","Sì, metto più noci.":"Ja, ich gebe mehr Nüsse dazu.","Allergico? Che bello.":"Allergisch? Wie schön.","Le noci costano due euro.":"Die Nüsse kosten zwei Euro.","No, il forno è fuori.":"Nein, der Ofen ist draußen.","Fuori piove pizza.":"Draußen regnet es Pizza.","Sì, il bagno è fuori.":"Ja, die Toilette ist draußen.","Il conto è buonissimo.":"Die Rechnung ist sehr lecker.","Subito! Sono {W} euro.":"Sofort! Das macht {W} Euro.",
"Buongiorno, si accomodi.":"Guten Tag, nehmen Sie Platz.","Paga il pane.":"Er zahlt das Brot.","Sono {W} euro, grazie.":"Das macht {W} Euro, danke.","Sono di Napoli.":"Ich bin aus Neapel.","Pago io, grazie.":"Ich zahle, danke.","La pizza è di carta.":"Die Pizza ist aus Papier.","No, è un tavolo.":"Nein, das ist ein Tisch.","Vorrei un caffè.":"Ich hätte gern einen Kaffee.","Non mi piace la mancia.":"Ich mag kein Trinkgeld.","Mancia una pizza?":"Trinkgeld eine Pizza?",
"Mi dispiace molto.":"Es tut mir sehr leid.","Il caffè è nel conto?":"Ist der Kaffee in der Rechnung?","Sono le tre.":"Es ist drei Uhr.","No, siamo al mare.":"Nein, wir sind am Meer.","Venti? Ne prendo il doppio!":"Zwanzig? Ich nehme das Doppelte!","Non ho fame, grazie.":"Ich habe keinen Hunger, danke.","Cinque euro di resto.":"Fünf Euro Wechselgeld.","La farina è bianca.":"Das Mehl ist weiß.","Sono le cinque.":"Es ist fünf Uhr.","No, le olive sono in vacanza.":"Nein, die Oliven sind im Urlaub.",
"Oggi è chiuso.":"Heute ist geschlossen.","Sono allergico al mercato.":"Ich bin allergisch gegen den Markt.","Tre pizze, subito!":"Drei Pizzen, sofort!","Resto qui a dormire.":"Ich bleibe hier zum Schlafen.","Il resto è freddo.":"Das Wechselgeld ist kalt.","Un vino bianco, arriva subito!":"Ein Weißwein, kommt sofort!","Una birra rossa, subito!":"Ein rotes Bier, sofort!","Un'acqua rossa? Certo!":"Ein rotes Wasser? Natürlich!","Certo, una spina di pesce.":"Natürlich, eine Fischgräte.","Certo, una pizza alla birra.":"Natürlich, eine Bierpizza.",
"Ecco il conto della birra.":"Hier ist die Rechnung für das Bier.","Ecco, acqua frizzante con ghiaccio.":"Bitte, Sprudelwasser mit Eis.","Ecco, tanto ghiaccio!":"Bitte, viel Eis!","Ecco, un tè freddo.":"Bitte, ein Eistee.","Abbiamo pane e sale.":"Wir haben Brot und Salz.","Il dolce è il conto.":"Der Nachtisch ist die Rechnung.","Dolce? Sì, sono le dieci.":"Nachtisch? Ja, es ist zehn Uhr.","Un caffè con la pizza?":"Ein Kaffee mit der Pizza?","Il caffè è macchiato di pomodoro.":"Der Kaffee hat einen Tomatenfleck.","Un cappuccino gigante con panna!":"Ein Riesen-Cappuccino mit Sahne!",
"No, la casa è chiusa.":"Nein, das Haus ist geschlossen.","Sì, la casa è in via Roma.":"Ja, das Haus ist in der Via Roma.","Fatto? Non ancora, domani.":"Fertig? Noch nicht, morgen.","Finito, arrivederci.":"Fertig, auf Wiedersehen.","Il limone è finito.":"Die Zitrone ist alle.","Per finire il conto, sì.":"Zum Abschluss die Rechnung, ja.","La spiaggia è una pizza.":"Der Strand ist eine Pizza.","Vado a dormire.":"Ich gehe schlafen.","Sì, è buonissima.":"Ja, sie ist sehr lecker.","Sì, vendiamo pizza.":"Ja, wir verkaufen Pizza.",
"No, sono in vacanza.":"Nein, ich bin im Urlaub.","La farmacia è calda.":"Die Apotheke ist warm.","Capri è in via Roma.":"Capri ist in der Via Roma.","Il traghetto è fritto.":"Die Fähre ist frittiert.","Parte domani per Milano.":"Er fährt morgen nach Mailand.","Sì, la pioggia è gratis.":"Ja, der Regen ist gratis.","No, domani è martedì.":"Nein, morgen ist Dienstag.","Piove pizza!":"Es regnet Pizza!","Nell'autobus c'è la pizza.":"Im Bus ist die Pizza.","I biglietti sono rossi.":"Die Fahrkarten sind rot.",
"Comprare? Domani.":"Kaufen? Morgen.","Dieci euro a piede.":"Zehn Euro pro Fuß.","Il centro è chiuso.":"Das Zentrum ist geschlossen.","Ho i piedi stanchi.":"Meine Füße sind müde.","Mangiato? Domani mangio.":"Gegessen? Morgen esse ich.","La vita è un conto.":"Das Leben ist eine Rechnung.","Faccio la pizza alle tre.":"Ich mache die Pizza um drei.","Il tempo è bello.":"Das Wetter ist schön.","Ho tre pizze.":"Ich habe drei Pizzen.","Il segreto è nel bagno.":"Das Geheimnis ist in der Toilette.",
"L'impasto è di Milano.":"Der Teig ist aus Mailand.","Riposo ventiquattro giorni.":"Ich ruhe mich vierundzwanzig Tage aus.","Sì, ieri ho mangiato bene.":"Ja, gestern habe ich gut gegessen.","Venite ieri sera!":"Kommt gestern Abend!","Chiuso? Che bella giornata.":"Geschlossen? Was für ein schöner Tag.","La foto è nel forno.":"Das Foto ist im Ofen.","Il giornale è fritto.":"Die Zeitung ist frittiert.","No, oggi è domenica.":"Nein, heute ist Sonntag.","Provo la pizza domani.":"Ich probiere die Pizza morgen.","Consiglio il bagno.":"Ich empfehle die Toilette.",
"Mi provi lei.":"Probieren Sie mich.","Il premio costa dieci euro.":"Der Preis kostet zehn Euro.","Vinto? No, ho perso il treno.":"Gewonnen? Nein, ich habe den Zug verpasst.","Sì, abbiamo vino.":"Ja, wir haben Wein.","Una cartolina, grazie.":"Eine Postkarte, danke.","Un cucchiaio, grazie.":"Einen Löffel, danke.","Una coperta, grazie.":"Eine Decke, danke.","Due euro, per favore.":"Zwei Euro, bitte.","Alle due, per favore.":"Um zwei Uhr, bitte.","Per due persone, grazie.":"Für zwei Personen, danke.",
"Prosciutto e melone.":"Schinken und Melone.","Pesce e limone.":"Fisch und Zitrone.","Pane e pomodoro.":"Brot und Tomate.","Sì, un po' di pane, grazie.":"Ja, ein bisschen Brot, danke.","Sì, un po' di pepe, grazie.":"Ja, ein bisschen Pfeffer, danke.","Sì, un po' di pasta, grazie.":"Ja, ein bisschen Nudeln, danke.","Lo porto domani, grazie.":"Ich bringe es morgen, danke.","Lo mangio ieri, grazie.":"Ich esse es gestern, danke.","Lo pago dopo, grazie.":"Ich zahle es später, danke.","Sì, posso pagare il pistacchio?":"Ja, kann ich die Pistazie bezahlen?",
"Sì, posso portare il pistacchio?":"Ja, kann ich die Pistazie mitbringen?","Sì, posso prenotare il pistacchio?":"Ja, kann ich die Pistazie reservieren?","Al caffè, per favore.":"Zum Café, bitte.","A cavallo, per favore.":"Zu Pferd, bitte.","A carte, per favore.":"Mit Karten (Spielkarten), bitte.","Andata e ristorante, grazie.":"Hinfahrt und Restaurant, danke.","Arrivo e ritardo, grazie.":"Ankunft und Verspätung, danke.","Andiamo al ritorno, grazie.":"Gehen wir zur Rückfahrt, danke.","Due bicchieri, per favore.":"Zwei Gläser, bitte.","Due bagagli, per favore.":"Zwei Gepäckstücke, bitte.",
"Due biciclette, per favore.":"Zwei Fahrräder, bitte.","No, solo uno zio.":"Nein, nur ein Onkel.","No, solo un bagno.":"Nein, nur eine Toilette.","No, solo uno zucchino.":"Nein, nur eine Zucchini."
};
// Bar
Object.assign(WRONG_DE,{"Subito! Il cornetto con il tonno?":"Sofort! Das Hörnchen mit Thunfisch?","Il cappuccino è finito, mi dispiace.":"Der Cappuccino ist aus, tut mir leid.","Certo, una pizza cornetto.":"Natürlich, eine Hörnchen-Pizza.",
 "Certo, latte caldo caldo.":"Natürlich, ganz heiße Milch.","Il caffè è freddo, mi dispiace.":"Der Kaffee ist kalt, tut mir leid.","Certo, un tè freddo.":"Natürlich, ein Eistee.",
 "Sì, abbiamo tanto zucchero.":"Ja, wir haben viel Zucker.","No, il latte è nel caffè.":"Nein, die Milch ist im Kaffee.","Sì, la pizza è senza pomodoro.":"Ja, die Pizza ist ohne Tomate.",
 "Un doppio caffè, arriva!":"Ein doppelter Espresso, kommt!","Buonanotte, signore!":"Gute Nacht, mein Herr!","Un caffè corretto, arriva!":"Ein Espresso mit Grappa, kommt!",
 "Ecco a lei, acqua naturale calda.":"Bitte sehr, warmes stilles Wasser.","Ecco, un gelato al limone.":"Bitte, ein Zitroneneis.","Ecco, senza ghiaccio e senza limone.":"Bitte, ohne Eis und ohne Zitrone.",
 "La pizza della casa è chiusa.":"Die Hauspizza ist geschlossen.","Il vino è nel forno.":"Der Wein ist im Ofen.","Consiglio un cappuccino.":"Ich empfehle einen Cappuccino.",
 "Rossa o bianca? Di pizza?":"Rot oder weiß? Aus Pizza?","Birra? Sono le otto di mattina!":"Bier? Es ist acht Uhr morgens!","La birra è finita ieri, domani.":"Das Bier ist gestern ausgegangen, morgen.",
 "Un cappuccino? Sono le tre di notte!":"Ein Cappuccino? Es ist drei Uhr nachts!","No, il cappuccino è solo per i bambini.":"Nein, Cappuccino ist nur für Kinder.","Un caffè corretto, subito!":"Einen Espresso mit Grappa, sofort!"});


Object.assign(WRONG_DE,WRONG_DE_ISP);

// Übersetzungen der falschen Antworten für die neuen Fragen
Object.assign(WRONG_DE,{"Sì, sono le cinque.": "Ja, es ist fünf Uhr.", "Cinque pizze margherita?": "Fünf Pizza Margherita?", "No, il tavolo è in cucina.": "Nein, der Tisch ist in der Küche.", "Il cane non mangia la pizza.": "Der Hund isst keine Pizza.", "Sì, porto il conto.": "Ja, ich bringe die Rechnung.", "Mi chiamo Cane.": "Ich heiße Hund.", "Canto la pizza.": "Ich singe die Pizza.", "La musica è fredda.": "Die Musik ist kalt.", "Sono le nove e mezza.": "Es ist halb zehn.", "La prima pizza è nel forno.": "Die erste Pizza ist im Ofen.", "Sì, vengo anch'io.": "Ja, ich komme auch.", "No, è l'ultima volta.": "Nein, es ist das letzte Mal.", "La forchetta è buonissima.": "Die Gabel ist sehr lecker.", "Manca il sole oggi.": "Heute fehlt die Sonne.", "Sì, mangi con le mani.": "Ja, essen Sie mit den Händen.", "Il bambino è molto alto.": "Das Kind ist sehr groß.", "Il seggiolone è nel forno.": "Der Hochstuhl ist im Ofen.", "Sì, è un bambino.": "Ja, das ist ein Kind.", "Ecco il conto: {W} euro.": "Hier ist die Rechnung: {W} Euro.", "Il conto è molto cortese.": "Die Rechnung ist sehr höflich.", "Porto una pizza in più.": "Ich bringe eine Pizza mehr.", "No, solo con la pizza.": "Nein, nur mit der Pizza.", "In contanti? Sono le dieci.": "Bar? Es ist zehn Uhr.", "Conto i tavoli.": "Ich zähle die Tische.", "Sì, un sacchetto di vino.": "Ja, eine Tüte Wein.", "No, sono di Roma.": "Nein, ich bin aus Rom.", "Il sacchetto è fresco di oggi.": "Die Tüte ist heute frisch.", "Un caffè in banca? È chiusa.": "Ein Kaffee in der Bank? Die ist zu.", "Al banco non si beve.": "An der Theke trinkt man nicht.", "Ecco una pizza al banco.": "Hier ist eine Pizza an der Theke.", "Certo, uno spritz di latte.": "Natürlich, ein Spritz mit Milch.", "Lo spritz è finito ieri.": "Der Spritz ist seit gestern aus.", "Uno sprint? Corro subito!": "Ein Sprint? Ich renne sofort!", "Il treno è nel forno.": "Der Zug ist im Ofen.", "La stazione è buonissima.": "Der Bahnhof ist sehr lecker.", "Due treni, per favore.": "Zwei Züge, bitte.", "Il duomo è una pizza.": "Der Dom ist eine Pizza.", "Visito il dentista.": "Ich besuche den Zahnarzt.", "Qui? Sono le sette.": "Hier? Es ist sieben Uhr.", "Il forno ha fame.": "Der Ofen hat Hunger.", "Ho cinque pizze nel forno.": "Ich habe fünf Pizzen im Ofen.", "Costruisco domani.": "Ich baue morgen.", "Scrivo la pizza domani.": "Ich schreibe die Pizza morgen.", "L'articolo è nel forno.": "Der Artikel ist im Ofen.", "Ieri il mare era chiuso.": "Gestern war das Meer geschlossen.", "Sì, un biglietto, grazie.": "Ja, eine Fahrkarte, danke.", "Sì, un bicchiere, grazie.": "Ja, ein Glas, danke.", "Sì, un bicchierino, grazie.": "Ja, ein Gläschen, danke.", "Piccante, per favore.": "Scharf, bitte.", "Pinoli, per favore.": "Pinienkerne, bitte.", "Un piatto, per favore.": "Einen Teller, bitte.", "Fuori, sul pane, grazie.": "Draußen, auf dem Brot, danke.", "Fuori, sul monte, grazie.": "Draußen, auf dem Berg, danke.", "Fuori, sul conto, grazie.": "Draußen, auf der Rechnung, danke.", "Vicino alla farina, è comodo.": "Neben dem Mehl, das ist praktisch.", "Sotto il basilico.": "Unter dem Basilikum.", "Non li usiamo, solo acqua.": "Wir benutzen keine, nur Wasser.", "Lo buttiamo nel lavandino.": "Wir kippen es ins Spülbecken.", "Lo usiamo per un altro mese.": "Wir benutzen es noch einen Monat.", "Lo vendiamo come olio nuovo.": "Wir verkaufen es als neues Öl.", "Piove in cucina.": "Es regnet in der Küche.", "È il sugo, va bene così.": "Das ist die Soße, das passt so.", "Il cuoco ha sete.": "Der Koch hat Durst.", "Sì, una pizza all'arancia.": "Ja, eine Pizza mit Orange.", "No, l'arancia è blu.": "Nein, die Orange ist blau.", "Sì, un succo di pomodoro caldo.": "Ja, ein heißer Tomatensaft.", "Ecco la caraffa di rosso.": "Hier ist die Karaffe Rotwein.", "Una caraffa d'acqua calda?": "Eine Karaffe heißes Wasser?", "Il tavolo è bianco, sì.": "Der Tisch ist weiß, ja."});
