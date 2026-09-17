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
  '--window-size=400,850', // Mobile size
  'http://localhost:4321?t=' + Date.now()
]);

await sleep(3000);

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

// Patient Screens
await evaluate('window.ccaEpisodeStore.setRole("patient")');

await evaluate('window.ccaEpisodeStore.navigatePatient("Home")');
await sleep(1000);
await screenshot('after_p02_home.png');

await evaluate('window.ccaEpisodeStore.navigatePatient("MyCare")');
await sleep(1000);
await screenshot('after_p03_mycare.png');

await evaluate('window.ccaEpisodeStore.navigatePatient("Roadmap")');
await sleep(1000);
await screenshot('after_p08_roadmap.png');

await evaluate('window.ccaEpisodeStore.navigatePatient("Medicines")');
await sleep(1000);
await screenshot('after_p09_medicines.png');

await evaluate('window.ccaEpisodeStore.navigatePatient("Symptoms")');
await sleep(1000);
await screenshot('after_p11_symptoms.png');

await evaluate('window.ccaEpisodeStore.navigatePatient("Records")'); // Records is P13? P13 is Results but Records is the hub
await sleep(1000);
await screenshot('after_p13_records.png');

// Doctor Screens
await evaluate('window.ccaEpisodeStore.setRole("doctor")');

await evaluate('window.ccaEpisodeStore.navigateDoctor("Home")');
await sleep(1000);
await screenshot('after_d01_home.png');

await evaluate('window.ccaEpisodeStore.navigateDoctor("Summary")');
await sleep(1000);
await screenshot('after_d03_summary.png');

await evaluate('window.ccaEpisodeStore.navigateDoctor("Consultation")');
await sleep(1000);
await screenshot('after_d04_consultation.png');

await evaluate('window.ccaEpisodeStore.navigateDoctor("Nexus")');
await sleep(1000);
await screenshot('after_d07_nexus.png');

await evaluate('window.ccaEpisodeStore.navigateDoctor("Plan")');
await sleep(1000);
await screenshot('after_d10_plan.png');

ws.close();
chromeProc.kill();
console.log('All 11 visual evidence screens captured successfully.');
process.exit(0);
