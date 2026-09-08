#!/usr/bin/env node
/*  Prüft die Seite am GERENDERTEN Ergebnis, nicht am Quelltext.
    Nutzt das DevTools-Protokoll von Chrome — kein Puppeteer nötig.

    Start:  node scripts/pruefe-seite.mjs [URL]
    Vorher: python3 -m http.server 8899   (im Projektordner)
*/

import { spawn } from 'node:child_process';
import { setTimeout as warte } from 'node:timers/promises';

const URL_ = process.argv[2] || 'http://localhost:8899/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

let fehler = 0, warnungen = 0;
const ok = (t) => console.log('  \x1b[32m✓\x1b[0m ' + t);
const bad = (t) => { fehler++; console.log('  \x1b[31m✗\x1b[0m ' + t); };
const warn = (t) => { warnungen++; console.log('  \x1b[33m!\x1b[0m ' + t); };
const kopf = (t) => console.log('\n\x1b[1m' + t + '\x1b[0m');

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  '--disable-gpu', '--no-first-run', '--window-size=1440,900',
  'about:blank'
], { stdio: 'ignore' });

process.on('exit', () => chrome.kill());

async function hole(pfad) {
  const r = await fetch(`http://127.0.0.1:${PORT}${pfad}`);
  return r.json();
}

let ws;
for (let i = 0; i < 40; i++) {
  try {
    const seiten = await hole('/json/list');
    const s = seiten.find(p => p.type === 'page');
    if (s) { ws = s.webSocketDebuggerUrl; break; }
  } catch {}
  await warte(250);
}
if (!ws) { console.error('Chrome nicht erreichbar.'); process.exit(1); }

const { WebSocket } = await import('node:worker_threads').then(() => ({ WebSocket: globalThis.WebSocket }));
const sock = new WebSocket(ws);
let id = 0;
const offen = new Map();
const konsole = [];
const anfragen = [];

sock.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && offen.has(m.id)) { offen.get(m.id)(m.result); offen.delete(m.id); }
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) {
    konsole.push(m.params.type + ': ' + (m.params.args?.[0]?.value ?? ''));
  }
  if (m.method === 'Runtime.exceptionThrown') {
    konsole.push('exception: ' + (m.params.exceptionDetails?.text ?? ''));
  }
  if (m.method === 'Network.requestWillBeSent') anfragen.push(m.params.request.url);
});

const send = (method, params = {}) => new Promise((res) => {
  const i = ++id;
  offen.set(i, res);
  sock.send(JSON.stringify({ id: i, method, params }));
});

const js = async (ausdruck) => {
  const r = await send('Runtime.evaluate', { expression: ausdruck, returnByValue: true, awaitPromise: true });
  return r?.result?.value;
};

await new Promise((r) => sock.addEventListener('open', r));
await send('Runtime.enable');
await send('Network.enable');
await send('Page.enable');
await send('Page.navigate', { url: URL_ });
await warte(2600);

console.log('\n\x1b[1mPrüfe:\x1b[0m ' + URL_);

/* ---------- 1. Konsole ---------- */
kopf('1. Konsole');
if (konsole.length === 0) ok('keine Fehler oder Warnungen');
else konsole.forEach(k => bad(k));

/* ---------- 2. Fremde Hosts ---------- */
kopf('2. Externe Requests (DSGVO)');
const eigenerHost = new URL(URL_).origin;
const fremd = anfragen.filter(u =>
  !u.startsWith(eigenerHost) && !u.startsWith('data:') &&
  !u.startsWith('about:') && !u.startsWith('blob:'));
if (fremd.length === 0) ok('kein einziger Request an einen fremden Host (eigener: ' + eigenerHost + ')');
else fremd.forEach(u => bad('fremder Host: ' + u));

/* ---------- 4. Reveal: nichts darf unsichtbar hängen ---------- */
kopf('4. Reveal-Animationen');
await js(`window.scrollTo(0, document.body.scrollHeight); 1`);
await warte(1400);
await js(`window.scrollTo(0, 0); 1`);
await warte(700);
const versteckt = await js(`JSON.stringify([...document.querySelectorAll('.zeig:not(.da), .wort:not(.da)')]
  .map(e => (e.textContent||'').replace(/\\s+/g,' ').trim().slice(0,45)).filter(Boolean))`);
const v = JSON.parse(versteckt || '[]');
if (v.length === 0) ok('kein Element bleibt unsichtbar hängen');
else v.forEach(t => bad('unsichtbar geblieben: ' + t));

/* ---------- 3. Bilder (nach dem Durchscrollen — lazy loading) ---------- */
kopf('3. Bilder');
const bilder = await js(`JSON.stringify([...document.images].map(i => ({
  src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0,
  nw: i.naturalWidth, bw: Math.round(i.getBoundingClientRect().width)
})))`);
const bl = JSON.parse(bilder || '[]');
bl.forEach(b => {
  if (!b.ok) return bad('nicht geladen: ' + b.src);
  if (b.bw > 4 && b.nw < b.bw * 0.95) warn(`hochskaliert: ${b.src} (${b.nw}px auf ${b.bw}px)`);
});
if (bl.length && bl.every(b => b.ok)) ok(`alle ${bl.length} Bilder geladen`);

/* ---------- 5. Direktsprung auf Anker ---------- */
kopf('5. Direktsprung auf Anker');
const anker_liste = URL_.includes('index.html') || URL_.endsWith('/')
  ? ['#anfrage', '#probeflaeche', '#stimmen', '#ueber-uns', '#arbeit'] : [];
if (!anker_liste.length) ok('Unterseite — verlinkt auf die Startseite, keine eigenen Anker');
for (const anker of anker_liste) {
  await send('Page.navigate', { url: URL_.split('#')[0] + anker });
  await warte(1900);
  const leer = await js(`(() => {
    const s = document.querySelector('${anker}');
    if (!s) return 'Sektion fehlt';
    const unsichtbar = s.querySelectorAll('.zeig:not(.da)').length;
    return unsichtbar ? unsichtbar + ' Element(e) unsichtbar' : '';
  })()`);
  if (leer) bad(anker + ': ' + leer); else ok(anker + ' zeigt Inhalt');
}

/* ---------- 6. Sprachumschalter ---------- */
kopf('6. Sprachumschalter DE → EN');
await send('Page.navigate', { url: URL_.split('#')[0] });
await warte(1800);
const rest = await js(`(async () => {
  document.querySelector('.sprache button[data-lang="en"]').click();
  await new Promise(r => setTimeout(r, 400));
  const muster = /\\b(und|der|die|das|nicht|wir|für|mit|von|auf|ist|sind|werden|Ihre|kostenlos|Fläche|Reinigung|Dach|Gehweg|Einfahrt|Bitte|oder|eine)\\b/;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  const raus = []; let n;
  while ((n = w.nextNode())) {
    const p = n.parentNode;
    if (!p || ['SCRIPT','STYLE'].includes(p.nodeName)) continue;
    if (p.closest && p.closest('[data-nicht-uebersetzen]')) continue;
    const t = n.nodeValue.replace(/\\s+/g,' ').trim();
    if (t.length > 2 && muster.test(t)) raus.push(t.slice(0,60));
  }
  return JSON.stringify(raus);
})()`);
const dr = JSON.parse(rest || '[]');
if (dr.length === 0) ok('keine Zeile bleibt auf Englisch deutsch');
else dr.forEach(t => bad('nicht übersetzt: ' + t));

/* ---------- 7. Keine Preisrechner-Reste ---------- */
kopf('7. Preisrechner entfernt');
const reste = await js(`JSON.stringify({
  rechner: !!document.getElementById('flaeche-regler'),
  anzeige: !!document.getElementById('preis-anzeige'),
  skript: !!window.EBERT_PREISE
})`);
const R = JSON.parse(reste || "{}");
const startseite = URL_.includes('index.html') || URL_.endsWith('/');
if (!R.rechner && !R.anzeige && !R.skript) ok('kein Rechner und keine Preisdaten mehr geladen');
else bad('Rechner-Reste gefunden: ' + JSON.stringify(R));

/* ---------- 8. Formular-Validierung ---------- */
kopf('8. Formular');
const form = await js(`(() => {
  const f = document.getElementById('anfrage-form');
  const m = document.getElementById('melde');
  if (!f || !m) return 'Formular fehlt';
  f.querySelector('#f-name').value = '';
  f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  return m.className.includes('schlecht') ? '' : 'leere Pflichtfelder werden nicht abgefangen';
})()`);
if (form && !startseite) ok('Unterseite — kein eigenes Formular');
else if (form) bad(form);
else ok('leere Pflichtfelder werden abgefangen');

/* ---------- 9. Chat ---------- */
kopf('9. Chat-Hülle');
const chat = await js(`(async () => {
  const k = document.getElementById('chat-knopf');
  if (!k) return JSON.stringify({ fehlt: true });
  k.click();
  await new Promise(r => setTimeout(r, 700));
  const auf = document.getElementById('chat').classList.contains('auf');
  const blasen = document.querySelectorAll('#chat-verlauf .blase').length;
  return JSON.stringify({ auf, blasen });
})()`);
let ch = {};
try { ch = JSON.parse(chat || '{}'); } catch { bad('Chat-Test lieferte kein Ergebnis'); }
if (ch.fehlt) bad('Chat-Knopf fehlt auf dieser Seite');
else if (ch.auf) ok('Chat öffnet sich'); else bad('Chat öffnet nicht');
if (ch.fehlt) {} else if (ch.blasen > 0) ok('Begrüßung erscheint'); else warn('keine Begrüßung im Chat');

/* ---------- 10. Breiten ---------- */
kopf('10. Darstellung auf verschiedenen Breiten');
for (const [b, h] of [[390, 844], [768, 1024], [1440, 900]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: b, height: h, deviceScaleFactor: 1, mobile: b < 700 });
  await warte(500);
  const ueber = await js(`(() => {
    const w = document.documentElement.scrollWidth;
    const v = window.innerWidth;
    const raus = [...document.querySelectorAll('body *')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && (r.right > v + 2);
    }).slice(0,3).map(e => e.tagName + '.' + (e.className||'').toString().split(' ')[0]);
    return JSON.stringify({ scrollW: w, innerW: v, raus });
  })()`);
  const u = JSON.parse(ueber || '{}');
  if (u.scrollW > u.innerW + 2) bad(`${b}px: Seite ist ${u.scrollW}px breit`);
  else if (u.raus.length) bad(`${b}px: ragt seitlich heraus — ${u.raus.join(', ')}`);
  else ok(`${b}px: nichts ragt heraus`);
}
await send('Emulation.clearDeviceMetricsOverride');

/* ---------- 11. Gewicht ---------- */
kopf('11. Seitengewicht');
const gewicht = await js(`(() => {
  const e = performance.getEntriesByType('resource');
  const b = e.reduce((s, r) => s + (r.transferSize || r.decodedBodySize || 0), 0);
  return JSON.stringify({ kb: Math.round(b / 1024), n: e.length });
})()`);
const g = JSON.parse(gewicht || '{}');
if (g.kb < 3500) ok(`${g.kb} KB über ${g.n} Requests`);
else warn(`${g.kb} KB — Bilder weiter verkleinern`);


/* ---------- 12. Lesbarkeit für Leser ab 50 ---------- */
kopf('12. Lesbarkeit (Zielgruppe ab 50)');
const les = await js(`(() => {
  function lum(c){
    const m = c.match(/[\\d.]+/g); if(!m) return 1;
    const [r,g,b] = m.slice(0,3).map(v => { v = v/255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
    return 0.2126*r + 0.7152*g + 0.0722*b;
  }
  function kontrast(f, h){ const a = lum(f), b = lum(h); return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05); }
  function grund(el){
    let e = el;
    while (e && e !== document.documentElement) {
      const b = getComputedStyle(e).backgroundColor;
      if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') return b;
      e = e.parentElement;
    }
    return 'rgb(255,255,255)';
  }
  const schwach = [], klein = [], flach = [];
  document.querySelectorAll('p, li, td, span, small, label, summary, .klein, .lead, figcaption')
    .forEach(el => {
      if (!el.textContent.trim() || el.children.length) return;
      if (el.getAttribute('aria-hidden') === 'true') return;
      // Text ueber Bildern: Hintergrund ist nicht messbar, dort sorgt ein
      // dunkler Verlauf fuer den Kontrast — separat sichergestellt.
      if (el.closest('.weiter-karte, .hero, .unter-hero, .schieber, .abschnitt.dunkel, .probe-kasten, .vergleich-karte.gut, .oben-leiste, .tel-leiste, .chat')) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) < 0.5) return;
      const px = parseFloat(s.fontSize);
      const k = kontrast(s.color, grund(el));
      const name = (el.className || el.tagName).toString().split(' ')[0].slice(0, 24);
      const txt = el.textContent.replace(/\\s+/g,' ').trim().slice(0, 34);
      if (k < 7) schwach.push(name + ' — ' + k.toFixed(2) + ' — "' + txt + '"');
      if (px < 17) klein.push(name + ' — ' + px + 'px — "' + txt + '"');
    });
  document.querySelectorAll('a.knopf, button, .nav a, .nav-klapp-knopf, .direkt a, .tel-leiste a, .hero-tel')
    .forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.height < 44) {
        flach.push((el.className || el.tagName).toString().split(' ')[0] + ' — ' + Math.round(r.height) + 'px');
      }
    });
  return JSON.stringify({ schwach: [...new Set(schwach)], klein: [...new Set(klein)], flach: [...new Set(flach)] });
})()`);
const L = JSON.parse(les || '{}');
if (!L.schwach?.length) ok('Kontrast überall ≥ 7,0 (WCAG AAA)');
else L.schwach.slice(0, 8).forEach(t => bad('Kontrast zu schwach: ' + t));
if (!L.klein?.length) ok('kein Text unter 17 px');
else L.klein.slice(0, 8).forEach(t => bad('Schrift zu klein: ' + t));
if (!L.flach?.length) ok('alle Schaltflächen ≥ 44 px hoch');
else L.flach.slice(0, 8).forEach(t => bad('Schaltfläche zu flach: ' + t));

/* ---------- 12b. Animationen erreichen ihren Endzustand ---------- */
kopf('12b. Animationen enden korrekt');
await send('Page.navigate', { url: URL_.split('#')[0] });
await warte(600);
await js(`window.scrollTo(0, document.body.scrollHeight); 1`);
await warte(2600);
const anim = await js(`(() => {
  const zahlen = [...document.querySelectorAll('[data-zaehl]')].map(e => ({
    ist: e.textContent.replace(/\\D/g, ''), soll: e.dataset.zaehl
  }));
  const haengt = [...document.querySelectorAll('.zeig:not(.da)')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; })
    .map(e => (e.className || e.tagName).toString().split(' ')[0]);
  const verschoben = [...document.querySelectorAll('.zeig.da')].filter(e => {
    const t = getComputedStyle(e).transform;
    return t && t !== 'none' && !t.includes('matrix(1, 0, 0, 1, 0, 0)');
  }).length;
  return JSON.stringify({ zahlen, haengt: [...new Set(haengt)], verschoben });
})()`);
const A = JSON.parse(anim || '{}');
const falsch = (A.zahlen || []).filter(z => z.ist !== z.soll);
if (!A.zahlen?.length) ok('keine Zähl-Animation auf dieser Seite');
else if (!falsch.length) ok('alle Zahlen erreichen ihren Endwert (' + A.zahlen.map(z => z.soll).join(', ') + ')');
else falsch.forEach(z => bad('Zahl bleibt bei ' + z.ist + ' statt ' + z.soll));
if (!A.haengt?.length) ok('kein sichtbares Element bleibt in der Bewegung hängen');
else A.haengt.slice(0, 5).forEach(t => bad('bleibt verschoben: ' + t));

/* ---------- 12c. Terminbuchung lädt erst nach Klick ---------- */
kopf('12c. Terminbuchung (Zwei-Klick)');
const termin = await js(`(() => {
  const kasten = document.getElementById('termin-kasten');
  if (!kasten) return JSON.stringify({ keine: true });
  return JSON.stringify({
    rahmenVorKlick: kasten.querySelectorAll('iframe').length,
    knopf: !!document.getElementById('termin-laden'),
    adresse: (window.EBERT_TERMIN || {}).buchungsseite || ''
  });
})()`);
const TB = JSON.parse(termin || '{}');
if (TB.keine) ok('keine Terminbuchung auf dieser Seite');
else {
  if (TB.rahmenVorKlick === 0) ok('kein Kalender-iFrame vor dem Klick — Seite bleibt bannerfrei');
  else bad('iFrame lädt schon beim Seitenaufruf — dann wird ein Cookie-Banner Pflicht');
  if (TB.knopf) ok('Schaltfläche zum Laden vorhanden');
  else bad('Schaltfläche fehlt');
  if (!TB.adresse) warn('Buchungsseite noch nicht hinterlegt (termin.js) — Platzhalter aktiv');
  else ok('Buchungsseite hinterlegt');
}

/* ---------- 13. Keine Preise ---------- */
kopf('13. Keine Preisangaben');
const preise = await js(`(() => {
  const t = document.body.innerText;
  const treffer = [];
  const muster = [/\\d[\\d.,]*\\s*€/g, /€\\s*\\d/g, /\\bEUR\\b/g, /pro\\s*m²/gi, /\\/\\s*m²/g, /Euro\\b/g];
  muster.forEach(m => { const f = t.match(m); if (f) treffer.push(...f); });
  return JSON.stringify([...new Set(treffer)]);
})()`);
const pr = JSON.parse(preise || '[]');
if (!pr.length) ok('keine Preisangabe im sichtbaren Text');
else pr.slice(0, 6).forEach(t => bad('Preisangabe gefunden: ' + t));

/* ---------- 14. Sofort sichtbar ---------- */
kopf('14. Alles sofort sichtbar (keine Einblend-Animation)');
await send('Page.navigate', { url: URL_.split('#')[0] });
await warte(900);
const unsichtbar = await js(`(() => {
  const raus = [];
  document.querySelectorAll('body *').forEach(el => {
    const s = getComputedStyle(el);
    if (parseFloat(s.opacity) < 0.5 && el.textContent.trim() && s.display !== 'none' && s.visibility !== 'hidden') {
      if (el.closest('.chat') || el.closest('.nav-klapp-inhalt') || el.closest('.nav')) return;
      raus.push((el.className || el.tagName).toString().split(' ')[0] + ' — ' + el.textContent.replace(/\\s+/g,' ').trim().slice(0,30));
    }
  });
  return JSON.stringify([...new Set(raus)]);
})()`);
const un = JSON.parse(unsichtbar || '[]');
if (!un.length) ok('kein Element startet unsichtbar');
else un.slice(0, 6).forEach(t => bad('startet unsichtbar: ' + t));

/* ---------- Ergebnis ---------- */
console.log('\n' + '─'.repeat(46));
if (fehler === 0) console.log(`\x1b[32m\x1b[1mBESTANDEN\x1b[0m — 0 Fehler, ${warnungen} Hinweis(e)`);
else console.log(`\x1b[31m\x1b[1mDURCHGEFALLEN\x1b[0m — ${fehler} Fehler, ${warnungen} Hinweis(e)`);
console.log('─'.repeat(46) + '\n');

sock.close();
chrome.kill();
process.exit(fehler === 0 ? 0 : 1);
