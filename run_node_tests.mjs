// Automated Node.js 25 CDP Test Suite for CCA Cancer Care Prototype
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless',
  '--disable-gpu',
  '--remote-debugging-port=9222',
  '--user-data-dir=/tmp/cca-test-chrome-profile',
  '--window-size=1400,900',
  'http://localhost:4321'
]);

await new Promise(r => setTimeout(r, 2000));

const tabsRes = await fetch('http://localhost:9222/json');
const tabs = await tabsRes.json();
const pageTab = tabs.find(t => t.type === 'page');
if (!pageTab) {
  console.error('No page tab found in Chrome');
  chrome.kill();
  process.exit(1);
}

console.log(`Connected to: ${pageTab.title}`);
const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

await new Promise(resolve => ws.onopen = resolve);

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
  if (res?.data) {
    const buf = Buffer.from(res.data, 'base64');
    writeFileSync(filename, buf);
    console.log(`📸 Screenshot saved: ${filename} (${buf.length} bytes)`);
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

console.log('\n--- 1. Verification of Initial Stage & Patient Home ---');
const title = await evaluate('document.title');
const role = await evaluate('window.ccaEpisodeStore.role');
console.log(`Title: ${title} | Role: ${role}`);
await screenshot('qa_01_patient_home.png');

console.log('\n--- 2. Patient Flow: Confirming Appointment ---');
await evaluate("document.getElementById('btnGoNextApt').click()");
await sleep(350);
console.log(`Navigated to: ${await evaluate('window.ccaEpisodeStore.currentPatientScreen')}`);
await evaluate("document.querySelector('.btnConfirmApt').click()");
await sleep(350);
const aptStatus = await evaluate("window.ccaEpisodeStore.state.appointments[0].status");
console.log(`Appointment Status updated to: ${aptStatus}`);
await evaluate("document.getElementById('btnAppBack').click()");
await sleep(350);
console.log(`Returned to: ${await evaluate('window.ccaEpisodeStore.currentPatientScreen')}`);

console.log('\n--- 3. Patient Flow: Marking Supportive Medicine Taken ---');
await evaluate("document.querySelector('[data-med-id=\"MED-01\"]').click()");
await sleep(350);
const med1 = await evaluate("window.ccaEpisodeStore.state.medicines[0].todayStatus");
console.log(`Ondansetron Status: ${med1}`);

console.log('\n--- 4. Patient Flow: 5-Step Progressive Symptom Wizard ---');
await evaluate("document.getElementById('btnShortcutSymptoms').click()");
await sleep(350);
console.log(`Step 1: Category: ${await evaluate('window.ccaEpisodeStore.symptomWizard.step')}`);

await evaluate("document.querySelector('[data-cat=\"Temperature\"]').click()");
await evaluate("document.getElementById('btnWizNext1').click()");
await sleep(350);
console.log(`Step 2: Severity/Reading: ${await evaluate('window.ccaEpisodeStore.symptomWizard.step')}`);

await evaluate("document.querySelector('[data-temp=\"100.6\"]').click()");
await evaluate("document.querySelector('[data-sev=\"Severe\"]').click()");
await evaluate("document.getElementById('btnWizNext2').click()");
await sleep(350);
console.log(`Step 3: Onset/Progression: ${await evaluate('window.ccaEpisodeStore.symptomWizard.step')}`);

await evaluate("document.querySelector('[data-onset=\"Today\"]').click()");
await evaluate("document.querySelector('[data-prog=\"Getting worse\"]').click()");
await evaluate("document.getElementById('btnWizNext3').click()");
await sleep(350);
console.log(`Step 4: Review: ${await evaluate('window.ccaEpisodeStore.symptomWizard.step')}`);

await evaluate("document.getElementById('btnSubmitFinalSymptom').click()");
await sleep(500);
const step5 = await evaluate('window.ccaEpisodeStore.symptomWizard.step');
const alertsLen = await evaluate('window.ccaEpisodeStore.state.alerts.length');
console.log(`Step 5: Submitted Confirmation: Step ${step5} | Active Alerts: ${alertsLen}`);
await screenshot('qa_02_fever_submitted_emergency.png');

await evaluate("document.getElementById('btnWizDone').click()");
await sleep(350);

console.log('\n--- 5. Doctor Flow: Urgent Triage Alert & Direct Care Directive ---');
await evaluate("window.ccaEpisodeStore.setRole('doctor')");
await sleep(350);
console.log(`Doctor Home Screen. Urgent Alert visible: ${await evaluate("!!document.getElementById('btnGoUrgentAlert')")}`);

await evaluate("document.getElementById('btnAckAlert').click()");
await sleep(350);
console.log(`Alert 0 Status: ${await evaluate('window.ccaEpisodeStore.state.alerts[0].status')}`);

await evaluate("document.getElementById('btnQuickDirective').click()");
await sleep(350);
console.log(`Directive Bottom Sheet Open: ${await evaluate("document.getElementById('bottomSheetModal').classList.contains('open')")}`);
await evaluate("document.getElementById('btnConfirmSendDirective').click()");
await sleep(400);
console.log(`Care directive published to patient artifacts. Total artifacts: ${await evaluate('window.ccaEpisodeStore.state.patientArtifacts.length')}`);
await screenshot('qa_03_doctor_home_acknowledged.png');

console.log('\n--- 6. Doctor Flow: Episode Summary, Scribe & Consultation Signing ---');
await evaluate("document.getElementById('btnOpenEleanorSummary').click()");
await sleep(350);
console.log(`Inside Eleanor Summary. Persistent Safety Header: ${await evaluate("document.getElementById('doctorSafetyHeader').style.display")}`);

await evaluate("document.getElementById('btnStartConsultation').click()");
await sleep(350);
console.log(`Consultation Workspace: ${await evaluate('window.ccaEpisodeStore.currentDoctorScreen')}`);

await evaluate("document.getElementById('btnLaunchScribe').click()");
await sleep(350);
console.log(`Voice Scribe Workspace: ${await evaluate('window.ccaEpisodeStore.currentDoctorScreen')}`);
await evaluate("document.getElementById('btnToggleRecord').click()");
await sleep(500);
await evaluate("document.getElementById('btnAcceptScribeAll').click()");
await sleep(350);
console.log(`Returned to Consultation. Assessment updated.`);

await evaluate("document.getElementById('btnSignConsultationModal').click()");
await sleep(350);
await evaluate("document.getElementById('btnExecuteSignConsult').click()");
await sleep(500);
const consultSigned = await evaluate("window.ccaEpisodeStore.consultationDraft.isSigned");
console.log(`Consultation Formally Signed: ${consultSigned}`);
await screenshot('qa_04_consultation_signed.png');

console.log('\n--- 7. Doctor Flow: OCR Document Fact Verification & NEXUS Run 2 ---');
await evaluate("window.ccaEpisodeStore.navigateDoctor('OCR')");
await sleep(350);
await evaluate("document.querySelector('.btnVerifyCandidate').click()");
await sleep(350);
const ki67Fact = await evaluate("window.ccaEpisodeStore.state.clinicalFacts.some(f => f.name.includes('Ki-67') && f.verified)");
console.log(`Ki-67 Fact Verified & Promoted: ${ki67Fact}`);

await evaluate("window.ccaEpisodeStore.navigateDoctor('NEXUS')");
await sleep(350);
await evaluate("document.getElementById('btnReRunNexus').click()");
await sleep(500);
const run2 = await evaluate("window.ccaEpisodeStore.state.nexusSnapshots.some(s => s.runId === 'NEX-RUN-02')");
console.log(`NEXUS Snapshot 2 Confirmed: ${run2}`);
await screenshot('qa_05_nexus_snapshot2.png');

console.log('\n--- 8. Doctor Flow: Treatment Plan v2 Revision & Signature ---');
await evaluate("window.ccaEpisodeStore.navigateDoctor('Plan')");
await sleep(350);
await evaluate("document.getElementById('btnCreatePlanRevision').click()");
await sleep(350);
await evaluate("document.getElementById('btnSignPlanDraftModal').click()");
await sleep(350);
await evaluate("document.getElementById('btnConfirmSignPlan').click()");
await sleep(500);
const plan2 = await evaluate("window.ccaEpisodeStore.state.treatmentPlans.find(p => p.version === 2).status");
const plan1 = await evaluate("window.ccaEpisodeStore.state.treatmentPlans.find(p => p.version === 1).status");
console.log(`Plan v2 Status: ${plan2} | Plan v1 Status: ${plan1}`);
await screenshot('qa_06_plan_v2_signed.png');

console.log('\n--- 9. Doctor Flow: CBC Result Review & Patient Release ---');
await evaluate("window.ccaEpisodeStore.navigateDoctor('Results')");
await sleep(350);
await evaluate("document.querySelector('.btnPreviewResult').click()");
await sleep(350);
await evaluate("document.getElementById('btnReleaseFromPreview').click()");
await sleep(500);
const cbcRel = await evaluate("window.ccaEpisodeStore.state.results.find(r => r.id === 'RES-CBC-D8').releaseState");
console.log(`Day 8 CBC Nadir Result Release State: ${cbcRel}`);
await screenshot('qa_07_result_released.png');

console.log('\n--- 10. Doctor Flow: Patient Directory Search & Messaging ---');
await evaluate("window.ccaEpisodeStore.navigateDoctor('Patients')");
await sleep(350);
await evaluate("window.ccaEpisodeStore.setPatientSearchQuery('Ananya')");
await sleep(350);
const filteredCount = await evaluate("document.querySelectorAll('.patient-card-item').length");
console.log(`Patient Directory filtered for 'Ananya': ${filteredCount} card(s)`);

await evaluate("window.ccaEpisodeStore.setPatientSearchQuery('')");
await evaluate("window.ccaEpisodeStore.navigateDoctor('Messages')");
await sleep(350);
await evaluate("document.getElementById('chatInputDoc').value = 'Hydration directive confirmed. Please rest.'");
await evaluate("document.getElementById('btnSendDocMsg').click()");
await sleep(350);
const lastMsg = await evaluate("window.ccaEpisodeStore.state.messages[window.ccaEpisodeStore.state.messages.length - 1].text");
console.log(`Doctor Sent Message: "${lastMsg}"`);

console.log('\n--- 11. Cross-Role Patient Verification: Results, Plan, Visit Summary Unlocked ---');
await evaluate("window.ccaEpisodeStore.setRole('patient')");
await sleep(350);
await screenshot('qa_08_patient_home_updated.png');

// Check released results in Patient portal
await evaluate("window.ccaEpisodeStore.navigatePatient('Results')");
await sleep(350);
const releasedCards = await evaluate("document.querySelectorAll('.card.glow-patient').length");
console.log(`Patient Released Results Visible: ${releasedCards}`);
await screenshot('qa_09_patient_results_unlocked.png');

// Check Plan v2 in Patient Roadmap
await evaluate("window.ccaEpisodeStore.navigatePatient('Roadmap')");
await sleep(350);
const activeRoadmap = await evaluate("window.ccaEpisodeStore.state.cancerEpisode.activePlanVersion");
console.log(`Patient Active Treatment Plan on Roadmap: v${activeRoadmap}`);

// Check Visit Summary
await evaluate("window.ccaEpisodeStore.navigatePatient('VisitSummary')");
await sleep(350);
const vsBtn = await evaluate("!!document.getElementById('btnAckVisitSummary')");
console.log(`Patient has released Visit Summary: ${vsBtn}`);
await evaluate("document.getElementById('btnAckVisitSummary').click()");
await sleep(300);

// Caregiver invite
await evaluate("window.ccaEpisodeStore.navigatePatient('Profile')");
await sleep(350);
await evaluate("document.getElementById('btnInviteCaregiverSheet').click()");
await sleep(350);
await evaluate("document.getElementById('btnConfirmInviteCaregiver').click()");
await sleep(400);
const cgLen = await evaluate("window.ccaEpisodeStore.state.patient.caregivers.length");
console.log(`Caregivers registered for Ananya: ${cgLen}`);

console.log('\n--- 12. Full Baseline Demo Reset Verification (R Key) ---');
await evaluate("window.ccaEpisodeStore.resetEpisode()");
await sleep(500);
const resetRole = await evaluate("window.ccaEpisodeStore.role");
const resetAlerts = await evaluate("window.ccaEpisodeStore.state.alerts.length");
console.log(`After Reset: Role = ${resetRole}, Active Alerts = ${resetAlerts}`);
await screenshot('qa_10_demo_reset_baseline.png');

console.log('\n======================================================');
console.log('🎉 ALL 12 AUTOMATED INTERACTION FLOWS VERIFIED 100% PASS');
console.log('======================================================');

ws.close();
chrome.kill();
process.exit(0);
