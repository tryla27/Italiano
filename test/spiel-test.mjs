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
const TYPES = { ".html": "text/html", ".mp3": "audio/mpeg", ".png": "image/png", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp" };
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
async function act(a, extra = "") {
  const el = page.locator(`[data-act="${a}"]${extra}`).first();
  if (!(await el.count())) { console.log(`  (Knopf "${a}" nicht gefunden)`); return false; }
  await el.click();
  return true;
}
async function fresh(state) {
  await page.goto(URL);
  await page.evaluate(s => { localStorage.clear(); if (s) localStorage.setItem("pizzeria-parola", JSON.stringify({ savedAt: Date.now(), state: JSON.stringify({ v: 2, S: s, G: null, screen: "home" }) })); }, state);
  await page.reload();
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
await act("vlist");
await act("home");
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

// Jede alte Spielstand-Version aus test/spielstaende/ lädt, behält Geld, Tag und Stufe, und alle Bildschirme gehen
for (const f of (await readdir(join(ROOT, "test", "spielstaende"))).filter(f => f.endsWith(".json")).sort()) {
  const fx = JSON.parse(await readFile(join(ROOT, "test", "spielstaende", f), "utf8"));
  await page.goto(URL);
  await page.evaluate(r => { localStorage.clear(); localStorage.setItem("pizzeria-parola", JSON.stringify(r)); }, fx.raw);
  await page.reload();
  const got = await page.evaluate(() => ({ coins: S.coins, day: S.day, level: S.level, ing: S.ing.length }));
  check(got.coins === fx.expect.coins && got.day === fx.expect.day && got.level === fx.expect.level && (!fx.expect.ing || got.ing === fx.expect.ing), `Spielstand ${fx.name} lädt falsch: ${JSON.stringify(got)}`);
  check(await page.evaluate(() => { try { for (const s of ["home", "shop", "map", "book", "vocab"]) { screen = s; render(); } screen = "home"; render(); return true; } catch (e) { return String(e); } }) === true, `Spielstand ${fx.name}: Bildschirm bricht`);
  check(await page.evaluate(() => { S.streak++; save(); S.streak--; save(); return JSON.parse(JSON.parse(localStorage.getItem("pizzeria-parola")).state).v === SAVE_V; }), `Spielstand ${fx.name} wird nicht auf die neue Version gehoben`);
}
// Pizzen: neues Spiel startet mit sechs Zutaten, Bestellungen nutzen nur eigene Zutaten
await fresh({ coins: 200, level: 1, day: 3, setupDone: true });
check(await page.evaluate(() => { S.ing = [...START_ING]; for (let i = 0; i < 60; i++) { const o = orderStep(i % 3); if (![...o.want].every(hasIng)) return false; } return availPizze().length === 3; }), "Bestellung braucht Zutaten, die man nicht hat");
// Markt-Stand: Salami kaufen schaltet die Diavola frei, am nächsten Tag wird sie bestellt
check(await page.evaluate(() => { S.ing = [...START_ING]; S.level = 1; S.day = 3; startDay(); G.phase = "market"; G.mi = G.market.findIndex(m => m.kind === "stall"); render(); return G.mi >= 0 && !!document.querySelector('[data-act="stallbuy"][data-k="salame"]'); }), "Markt-Stand fehlt oder bietet keine Salami an");
await page.locator('[data-act="stallbuy"][data-k="salame"]').click();
// Feilschen: Signor Esposito nennt den Preis, steht als Figur im Markt, macht Gegenangebote
check(await page.evaluate(() => { const H = curStep().hag; return !!H && H.ask === 15 && H.offers.length >= 2 && /quindici/.test(H.say) && document.querySelectorAll('[data-act="hoffer"]').length === H.offers.length && !!document.querySelector(".stage .walker"); }), "Feilschen startet nicht");
await shot("markt-feilschen");
check(await page.evaluate(() => { const H = curStep().hag; hagOffer(H.offers.reduce((a, o) => o.n < a.n ? o : a).n); return H.pat === 1 && H.ask === 15 && /scherza/.test(H.say); }), "Zu niedriges Angebot ärgert den Händler nicht");
check(await page.evaluate(() => { const H = curStep().hag; const o = H.offers.find(x => x.n >= H.min && x.n < H.ask - 1); if (!o) return false; hagOffer(o.n); render(); return H.ask < 15 && H.ask > o.n && H.rounds === 1; }), "Gegenangebot fehlt");
await page.locator('[data-act="hpeek"]').click();
await shot("markt-gegenangebot");
await page.locator('[data-act="hdeal"]').click();
check(await page.evaluate(() => hasIng("salame") && S.newPz === "diavola" && G.bought < 15 && G.haggled === 15 - G.bought && !curStep().hag && /Diavola/.test(G.banner)), "Kauf nach dem Feilschen klappt nicht");
await shot("markt-stand");
// Weggehen merkt sich den Preis; voller Preis ohne Feilschen geht auch
check(await page.evaluate(() => { const st = curStep(), k = st.offer.find(x => !hasIng(x)); if (!k) return true; hagStart(k); hagLeave(); return !st.hag && st.asks[k] === ING[k][3]; }), "Weggehen beim Feilschen klappt nicht");
check(await page.evaluate(() => { const b = G.bought; while (G && screen === "play") advance(); return G.summary.buy === b; }), "Zutatenkauf fehlt in der Abrechnung");
check(await page.evaluate(() => { G = null; startDay(); return G.guests.some(g => g.steps.some(s => s.named === "diavola")) && S.newPz === null; }), "Neue Pizza wird am nächsten Tag nicht bestellt");
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
// Rezeptbuch mit Sternen
await page.evaluate(() => { G = null; screen = "home"; S.pz = { margherita: { ok: 9 } }; menuOpen = true; render(); });
check(await page.evaluate(() => /Il ricettario/.test($("#overlay").textContent) && $("#overlay").querySelectorAll(".mi.locked").length > 0 && /Dir fehlen/.test($("#overlay").textContent)), "Rezeptbuch fehlt");
await shot("rezeptbuch");
await page.evaluate(() => { menuOpen = false; render(); });

// Einrichtung: kaufen, Moretti fragt nach dem Platz, auf ein grünes Feld stellen
await fresh({ coins: 1000, level: 2, day: 5, setupDone: true });
await page.evaluate(() => { screen = "shop"; render(); });
await page.locator('[data-act="buy"][data-id="tavoli2"]').click();
check(await page.evaluate(() => S.owned.includes("tavoli2") && S.coins === 970 && placing && placing.key === "tavoli" && /Dove mettiamo/.test($(".board-line").textContent)), "Möbel kaufen fragt nicht nach dem Platz");
await shot("einrichtung");
const okCell = await page.evaluate(() => { const c = document.querySelector(".board .cell.ok"); return c && [c.dataset.x, c.dataset.y]; });
await page.locator(`.board .cell.ok[data-x="${okCell[0]}"][data-y="${okCell[1]}"]`).click();
check(await page.evaluate(([x, y]) => S.place.tavoli[0] === +x && S.place.tavoli[1] === +y && !placing, okCell), "Möbel lässt sich nicht umstellen");
check(await page.evaluate(() => { const before = S.place.tavoli + ""; placing = { key: "tavoli", msg: "" }; furnPut(0, 0); return S.place.tavoli + "" === before; }), "Tisch darf nicht an die Küchenwand");
check(await page.evaluate(() => { S.owned = SHOP.filter(i => i.fx && i.fx.tip).map(i => i.id); return mult() === 1 + TIP_CAP; }), "Trinkgeld-Deckel fehlt");
check(await page.evaluate(() => { S.owned = ["tavoli2", "tavoli3", "terrazza"]; G = null; startDay(); return G.guests.length === LEVELS[S.level].guests + 3; }), "Tische bringen keine Gäste");
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
await page.goto(URL);
await page.evaluate(() => { localStorage.clear(); localStorage.setItem("pizzeria-parola-backup", JSON.stringify({ savedAt: 1, state: JSON.stringify({ v: 3, S: { coins: 321, day: 7, setupDone: true }, G: null, screen: "home" }) })); localStorage.setItem("pizzeria-parola", "{kaputt"); });
await page.reload();
check(await page.evaluate(() => S.coins === 321), "Sicherheitskopie wird bei kaputtem Spielstand nicht genutzt");

// Alter Spielstand ohne neue Felder muss weiter laden
await fresh({ coins: 77, level: 1, day: 5, setupDone: true, vol: { music: .3 } });
check(await page.evaluate(() => S.coins === 77 && S.level === 1 && S.muted === false && S.vol.sfx === .8), "Alter Spielstand wird nicht richtig übernommen");

// Ausflüge: Eisladen und Hafen einmal komplett durchspielen
for (const trip of ["gelateria", "porto"]) {
  await fresh({ setupDone: true, coins: 10, day: 2 });
  await act("map");
  if (trip === "gelateria") await shot("karte");
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

// Karte: Markt ist außerhalb des Spieltags zu, die Pizzeria startet den Tag
await fresh({ setupDone: true, coins: 10, day: 2 });
await act("map");
await page.locator('.map [data-act="place"][data-p="mercato"]').click();
check(await page.evaluate(() => screen === "map" && /Markt/.test(mapMsg)), "Geschlossener Markt auf der Karte reagiert nicht");
await page.locator('.map [data-act="place"][data-p="pizzeria"]').click();
check(await page.evaluate(() => screen === "play" && !G.trip), "Pizzeria auf der Karte startet keinen Spieltag");

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
check(await page.evaluate(() => pauseOpen && screen === "play"), "Zurück-Knopf im Spiel öffnet keine Pause");
await shot("pause");
await page.locator('#overlay [data-act="abort"]').click();
check(await page.evaluate(() => screen === "home" && !G && S.coins === 25 && S.day === 2), "Abbrechen gibt doch Belohnung oder neuen Tag");

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
