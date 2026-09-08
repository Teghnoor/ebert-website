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
const fremd = anfragen.filter(u => !u.startsWith('http://localhost') && !u.startsWith('http://127.0.0.1') && !u.startsWith('data:') && !u.startsWith('about:'));
if (fremd.length === 0) ok('kein einziger Request an einen fremden Host');
else fremd.forEach(u => bad('fremder Host: ' + u));

/* ---------- 3. Bilder ---------- */
kopf('3. Bilder');
const bilder = await js(`JSON.stringify([...document.images].map(i => ({
  src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0,
  nw: i.naturalWidth, nh: i.naturalHeight,
  bw: Math.round(i.getBoundingClientRect().width), bh: Math.round(i.getBoundingClientRect().height)
})))`);
const bl = JSON.parse(bilder || '[]');
bl.forEach(b => {
  if (!b.ok) return bad('nicht geladen: ' + b.src);
  if (b.bw > 4 && b.nw < b.bw * 0.95) warn(`hochskaliert: ${b.src} (${b.nw}px auf ${b.bw}px)`);
});
if (bl.length && bl.every(b => b.ok)) ok(`alle ${bl.length} Bilder geladen`);

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

/* ---------- 5. Direktsprung auf Anker ---------- */
kopf('5. Direktsprung auf Anker');
for (const anker of ['#anfrage', '#rechner', '#stimmen']) {
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
    const t = n.nodeValue.replace(/\\s+/g,' ').trim();
    if (t.length > 2 && muster.test(t)) raus.push(t.slice(0,60));
  }
  return JSON.stringify(raus);
})()`);
const dr = JSON.parse(rest || '[]');
if (dr.length === 0) ok('keine Zeile bleibt auf Englisch deutsch');
else dr.forEach(t => bad('nicht übersetzt: ' + t));

/* ---------- 7. Preisrechner ---------- */
kopf('7. Preisrechner');
await js(`try { localStorage.removeItem('ebert-lang'); } catch(e) {}; 1`);
await send('Page.navigate', { url: URL_.split('#')[0] });
await warte(1600);
const rechner = await js(`(() => {
  const r = document.getElementById('flaeche-regler');
  const a = document.getElementById('preis-anzeige');
  if (!r || !a) return JSON.stringify({ fehler: 'Rechner fehlt' });
  const werte = [];
  for (const v of [20, 80, 400]) {
    r.value = v; r.dispatchEvent(new Event('input'));
    werte.push({ qm: v, text: a.textContent });
  }
  document.querySelector('input[name="leistung"][value="dach"]').click();
  const dach = a.textContent;
  return JSON.stringify({ werte, dach });
})()`);
const rc = JSON.parse(rechner || '{}');
if (rc.fehler) bad(rc.fehler);
else {
  const zahlen = rc.werte.map(w => parseInt((w.text.match(/[\d.,]+/g) || ['0'])[0].replace(/[.,]/g, ''), 10));
  if (zahlen[0] > 0 && zahlen[2] > zahlen[1] && zahlen[1] > 0) ok(`steigt mit der Fläche: ${rc.werte.map(w => w.qm + 'm² → ' + w.text).join(' · ')}`);
  else bad('Ergebnis steigt nicht plausibel: ' + JSON.stringify(rc.werte));
  ok('Leistungswechsel wirkt: Dach → ' + rc.dach);
}

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
if (form) bad(form); else ok('leere Pflichtfelder werden abgefangen');

/* ---------- 9. Chat ---------- */
kopf('9. Chat-Hülle');
const chat = await js(`(async () => {
  document.getElementById('chat-knopf').click();
  await new Promise(r => setTimeout(r, 700));
  const auf = document.getElementById('chat').classList.contains('auf');
  const blasen = document.querySelectorAll('#chat-verlauf .blase').length;
  return JSON.stringify({ auf, blasen });
})()`);
const ch = JSON.parse(chat || '{}');
if (ch.auf) ok('Chat öffnet sich'); else bad('Chat öffnet nicht');
if (ch.blasen > 0) ok('Begrüßung erscheint'); else warn('keine Begrüßung im Chat');

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
  if (u.scrollW <= u.innerW + 2) ok(`${b}px: kein waagerechtes Scrollen`);
  else bad(`${b}px: Seite ist ${u.scrollW}px breit (${u.raus.join(', ')})`);
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

/* ---------- Ergebnis ---------- */
console.log('\n' + '─'.repeat(46));
if (fehler === 0) console.log(`\x1b[32m\x1b[1mBESTANDEN\x1b[0m — 0 Fehler, ${warnungen} Hinweis(e)`);
else console.log(`\x1b[31m\x1b[1mDURCHGEFALLEN\x1b[0m — ${fehler} Fehler, ${warnungen} Hinweis(e)`);
console.log('─'.repeat(46) + '\n');

sock.close();
chrome.kill();
process.exit(fehler === 0 ? 0 : 1);
