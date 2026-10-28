// Automatischer Test: startet das Spiel in einem Handy-Browser (ohne Bildschirm),
// klickt die wichtigsten Bildschirme durch, macht Screenshots und meldet JavaScript-Fehler.
//
// Starten:   node test/spiel-test.mjs
// Ergebnis:  Screenshots in test/screenshots/, Fehler in der Konsole (Exit-Code 1 bei Fehlern)
//
// Braucht das npm-Paket "playwright" mit Chromium (in der Claude-Cloud schon vorhanden;
// am PC einmalig: npm i -D playwright && npx playwright install chromium).

import { createServer } from "node:http";
import { readFile, mkdir, rm } from "node:fs/promises";
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
await act("home");
if (await act("book")) await shot("heft");
await act("home");

// Einstellungen oben links: öffnen, alles stumm, nach Neuladen noch stumm, wieder laut
await page.locator('#topbar [data-act="vol"]').click();
await shot("einstellungen");
await page.locator('#overlay [data-act="mute"]').click();
await shot("einstellungen-stumm");
check(await page.evaluate(() => S.muted && vol("music") === 0 && vol("sfx") === 0 && vol("voice") === 0), "Stumm setzt nicht alle Lautstärken auf 0");
await page.locator('#overlay [data-act="vol"]').click();
await page.reload();
check(await page.evaluate(() => S.muted), "Stumm geht beim Neuladen verloren");
await page.locator('#topbar [data-act="mute"]').click();
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
