/* Bücher für die Biblioteca: gemeinfreie Klassiker, für Lernende vereinfacht nacherzählt.
   Jede Seite: [italienisch, deutsch]. Fragen: [Frage, richtige Antwort, [falsche Antworten]].
   Wörter, die noch nicht im Wörterbuch stehen, kommen nach "parole" (werden beim Laden in DICT übernommen).
   Pinocchio: Carlo Collodi, „Le avventure di Pinocchio“ (1883), gemeinfrei. */
const LIBRI=[
{id:"pinocchio",titolo:"Le avventure di Pinocchio",autore:"Carlo Collodi, 1883",nota:"vereinfacht für Lernende",colore:"#c0503f",
 capitoli:[
  {t:"Un pezzo di legno",de:"Ein Stück Holz",
   pagine:[
    ["C'era una volta un pezzo di legno. Non era un legno di lusso: era un pezzo semplice, da mettere nel camino.","Es war einmal ein Stück Holz. Es war kein edles Holz: es war ein einfaches Stück, zum Verbrennen im Kamin."],
    ["Un giorno il legno arriva nella bottega di un vecchio falegname. Il falegname si chiama Mastro Antonio, ma tutti lo chiamano Mastro Ciliegia, perché ha il naso rosso come una ciliegia.","Eines Tages kommt das Holz in die Werkstatt eines alten Tischlers. Der Tischler heißt Meister Antonio, aber alle nennen ihn Meister Kirsche, weil er eine Nase rot wie eine Kirsche hat."],
    ["Mastro Ciliegia prende l'ascia e dice: «Con questo legno faccio una gamba per un tavolo.» Ma quando colpisce il legno, una vocina piccola piccola grida: «Non mi picchiare così forte!»","Meister Kirsche nimmt die Axt und sagt: „Aus diesem Holz mache ich ein Bein für einen Tisch.“ Aber als er das Holz schlägt, ruft eine ganz kleine Stimme: „Schlag mich nicht so fest!“"],
    ["Mastro Ciliegia guarda sotto il tavolo, guarda nell'armadio, guarda fuori dalla porta. Non c'è nessuno! Ha tanta paura che il suo naso rosso diventa blu.","Meister Kirsche schaut unter den Tisch, schaut in den Schrank, schaut vor die Tür. Da ist niemand! Er hat so viel Angst, dass seine rote Nase blau wird."]
   ],
   domande:[
    ["Che cosa vuole fare Mastro Ciliegia con il legno?","Una gamba per un tavolo",["Una porta per la casa","Una pizza per la sera"]],
    ["Perché lo chiamano Mastro Ciliegia?","Ha il naso rosso",["Mangia sempre ciliegie","Ha un giardino"]],
    ["Chi parla quando lui colpisce il legno?","Una vocina nel legno",["Un amico fuori dalla porta","Il gatto sotto il tavolo"]]
   ]},
  {t:"Geppetto fa un burattino",de:"Geppetto macht eine Holzpuppe",
   pagine:[
    ["Qualcuno bussa alla porta. È Geppetto, un vecchio povero e simpatico. «Vorrei fare un burattino di legno», dice. «Un burattino che sa ballare e saltare. Così giro il mondo e guadagno un po' di pane.»","Jemand klopft an die Tür. Es ist Geppetto, ein armer und netter alter Mann. „Ich möchte eine Holzpuppe machen“, sagt er. „Eine Puppe, die tanzen und springen kann. So reise ich durch die Welt und verdiene ein bisschen Brot.“"],
    ["Mastro Ciliegia è contento: gli regala subito il pezzo di legno. Geppetto torna a casa. La sua casa è piccola: c'è solo una sedia, un letto e un camino dipinto sul muro.","Meister Kirsche ist froh: er schenkt ihm sofort das Stück Holz. Geppetto geht nach Hause. Sein Haus ist klein: es gibt nur einen Stuhl, ein Bett und einen Kamin, der an die Wand gemalt ist."],
    ["Geppetto comincia a lavorare. «Lo chiamo Pinocchio», dice. Fa i capelli, la fronte, gli occhi. Gli occhi si muovono e lo guardano! Poi fa il naso, ma il naso cresce, cresce, cresce e non finisce mai.","Geppetto beginnt zu arbeiten. „Ich nenne ihn Pinocchio“, sagt er. Er macht die Haare, die Stirn, die Augen. Die Augen bewegen sich und schauen ihn an! Dann macht er die Nase, aber die Nase wächst, wächst, wächst und hört nie auf."],
    ["Quando le gambe sono pronte, Pinocchio salta giù dal tavolo e corre fuori dalla porta. «Fermatelo!» grida Geppetto. Ma Pinocchio corre veloce per la strada, come una lepre.","Als die Beine fertig sind, springt Pinocchio vom Tisch und rennt zur Tür hinaus. „Haltet ihn!“ ruft Geppetto. Aber Pinocchio rennt schnell die Straße entlang, wie ein Hase."]
   ],
   domande:[
    ["Che cosa vuole fare Geppetto?","Un burattino di legno",["Un tavolo nuovo","Una casa grande"]],
    ["Che cosa c'è sul muro della casa?","Un camino dipinto",["Una finestra aperta","Un grande specchio"]],
    ["Che cosa fa il naso di Pinocchio?","Cresce e non finisce mai",["Diventa blu","Cade per terra"]]
   ]},
  {t:"Il Grillo Parlante",de:"Die sprechende Grille",
   pagine:[
    ["Pinocchio torna a casa da solo e chiude la porta. Si siede per terra, contento. Ma all'improvviso sente una voce: «Cri-cri-cri!»","Pinocchio kommt allein nach Hause und schließt die Tür. Er setzt sich zufrieden auf den Boden. Aber plötzlich hört er eine Stimme: „Zirp-zirp-zirp!“"],
    ["Sul muro c'è un grillo. «Io sono il Grillo Parlante», dice. «Abito in questa stanza da più di cento anni. I bambini che non ascoltano il papà e scappano di casa non saranno mai felici.»","An der Wand sitzt eine Grille. „Ich bin die sprechende Grille“, sagt sie. „Ich wohne seit mehr als hundert Jahren in diesem Zimmer. Kinder, die nicht auf ihren Papa hören und von zu Hause weglaufen, werden nie glücklich sein.“"],
    ["«Io non voglio andare a scuola», risponde Pinocchio. «Voglio solo mangiare, bere, dormire e giocare tutto il giorno.» Il Grillo dice: «Allora diventerai un asino!» Pinocchio si arrabbia e il Grillo vola via.","„Ich will nicht zur Schule gehen“, antwortet Pinocchio. „Ich will nur essen, trinken, schlafen und den ganzen Tag spielen.“ Die Grille sagt: „Dann wirst du ein Esel!“ Pinocchio wird wütend und die Grille fliegt weg."],
    ["Intanto viene la sera e Pinocchio ha fame. Cerca da mangiare in tutta la casa. Trova solo un uovo. Lo rompe per cucinarlo, ma dall'uovo esce un pulcino: «Grazie, signor Pinocchio! Arrivederci!» E il pulcino vola dalla finestra.","Inzwischen wird es Abend und Pinocchio hat Hunger. Er sucht im ganzen Haus nach etwas zu essen. Er findet nur ein Ei. Er schlägt es auf, um es zu kochen, aber aus dem Ei kommt ein Küken: „Danke, Herr Pinocchio! Auf Wiedersehen!“ Und das Küken fliegt zum Fenster hinaus."]
   ],
   domande:[
    ["Da quanti anni abita il Grillo nella stanza?","Più di cento anni",["Due anni","Dieci giorni"]],
    ["Che cosa non vuole fare Pinocchio?","Andare a scuola",["Mangiare","Giocare"]],
    ["Che cosa esce dall'uovo?","Un pulcino",["Una pizza","Un grillo"]]
   ]}
 ],
 parole:{"c'era":"es gab, es war","volta":"Mal","pezzo":"Stück","legno":"Holz","lusso":"Luxus","semplice":"einfach","mettere":"legen, stellen","camino":"Kamin","giorno":"Tag","arriva":"kommt an","bottega":"Werkstatt, Laden","vecchio":"alt","falegname":"Tischler","mastro":"Meister","antonio":"Antonio (Name)","tutti":"alle","naso":"Nase","ciliegia":"Kirsche","perché":"weil, warum","prende":"nimmt","ascia":"Axt","dice":"sagt","questo":"dieses","gamba":"Bein","quando":"wenn, als","colpisce":"schlägt","vocina":"Stimmchen","piccola":"klein","grida":"ruft, schreit","picchiare":"schlagen","così":"so","forte":"fest, stark","guarda":"schaut","sotto":"unter","armadio":"Schrank","nessuno":"niemand","paura":"Angst","suo":"sein","diventa":"wird","blu":"blau","qualcuno":"jemand","bussa":"klopft","povero":"arm","simpatico":"nett","burattino":"Holzpuppe, Marionette","sa":"kann, weiß","ballare":"tanzen","saltare":"springen","giro":"ich reise herum","mondo":"Welt","guadagno":"ich verdiene","contento":"froh, zufrieden","gli":"ihm","regala":"schenkt","torna":"kehrt zurück","sua":"seine","piccola":"klein","letto":"Bett","dipinto":"gemalt","muro":"Mauer, Wand","comincia":"beginnt","lavorare":"arbeiten","fa":"macht","capelli":"Haare","fronte":"Stirn","occhi":"Augen","muovono":"bewegen","guardano":"schauen an","cresce":"wächst","finisce":"hört auf","gambe":"Beine","pronte":"fertig","salta":"springt","giù":"herunter","corre":"rennt","fermatelo":"haltet ihn auf","veloce":"schnell","strada":"Straße","lepre":"Hase","solo":"allein, nur","chiude":"schließt","siede":"setzt sich","terra":"Boden, Erde","improvviso":"plötzlich (all'improvviso)","sente":"hört","voce":"Stimme","cri":"zirp","grillo":"Grille","parlante":"sprechend","abito":"ich wohne","stanza":"Zimmer","bambini":"Kinder","ascoltano":"hören zu","papà":"Papa","scappano":"laufen weg","saranno":"werden sein","felici":"glücklich","voglio":"ich will","andare":"gehen","scuola":"Schule","risponde":"antwortet","bere":"trinken","giocare":"spielen","diventerai":"du wirst","asino":"Esel","arrabbia":"wird wütend","vola":"fliegt","intanto":"inzwischen","viene":"kommt","cerca":"sucht","mangiare":"essen","tutta":"ganz","trova":"findet","uovo":"Ei","rompe":"bricht","cucinarlo":"es kochen","esce":"kommt heraus","pulcino":"Küken","signor":"Herr","nella":"in der","chiamano":"(sie) nennen","tanta":"so viel","lui":"er","dall'":"aus dem","abita":"wohnt","fame":"Hunger","vuole":"will","chi":"wer","parla":"spricht","amico":"Freund","gatto":"Katze","quanti":"wie viele","nuovo":"neu","cade":"fällt","giardino":"Garten","sempre":"immer","ciliegie":"Kirschen","muro":"Wand","specchio":"Spiegel","aperta":"offen","sera":"Abend","porta":"Tür","casa":"Haus"}}
];
Object.entries(LIBRI.reduce((a,b)=>Object.assign(a,b.parole||{}),{})).forEach(([w,de])=>{if(!DICT[w])DICT[w]=de;});

/* Kinderreime (filastrocche) für das Regal „Poesie“: jede Zeile [italienisch, deutsch].
   Trenta giorni und Giro giro tondo sind überliefert (Volksgut), Stella stellina stammt von Lina Schwarz (1876–1947), gemeinfrei. */
const POESIE=[
{id:"trenta",titolo:"Trenta giorni ha novembre",de:"Dreißig Tage hat November",autore:"Volksreim",colore:"#2f78c4",
 versi:[["Trenta giorni ha novembre,","Dreißig Tage hat November,"],["con april, giugno e settembre;","mit April, Juni und September;"],["di ventotto ce n'è uno,","mit achtundzwanzig gibt es einen,"],["tutti gli altri ne han trentuno.","alle anderen haben einunddreißig."]]},
{id:"giro",titolo:"Giro giro tondo",de:"Ringel, Ringel, Reihe",autore:"Volksreim",colore:"#3a9a4a",
 versi:[["Giro giro tondo,","Dreh dich, dreh dich rund,"],["casca il mondo,","die Welt fällt um,"],["casca la terra,","die Erde fällt um,"],["tutti giù per terra!","alle runter auf den Boden!"]]},
{id:"stella",titolo:"Stella stellina",de:"Sternchen, Sternlein",autore:"Lina Schwarz",colore:"#7a5aa6",
 versi:[["Stella stellina,","Sternchen, Sternlein,"],["la notte s'avvicina:","die Nacht kommt näher:"],["la fiamma traballa,","die Flamme flackert,"],["la mucca è nella stalla.","die Kuh ist im Stall."],["La mucca e il vitello,","Die Kuh und das Kalb,"],["la pecora e l'agnello,","das Schaf und das Lamm,"],["la chioccia e il pulcino,","die Glucke und das Küken,"],["ognuno ha il suo bambino,","jeder hat sein Kind,"],["ognuno ha la sua mamma","jeder hat seine Mama"],["e tutti fan la nanna.","und alle machen Heia."]]}
];
Object.entries({trenta:"dreißig",giorni:"Tage",novembre:"November",april:"April",giugno:"Juni",settembre:"September",ventotto:"achtundzwanzig","ce":"es (ce n'è = es gibt davon)","n'":"davon","è":"ist",altri:"andere",han:"haben",trentuno:"einunddreißig",
 giro:"Runde, dreh",tondo:"rund",casca:"fällt",mondo:"Welt",terra:"Erde, Boden","giù":"runter",tutti:"alle",
 stella:"Stern",stellina:"Sternchen",notte:"Nacht","s'":"sich","avvicina":"nähert sich",fiamma:"Flamme",traballa:"flackert, wackelt",mucca:"Kuh",nella:"in der",stalla:"Stall",vitello:"Kalb",pecora:"Schaf","l'":"der, die, das",agnello:"Lamm",chioccia:"Glucke",pulcino:"Küken",ognuno:"jeder",suo:"sein",bambino:"Kind",sua:"seine",mamma:"Mama",fan:"machen",nanna:"Heia (Schlafen)"}).forEach(([w,de])=>{if(!DICT[w])DICT[w]=de;});
