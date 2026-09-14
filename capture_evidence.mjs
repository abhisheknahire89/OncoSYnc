// capture_evidence.mjs
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';

try {
  rmSync('/tmp/cca-shots-chrome-profile', { recursive: true, force: true });
} catch (e) {}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless',
  '--remote-debugging-port=9224',
  '--disable-gpu',
  '--disable-application-cache',
  '--disk-cache-size=0',
  '--user-data-dir=/tmp/cca-shots-chrome-profile',
  '--window-size=1400,900',
  'http://localhost:4321?t=' + Date.now()
]);

await sleep(2500);

const tabsRes = await fetch('http://localhost:9224/json');
const tabs = await tabsRes.json();
const pageTab = tabs.find(t => t.type === 'page');
if (!pageTab) {
  console.error('Failed to find page tab.');
  chromeProc.kill();
  process.exit(1);
}

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

async function screenshot(filename) {
  const res = await call('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(res.data, 'base64');
  writeFileSync(filename, buf);
  console.log(`Saved screenshot: ${filename}`);
}

await call('Page.enable');
await call('Runtime.enable');
await call('Page.reload', { ignoreCache: true });
await sleep(1500);

await evaluate('window.ccaEpisodeStore.resetEpisode()');

// 1. Patient Home (P02) with bright mode
await evaluate('window.ccaEpisodeStore.setRole("patient")');
await evaluate('window.ccaEpisodeStore.navigatePatient("Home")');
await sleep(500);
await screenshot('ev_p02_home.png');

// 2. My Cancer Care (P03)
await evaluate('window.ccaEpisodeStore.navigatePatient("MyCare")');
await sleep(500);
await screenshot('ev_p03_mycare.png');

// 3. Visit Preparation (P05)
await evaluate('window.ccaEpisodeStore.navigatePatient("VisitPreparation")');
await sleep(500);
await screenshot('ev_p05_visit_prep.png');

// 4. Treatment Day Guide (P10)
await evaluate('window.ccaEpisodeStore.navigatePatient("TreatmentDay")');
await sleep(500);
await screenshot('ev_p10_treatment_day.png');

// 5. Bills & Insurance (P15)
await evaluate('window.ccaEpisodeStore.navigatePatient("Billing")');
await sleep(500);
await screenshot('ev_p15_billing.png');

// 6. Survivorship Care Plan (P16)
await evaluate('window.ccaEpisodeStore.navigatePatient("Survivorship")');
await sleep(500);
await screenshot('ev_p16_survivorship.png');

// 7. Doctor Staging Calculator (D08)
await evaluate('window.ccaEpisodeStore.setRole("doctor")');
await evaluate('window.ccaEpisodeStore.navigateDoctor("Staging")');
await sleep(500);
await screenshot('ev_d08_staging.png');

ws.close();
chromeProc.kill();
console.log('All visual evidence captured successfully.');
process.exit(0);
