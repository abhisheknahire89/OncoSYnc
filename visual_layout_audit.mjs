// visual_layout_audit.mjs
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';

const SCREENSHOT_DIR = process.argv.includes('--after') ? 'visual_audit_after' : 'visual_audit_before';
if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Kill existing profile if any
try {
  rmSync('/tmp/cca-audit-chrome-profile', { recursive: true, force: true });
} catch (e) {}

const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless',
  '--remote-debugging-port=9225',
  '--disable-gpu',
  '--disable-application-cache',
  '--disk-cache-size=0',
  '--user-data-dir=/tmp/cca-audit-chrome-profile',
  '--window-size=402,874',
  'http://localhost:4321?t=' + Date.now()
]);

await sleep(2500);

const tabsRes = await fetch('http://localhost:9225/json');
const tabs = await tabsRes.json();
const pageTab = tabs.find(t => t.type === 'page');
if (!pageTab) {
  console.error('Failed to find page tab on port 9225.');
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
  writeFileSync(`${SCREENSHOT_DIR}/${filename}`, buf);
  console.log(`Saved screenshot: ${SCREENSHOT_DIR}/${filename}`);
}

await call('Page.enable');
await call('Runtime.enable');
await call('Page.reload', { ignoreCache: true });
await sleep(1500);

await evaluate('window.ccaEpisodeStore.resetEpisode()');

// DOM Inspection script run inside page context
const inspectDOMScript = `
(() => {
  const defects = [];
  const container = document.getElementById('appContent') || document.body;
  const containerRect = container.getBoundingClientRect();
  const phoneWidth = window.innerWidth || 402;

  // Helper to add defect
  function addDefect(category, severity, element, problem, evidence) {
    let selector = element.tagName.toLowerCase();
    if (element.id) selector += '#' + element.id;
    if (element.className) selector += '.' + Array.from(element.classList).join('.');
    defects.push({
      category,
      severity,
      selector,
      textSnippet: (element.innerText || '').substring(0, 60).replace(/\\n/g, ' '),
      problem,
      evidence
    });
  }

  // 1. Horizontal Overflow & Clipped Elements
  const allElements = container.querySelectorAll('*');
  allElements.forEach(el => {
    if (el.offsetWidth === 0 || el.offsetHeight === 0) return;
    const rect = el.getBoundingClientRect();
    
    // Horizontal Overflow
    if (rect.right > phoneWidth + 2 && !el.closest('.horizontal-scroll-container')) {
      addDefect('HORIZONTAL_OVERFLOW', 'V0', el, 
        'Element right edge exceeds phone viewport boundary', 
        \`Right edge: \${Math.round(rect.right)}px > Viewport: \${phoneWidth}px\`
      );
    }

    // Clipped Elements
    if (el.scrollWidth > el.clientWidth + 3 && getComputedStyle(el).overflowX === 'hidden') {
      addDefect('CLIPPED_CONTENT', 'V1', el,
        'Horizontal content clipped without scrollbar',
        \`ScrollWidth: \${el.scrollWidth}px > ClientWidth: \${el.clientWidth}px\`
      );
    }
  });

  // 2. Pathological Wrapping (e.g. single word lines in multi-word text)
  const textNodes = Array.from(allElements).filter(el => {
    return el.children.length === 0 && el.innerText && el.innerText.trim().length > 10;
  });

  textNodes.forEach(el => {
    const text = el.innerText.trim();
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    // Check if MRN or ID is broken vertically
    if (text.includes('DEMO-CCA') || text.includes('MRN')) {
      if (rect.height > 28 && !text.includes('\\n')) {
        addDefect('PATHOLOGICAL_WRAPPING', 'V1', el,
          'MRN/ID broken across multiple vertical lines',
          \`Text: "\${text}" wrapped into height \${Math.round(rect.height)}px\`
        );
      }
    }

    // Check if patient name or title is squeezed into ultra narrow width
    if (el.classList.contains('patient-card-name') || el.classList.contains('doctor-card-title') || el.tagName === 'H3' || el.tagName === 'H2') {
      if (rect.width < 100 && text.length > 8) {
        addDefect('NARROW_TEXT_COLUMN', 'V1', el,
          'Title or Patient Name squeezed into <100px narrow column',
          \`Width: \${Math.round(rect.width)}px for text: "\${text}"\`
        );
      }
    }
  });

  // 3. Desktop multi-column grid cards inside mobile screen
  const gridCards = container.querySelectorAll('.today-clinic-card, .doctor-card, .patient-card, .worklist-item');
  gridCards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const style = getComputedStyle(card);
    if (style.display === 'grid' || style.gridTemplateColumns !== 'none') {
      const colCount = style.gridTemplateColumns.split(' ').length;
      if (colCount > 3) {
        addDefect('DESKTOP_GRID_ON_MOBILE', 'V1', card,
          \`Card uses \${colCount} desktop grid columns on mobile screen\`,
          \`Columns: \${style.gridTemplateColumns}\`
        );
      }
    }
    // Check if worklist card height is excessive due to multi-column wrapping (>140px for a simple worklist row)
    if (card.classList.contains('today-clinic-card') && rect.height > 140) {
      addDefect('EXCESSIVE_ROW_HEIGHT', 'V1', card,
        'Worklist row height is excessively tall due to column wrapping',
        \`Height: \${Math.round(rect.height)}px\`
      );
    }
  });

  // 4. Touch target collisions / undersized touch targets
  const interactives = container.querySelectorAll('button, a, input, select, [data-clickable="true"]');
  interactives.forEach(btn => {
    if (btn.offsetWidth === 0 || btn.offsetHeight === 0) return;
    const rect = btn.getBoundingClientRect();
    if (rect.width < 32 || rect.height < 32) {
      addDefect('UNDERSIZED_TOUCH_TARGET', 'V2', btn,
        'Interactive control touch region is below 32px',
        \`Dimensions: \${Math.round(rect.width)}x\${Math.round(rect.height)}px\`
      );
    }
  });

  return defects;
})()
`;

console.log('============================================================');
console.log('STARTING VISUAL LAYOUT AUDIT & SCREENSHOT CAPTURE (402px)');
console.log('============================================================');

const allDefects = [];

// AUDIT DOCTOR SCREENS (D01 - D17)
console.log('\n--- Auditing Doctor Workspaces (D01 - D17) ---');
await evaluate('window.ccaEpisodeStore.setRole("doctor")');
await sleep(300);

const doctorScreens = [
  { id: 'D01', name: 'Home', file: 'd01_home.png' },
  { id: 'D02', name: 'Search', file: 'd02_search.png' },
  { id: 'D03', name: 'Summary', file: 'd03_summary.png' },
  { id: 'D04', name: 'Consultation', file: 'd04_consultation.png' },
  { id: 'D05', name: 'Scribe', file: 'd05_scribe.png' },
  { id: 'D06', name: 'OCR', file: 'd06_ocr.png' },
  { id: 'D07', name: 'NEXUS', file: 'd07_nexus.png' },
  { id: 'D08', name: 'Staging', file: 'd08_staging.png' },
  { id: 'D09', name: 'Pathway', file: 'd09_pathway.png' },
  { id: 'D10', name: 'Plan', file: 'd10_plan.png' },
  { id: 'D11', name: 'Cycle', file: 'd11_cycle.png' },
  { id: 'D12', name: 'Results', file: 'd12_results.png' },
  { id: 'D13', name: 'Messages', file: 'd13_messages.png' },
  { id: 'D14', name: 'MDT', file: 'd14_mdt.png' },
  { id: 'D15', name: 'Timeline', file: 'd15_timeline.png' },
  { id: 'D16', name: 'Tasks', file: 'd16_tasks.png' },
  { id: 'D17', name: 'Profile', file: 'd17_profile.png' }
];

for (const scr of doctorScreens) {
  await evaluate(`window.ccaEpisodeStore.navigateDoctor('${scr.name}')`);
  await sleep(350);
  await screenshot(scr.file);
  const screenDefects = await evaluate(inspectDOMScript);
  if (Array.isArray(screenDefects)) {
    screenDefects.forEach(d => {
      d.role = 'Doctor';
      d.screenId = scr.id;
      d.screenName = scr.name;
      allDefects.push(d);
    });
    console.log(`[${scr.id}] ${scr.name}: ${screenDefects.length} defect(s) detected`);
  }
}

// AUDIT PATIENT SCREENS (P01 - P17 + Support Screens)
console.log('\n--- Auditing Patient Screens (P01 - P17 + Services) ---');
await evaluate('window.ccaEpisodeStore.setRole("patient")');
await sleep(300);

const patientScreens = [
  { id: 'P01', name: 'Auth', file: 'p01_auth.png' },
  { id: 'P02', name: 'Home', file: 'p02_home.png' },
  { id: 'P03', name: 'MyCare', file: 'p03_mycare.png' },
  { id: 'P04', name: 'Appointments', file: 'p04_appointments.png' },
  { id: 'P05', name: 'VisitPreparation', file: 'p05_visit_prep.png' },
  { id: 'P06', name: 'Documents', file: 'p06_documents.png' },
  { id: 'P07', name: 'VisitSummary', file: 'p07_visit_summary.png' },
  { id: 'P08', name: 'Roadmap', file: 'p08_roadmap.png' },
  { id: 'P09', name: 'Medicines', file: 'p09_medicines.png' },
  { id: 'P10', name: 'TreatmentDay', file: 'p10_treatment_day.png' },
  { id: 'P11', name: 'Symptoms', file: 'p11_symptoms.png' },
  { id: 'P12', name: 'UrgentHelp', file: 'p12_urgent_help.png' },
  { id: 'P13', name: 'Results', file: 'p13_results.png' },
  { id: 'P14', name: 'Messages', file: 'p14_messages.png' },
  { id: 'P15', name: 'Billing', file: 'p15_billing.png' },
  { id: 'P16', name: 'Survivorship', file: 'p16_survivorship.png' },
  { id: 'P17', name: 'Profile', file: 'p17_profile.png' },
  { id: 'P-VID', name: 'VideoVisit', file: 'p_video_visit.png' },
  { id: 'P-HHC', name: 'CareAtHome', file: 'p_care_at_home.png' },
  { id: 'P-CG', name: 'CaregiverAccess', file: 'p_caregiver_access.png' }
];

for (const scr of patientScreens) {
  if (scr.id === 'P01') {
    await evaluate('window.ccaEpisodeStore.logout()');
    await sleep(250);
    await screenshot(scr.file);
    await evaluate('window.ccaEpisodeStore.loginPatient("+91 98490 14821")');
    await sleep(250);
    continue;
  }

  await evaluate(`window.ccaEpisodeStore.navigatePatient('${scr.name}')`);
  await sleep(350);
  await screenshot(scr.file);
  const screenDefects = await evaluate(inspectDOMScript);
  if (Array.isArray(screenDefects)) {
    screenDefects.forEach(d => {
      d.role = 'Patient';
      d.screenId = scr.id;
      d.screenName = scr.name;
      allDefects.push(d);
    });
    console.log(`[${scr.id}] ${scr.name}: ${screenDefects.length} defect(s) detected`);
  }
}

// Write out JSON report
const auditOutput = {
  timestamp: new Date().toISOString(),
  screenshotDirectory: SCREENSHOT_DIR,
  totalDefects: allDefects.length,
  v0Count: allDefects.filter(d => d.severity === 'V0').length,
  v1Count: allDefects.filter(d => d.severity === 'V1').length,
  v2Count: allDefects.filter(d => d.severity === 'V2').length,
  defects: allDefects
};

writeFileSync(`visual_layout_audit_${SCREENSHOT_DIR}.json`, JSON.stringify(auditOutput, null, 2));
console.log(`\nAudit finished! Total defects: ${allDefects.length} (V0: ${auditOutput.v0Count}, V1: ${auditOutput.v1Count}, V2: ${auditOutput.v2Count})`);
console.log(`Detailed audit output written to visual_layout_audit_${SCREENSHOT_DIR}.json`);

ws.close();
chromeProc.kill();
process.exit(0);
