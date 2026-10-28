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
const TYPES = { ".html": "text/html", ".mp3": "audio/mpeg", ".png": "image/png", ".js": "text/javascript", ".css": "text/css" };
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
if (await act("setup")) await shot("laden-einrichten");
await fresh(null);
if (await act("shop")) await shot("shop");
await act("home");
if (await act("vocab")) await shot("vokabeln");
if (await act("vstart")) await shot("vokabel-frage");
await act("home");
if (await act("book")) await shot("heft");
await act("home");
if (await act("vol")) { await shot("lautstaerke"); await page.locator(`#overlay [data-act="vol"]`).click(); }

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
