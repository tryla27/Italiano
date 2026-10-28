/* Alle Inhalte: Zutaten, Speisekarte, Gäste-Sätze, Stufen, Shop, Bewertungen.
   Neue Sätze hier eintragen (Muster siehe Kommentar über GREET). */
/* ---------- Content ---------- */
const ING={pomodoro:["Tomate","#d8402b"],mozzarella:["Mozzarella","#f6f0e2"],basilico:["Basilikum","#3f9a45"],funghi:["Pilze","#b08d6a"],
  prosciutto:["Schinken","#e79a9a"],salame:["Salami","#a3262a"],olive:["Oliven","#2a2a2a"],cipolla:["Zwiebeln","#cfa6dc"],
  peperoni:["Paprika","#f2b134"],tonno:["Thunfisch","#c8a17f"],carciofi:["Artischocken","#8aa357"],rucola:["Rucola","#4f8a2a"]};
const EXTRAS=Object.keys(ING).filter(k=>k!=="pomodoro"&&k!=="mozzarella");
const MENU=[
  {n:"margherita",p:7,pl:"margherite",ing:["pomodoro","mozzarella","basilico"]},
  {n:"diavola",p:9,pl:"diavole",ing:["pomodoro","mozzarella","salame"]},
  {n:"capricciosa",p:11,pl:"capricciose",ing:["pomodoro","mozzarella","prosciutto","funghi","carciofi","olive"]},
  {n:"prosciutto e funghi",p:10,pl:"prosciutto e funghi",ing:["pomodoro","mozzarella","prosciutto","funghi"]},
  {n:"tonno e cipolla",p:9,pl:"tonno e cipolla",ing:["pomodoro","mozzarella","tonno","cipolla"]},
  {n:"ortolana",p:9,pl:"ortolane",ing:["pomodoro","mozzarella","peperoni","cipolla","funghi"]},
  {n:"crudo e rucola",p:11,pl:"crudo e rucola",ing:["pomodoro","mozzarella","prosciutto","rucola"]}
];
const cap=s=>s.replace(/\b\w/g,c=>c.toUpperCase());
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
 ["Buongiorno! Ho fame!","Guten Tag! Ich habe Hunger!","Allora è nel posto giusto!","Dann sind Sie hier genau richtig!",["Mi dispiace, sono stanco.","Fame? Che freddo!","Il bagno è a destra."],"fame = Hunger. Der Gast hat Hunger."]
];
const TALK=[
 ["Che bella giornata oggi!","Was für ein schöner Tag heute!","Sì, c'è il sole!","Ja, die Sonne scheint!",["Sì, piove molto.","No, è notte.","Il conto è qui."],"giornata = Tag. Er findet das Wetter schön. Stimm zu!"],
 ["Sono di Milano, sono qui in vacanza.","Ich bin aus Mailand und hier im Urlaub.","Che bello! Benvenuto a Napoli.","Wie schön! Willkommen in Neapel.",["Mi dispiace, è chiuso.","Milano è una pizza.","Sono le dieci."],"vacanza = Urlaub. Er kommt aus Mailand."],
 ["Lei parla italiano molto bene!","Sie sprechen sehr gut Italienisch!","Grazie, sto imparando!","Danke, ich lerne gerade!",["No, non parlo.","Il conto è sul tavolo.","Sì, ho dodici anni."],"Ein Kompliment für dein Italienisch! imparare = lernen."],
 ["Lei è di qui?","Sind Sie von hier?","No, vengo dalla Germania.","Nein, ich komme aus Deutschland.",["Sì, qui c'è il bagno.","No, è di là.","Sono qui da due pizze."],"di qui = von hier. Er fragt, woher du kommst."],
 ["Questa pizza è buonissima!","Diese Pizza ist super lecker!","Grazie mille, è la ricetta di mia nonna.","Vielen Dank, das ist das Rezept meiner Oma.",["Mi scusi, è fredda.","Sì, è chiusa.","Prego, si accomodi."],"buonissima = sehr lecker. Bedank dich!"],
 ["Come si chiama Lei?","Wie heißen Sie?","Mi chiamo Luca, piacere!","Ich heiße Luca, freut mich!",["Si chiama margherita.","Chiamo un taxi.","Sto bene, grazie."],"chiamarsi = heißen. Er fragt nach deinem Namen."],
 ["Come sta oggi?","Wie geht es Ihnen heute?","Bene, grazie! E Lei?","Gut, danke! Und Ihnen?",["Sto in via Roma.","Oggi è lunedì.","Sono tre euro."],"Come sta? = Wie geht es Ihnen?"],
 ["Domani vado al mare. Cosa mi consiglia?","Morgen fahre ich ans Meer. Was empfehlen Sie?","Vada a Sorrento, è bellissima!","Fahren Sie nach Sorrent, es ist wunderschön!",["Domani è chiuso.","Consiglio il conto.","Il mare è in cucina."],"consigliare = empfehlen. mare = Meer."]
];
const PROB=[
 ["Scusi, dov'è il bagno?","Entschuldigung, wo ist die Toilette?","In fondo a destra.","Hinten rechts.",["Il bagno è buonissimo.","Sono le nove.","Con la carta, grazie."],"bagno = Toilette. Er fragt, wo sie ist."],
 ["La pizza è fredda!","Die Pizza ist kalt!","Mi scusi, gliene porto un'altra calda.","Entschuldigung, ich bringe Ihnen eine heiße.",["Grazie, molto gentile!","Sì, il ghiaccio è gratis.","Buon appetito!"],"freddo = kalt. Entschuldige dich!"],
 ["Fa troppo caldo qui dentro.","Es ist zu warm hier drin.","Apro subito la finestra.","Ich mache sofort das Fenster auf.",["Le porto una coperta.","Sì, la pizza è calda.","Chiudo la porta."],"Achtung: caldo = warm/heiß, nicht kalt!"],
 ["Scusi, c'è un errore nel conto.","Entschuldigung, die Rechnung hat einen Fehler.","Mi dispiace, controllo subito.","Tut mir leid, ich prüfe das sofort.",["Il conto è perfetto, ciao.","Errore? Che bello!","Due euro in più, grazie."],"errore = Fehler. Prüfe die Rechnung."],
 ["Avete il wifi?","Haben Sie WLAN?","Sì, la password è sul menù.","Ja, das Passwort steht auf der Karte.",["No, siamo chiusi.","Il wifi è piccante.","Sì, con funghi."],"Er fragt nach dem WLAN."],
 ["Dove posso parcheggiare la macchina?","Wo kann ich das Auto parken?","C'è un parcheggio dietro l'angolo.","Um die Ecke gibt es einen Parkplatz.",["La macchina è nel forno.","Parcheggio la pizza.","Sì, è aperta."],"macchina = Auto. parcheggiare = parken."],
 ["Sono allergico alle noci. È un problema?","Ich bin allergisch gegen Nüsse. Ist das ein Problem?","No, nelle nostre pizze non ci sono noci.","Nein, in unseren Pizzen sind keine Nüsse.",["Sì, metto più noci.","Allergico? Che bello.","Le noci costano due euro."],"noci = Nüsse. allergico = allergisch."],
 ["Possiamo sederci fuori?","Können wir draußen sitzen?","Sì, c'è un tavolo in terrazza.","Ja, auf der Terrasse ist ein Tisch frei.",["No, il forno è fuori.","Fuori piove pizza.","Sì, il bagno è fuori."],"fuori = draußen. sedersi = sich setzen."]
];
const BILL=[
 ["Il conto, per favore.","Die Rechnung, bitte.","Subito! Sono {N} euro.","Sofort! Das macht {D} Euro.",["Il conto è buonissimo.","Subito! Sono {W} euro.","Buongiorno, si accomodi."],"conto = Rechnung. Nenn ihm den richtigen Preis! Er hat {D} € verbraucht."],
 ["Quanto pago?","Wie viel zahle ich?","Sono {N} euro, grazie.","Das macht {D} Euro, danke.",["Paga il pane.","Sono {W} euro, grazie.","Sono di Napoli."],"quanto = wie viel. pagare = bezahlen. Seine Bestellung kostet {D} €."],
 ["Posso pagare con la carta?","Kann ich mit Karte zahlen?","Sì, certo!","Ja, natürlich!",["Pago io, grazie.","La pizza è di carta.","No, è un tavolo."],"carta = Karte. Er möchte mit Karte zahlen."],
 ["Grazie mille, arrivederci!","Vielen Dank, auf Wiedersehen!","Grazie a Lei, a presto!","Ich danke Ihnen, bis bald!",["Buongiorno, si accomodi.","Il bagno è a destra.","Vorrei un caffè."],"Der Gast verabschiedet sich. Verabschiede dich auch."],
 ["Era tutto perfetto! Le lascio la mancia.","Alles war perfekt! Ich lasse Ihnen Trinkgeld da.","Grazie mille, molto gentile!","Vielen Dank, sehr nett!",["Non mi piace la mancia.","Mancia una pizza?","Mi dispiace molto."],"mancia = Trinkgeld."],
 ["Un caffè e il conto, per favore.","Einen Kaffee und die Rechnung, bitte.","Certo, arriva subito!","Natürlich, kommt sofort!",["Il caffè è nel conto?","Sono le tre.","No, siamo al mare."],"Er möchte noch einen Kaffee und dann zahlen."]
];
const MARKET=[
 ["I pomodori costano tre euro al chilo.","Die Tomaten kosten drei Euro das Kilo.","3 €","",["13 €","30 €","2 €"],"tre = 3, tredici = 13, trenta = 30","Wie viel kostet ein Kilo Tomaten?"],
 ["La mozzarella fresca fa quindici euro.","Der frische Mozzarella kostet fünfzehn Euro.","15 €","",["5 €","50 €","14 €"],"quindici = 15, quattordici = 14, cinque = 5","Wie viel kostet der Mozzarella?"],
 ["Per tutto fanno venti euro.","Für alles macht das zwanzig Euro.","È un po' caro… facciamo quindici?","Das ist etwas teuer … sagen wir fünfzehn?",["Venti? Ne prendo il doppio!","Non ho fame, grazie.","Il conto, per favore."],"caro = teuer. Handeln = einen kleineren Preis vorschlagen.","Handle den Preis runter!"],
 ["Quanti chili di farina vuole?","Wie viele Kilo Mehl möchten Sie?","Cinque chili, per favore.","Fünf Kilo, bitte.",["Cinque euro di resto.","La farina è bianca.","Sono le cinque."],"farina = Mehl. Er fragt nach der Menge."],
 ["Il basilico è fresco di oggi!","Das Basilikum ist heute frisch!","Das Basilikum ist ganz frisch von heute","",["Das Basilikum ist heute teuer","Heute gibt es kein Basilikum","Das Basilikum ist von gestern"],"fresco = frisch, oggi = heute","Was sagt der Händler?"],
 ["Vuole anche le olive? Oggi sono in offerta.","Möchten Sie auch Oliven? Heute sind sie im Angebot.","Sì, grazie, ne prendo un chilo.","Ja, danke, ich nehme ein Kilo.",["No, le olive sono in vacanza.","Oggi è chiuso.","Sono allergico al mercato."],"in offerta = im Angebot."],
 ["Sono dodici euro e cinquanta.","Das macht zwölf Euro fünfzig.","12,50 €","",["2,50 €","20,50 €","12,15 €"],"dodici = 12, cinquanta = 50, quindici = 15","Wie viel musst du zahlen?"],
 ["Ecco il resto: tre euro.","Hier ist Ihr Wechselgeld: drei Euro.","Grazie, buona giornata!","Danke, schönen Tag noch!",["Tre pizze, subito!","Resto qui a dormire.","Il resto è freddo."],"il resto = das Wechselgeld."]
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
 ["Un limoncello per finire!","Zum Abschluss einen Limoncello!","Ottima scelta, offre la casa!","Gute Wahl, geht aufs Haus!",["Finito, arrivederci.","Il limone è finito.","Per finire il conto, sì."],"per finire = zum Abschluss. offre la casa = geht aufs Haus."]
];
const DRINK_PRICE=[5,4,2,5,2,5,0]; // gleiche Reihenfolge wie DRINK
const DIR=[
 ["Scusi, dov'è la spiaggia?","Entschuldigung, wo ist der Strand?","Vada dritto e poi giri a sinistra.","Gehen Sie geradeaus und dann links.",["La spiaggia è una pizza.","Vado a dormire.","Sì, è buonissima."],"spiaggia = Strand. dritto = geradeaus, a sinistra = links."],
 ["C'è una farmacia qui vicino?","Gibt es hier in der Nähe eine Apotheke?","Sì, a cento metri, sulla destra.","Ja, hundert Meter weiter rechts.",["Sì, vendiamo pizza.","No, sono in vacanza.","La farmacia è calda."],"farmacia = Apotheke, vicino = in der Nähe, a destra = rechts."],
 ["A che ora parte l'ultimo traghetto per Capri?","Wann fährt die letzte Fähre nach Capri?","Alle sei e mezza, dal porto.","Um halb sieben, vom Hafen.",["Capri è in via Roma.","Il traghetto è fritto.","Parte domani per Milano."],"traghetto = Fähre, ultimo = letzte, porto = Hafen."],
 ["Domani piove?","Regnet es morgen?","No, domani c'è il sole.","Nein, morgen scheint die Sonne.",["Sì, la pioggia è gratis.","No, domani è martedì.","Piove pizza!"],"piovere = regnen, domani = morgen."],
 ["Dove compro i biglietti per l'autobus?","Wo kaufe ich Busfahrkarten?","Dal tabaccaio, lì all'angolo.","Im Tabakladen, dort an der Ecke.",["Nell'autobus c'è la pizza.","I biglietti sono rossi.","Comprare? Domani."],"In Italien kauft man Bustickets oft im Tabakladen (tabaccaio)."],
 ["Quanto ci vuole a piedi fino al centro?","Wie lange braucht man zu Fuß ins Zentrum?","Circa dieci minuti.","Ungefähr zehn Minuten.",["Dieci euro a piede.","Il centro è chiuso.","Ho i piedi stanchi."],"a piedi = zu Fuß, quanto ci vuole = wie lange dauert es."]
];
const CRITIC=[
 ["Ho mangiato la migliore pizza della mia vita!","Ich habe die beste Pizza meines Lebens gegessen!","Grazie, è un grande onore!","Danke, das ist eine große Ehre!",["Mangiato? Domani mangio.","La vita è un conto.","Mi dispiace molto."],"ho mangiato = ich habe gegessen. migliore = beste."],
 ["Da quanto tempo fa il pizzaiolo?","Seit wann sind Sie Pizzabäcker?","Ho cominciato tre anni fa con un chiosco.","Ich habe vor drei Jahren mit einem Imbissstand angefangen.",["Faccio la pizza alle tre.","Il tempo è bello.","Ho tre pizze."],"da quanto tempo = seit wann. tre anni fa = vor drei Jahren."],
 ["Qual è il segreto del suo impasto?","Was ist das Geheimnis Ihres Teigs?","Lo faccio riposare ventiquattro ore.","Ich lasse ihn 24 Stunden ruhen.",["Il segreto è nel bagno.","L'impasto è di Milano.","Riposo ventiquattro giorni."],"impasto = Teig, segreto = Geheimnis, riposare = ruhen."],
 ["Ieri sera siamo venuti, ma era chiuso.","Gestern Abend waren wir da, aber es war zu.","Mi dispiace, il lunedì siamo chiusi.","Tut mir leid, montags haben wir zu.",["Sì, ieri ho mangiato bene.","Venite ieri sera!","Chiuso? Che bella giornata."],"ieri sera = gestern Abend. siamo venuti = wir sind gekommen."],
 ["Posso fare una foto per il mio giornale?","Darf ich ein Foto für meine Zeitung machen?","Certo, sorrido!","Natürlich, ich lächle!",["La foto è nel forno.","Il giornale è fritto.","No, oggi è domenica."],"giornale = Zeitung, sorridere = lächeln."],
 ["Quale pizza mi consiglia di provare?","Welche Pizza empfehlen Sie mir?","Provi la capricciosa, è la nostra specialità.","Probieren Sie die Capricciosa, unsere Spezialität.",["Provo la pizza domani.","Consiglio il bagno.","Mi provi lei."],"provare = probieren, consigliare = empfehlen."],
 ["Avete mai vinto un premio?","Haben Sie schon einmal einen Preis gewonnen?","Sì, abbiamo vinto il premio della città!","Ja, wir haben den Preis der Stadt gewonnen!",["Il premio costa dieci euro.","Vinto? No, ho perso il treno.","Sì, abbiamo vino."],"vinto = gewonnen (von vincere). premio = Preis."]
];
const DAYS=[["lunedì","Montag"],["martedì","Dienstag"],["mercoledì","Mittwoch"],["giovedì","Donnerstag"],["venerdì","Freitag"],["sabato","Samstag"],["domenica","Sonntag"]];
const SURNAMES=["Rossi","Russo","Ricci","Romano","Rinaldi"];

// Stufen: was neu dazukommt, steht in "neu"
const LEVELS=[
 {it:"Il Chiosco",rent:8,de:"Imbissstand",guests:3,base:2,cost:12,phones:0,talk:[TALK],talkChance:.5,neu:"Begrüßen, einfache Pizzen, abkassieren"},
 {it:"La Pizzeria",rent:15,de:"Pizzeria",guests:4,base:3,cost:25,phones:1,talk:[TALK,PROB],neu:"Pizzen von der Karte, „senza“, Mengen, Probleme, Telefon"},
 {it:"La Trattoria",rent:25,de:"Trattoria",guests:4,base:4,cost:35,phones:1,talk:[TALK,PROB],drinks:true,neu:"Getränke und Nachtisch"},
 {it:"Il Ristorante",rent:35,de:"Ristorante",guests:5,base:5,cost:50,phones:2,talk:[PROB,TALK],drinks:true,reserv:true,neu:"„senza … ma con …“, Tischreservierungen am Telefon"},
 {it:"Sul Mare",rent:45,de:"Restaurant am Meer in Amalfi",guests:5,base:6,cost:65,phones:2,talk:[DIR,PROB],drinks:true,reserv:true,neu:"Touristen: Wegbeschreibungen, Wetter, Fähre"},
 {it:"Il Maestro",rent:60,de:"Meister-Pizzeria",guests:5,base:8,cost:80,phones:2,talk:[CRITIC,DIR],drinks:true,reserv:true,neu:"Restaurantkritiker und Zeitung, Vergangenheitsform"}
];
// Wochentage: Tag 1 ist ein Montag. Markt ist nur mittwochs und samstags.
const GIORNI=[["lunedì","Montag","lun"],["martedì","Dienstag","mar"],["mercoledì","Mittwoch","mer"],["giovedì","Donnerstag","gio"],["venerdì","Freitag","ven"],["sabato","Samstag","sab"],["domenica","Sonntag","dom"]];
const MARKT_TAGE=[2,5];
const SHOP=[
 {id:"basilico",ic:"🌿",it:"il basilico in vaso",de:"Basilikum im Topf",cost:25,bonus:.05,lv:0},
 {id:"tovaglie",ic:"🧺",it:"le tovaglie a quadri",de:"Karierte Tischdecken",cost:40,bonus:.05,lv:0},
 {id:"mandolino",ic:"🎶",it:"il mandolino",de:"Musik vom Mandolinenspieler",cost:60,bonus:.1,lv:0},
 {id:"pizzeria",ic:"🏠",it:"La Pizzeria",de:"Aufsteigen: mehr Gäste, Pizzen von der Karte, Telefon",cost:200,lv:0,up:1},
 {id:"forno",ic:"🔥",it:"il forno a legna",de:"Holzofen",cost:120,bonus:.15,lv:1},
 {id:"vespa",ic:"🛵",it:"la Vespa",de:"Vespa für Lieferungen",cost:150,bonus:.1,lv:1},
 {id:"trattoria",ic:"🍷",it:"La Trattoria",de:"Aufsteigen: Getränke und Nachtisch",cost:450,lv:1,up:2},
 {id:"botti",ic:"🛢️",it:"le botti di vino",de:"Weinfässer",cost:200,bonus:.1,lv:2},
 {id:"insegna",ic:"💡",it:"l'insegna luminosa",de:"Leuchtschild",cost:170,bonus:.1,lv:2},
 {id:"ristorante",ic:"⭐",it:"Il Ristorante",de:"Aufsteigen: Reservierungen, schwierigere Bestellungen",cost:800,lv:2,up:3},
 {id:"lampadari",ic:"✨",it:"i lampadari",de:"Kronleuchter",cost:300,bonus:.15,lv:3},
 {id:"pianoforte",ic:"🎹",it:"il pianoforte",de:"Klavier mit Live-Musik",cost:380,bonus:.15,lv:3},
 {id:"mare",ic:"🌊",it:"Sul Mare",de:"Aufsteigen: Umzug an die Amalfiküste, viele Touristen",cost:1300,lv:3,up:4},
 {id:"terrazza",ic:"🏖️",it:"la terrazza sul mare",de:"Terrasse mit Meerblick",cost:500,bonus:.2,lv:4},
 {id:"barca",ic:"⛵",it:"la barca",de:"Eigenes Boot für Ausflügler",cost:620,bonus:.2,lv:4},
 {id:"maestro",ic:"👑",it:"Il Maestro",de:"Aufsteigen: Die berühmteste Pizzeria Italiens",cost:2000,lv:4,up:5},
 {id:"forno_oro",ic:"🏆",it:"il forno d'oro",de:"Goldener Ofen",cost:1000,bonus:.3,lv:5}
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
 ["Vuole assaggiare un gusto?","Möchten Sie eine Sorte probieren?","Sì, posso provare il pistacchio?","Ja, darf ich Pistazie probieren?",["Sì, posso pagare il pistacchio?","Sì, posso portare il pistacchio?","Sì, posso prenotare il pistacchio?"],"assaggiare = kosten, provare = probieren."]
];
const PORTO=[
 ["Buongiorno! Dove vuole andare?","Guten Tag! Wohin möchten Sie fahren?","A Capri, per favore.","Nach Capri, bitte.",["Al caffè, per favore.","A cavallo, per favore.","A carte, per favore."],"andare = gehen, fahren. dove = wohin."],
 ["Solo andata o andata e ritorno?","Nur Hinfahrt oder hin und zurück?","Andata e ritorno, grazie.","Hin und zurück, danke.",["Andata e ristorante, grazie.","Arrivo e ritardo, grazie.","Andiamo al ritorno, grazie."],"andata = Hinfahrt, ritorno = Rückfahrt."],
 ["Il prossimo traghetto parte alle dieci e un quarto.","Die nächste Fähre fährt um Viertel nach zehn.","10:15 Uhr","",["10:45 Uhr","11:15 Uhr","10:04 Uhr"],"dieci = 10, e un quarto = Viertel nach.","Wann fährt die nächste Fähre?"],
 ["Il traghetto è in ritardo di venti minuti.","Die Fähre hat zwanzig Minuten Verspätung.","Sie hat 20 Minuten Verspätung","",["Sie fährt in 20 Minuten","Die Fahrt dauert 20 Minuten","Sie ist vor 20 Minuten gefahren"],"in ritardo = verspätet.","Was ist mit der Fähre?"],
 ["Quanti biglietti?","Wie viele Fahrkarten?","Due biglietti, per favore.","Zwei Fahrkarten, bitte.",["Due bicchieri, per favore.","Due bagagli, per favore.","Due biciclette, per favore."],"biglietto = Fahrkarte, bicchiere = Glas, bagaglio = Gepäck."],
 ["Ha bagagli grandi?","Haben Sie großes Gepäck?","No, solo uno zaino.","Nein, nur einen Rucksack.",["No, solo uno zio.","No, solo un bagno.","No, solo uno zucchino."],"bagagli = Gepäck, zaino = Rucksack."],
 ["La fermata dell'autobus è davanti al porto.","Die Bushaltestelle ist vor dem Hafen.","Vor dem Hafen","",["Hinter dem Hafen","Im Hafen","Weit weg vom Hafen"],"davanti = vor, dietro = hinter.","Wo ist die Bushaltestelle?"],
 ["Oggi il mare è un po' mosso.","Heute ist das Meer etwas unruhig.","Das Meer ist etwas unruhig","",["Das Meer ist ganz ruhig","Das Meer ist sehr kalt","Das Meer ist heute warm"],"mosso = bewegt, unruhig. calmo = ruhig.","Wie ist das Meer heute?"]
];
const TRIPS={
  gelateria:{it:"Gelateria",de:"Eisladen",ic:"🍨",who:"Signora Lucia",pool:GELATERIA,steps:4},
  porto:{it:"Il Porto",de:"Hafen",ic:"⛴️",who:"Signor Marino",pool:PORTO,steps:4}
};
