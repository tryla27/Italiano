// Sammelt alle Sätze, die das Spiel vorlesen kann, und wer sie spricht (Frau "f" / Mann "m").
// Lädt dafür das echte Spiel im Browser, damit alle Inhalte und Hilfsfunktionen da sind.
// Ergebnis: tools/stimmen/saetze.json  ({f:[...], m:[...], bausteine:{f,m}})
// Bausteine: Satzteile, aus denen das Spiel Bestellungen, Anrufe und Reservierungen zusammensetzt.
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const HERE = dirname(fileURLToPath(import.meta.url));
const WWW = join(HERE, "..", "..", "www");
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  try { const body = await readFile(join(WWW, path.endsWith("/") ? path + "index.html" : path)); res.writeHead(200, { "content-type": extname(path) === ".js" ? "text/javascript" : "text/html" }).end(body); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/`);
await page.waitForFunction(() => typeof PERS !== "undefined" && typeof numIt === "function");
const out = await page.evaluate(() => {
  const F = new Set(), M = new Set(), BF = new Set(), BM = new Set(); let block = false;
  const add = (sex, t) => { if (!t || typeof t !== "string") return; t = t.trim().replace(/\s+/g, " "); if (!t || /\{[NDW]\}/.test(t)) return; (sex === "m" ? M : F).add(t); if (block) (sex === "m" ? BM : BF).add(t); };
  const both = t => { add("f", t); add("m", t); };
  const sexOf = who => who === "Signor Esposito" ? "m" : CHARS[who] && CHARS[who].f ? "f" : "m";
  const NARR = "f"; // Erzähler, Vokabeln, Bücher, eigene Antworten, Anrufer
  // Antworten des Spielers (nur italienische: Einträge mit deutscher Übersetzung der richtigen Antwort)
  const answers = it => { if (!it[3]) return; add(NARR, it[2]); (it[4] || []).forEach(w => add(NARR, Array.isArray(w) ? w[0] : w)); };
  const generic = [GREET, TALK, PROB, BILL, DRINK, BAR, DIR, CRITIC, ...LEVELS.flatMap(l => l.talk || [])];
  generic.forEach(pool => pool.forEach(it => { both(it[0]); answers(it); }));
  [HUH, HUH_PIZZA].forEach(p => p.flat(1).forEach(r => Array.isArray(r) && both(r[0])));
  HUH.forEach(g => g.forEach(r => both(r[0])));
  HUH_PIZZA.forEach(r => both(r[0]));
  Object.entries(PERS).forEach(([n, P]) => { const s = sexOf(n); [...P.greet, ...P.talk].forEach(it => { add(s, it[0]); answers(it); }); (P.huh || []).forEach(g => g.forEach(r => add(s, r[0]))); });
  STORIES.forEach(st => st.parts.forEach(p => p.lines.forEach(it => { add(sexOf(p.who), it[0]); answers(it); })));
  ISPEZIONE.forEach(it => { add("f", it[0]); answers(it); });
  MARKET.forEach(it => { add("m", it[0]); answers(it); });
  Object.values(TRIPS).forEach(T => T.pool.forEach(it => { add(sexOf(T.who), it[0]); answers(it); }));
  // Rechnung mit Zahlen: alle Beträge
  for (let n = 1; n <= 160; n++) BILL.forEach(it => [it[2], ...it[4]].forEach(t => /\{[NW]\}/.test(t) && add(NARR, t.replace(/\{[NW]\}/, numIt(n)))));
  // Kaffee-Bestellungen
  const cops = ["E per finire, un", "Mi fa un", "Prendo anche un", "Per me un"];
  CAFFE.forEach(c => cops.forEach(op => both(`${op} ${c.n}, per favore.`)));
  // Markt: Signor Esposito feilscht
  add("m", "Oggi ho prodotti freschissimi! Cosa prende?"); add("m", "Affare fatto! Grazie e buona giornata."); add("m", "Come vuole. Altro?");
  // Preise am Stand liegen unter 40 €: Gebote und Antworten für alle Beträge bis 40
  for (let n = 1; n <= 40; n++) {
    const w = numIt(n), W = cap(w);
    ["Facciamo {N}?", "Le do {N} euro.", "{N} euro, va bene?"].forEach(t => add(NARR, t.replace("{N}", w)));
    [`Di nuovo qui? Il prezzo resta ${w} euro.`, `Basta! ${W} euro, prendere o lasciare.`, `Ma scherza? Così ci rimetto! Il prezzo è ${w} euro.`, `Affare fatto! ${W} euro.`,
     `Ultimo prezzo: ${w} euro. Di più non posso.`, `Mmh… facciamo ${w}.`, `Va bene, per Lei ${w} euro.`, `Non posso, ma ${w} sì.`].forEach(t => add("m", t));
  }
  Object.keys(ING).forEach(k => ING[k][3] && add("m", `${cap(k)}? Per Lei, ${numIt(ING[k][3])} euro.`));
  // Bausteine für zusammengesetzte Sätze: Das Spiel setzt sie beim Abspielen aneinander (Bestellungen, Anrufe, Reservierungen)
  block = true;
  const ops = ["Vorrei", "Per me", "Allora, prendo", "Mi porta"], ings = Object.keys(ING);
  [1, 2, 3].forEach(q => ops.forEach(op => {
    PIZZE.forEach(p => { const t = `${op} ${QIT[q]} ${q > 1 ? p.pl : p.n}`; both(t); both(t + ", per favore."); });
    both(`${op} ${QIT[q]} ${q > 1 ? "pizze" : "pizza"} con`);
  }));
  ings.forEach(x => { [`senza ${x}`, `senza ${x}, per favore.`, `con ${x}, per favore.`, `ma con ${x}, per favore.`, `${x},`, x, `e ${x}, per favore.`].forEach(both); });
  add(NARR, "Pronto, pizzeria?");
  PIZZE.forEach(p => [1, 2, 3, 4].forEach(q => add(NARR, `Vorrei ordinare ${q === 1 ? "una " + p.n : QIT[q] + " " + p.pl}`)));
  TIMES.forEach(t => { add(NARR, `per le ${t[0]}.`); DAYS.forEach(d => add(NARR, `${d[0]} sera alle ${t[0]}.`)); });
  STREETS.forEach(st => NUMS.forEach(n => add(NARR, `L'indirizzo è ${st}, numero ${n[0]}.`)));
  ["due", "tre", "quattro", "cinque", "sei", "sette", "otto"].forEach(n => add(NARR, `Buonasera, vorrei prenotare un tavolo per ${n} persone,`));
  SURNAMES.forEach(n => add(NARR, `A nome ${n}.`));
  block = false;
  // Signor Moretti beim Einrichten
  const items = [...ROOM_ITEMS, ...SHOP.map(s => ({ it: s.it }))];
  items.forEach(i => { add("m", `Dove mettiamo ${i.it}?`); add("m", `Tocca ${i.it}!`); add(NARR, i.it); });
  // Wörter, Zutaten, Bücher, Gedichte
  Object.keys(DICT).forEach(k => add(NARR, k));
  Object.keys(ING).forEach(k => add(NARR, k));
  LIBRI.forEach(b => b.capitoli.forEach(c => { c.pagine.forEach(p => add(NARR, p[0])); (c.domande || []).forEach(([q, ok, wr]) => [ok, ...wr].forEach(o => add(NARR, o))); }));
  POESIE.forEach(p => p.versi.forEach(v => add(NARR, v[0])));
  add(NARR, "Ciao! Benvenuto in pizzeria.");
  return { f: [...F], m: [...M], bausteine: { f: [...BF], m: [...BM] } };
});
await writeFile(join(HERE, "saetze.json"), JSON.stringify(out, null, 1));
console.log("Frauenstimme:", out.f.length, "Männerstimme:", out.m.length);
await browser.close(); server.close();
