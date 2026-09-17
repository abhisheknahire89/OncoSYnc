// snap_doctor_consultation.mjs
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless',
  '--remote-debugging-port=9227',
  '--disable-gpu',
  '--window-size=402,874',
  'http://localhost:4321?v=' + Date.now()
]);

await sleep(2500);

const tabsRes = await fetch('http://localhost:9227/json');
const tabs = await tabsRes.json();
const pageTab = tabs.find(t => t.type === 'page');

const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let reqId = 1;
const pending = new Map();

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    const cb = pending.get(data.id);
    pending.delete(data.id);
    cb(data.result);
  }
};

function call(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++reqId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expr) {
  const res = await call('Runtime.evaluate', { expression: expr, returnByValue: true });
  return res?.result?.value;
}

await call('Page.enable');
await call('Runtime.enable');
await call('Page.reload', { ignoreCache: true });
await sleep(1500);

await evaluate('window.ccaEpisodeStore.setRole("doctor")');
await evaluate('window.ccaEpisodeStore.navigateDoctor("Consultation")');
await sleep(500);

const res = await call('Page.captureScreenshot', { format: 'png' });
const buf = Buffer.from(res.data, 'base64');
writeFileSync('snap_doctor_consultation.png', buf);
console.log('Saved snap_doctor_consultation.png');

ws.close();
chromeProc.kill();
process.exit(0);
