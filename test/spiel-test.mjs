// Automatischer Test: startet das Spiel in einem Handy-Browser (ohne Bildschirm),
// klickt die wichtigsten Bildschirme durch, macht Screenshots und meldet JavaScript-Fehler.
//
// Starten:   node test/spiel-test.mjs
// Ergebnis:  Screenshots in test/screenshots/, Fehler in der Konsole (Exit-Code 1 bei Fehlern)
//
// Braucht das npm-Paket "playwright" mit Chromium (in der Claude-Cloud schon vorhanden;
// am PC einmalig: npm i -D playwright && npx playwright install chromium).

import { createServer } from "node:http";
import { readFile, mkdir, rm, readdir } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WWW = join(ROOT, "www");
const OUT = join(ROOT, "test", "screenshots");
const DEVICE = process.env.DEVICE || "Pixel 7";

/* ---------- Kleiner Webserver für www/ ---------- */
const TYPES = { ".html": "text/html", ".mp3": "audio/mpeg", ".png": "image/png", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".glb": "model/gltf-binary" };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  try {
    const body = await readFile(join(WWW, path.endsWith("/") ? path + "index.html" : path));
    res.writeHead(200, { "content-type": TYPES[extname(path)] || "text/html" }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, r));
const URL = `http://localhost:${server.address().port}/`;

/* ---------- Browser im Handy-Format ---------- */
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices[DEVICE], locale: "de-DE" });
const page = await ctx.newPage();
page.setDefaultTimeout(8000);
const errors = [];
page.on("pageerror", e => errors.push(`Seitenfehler: ${e.message}`));
page.on("console", m => { if (m.type() === "error" && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(`Konsole: ${m.text()}`); });

const check = (ok, msg) => { if (!ok) errors.push(`Prüfung: ${msg}`); };
let n = 0;
async function shot(name) {
  await page.waitForTimeout(400);
  const file = `${String(++n).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: join(OUT, file) });
  console.log("  Screenshot:", file);
}
// Knöpfe, die auf der Startseite jetzt Häuser im 3D-Viertel sind
const PIN = { vocab: "scuola", memo: "bar", menu: "forno" };
async function act(a, extra = "") {
  let el = page.locator(`[data-act="${a}"]${extra}`).first();
  if (!(await el.count()) && !extra && PIN[a]) el = page.locator(`.city-pin[data-p="${PIN[a]}"]`).first();
  if (!(await el.count()) && a === "map" && await page.locator(".map.city").count()) return true; // Startseite ist schon die Karte
  if (!(await el.count())) { console.log(`  (Knopf "${a}" nicht gefunden)`); return false; }
  await el.click();
  return true;
}
async function fresh(state) {
  await page.goto(URL + "leer"); // leere Seite: das Spiel speichert beim Verlassen nicht über den Test-Stand
  await page.evaluate(s => { localStorage.clear(); if (s) localStorage.setItem("pizzeria-parola", JSON.stringify({ savedAt: Date.now(), state: JSON.stringify({ v: 2, S: s, G: null, screen: "home" }) })); }, state);
  await page.goto(URL);
  await page.waitForLoadState("networkidle").catch(() => {});
}

console.log(`Teste ${URL} als "${DEVICE}"`);

// 1) Neuer Spieler
await fresh(null);
await shot("start");
if (await act("shop")) await shot("shop");
await act("home");
if (await act("vocab")) await shot("vokabeln");
if (await act("vstart")) await shot("vokabel-frage");
// Vokabeln: beide Richtungen kommen vor
await page.evaluate(() => { S.vocab.days[1] = [{ it: "pomodoro", de: "Tomate" }, { it: "grazie", de: "danke" }, { it: "mille", de: "tausend" }, { it: "conto", de: "Rechnung" }]; S.vocab.done = {}; startVocab(1); });
check(await page.evaluate(() => new Set(S.vocabRun.queue.map(q => q.dir)).size === 2), "Vokabeln werden nicht in beide Richtungen gefragt");
for (let i = 0; i < 2; i++) {
  const ok = await page.evaluate(() => { const R = S.vocabRun, q = R.queue[0], v = S.vocab.days[R.day][q.k], want = q.dir === "de" ? v.it : v.de; return R.opts.indexOf(want); });
  await page.locator(`[data-act="vopt"][data-i="${ok}"]`).click();
  check(await page.evaluate(() => S.vocabRun.res === "ok"), "Richtige Vokabel-Antwort wird nicht erkannt");
  if (i === 0) await shot("vokabel-richtung");
  await act("vnext");
}
// Truhe nach dem ersten Bestehen eines Vokabeltags: drei Belohnungen, danach weg
await page.evaluate(() => { S.vocab.days[1] = [{ it: "grazie", de: "danke" }, { it: "conto", de: "Rechnung" }]; S.vocab.done = {}; S.chest = null; S.deko = {}; startVocab(1); S.vocabRun.queue = [{ k: 0, st: 1, dir: "it" }]; vocabNext(); });
check(await page.evaluate(() => !!S.chest), "Kein Truhe nach bestandenem Vokabeltag");
await page.waitForTimeout(900);
check(await page.evaluate(() => !$("#chest").hidden && !!chestUI), "Truhe öffnet sich nicht von selbst");
await shot("truhe");
const before = await page.evaluate(() => S.coins + Object.values(S.deko).reduce((a, b) => a + b, 0) + (S.boost ? 1 : 0));
await page.locator("#chest .chest-stage").click({ force: true });
await page.waitForTimeout(2300);
await shot("truhe-karte");
for (let i = 0; i < 3; i++) await page.locator("#chest .chest-stage").click({ force: true });
check(await page.evaluate(b => !S.chest && S.coins + Object.values(S.deko).reduce((a, c) => a + c, 0) + (S.boost ? 1 : 0) > b, before), "Truhe gibt keine Belohnung");
await page.locator('#chest [data-act="chest"].big').click({ force: true });
check(await page.evaluate(() => $("#chest").hidden && screen === "map" && !S.vocabRun), "Truhe geht nicht zu oder es geht nicht zur Karte");
check(await page.evaluate(() => { const n = {}; for (let i = 0; i < 4000; i++) { const k = rollReward().kind; n[k] = (n[k] || 0) + 1; } return n.rare > 80 && n.rare < 260 && n.deko && n.euro && n.boost; }), "Truhen-Wahrscheinlichkeiten stimmen nicht (selten ca. 4 %)");

// Klammer-Hinweise verraten die Antwort nicht
await page.evaluate(() => { S.vocab.days[1] = [{ it: "per favore", de: "bitte" }, { it: "favore", de: "Gefallen (per favore = bitte)" }, { it: "mille", de: "tausend (grazie mille = vielen Dank)" }]; S.vocab.done = {}; startVocab(1); S.vocabRun.queue = [{ k: 1, st: 1, dir: "de" }]; prepVocabQ(); render(); });
check(await page.evaluate(() => !/\(/.test(document.querySelector(".vword").textContent)), "Schreib-Frage verrät die Antwort in Klammern");
// Notizbuch im Vokabelmodus üben
await page.evaluate(() => { S.book = { grazie: { de: "danke", miss: 1 }, conto: { de: "Rechnung", miss: 2 } }; S.vocabRun = null; screen = "vocab"; render(); });
await act("vstart", '[data-d="book"]');
check(await page.evaluate(() => S.vocabRun && S.vocabRun.day === "book" && S.vocabRun.total === 2), "Notizbuch lässt sich nicht üben");
await shot("notizbuch-ueben");
await act("pause");
check(await page.locator('#overlay [data-act="vcity"]').count() === 1 && await page.locator('#overlay #v-music').count() === 1, "Pause und Einstellungen sind nicht ein Menü");
await act("vcity");
check(await page.evaluate(() => screen === "home" && !volOpen && S.vocabPaused), "Zurück zur Stadt aus den Vokabeln klappt nicht");
if (await act("book")) await shot("heft");
await act("home");

// Handy-Zurück-Knopf: aus dem Shop zurück zur Pizzeria
await act("shop");
await page.goBack();
await page.waitForTimeout(200);
check(await page.evaluate(() => screen === "home"), "Zurück-Knopf führt nicht aus dem Shop zur Pizzeria");

// Einstellungen oben links: öffnen, alles stumm, nach Neuladen noch stumm, wieder laut
await page.locator('#screen [data-act="vol"]').first().click();
await shot("einstellungen");
await page.locator('#overlay [data-act="mute"]').click();
await shot("einstellungen-stumm");
check(await page.evaluate(() => S.muted && vol("music") === 0 && vol("sfx") === 0 && vol("voice") === 0), "Stumm setzt nicht alle Lautstärken auf 0");
await page.locator('#overlay [data-act="vol"]').click();
await page.reload();
check(await page.evaluate(() => S.muted), "Stumm geht beim Neuladen verloren");
await page.locator('#screen [data-act="mute"]').first().click();
check(await page.evaluate(() => !S.muted && vol("music") > 0), "Ton lässt sich oben links nicht wieder einschalten");

// Stimmen: Männer bekommen eine Männerstimme, Frauen eine Frauenstimme, sonst tiefer/höher
check(await page.evaluate(() => {
  const list = [{ lang: "en-US", name: "English" }, { lang: "it-IT", name: "it-it-x-ita-local" }, { lang: "it-IT", name: "it-it-x-itd-local" }];
  const m = pickVoice(list, sexOf("Zio Gennaro")), f = pickVoice(list, sexOf("Nonna Pina")), one = pickVoice([list[1]], "m");
  return m.voice.i === 2 && f.voice.i === 1 && one.voice.i === 0 && one.pitch < 1 && pickVoice(list, null).pitch === 1;
}), "Stimmenwahl nach Figur stimmt nicht");
// Aufgenommene Stimmen: Männer und Frauen haben eigene Aufnahmen, Bestellungen werden aus Bausteinen zusammengesetzt
check(await page.evaluate(async () => {
  const m = recParts("m", PERS["Zio Gennaro"].greet[0][0]), f = recParts("f", PERS["Nonna Pina"].greet[0][0]);
  const order = recParts("m", "Allora, prendo due margherite senza basilico ma con funghi, per favore.");
  const phone = recParts("f", "Pronto, pizzeria? Vorrei ordinare tre diavole per le otto. L'indirizzo è via Roma, numero dodici.");
  const none = recParts("f", "Questa frase non esiste nel gioco, davvero.");
  const r = await fetch(`stimmen/m/${m[0]}.mp3`);
  return m && m.length === 1 && f && f.length === 1 && order && order.length > 1 && phone && phone.length > 1 && none === null && r.ok;
}), "Aufgenommene Stimmen fehlen oder werden nicht gefunden");

// Laden einrichten ist vorerst aus: neuer Spieler und alter Stand mitten im Einrichten starten direkt
await fresh(null);
check(await page.locator('[data-act="start"]').count() === 1 && await page.locator('[data-act="setup"]').count() === 0, "Neuer Spieler sieht noch „Laden einrichten“");
await fresh({ setupDone: false, setupQuiz: { queue: [0], qi: 0 }, room: [] });
check(await page.evaluate(() => S.setupDone && !S.setupQuiz), "Alter Stand hängt im Einrichten fest");

// Spielstand-Code: kopieren, Stand ändern, Code einfügen holt den alten Stand zurück
await fresh({ setupDone: true, coins: 123, day: 4, book: { conto: { de: "Rechnung", miss: 2 } } });
await page.locator('#screen [data-act="vol"]').first().click();
await page.locator('#overlay [data-act="code-copy"]').click();
await page.waitForTimeout(300);
const code = await page.locator("#codebox").inputValue();
check(/^PP[01]\./.test(code), "Spielstand-Code wird nicht erzeugt");
await shot("spielstand-code");
await page.evaluate(() => { S.coins = 1; S.book = {}; save(); });
await page.locator('#overlay [data-act="code-paste"]').click();
await page.locator("#codebox").fill(code);
await page.locator('#overlay [data-act="code-load"]').click();
await page.waitForTimeout(300);
await page.reload();
check(await page.evaluate(() => S.coins === 123 && S.day === 4 && S.book.conto && S.book.conto.miss === 2), "Spielstand-Code stellt den Stand nicht wieder her");
check(await page.evaluate(async () => !(await loadCode("Quatsch")) && S.coins === 123), "Falscher Code verändert den Spielstand");

// Spielstand als Datei: speichern (Download), Stand ändern, Datei laden holt ihn zurück
await page.locator('#screen [data-act="vol"]').first().click();
const [dl] = await Promise.all([page.waitForEvent("download"), page.locator('#overlay [data-act="file-save"]').click()]);
const saveFilePath = join(OUT, "spielstand.txt");
await dl.saveAs(saveFilePath);
check(/^ParlaPizza-Spielstand-.*\.txt$/.test(dl.suggestedFilename()) && /^PP[01]\./.test(await readFile(saveFilePath, "utf8")), "Spielstand-Datei wird nicht gespeichert");
await page.waitForTimeout(200);
await shot("spielstand-datei");
await page.evaluate(() => { S.coins = 7; save(); });
await page.locator("#savefile").setInputFiles(saveFilePath);
await page.waitForFunction(() => S.coins === 123, null, { timeout: 5000 }).catch(() => {}); // Entpacken dauert manchmal länger
check(await page.evaluate(() => S.coins === 123 && /geladen/.test($("#overlay").textContent)), "Spielstand-Datei lädt den Stand nicht");
await page.locator("#savefile").setInputFiles({ name: "falsch.txt", mimeType: "text/plain", buffer: Buffer.from("Hallo") });
await page.waitForTimeout(300);
check(await page.evaluate(() => S.coins === 123 && /kein Spielstand/.test($("#overlay").textContent)), "Falsche Datei verändert den Spielstand");
await page.evaluate(() => { volOpen = false; codeBox = null; render(); });

// Jede alte Spielstand-Version aus test/spielstaende/ lädt, behält Geld, Tag und Stufe, und alle Bildschirme gehen
for (const f of (await readdir(join(ROOT, "test", "spielstaende"))).filter(f => f.endsWith(".json")).sort()) {
  const fx = JSON.parse(await readFile(join(ROOT, "test", "spielstaende", f), "utf8"));
  await page.goto(URL + "leer"); // leere Seite: das Spiel speichert beim Verlassen nicht über den Test-Stand
  await page.evaluate(r => { localStorage.clear(); localStorage.setItem("pizzeria-parola", JSON.stringify(r)); }, fx.raw);
  await page.goto(URL);
  const got = await page.evaluate(() => ({ coins: S.coins, day: S.day, level: S.level, ing: S.ing.length, lager: Math.min(...S.ing.map(stockOf)) }));
  check(got.coins === fx.expect.coins && got.day === fx.expect.day && got.level === fx.expect.level && (!fx.expect.ing || got.ing === fx.expect.ing) && (!fx.expect.lager || got.lager === fx.expect.lager), `Spielstand ${fx.name} lädt falsch: ${JSON.stringify(got)}`);
  check(await page.evaluate(() => { try { for (const s of ["home", "shop", "map", "book", "vocab"]) { screen = s; render(); } screen = "home"; render(); return true; } catch (e) { return String(e); } }) === true, `Spielstand ${fx.name}: Bildschirm bricht`);
  check(await page.evaluate(() => { S.streak++; save(); S.streak--; save(); return JSON.parse(JSON.parse(localStorage.getItem("pizzeria-parola")).state).v === SAVE_V; }), `Spielstand ${fx.name} wird nicht auf die neue Version gehoben`);
}
// Pizzen: neues Spiel startet mit sechs Zutaten, Bestellungen nutzen nur eigene Zutaten
await fresh({ coins: 200, level: 1, day: 3, setupDone: true });
check(await page.evaluate(() => { S.ing = [...START_ING]; for (let i = 0; i < 60; i++) { const o = orderStep(i % 3); if (![...o.want].every(hasIng)) return false; } return availPizze().length === 3; }), "Bestellung braucht Zutaten, die man nicht hat");
// Markt-Stand: Salami kaufen schaltet die Diavola frei, am nächsten Tag wird sie bestellt
check(await page.evaluate(() => { S.ing = [...START_ING]; S.lager = { ...START_LAGER }; S.level = 1; S.day = 3; startDay(); G.phase = "market"; G.mi = G.market.findIndex(m => m.kind === "stall"); render(); return G.mi >= 0 && !!document.querySelector('[data-act="stallbuy"][data-k="salame"]'); }), "Markt-Stand fehlt oder bietet keine Salami an");
await page.locator('[data-act="stallbuy"][data-k="salame"]').click();
// Feilschen: Signor Esposito nennt den Preis, steht als Figur im Markt, macht Gegenangebote
const P0 = await page.evaluate(() => espoPrice("salame"));
check(await page.evaluate(P => { const H = curStep().hag; return !!H && H.ask === P && H.offers.length >= 2 && new RegExp(numIt(P)).test(H.say) && document.querySelectorAll('[data-act="hoffer"]').length === H.offers.length && !!document.querySelector(".stage .walker"); }, P0), "Feilschen startet nicht");
await shot("markt-feilschen");
check(await page.evaluate(P => { const H = curStep().hag; hagOffer(H.offers.reduce((a, o) => o.n < a.n ? o : a).n); return H.pat === 1 && H.ask === P && /scherza/.test(H.say); }, P0), "Zu niedriges Angebot ärgert den Händler nicht");
check(await page.evaluate(P => { const H = curStep().hag; const o = H.offers.find(x => x.n >= H.min && x.n < H.ask - 1); if (!o) return false; hagOffer(o.n); render(); return H.ask < P && H.ask > o.n && H.rounds === 1; }, P0), "Gegenangebot fehlt");
await page.locator('[data-act="hpeek"]').click();
await shot("markt-gegenangebot");
await page.locator('[data-act="hdeal"]').click();
check(await page.evaluate(P => hasIng("salame") && stockOf("salame") === ESPO_KISTE && S.newPz === "diavola" && G.bought < P && G.haggled === P - G.bought && !curStep().hag && /Diavola/.test(G.banner), P0), "Kauf nach dem Feilschen klappt nicht");
await shot("markt-stand");
// Weggehen merkt sich den Preis; voller Preis ohne Feilschen geht auch
check(await page.evaluate(() => { const st = curStep(), k = st.offer.find(x => !st.bought.includes(x)); if (!k) return true; hagStart(k); hagLeave(); return !st.hag && st.asks[k] === espoPrice(k); }), "Weggehen beim Feilschen klappt nicht");
check(await page.evaluate(() => { const b = G.bought; while (G && screen === "play") advance(); return G.summary.buy === b; }), "Zutatenkauf fehlt in der Abrechnung");
check(await page.evaluate(() => { G = null; S.lager = Object.fromEntries(S.ing.map(k => [k, 30])); startDay(); return G.guests.some(g => g.steps.some(s => s.named === "diavola")) && S.newPz === null; }), "Neue Pizza wird am nächsten Tag nicht bestellt");
// Zutaten-Memory: vom Startbildschirm, Paare finden, einmal pro Spieltag Geld
await page.evaluate(() => { G = null; screen = "home"; S.memDay = 0; render(); });
await act("memo");
check(await page.evaluate(() => screen === "memo" && document.querySelectorAll('[data-act="mflip"]').length === 12), "Memory startet nicht");
await page.evaluate(() => { const c = MEMO.cards, a = c.findIndex(x => x.pic), b = c.findIndex(x => !x.pic && x.k !== c[a].k); memoFlip(a); memoFlip(b); });
await shot("memory-falsch");
await page.waitForTimeout(1300);
check(await page.evaluate(() => MEMO.open.length === 0 && MEMO.miss === 1), "Falsches Memory-Paar wird nicht wieder umgedreht");
await page.evaluate(() => { const c = MEMO.cards; [...new Set(c.map(x => x.k))].slice(0, 3).forEach(k => { memoFlip(c.findIndex(x => x.k === k && x.pic)); memoFlip(c.findIndex(x => x.k === k && !x.pic)); }); });
await shot("memory-halb");
check(await page.evaluate(() => { const before = S.coins, c = MEMO.cards; [...new Set(c.map(x => x.k))].forEach(k => { memoFlip(c.findIndex(x => x.k === k && x.pic)); memoFlip(c.findIndex(x => x.k === k && !x.pic)); }); return MEMO.done && MEMO.reward === 11 && S.coins === before + 11 && S.memDay === S.day; }), "Memory-Belohnung stimmt nicht");
await shot("memory-fertig");
check(await page.evaluate(() => { startMemo(); const before = S.coins, c = MEMO.cards; [...new Set(c.map(x => x.k))].forEach(k => { memoFlip(c.findIndex(x => x.k === k && x.pic)); memoFlip(c.findIndex(x => x.k === k && !x.pic)); }); return MEMO.done && MEMO.reward === 0 && S.coins === before; }), "Memory belohnt mehrmals am selben Tag");
await page.evaluate(() => { screen = "home"; render(); });
// Stammgäste mit Persönlichkeit, Reaktionen auf falsche Antworten, Geschichten über mehrere Tage
check(await page.evaluate(() => Object.keys(PERS).length === NAMES.length && NAMES.every(n => PERS[n].greet.length && PERS[n].talk.length && PERS[n].huh[0].length && PERS[n].huh[1].length)), "Nicht jeder Stammgast hat eigene Sätze");
check(await page.evaluate(() => PERS_ITEMS.every(x => x[4].length === 3 && x[4].every(w => WRONG_DE[w]) && x[3] && x[5])), "Gästesätze ohne Übersetzung oder Tipp");
check(await page.evaluate(() => { S.level = 1; S.story = null; S.storiesDone = []; S.storyNext = 99; let own = 0; for (let k = 0; k < 20; k++) { G = null; startDay(); G.guests.forEach(g => { const P = PERS[g.name]; if (P && g.steps.some(st => P.greet.concat(P.talk).some(x => x[0] === st.it))) own++; }); } return own > 10; }), "Stammgäste sagen nie ihre eigenen Sätze");
await page.evaluate(() => { S.level = 0; S.story = null; S.storiesDone = []; S.storyNext = 1; S.day = 5; G = null; startDay(); G.gi = G.guests.findIndex(g => g.story); G.si = 0; G.entered = G.gi; screen = "play"; render(); });
check(await page.evaluate(() => { const g = curGuest(); return g && g.story === "proposta" && g.name === "Marco" && /segreto/.test(curStep().it) && /Geschichte/.test($(".who").textContent) && G.guests.filter(x => x.name === "Marco").length === 1; }), "Geschichte startet nicht");
check(await page.evaluate(() => { const st = curStep(), i = st.opts.findIndex(o => !o.ok); wrongAnswer(i); render(); return !!st.react && PERS.Marco.huh[0].some(r => r[0] === st.react[0]) && !!document.querySelector(".bubble .react"); }), "Gast reagiert nicht auf falsche Antwort");
await shot("geschichte-reaktion");
check(await page.evaluate(() => { const st = curStep(); wrongAnswer(st.opts.findIndex((o, i) => !o.ok && !st.bad.includes(i))); return PERS.Marco.huh[1].some(r => r[0] === st.react[0]); }), "Verärgerte Reaktion fehlt");
check(await page.evaluate(() => { while (screen === "play" && G && !G.summary) { const st = curStep(); if (!st.done) { st.done = true; st.fb = ["good", ""]; } advance(); } return S.story && S.story.part === 1 && S.story.day === S.day + 1; }), "Geschichte geht nach dem Tag nicht weiter");
check(await page.evaluate(() => { G = null; startDay(); return !G.guests.some(g => g.story); }), "Nächster Teil kommt zu früh");
check(await page.evaluate(() => { G = null; S.day++; startDay(); const g = G.guests.find(x => x.story); return g && g.name === "Giulia"; }), "Zweiter Teil der Geschichte fehlt");
await page.evaluate(() => { G = null; screen = "home"; S.story = null; S.storyNext = 99; render(); });
// Rezeptbuch mit Sternen
await page.evaluate(() => { G = null; screen = "home"; S.pz = { margherita: { ok: 9 } }; menuOpen = true; render(); });
check(await page.evaluate(() => /Il ricettario/.test($("#overlay").textContent) && $("#overlay").querySelectorAll(".mi.locked").length > 0 && /Dir fehlen/.test($("#overlay").textContent)), "Rezeptbuch fehlt");
await shot("rezeptbuch");
await page.evaluate(() => { menuOpen = false; render(); });

// Einrichtung im 3D-Restaurant: kaufen, Moretti fragt nach dem Platz, ziehen, drehen, einlagern, aufstellen
await fresh({ coins: 1000, level: 2, day: 5, setupDone: true, place: { forno: [0, 0], frigo: [7, 0], tavoli: [2, 4], bancone: [3, 2] } });
await page.evaluate(() => { screen = "shop"; render(); });
await page.locator('[data-act="buy"][data-id="tavoli2"]').click();
await page.waitForFunction(() => L3.items.length && !L3.building && L3.byKey.tavoli && L3.byKey.tavoli.obj, null, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(300);
check(await page.evaluate(() => S.owned.includes("tavoli2") && S.coins === 970 && screen === "locale" && L3.sel === "tavoli" && /Dove mettiamo/.test($(".loc-msg").textContent)), "Möbel kaufen fragt nicht nach dem Platz");
check(await page.evaluate(() => L3.ok && !!document.querySelector("#loc3d canvas")), "3D-Restaurant startet nicht (WebGL)");
// Alte Plätze vom Raster sind umgerechnet: Ofen links an der Rückwand, Kühlung rechts, Theke in der Mitte
check(await page.evaluate(() => { const L = S.locale; return L.forno.x < -3 && L.forno.z < -2.5 && L.frigo.x > 3 && L.frigo.z < -2.5 && Math.abs(L.bancone.x + .56) < .3; }), "Alte Möbelplätze werden nicht übernommen");
await shot("einrichtung-3d");
const scr = k => page.evaluate(k => { const I = L3.byKey[k], v = new THREE.Vector3(I.pos.x, I.pos.y + .4, I.pos.z).project(L3.cam), r = L3.r.domElement.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; }, k);
{
  const before = await page.evaluate(() => JSON.stringify(S.locale.tavoli));
  const [x, y] = await scr("tavoli");
  await page.mouse.move(x, y); await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(x + i * 8, y - i * 7);
  await page.mouse.up(); await page.waitForTimeout(200);
  check(await page.evaluate(b => JSON.stringify(S.locale.tavoli) !== b && placeOk(L3.byKey.tavoli, L3.byKey.tavoli.pos), before), "Tisch lässt sich nicht ziehen");
  // Ins Gehwegfeld oder in die Tür darf der Tisch nicht
  check(await page.evaluate(() => { const I = L3.byKey.tavoli; return !placeOk(I, { x: 0, z: LD / 2 - .5, r: 0, y: 0 }) && !placeOk(I, { x: 0, z: OUT_Z0 + 1, r: 0, y: 0 }) && !placeOk(I, Object.assign({}, L3.byKey.bancone.pos)); }), "Tisch darf in die Tür, nach draußen oder auf die Theke");
}
await page.locator('[data-act="lrot"]').click();
check(await page.evaluate(() => S.locale.tavoli.r === 1 || S.locale.tavoli.r === 2), "Drehen geht nicht");
await page.locator('[data-act="lstore"]').click();
check(await page.evaluate(() => S.locale.tavoli.st === 1 && !L3.sel && document.querySelectorAll('[data-act="lput"]').length === 1), "Einlagern geht nicht");
await page.locator('[data-act="lput"]').click();
check(await page.evaluate(() => !S.locale.tavoli.st && L3.sel === "tavoli" && placeOk(L3.byKey.tavoli, L3.byKey.tavoli.pos)), "Aus dem Lager aufstellen geht nicht");
// Kleine Sachen stehen auf der Theke, Wandstücke an der Wand, nach Neuladen alles am selben Platz
await page.evaluate(() => { S.owned.push("moka", "foto"); save(); render(); });
await page.waitForFunction(() => !L3.building && L3.byKey.caffe && L3.byKey.caffe.pos && L3.byKey.foto && L3.byKey.foto.pos, null, { timeout: 15000 }).catch(() => {});
check(await page.evaluate(() => S.locale.caffe.y > .8 && S.locale.foto.y > 1), "Moka steht nicht auf der Theke oder Bild hängt nicht an der Wand");
await shot("einrichtung-3d-moka");
{
  const keep = await page.evaluate(() => { flushSave(); return JSON.stringify(S.locale); });
  await page.reload(); await page.evaluate(() => { screen = "locale"; render(); });
  await page.waitForFunction(() => L3.items.length && !L3.building && L3.syncSig === locStruct(), null, { timeout: 15000 }).catch(() => {});
  check(await page.evaluate(k => JSON.stringify(S.locale) === k, keep), "Möbelplätze gehen beim Neuladen verloren");
}
check(await page.evaluate(() => { screen = "home"; render(); return !!document.querySelector('[data-act="locale"]'); }), "Startseite hat keinen Knopf zum Restaurant");
// Spieltag zeigt das eigene 3D-Restaurant (Blick hinter der Theke) statt des gemalten Bilds
await page.waitForFunction(() => L3.stage && L3.stage.sig === locSig(), null, { timeout: 15000 }).catch(() => {});
check(await page.evaluate(() => { G = null; startDay(); G.phase = "guest"; G.entered = -1; screen = "play"; render(); const im = document.querySelector(".stage image"); return !!im && /^data:image/.test(im.getAttribute("href")) && !!document.querySelector(".stage .walker"); }), "Spieltag zeigt nicht das 3D-Restaurant");
await shot("spieltag-3d");
await page.evaluate(() => { G = null; screen = "home"; render(); });
check(await page.evaluate(() => { S.owned = SHOP.filter(i => i.fx && i.fx.tip).map(i => i.id); return mult() === 1 + TIP_CAP; }), "Trinkgeld-Deckel fehlt");
check(await page.evaluate(() => { S.owned = ["tavoli2", "tavoli3", "terrazza"]; S.lager = Object.fromEntries(S.ing.map(k => [k, 99])); G = null; startDay(); return G.guests.length === LEVELS[S.level].guests + 3; }), "Tische bringen keine Gäste");
// Holzofen: eine falsche Pizza pro Tag zählt nicht
check(await page.evaluate(() => { S.owned = ["forno"]; G = null; startDay(); const gi = G.guests.findIndex(g => g.steps.some(x => x.kind === "pizza")); G.gi = gi; G.si = G.guests[gi].steps.findIndex(x => x.kind === "pizza"); render(); return true; }), "");
await page.locator('[data-act="serve"]').click();
check(await page.evaluate(() => G.ovenUsed && curStep().wrong === 0 && /forno/.test(G.banner)), "Holzofen verzeiht die falsche Pizza nicht");
// Kaffee: Zutaten in der richtigen Reihenfolge und die richtige Tasse
check(await page.evaluate(() => { S.owned = ["moka", "macchina"]; for (let n = 0; n < 30; n++) { G = null; startDay(); const gi = G.guests.findIndex(g => g.steps.some(x => x.kind === "coffee")); if (gi >= 0) { G.gi = gi; G.si = G.guests[gi].steps.findIndex(x => x.kind === "coffee"); render(); return true; } } return false; }), "Kein Kaffee bestellt, obwohl die Moka-Kanne da ist");
await shot("kaffee");
const cf = await page.evaluate(() => ({ want: curStep().want, cup: curStep().cup }));
for (const k of cf.want) await page.locator(`[data-act="cing"][data-k="${k}"]`).click();
await page.locator(`[data-act="cup"][data-k="${cf.cup}"]`).click();
await page.locator('[data-act="cserve"]').click();
check(await page.evaluate(() => curStep().done && curStep().wrong === 0), "Richtig zubereiteter Kaffee wird nicht angenommen");
await page.evaluate(() => { G = null; screen = "home"; S.owned = []; render(); });

// Gesundheitsamt: Brief am Abend davor, vier Fragen, Ergebnis in der Abrechnung
await fresh({ coins: 100, level: 1, day: 6, setupDone: true });
check(await page.evaluate(() => { S.inspDue = 7; G = null; startDay(); G.phase = "guest"; while (G && screen === "play") advance(); return G.summary.letter === true; }), "Brief vom Gesundheitsamt fehlt am Abend davor");
await shot("brief-asl");
check(await page.evaluate(() => { G = null; startDay(); return G.guests[0].insp && G.guests[0].name === "Dottoressa Severini" && G.guests[0].steps.length === 4; }), "Dottoressa Severini kommt nicht");
await page.evaluate(() => render());
await shot("ispettrice");
check(await page.evaluate(() => { const coins = S.coins; G.guests[0].steps.forEach(() => { finish(); advance(); }); const pass = G.insp && G.insp.res === "pass"; while (G && screen === "play") advance(); return pass && S.cert === 3 && G.summary.net === G.summary.net && S.inspDue > S.day; }), "Bestandene Prüfung gibt kein Zertifikat");
check(await page.evaluate(() => { S.inspDue = S.day; G = null; startDay(); G.guests[0].steps.forEach(st => { wrongAnswer(0); finish(); advance(); }); const fail = G.insp.res === "fail" && G.inspMoney === -20; while (G && screen === "play") advance(); return fail && S.inspDue === S.day; }), "Durchgefallen: keine Strafe oder kein Wiederbesuch am nächsten Tag");
await page.evaluate(() => { G = null; screen = "home"; render(); });

// Antwort antippen: die Stimme liest sie vor
await fresh({ coins: 10, level: 0, day: 1, setupDone: true });
await page.evaluate(() => { window.__said = []; const o = speak; speak = (t, w) => { __said.push(t); }; G = null; startDay(); render(); });
await page.locator('#screen .opt').first().click();
check(await page.evaluate(() => __said.includes(curStep().opts[0].t)), "Angetippte Antwort wird nicht vorgelesen");
await page.evaluate(() => { G = null; screen = "home"; render(); });

// Kaputter Hauptstand: die Sicherheitskopie springt ein
await page.goto(URL + "leer"); // leere Seite: das Spiel speichert beim Verlassen nicht über den Test-Stand
await page.evaluate(() => { localStorage.clear(); localStorage.setItem("pizzeria-parola-backup", JSON.stringify({ savedAt: 1, state: JSON.stringify({ v: 3, S: { coins: 321, day: 7, setupDone: true }, G: null, screen: "home" }) })); localStorage.setItem("pizzeria-parola", "{kaputt"); });
await page.goto(URL);
check(await page.evaluate(() => S.coins === 321), "Sicherheitskopie wird bei kaputtem Spielstand nicht genutzt");

// Alter Spielstand ohne neue Felder muss weiter laden
await fresh({ coins: 77, level: 1, day: 5, setupDone: true, vol: { music: .3 } });
check(await page.evaluate(() => S.coins === 77 && S.level === 1 && S.muted === false && S.vol.sfx === .8), "Alter Spielstand wird nicht richtig übernommen");

// Ausflüge: Eisladen und Hafen einmal komplett durchspielen
for (const trip of ["gelateria", "porto"]) {
  await fresh({ setupDone: true, coins: 10, day: 2 });
  await act("map");
  if (trip === "gelateria") {
    await page.waitForTimeout(1500);
    check(await page.locator(".map.city canvas").count() === 1 && await page.locator(".map .city-pin").count() === 9, "Karte zeigt kein 3D-Viertel mit allen Orten");
    await shot("karte");
  }
  await page.locator(`.map [data-act="place"][data-p="${trip}"]`).click();
  await shot(`ausflug-${trip}`);
  for (let i = 0; i < 10 && await page.evaluate(() => screen === "play"); i++) {
    if (await page.locator('[data-act="next"]').count()) { await act("next"); continue; }
    const k = await page.evaluate(() => curStep().opts.findIndex(o => o.ok));
    await page.locator(`[data-act="opt"][data-i="${k}"]`).click();
  }
  check(await page.locator("#kasse .kasse-pop").count() === 1, "Kassen-Symbol erscheint nicht beim Geldbekommen");
  await shot(`ausflug-${trip}-ende`);
  check(await page.evaluate(() => screen === "summary" && S.coins > 10), `Ausflug ${trip} endet nicht mit Trinkgeld`);
}

// Startseite ist das 3D-Viertel: die Lernhäuser führen zu Vokabeln, Memory, Notizbuch und Rezepten
await fresh({ setupDone: true, coins: 10, day: 2 });
check(await page.evaluate(() => screen === "home" && !!document.querySelector(".s-home .map.city canvas") && document.querySelectorAll(".s-home .city-pin").length === 9), "Startseite zeigt nicht das 3D-Viertel mit allen Orten");
await shot("startseite-stadt");
for (const [p, want] of [["scuola", "vocab"], ["bar", "memo"], ["biblioteca", "biblio"]]) {
  await page.evaluate(() => { screen = "home"; render(); });
  await page.locator(`.city-pin[data-p="${p}"]`).click();
  check(await page.evaluate(w => screen === w, want), `Haus ${p} führt nicht zu ${want}`);
}
// Biblioteca: Kapitel lesen, Fragen beantworten, einmal Geld
await page.evaluate(() => { screen = "home"; render(); });
await page.locator('.city-pin[data-p="biblioteca"]').click();
check(await page.evaluate(() => screen === "biblio") && await page.locator('[data-act="leggi"]').count() >= 3, "Biblioteca zeigt kein Bücherregal");
await page.locator('[data-act="leggi"][data-c="0"]').click();
await shot("buch-lesen");
check(await page.evaluate(() => LIBRI.every(B => B.capitoli.every(C => C.pagine.every(([it]) => (it.match(/[A-Za-zÀ-ÖØ-öø-ÿ]+'?/g) || []).every(w => lookup(w)))))), "Buch hat Wörter ohne Übersetzung");
await page.evaluate(() => { const before = S.coins; LETTURA.p = libro("pinocchio").capitoli[0].pagine.length - 1; letturaPage(1); for (let i = 0; i < 3; i++) { const C = libro("pinocchio").capitoli[0]; letturaAnswer(LETTURA.q.opts.indexOf(C.domande[LETTURA.q.i][1])); letturaNext(); } window.__libGain = S.coins - before; });
check(await page.evaluate(() => window.__libGain === LIBRO_PREMIO && S.libri.pinocchio.done.includes(0) && LETTURA.end), "Kapitel gibt kein Geld oder wird nicht gemerkt");
// Poesie: Kinderreim ergänzen, eine Stufe pro Spieltag, nach drei Stufen auswendig
check(await page.evaluate(() => POESIE.every(P => P.versi.every(([it]) => poWords(it).every(w => lookup(w))))), "Gedicht hat Wörter ohne Übersetzung");
check(await page.evaluate(() => { const solve = () => { startPoesia("giro"); startPoesiaQuiz(); while (POESIA.quiz) { const g = POESIA.quiz.gaps[POESIA.quiz.gi]; poesiaAnswer(g.opts.indexOf(g.word)); } };
  const c0 = S.coins; solve(); solve(); const l1 = S.poesie.giro.lvl; S.day++; solve(); S.day++; solve(); return l1 === 1 && S.poesie.giro.lvl === POESIA_MAX && S.coins === c0 + POESIA_PREMIO; }), "Gedicht-Stufen oder Belohnung stimmen nicht");
await page.evaluate(() => { screen = "home"; render(); });
await page.locator('.city-pin[data-p="forno"]').click();
check(await page.evaluate(() => menuOpen), "Forno öffnet keine Rezepte");
await page.evaluate(() => { menuOpen = false; render(); });

// Karte: Markt ist außerhalb des Spieltags offen, die Pizzeria startet den Tag
await fresh({ setupDone: true, coins: 10, day: 2 });
await act("map");
await page.locator('.map [data-act="place"][data-p="mercato"]').click();
check(await page.evaluate(() => screen === "mercato" && document.querySelectorAll('[data-act="mkbank"]').length === BANCHE.length), "Markt öffnet nicht außerhalb des Spieltags");
await shot("mercato");
await page.evaluate(() => { screen = "home"; render(); });
await page.locator('.map [data-act="place"][data-p="pizzeria"]').click();
check(await page.evaluate(() => screen === "play" && !G.trip), "Pizzeria auf der Karte startet keinen Spieltag");
// Während des Spieltags ist der Markt zu
check(await page.evaluate(() => { goPlace("mercato"); const ok = screen !== "mercato" && /läuft noch/.test(mapMsg); mapMsg = ""; return ok; }), "Markt öffnet mitten im Spieltag");

// Mercato: jede Zutat an genau einem Stand, Kiste kaufen, Pizzen verbrauchen den Vorrat, ohne Vorrat kein Spieltag
await fresh({ setupDone: true, coins: 100, day: 2, level: 1 });
check(await page.evaluate(() => { const all = BANCHE.flatMap(b => b.ing); return all.length === Object.keys(ING).length && new Set(all).size === all.length && all.every(k => ING[k] && ING[k][3] > 0); }), "Nicht jede Zutat gibt es genau einmal auf dem Markt");
await page.evaluate(() => { S.ing = [...START_ING]; S.lager = { ...START_LAGER }; G = null; mkGo(); mkTab = "salumi"; render(); });
await page.locator('[data-act="mkbuy"][data-k="salame"]').click();
check(await page.evaluate(() => hasIng("salame") && stockOf("salame") === KISTE && S.coins === 100 - mkPrice("salame") && S.newPz === "diavola" && /Diavola/.test(mkMsg)), "Kiste kaufen im Mercato klappt nicht");
await shot("mercato-salumeria");
check(await page.evaluate(() => { S.lager.mozzarella = 0; const c = S.coins, n = mkList().length; mkFill(); return n > 0 && S.coins < c && mkList().length === 0 && stockOf("mozzarella") >= KISTE; }), "Vorrat auffüllen klappt nicht");
check(await page.evaluate(() => { const before = { ...S.lager }; G = null; startDay(); const need = {}; G.guests.forEach(g => g.steps.forEach(st => { if (st.kind === "pizza") [...st.want].forEach(k => need[k] = (need[k] || 0) + st.qty); })); const ok = Object.keys(need).every(k => G.use[k] >= need[k]); while (G && screen === "play") { const st = curStep(); if (!st.done) { st.done = true; st.fb = ["good", ""]; } advance(); } return ok && Object.keys(G.use).every(k => S.lager[k] === before[k] - G.use[k]) && G.summary.used > 0; }), "Pizzen verbrauchen den Vorrat nicht");
check(await page.evaluate(() => { S.lager = { pomodoro: 1, mozzarella: 1, basilico: 1, olio: 1 }; G = null; startDay(); const pz = G.guests.flatMap(g => g.steps).filter(st => st.kind === "pizza"); return pz.length === 1 && pz[0].qty === 1 && G.away > 0; }), "Gäste bestellen mehr, als im Vorrat ist");
check(await page.evaluate(() => { G = null; S.lager = {}; screen = "home"; render(); return true; }), "");
await act("start");
check(await page.evaluate(() => screen === "mercato" && !G && /leer/.test(mkMsg)), "Leere Küche schickt nicht zum Markt");
await page.evaluate(() => { screen = "home"; render(); });

// Jede Antwortmöglichkeit hat eine deutsche Übersetzung, auch bei der Rechnung mit Zahl
check(await page.evaluate(() => [GREET, TALK, PROB, DRINK, DIR, CRITIC, MARKET].flat().filter(x => x[3]).every(x => mcStep(x, "x").opts.every(o => o.de)) && deOf("Subito! Sono 12 euro.") === "Sofort! Das macht 12 Euro."), "Antworten ohne Übersetzung");

// Wochentage: Tag 3 ist mercoledì (Markttag), Tag 4 nicht
check(await page.evaluate(() => isMarketDay(3) && !isMarketDay(4) && giorno(1)[0] === "lunedì" && giorno(8)[0] === "lunedì"), "Wochentage oder Markttage stimmen nicht");

// Wort antippen: einmal nur Übersetzung, doppelt ins Notizbuch
await fresh({ setupDone: true, coins: 25, day: 1 });
await act("start");
{
  const w = page.locator('[data-act="word"]').first();
  if (await w.count()) {
    const it = (await w.getAttribute("data-w")).toLowerCase();
    await w.click();
    check(await page.evaluate(k => !S.book[k] && !document.querySelector("#pop").hidden, it), "Einfaches Antippen legt Wort schon ins Notizbuch");
    await page.waitForTimeout(500);
    await w.click(); await w.click();
    check(await page.evaluate(k => !!S.book[k], it), "Doppeltipp legt Wort nicht ins Notizbuch");
  } else console.log("  (kein antippbares Wort gefunden)");
}

// Lektion abbrechen: Pause-Fenster per Zurück-Knopf, Abbrechen gibt keine Belohnung und keinen neuen Tag
await fresh({ setupDone: true, coins: 25, day: 2 });
await act("start");
await page.locator('[data-act="opt"]').first().click().catch(() => {});
await page.goBack();
await page.waitForTimeout(200);
check(await page.evaluate(() => volOpen && screen === "play") && await page.locator('#overlay [data-act="quit"]').count() === 1, "Zurück-Knopf im Spiel öffnet keine Pause mit „Zurück zur Stadt“");
await shot("pause");
await page.locator('#overlay [data-act="abort"]').click();
check(await page.evaluate(() => screen === "home" && !G && S.coins === 25 && S.day === 2), "Abbrechen gibt doch Belohnung oder neuen Tag");

// Schlupflöcher: Markt-Zutaten durch Abbrechen umsonst, Ausflüge endlos wiederholen, Ausflug löscht laufenden Tag
await fresh({ setupDone: true, coins: 100, day: 3, level: 1 });
const k0 = await page.evaluate(() => { S.ing = [...START_ING]; S.lager = { ...START_LAGER }; startDay(); G.phase = "market"; G.mi = G.market.findIndex(s => s.kind === "stall"); const k = curStep().offer[0]; stallBuy(k, espoPrice(k)); render(); return S.ing.includes(k) ? k : null; });
await act("pause"); await page.locator('#overlay [data-act="abort"]').click();
check(k0 && await page.evaluate(k => !S.ing.includes(k) && !stockOf(k) && S.coins === 100, k0), "Abbrechen nach dem Markt behält die Zutaten ohne zu zahlen");
check(await page.evaluate(() => { startDay(); goPlace("porto"); const ok = !G.trip && screen === "play" && /läuft noch/.test(mapMsg); G = null; mapMsg = ""; return ok; }), "Ausflug löscht einen laufenden Spieltag");
check(await page.evaluate(() => { const run = () => { const c = S.coins; startTrip("porto"); G.guests[0].steps.forEach(() => { finish(); G.si++; }); endTrip(); return S.coins - c; }; const a = run(), b = run(); screen = "home"; G = null; render(); return a > 0 && b === 0; }), "Ausflug zahlt mehrmals am selben Spieltag Trinkgeld");

// Kein Scrollen nötig: Startseite, Shop und erster Gast passen auf den Bildschirm
await fresh({ setupDone: true, coins: 25, day: 3 });
const fits = async name => check(await page.evaluate(() => { const s = document.querySelector("#screen"); return s.scrollHeight - s.clientHeight <= 2; }), `${name} muss gescrollt werden`);
await fits("Startseite"); await act("shop"); await fits("Shop"); await act("home"); await act("start"); await fits("Spiel");

// 2) Laden schon eingerichtet: einen Spieltag spielen
await fresh({ setupDone: true, coins: 25, day: 1 });
await act("start");
await shot("spieltag");
for (let i = 0; i < 12; i++) {
  if (await page.locator('[data-act="next"]').count()) { await act("next"); continue; }
  if (await page.locator('[data-act="serve"]').count()) { await act("idk") || await act("serve"); await shot(`schritt-${i}-pizza`); continue; }
  if (await page.locator('[data-act="opt"]').count()) { await act("opt"); await shot(`schritt-${i}`); if (await page.locator('[data-act="opt"]').count()) await act("idk"); continue; }
  break;
}
await shot("ende");

await browser.close();
server.close();

if (errors.length) { console.log("\nFEHLER:"); errors.forEach(e => console.log(" -", e)); process.exit(1); }
console.log(`\nKeine JavaScript-Fehler. ${n} Screenshots in test/screenshots/`);
