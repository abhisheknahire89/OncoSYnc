import { spawn } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';

try {
  rmSync('/tmp/cca-shots-chrome-profile', { recursive: true, force: true });
} catch (e) {}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture(width, height, filename) {
  console.log(`Starting capture for ${width}x${height}`);
  const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--disable-application-cache',
    '--disk-cache-size=0',
    '--user-data-dir=/tmp/cca-shots-chrome-profile',
    `--window-size=${width},${height}`,
    'http://localhost:4321?t=' + Date.now()
  ]);

  await sleep(3000);

  const tabsRes = await fetch('http://localhost:9224/json');
  const tabs = await tabsRes.json();
  const pageTab = tabs.find(t => t.type === 'page');
  if (!pageTab) {
    console.error('Failed to find page tab.');
    chromeProc.kill();
    return;
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

  await call('Page.enable');
  await call('Runtime.enable');
  
  // take screenshot
  const res = await call('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(res.data, 'base64');
  writeFileSync(filename, buf);
  console.log(`Saved screenshot: ${filename}`);

  ws.close();
  chromeProc.kill();
  await sleep(500); // wait for proc to die
}

async function run() {
  await capture(1440, 900, 'layout_1440x900.png');
  await capture(1280, 800, 'layout_1280x800.png');
  await capture(1024, 768, 'layout_1024x768.png');
  console.log('All layouts captured.');
}

run();
