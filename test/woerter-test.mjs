// Prüft, ob jedes italienische Wort in Gesprächen antippbar ist (also im Wörterbuch DICT steht).
// Spielt für jede Stufe viele Spieltage durch (ohne Bildschirm) und sammelt alle Sätze:
// Gäste, Antworten, Reaktionen, Markt, Gesundheitsamt, Geschichten, Bücher und Gedichte.
//
// Starten:   node test/woerter-test.mjs
// Ergebnis:  Liste der Wörter ohne Übersetzung (Exit-Code 1, wenn welche fehlen)

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const WWW = join(dirname(fileURLToPath(import.meta.url)), "..", "www");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".glb": "model/gltf-binary", ".json": "application/json" };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  try { res.writeHead(200, { "content-type": TYPES[extname(path)] || "text/html" }).end(await readFile(join(WWW, path.endsWith("/") ? path + "index.html" : path))); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));
await page.goto(`http://localhost:${server.address().port}/`);
await page.waitForFunction(() => typeof S !== "undefined" && S && typeof startDay === "function");

const missing = await page.evaluate(() => {
  const out = {}, texts = [];
  const add = t => { if (typeof t === "string" && t) texts.push(t); };
  const addStep = st => { if (!st) return; add(st.it); (st.opts || []).forEach(o => add(o.t)); if (st.react) add(st.react[0]); if (st.reply) add(st.reply); };
  const keep = JSON.stringify(S);
  for (let L = 0; L < LEVELS.length; L++) for (let r = 0; r < 40; r++) {
    try {
      S.level = L; S.inspDue = S.day; S.story = null;
      startDay();
      G.guests.forEach(g => g.steps.forEach(addStep)); (G.market || []).forEach(addStep);
    } catch (e) { out["(Fehler Stufe " + L + ": " + e.message + ")"] = ""; }
  }
  Object.assign(S, JSON.parse(keep));
  // Alle festen Inhalte zusätzlich direkt durchsuchen
  const walk = (x, d = 0) => { if (d > 8 || x == null) return; if (typeof x === "string") add(x); else if (Array.isArray(x)) x.forEach(y => walk(y, d + 1)); else if (typeof x === "object") Object.entries(x).forEach(([k, v]) => { if (!/^(de|corDe|tip|hint|task|n|ing|c|col|color)$/.test(k)) walk(v, d + 1); }); };
  [GREET, TALK, DRINK, MARKET, ISPEZIONE, BAR, typeof STORIES !== "undefined" ? STORIES : [], typeof PERS !== "undefined" ? PERS : {}, typeof FR_SHOUT !== "undefined" ? [FR_SHOUT, FR_SAY] : []].forEach(x => walk(x));
  (typeof LIBRI !== "undefined" ? LIBRI : []).forEach(b => walk(b.pagine || b.pages || b.testo || []));
  // Nur Sätze, die überwiegend aus bekannten italienischen Wörtern bestehen (keine deutschen Hinweise)
  const names = new Set([...NAMES, ...(typeof SURNAMES !== "undefined" ? SURNAMES : [])].join(" ").toLowerCase().split(/[^a-zà-ù]+/));
  // Deutsche Wörter (aus den Übersetzungen): Sätze mit ihnen sind Hinweise oder absichtlich falsche Antworten
  const german = new Set(Object.values(DICT).join(" ").toLowerCase().match(/[a-zäöüß]+/g).filter(w => !DICT[w]));
  const midName = new Set(); texts.forEach(t => (t.match(/[A-Za-zÀ-ÖØ-öø-ÿ]+/g) || []).slice(1).forEach(w => { if (/^[A-ZÀ-Ý]/.test(w)) midName.add(w.toLowerCase()); }));
  texts.forEach(t => {
    t = t.replace(/\{[A-Z]+\}/g, " ");
    const ws = t.match(/[A-Za-zÀ-ÖØ-öø-ÿ]+'?/g) || [];
    if (ws.filter(w => DICT[w.toLowerCase()]).length / ws.length < 0.6) return;
    if (/ = /.test(t) || ws.some(w => german.has(w.toLowerCase()))) return;
    ws.forEach((w, i) => {
      const k = w.toLowerCase();
      if (DICT[k] || names.has(k) || midName.has(k)) return;
      if (/^[A-ZÀ-Ý]/.test(w) && i > 0) return; // Eigenname mitten im Satz → „Name“
      out[k] = out[k] || t;
    });
  });
  return out;
});
await browser.close(); server.close();
const list = Object.entries(missing);
list.forEach(([w, t]) => console.log(`  ${w.padEnd(16)} ${t.slice(0, 80)}`));
errors.forEach(e => console.log("  Fehler:", e));
console.log(list.length ? `${list.length} Wörter ohne Übersetzung` : "Alle Wörter antippbar ✓");
process.exit(list.length || errors.length ? 1 : 0);
