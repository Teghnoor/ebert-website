#!/usr/bin/env node
/*  Echter Handy-Screenshot über das DevTools-Protokoll (mit Geräte-Emulation,
    damit das Viewport-Meta wirklich greift — ein einfacher --window-size-Aufruf
    tut das nicht und liefert abgeschnittene Bilder).

    node scripts/handy-bild.mjs [URL] [ziel.png] [breite] [hoehe]
*/
import { spawn } from 'node:child_process';
import { setTimeout as warte } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

const URL_ = process.argv[2] || 'http://localhost:8899/index.html';
const ZIEL = process.argv[3] || 'handy.png';
const B = parseInt(process.argv[4] || '390', 10);
const H = parseInt(process.argv[5] || '844', 10);
const PORT = 9344;

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  '--disable-gpu', '--no-first-run', 'about:blank'
], { stdio: 'ignore' });
process.on('exit', () => chrome.kill());

let ws;
for (let i = 0; i < 40; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const s = (await r.json()).find(p => p.type === 'page');
    if (s) { ws = s.webSocketDebuggerUrl; break; }
  } catch {}
  await warte(250);
}
if (!ws) { console.error('Chrome nicht erreichbar'); process.exit(1); }

const sock = new WebSocket(ws);
let id = 0; const offen = new Map();
sock.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && offen.has(m.id)) { offen.get(m.id)(m.result); offen.delete(m.id); }
});
const send = (method, params = {}) => new Promise(res => {
  const i = ++id; offen.set(i, res);
  sock.send(JSON.stringify({ id: i, method, params }));
});
await new Promise(r => sock.addEventListener('open', r));

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: B, height: H, deviceScaleFactor: 2, mobile: true
});
await send('Page.navigate', { url: URL_ });
await warte(2600);

const bild = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
writeFileSync(ZIEL, Buffer.from(bild.data, 'base64'));

// Gleich mitprüfen, ob etwas seitlich herausragt
const mess = await send('Runtime.evaluate', {
  expression: `(() => {
    const v = window.innerWidth;
    const raus = [...document.querySelectorAll('body *')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.right > v + 2 || r.left < -2);
    }).slice(0, 6).map(e => (e.className || e.tagName).toString().split(' ')[0] + ' bis ' + Math.round(e.getBoundingClientRect().right) + 'px');
    return JSON.stringify({ viewport: v, raus });
  })()`, returnByValue: true
});
const m = JSON.parse(mess.result.value);
console.log(`${ZIEL} — Viewport ${m.viewport}px`);
if (m.raus.length) { m.raus.forEach(t => console.log('  ✗ ragt heraus: ' + t)); }
else console.log('  ✓ nichts ragt seitlich heraus');

sock.close(); chrome.kill(); process.exit(0);
