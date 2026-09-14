import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('============================================================');
console.log('STARTING POST-REMEDIATION REGRESSION TEST SUITE');
console.log('============================================================');

const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless',
  '--remote-debugging-port=9223',
  '--disable-gpu',
  '--user-data-dir=/tmp/cca-regr-chrome-profile',
  '--window-size=1400,900',
  'http://localhost:4321'
]);

await sleep(2000);

const tabsRes = await fetch('http://localhost:9223/json');
const tabs = await tabsRes.json();
const pageTab = tabs.find(t => t.type === 'page');
if (!pageTab) {
  console.error('Failed to find page tab in Chrome.');
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

await call('Page.enable');
await call('Runtime.enable');
await sleep(1000);

const regressionResults = {
  architecture: {},
  doctorScreens: {},
  patientScreens: {},
  securityLeaks: {},
  crossRoleFlows: {},
  newFeatures: {}
};

// 1. ARCHITECTURE
console.log('\n--- 1. SINGLE AUTHORITATIVE STATE ARCHITECTURE ---');
const isSingleStore = await evaluate('!!window.ccaEpisodeStore && typeof window.ccaEpisodeStore.subscribe === "function"');
const ptName = await evaluate('window.ccaEpisodeStore.state.patient.name');
const epId = await evaluate('window.ccaEpisodeStore.state.cancerEpisode.id');
regressionResults.architecture = {
  isSingleStore,
  ptName,
  epId,
  verdict: (isSingleStore && ptName === 'Ananya Sharma') ? 'PASS' : 'FAIL'
};
console.log(`Single Authoritative Store: ${regressionResults.architecture.verdict} (${ptName}, ${epId})`);

// 2. DOCTOR SCREENS (D01 - D17)
console.log('\n--- 2. VERIFYING DOCTOR SCREENS (D01 - D17) ---');
await evaluate('window.ccaEpisodeStore.resetEpisode()');
await evaluate('window.ccaEpisodeStore.setRole("doctor")');
await sleep(300);

const doctorScreens = [
  { id: 'D01', name: 'Home', prd: 'Doctor Home / Worklist' },
  { id: 'D02', name: 'Search', prd: 'Patient Search' },
  { id: 'D03', name: 'Summary', prd: 'Patient / Episode Summary' },
  { id: 'D04', name: 'Consultation', prd: 'Consultation Workspace' },
  { id: 'D05', name: 'Scribe', prd: 'Voice Scribe' },
  { id: 'D06', name: 'OCR', prd: 'OCR / External Document Review' },
  { id: 'D07', name: 'NEXUS', prd: 'NEXUS Clinical Reasoning' },
  { id: 'D08', name: 'Staging', prd: 'Staging' },
  { id: 'D09', name: 'Pathway', prd: 'Guideline Pathway' },
  { id: 'D10', name: 'Plan', prd: 'Treatment Plan' },
  { id: 'D11', name: 'Cycle', prd: 'Treatment / Cycle Decision' },
  { id: 'D12', name: 'Results', prd: 'Results Inbox' },
  { id: 'D13', name: 'Messages', prd: 'Patient Messages / Questions' },
  { id: 'D14', name: 'MDT', prd: 'MDT' },
  { id: 'D15', name: 'Timeline', prd: 'Timeline' },
  { id: 'D16', name: 'Tasks', prd: 'Tasks & Alerts' },
  { id: 'D17', name: 'Profile', prd: 'Profile / Availability' }
];

for (const scr of doctorScreens) {
  await evaluate(`window.ccaEpisodeStore.navigateDoctor('${scr.name}')`);
  await sleep(250);
  const curScr = await evaluate('window.ccaEpisodeStore.currentDoctorScreen');
  const buttonsCount = await evaluate('document.querySelectorAll("#appContent button").length');
  const inputsCount = await evaluate('document.querySelectorAll("#appContent input, #appContent textarea, #appContent select").length');
  
  let verdict = 'PASS';
  let gap = 'None';
  if (curScr !== scr.name) {
    verdict = 'FAIL';
    gap = 'Failed to route';
  } else if ((scr.id === 'D08' || scr.id === 'D09' || scr.id === 'D14') && buttonsCount === 0) {
    verdict = 'PARTIAL';
    gap = 'Lacks interactive buttons';
  }
  regressionResults.doctorScreens[scr.id] = { screen: scr.prd, buttonsCount, inputsCount, verdict, gap };
  console.log(`[${scr.id}] ${scr.prd}: ${verdict} (Buttons: ${buttonsCount}, Inputs: ${inputsCount})`);
}

// 3. PATIENT SCREENS (P01 - P17)
console.log('\n--- 3. VERIFYING ALL 17 PATIENT SCREENS (P01 - P17) ---');
await evaluate('window.ccaEpisodeStore.setRole("patient")');
await sleep(300);

const patientScreens = [
  { id: 'P01', name: 'Auth', prd: 'Login / Record Link' },
  { id: 'P02', name: 'Home', prd: 'My Care Today' },
  { id: 'P03', name: 'MyCare', prd: 'My Cancer Care' },
  { id: 'P04', name: 'Appointments', prd: 'Appointments' },
  { id: 'P05', name: 'VisitPreparation', prd: 'Visit Preparation' },
  { id: 'P06', name: 'Documents', prd: 'Documents Upload' },
  { id: 'P07', name: 'VisitSummary', prd: 'Visit Summary' },
  { id: 'P08', name: 'Roadmap', prd: 'Treatment Roadmap' },
  { id: 'P09', name: 'Medicines', prd: 'Medicines' },
  { id: 'P10', name: 'TreatmentDay', prd: 'Treatment Day' },
  { id: 'P11', name: 'Symptoms', prd: 'Symptoms / PROMs' },
  { id: 'P12', name: 'UrgentHelp', prd: 'Urgent Help' },
  { id: 'P13', name: 'Results', prd: 'Results' },
  { id: 'P14', name: 'Messages', prd: 'Messages' },
  { id: 'P15', name: 'Billing', prd: 'Bills / Insurance' },
  { id: 'P16', name: 'Survivorship', prd: 'Treatment Summary / Survivorship' },
  { id: 'P17', name: 'Profile', prd: 'Profile / Caregiver Access' }
];

for (const scr of patientScreens) {
  if (scr.id === 'P01') {
    await evaluate('window.ccaEpisodeStore.logout()');
    await sleep(250);
    const authHeading = await evaluate('!!document.querySelector(".auth-main-heading")');
    regressionResults.patientScreens[scr.id] = { screen: scr.prd, verdict: authHeading ? 'PASS' : 'FAIL', gap: 'None' };
    console.log(`[P01] Login / Record Link: ${authHeading ? 'PASS' : 'FAIL'}`);
    await evaluate('window.ccaEpisodeStore.loginPatient("+91 98490 14821")');
    await sleep(250);
    continue;
  }

  await evaluate(`window.ccaEpisodeStore.navigatePatient('${scr.name}')`);
  await sleep(250);
  const curScr = await evaluate('window.ccaEpisodeStore.currentPatientScreen');
  const buttonsCount = await evaluate('document.querySelectorAll("#appContent button").length');
  const inputsCount = await evaluate('document.querySelectorAll("#appContent input, #appContent textarea").length');
  
  let verdict = (curScr === scr.name) ? 'PASS' : 'FAIL';
  let gap = (verdict === 'PASS') ? 'None' : `Failed to route to ${scr.name}`;
  regressionResults.patientScreens[scr.id] = { screen: scr.prd, buttonsCount, inputsCount, verdict, gap };
  console.log(`[${scr.id}] ${scr.prd}: ${verdict} (Buttons: ${buttonsCount}, Inputs: ${inputsCount})`);
}

// 4. INFORMATION LEAK & SECURITY TEST
console.log('\n--- 4. INFORMATION LEAK & RESTRICTED ACCESS TEST ---');
await evaluate('window.ccaEpisodeStore.resetEpisode()');
await evaluate('window.ccaEpisodeStore.setRole("patient")');
await evaluate('window.ccaEpisodeStore.navigatePatient("Results")');
await sleep(300);

// Check phone content specifically (not the right-side presentation deck)
const unreleasedLeakedInPhone = await evaluate('document.getElementById("appContent").innerText.includes("1.18")');
const rawNexusInPhone = await evaluate('document.getElementById("appContent").innerText.includes("NCCN Category 1")');
const mdtInPhone = await evaluate('document.getElementById("appContent").innerText.includes("MDT Deliberation")');

regressionResults.securityLeaks = {
  unreleasedLabValuesVisibleToPatient: unreleasedLeakedInPhone,
  rawNexusVisibleToPatient: rawNexusInPhone,
  internalMdtVisibleToPatient: mdtInPhone,
  verdict: (!unreleasedLeakedInPhone && !rawNexusInPhone && !mdtInPhone) ? 'PASS' : 'FAIL'
};
console.log(`Security Leak Audit: ${regressionResults.securityLeaks.verdict} (Unreleased Lab Leaked: ${unreleasedLeakedInPhone}, Raw NEXUS: ${rawNexusInPhone})`);

// 5. CROSS-ROLE FLOW 1: Symptom Alert & Care Directive
console.log('\n--- 5. TESTING CROSS-ROLE WORKFLOWS ---');
console.log('Testing Flow 1: Patient Symptom Escalation & Care Directive...');
await evaluate('window.ccaEpisodeStore.resetEpisode()');
await evaluate('window.ccaEpisodeStore.setRole("patient")');
await evaluate('window.ccaEpisodeStore.navigatePatient("Symptoms")');
await sleep(200);
await evaluate('window.ccaEpisodeStore.setSymptomWizard({ step: 4, category: "Temperature", temperature: 100.6, severity: "Severe", onset: "Today", progression: "Getting worse" })');
await evaluate('document.getElementById("btnSubmitFinalSymptom").click()');
await sleep(300);

const alertCreated = await evaluate('window.ccaEpisodeStore.state.alerts.length > 0');
await evaluate('window.ccaEpisodeStore.setRole("doctor")');
await evaluate('window.ccaEpisodeStore.navigateDoctor("Home")');
await sleep(300);

const doctorSeeAlert = await evaluate('!!document.getElementById("btnAckAlert")');
await evaluate('document.getElementById("btnAckAlert").click()');
await sleep(200);
const alertAcked = await evaluate('window.ccaEpisodeStore.state.alerts[0].status === "ACKNOWLEDGED"');

// Direct care directive submission via store
await evaluate('window.ccaEpisodeStore.sendCareInstruction("Clinical Care Directive", "Drink at least 3 Liters daily and take Ondansetron before meals.")');
await sleep(200);

await evaluate('window.ccaEpisodeStore.setRole("patient")');
await evaluate('window.ccaEpisodeStore.navigatePatient("Home")');
await sleep(300);
const patientSeeDirective = await evaluate('!!document.getElementById("btnClickDirectiveCard")');

regressionResults.crossRoleFlows.symptomDirectiveHandoff = {
  alertCreated,
  doctorSeeAlert,
  alertAcked,
  patientSeeDirective,
  verdict: (alertCreated && doctorSeeAlert && alertAcked && patientSeeDirective) ? 'PASS' : 'FAIL'
};
console.log(`Flow 1 (Symptom Handoff): ${regressionResults.crossRoleFlows.symptomDirectiveHandoff.verdict}`);

// Flow 2: Result Release
console.log('Testing Flow 2: Doctor CBC Review & Safe Patient Release...');
await evaluate('window.ccaEpisodeStore.setRole("doctor")');
await evaluate('window.ccaEpisodeStore.navigateDoctor("Results")');
await sleep(300);

await evaluate('document.querySelector(".btnPreviewResult").click()');
await sleep(300);
const previewModalOpen = await evaluate('document.getElementById("bottomSheetModal").classList.contains("open")');
await evaluate('document.getElementById("btnReleaseFromPreview").click()');
await sleep(350);

const cbcReleased = await evaluate('window.ccaEpisodeStore.state.results.find(r => r.id === "RES-CBC-D8").releaseState === "RELEASED"');
await evaluate('window.ccaEpisodeStore.setRole("patient")');
await evaluate('window.ccaEpisodeStore.navigatePatient("Results")');
await sleep(300);
const patientSeeReleasedCBC = await evaluate('document.getElementById("appContent").innerText.includes("1.18")');

regressionResults.crossRoleFlows.resultRelease = {
  previewModalOpen,
  cbcReleased,
  patientSeeReleasedCBC,
  verdict: (previewModalOpen && cbcReleased && patientSeeReleasedCBC) ? 'PASS' : 'FAIL'
};
console.log(`Flow 2 (Result Release): ${regressionResults.crossRoleFlows.resultRelease.verdict}`);

// Flow 3: Consultation Signing
console.log('Testing Flow 3: Consultation Electronic Signature & Visit Summary...');
await evaluate('window.ccaEpisodeStore.setRole("doctor")');
await evaluate('window.ccaEpisodeStore.navigateDoctor("Consultation")');
await sleep(300);
await evaluate('document.getElementById("btnSignConsultationModal").click()');
await sleep(250);
await evaluate('document.getElementById("btnExecuteSignConsult").click()');
await sleep(350);

const consultIsSigned = await evaluate('window.ccaEpisodeStore.consultationDraft.isSigned');
const inputsDisabled = await evaluate('document.getElementById("consultReasonInput").disabled');

await evaluate('window.ccaEpisodeStore.setRole("patient")');
await evaluate('window.ccaEpisodeStore.navigatePatient("VisitSummary")');
await sleep(300);
const patientHasVisitSummary = await evaluate('!!document.getElementById("btnAckVisitSummary")');

regressionResults.crossRoleFlows.consultationSigning = {
  consultIsSigned,
  inputsDisabled,
  patientHasVisitSummary,
  verdict: (consultIsSigned && inputsDisabled && patientHasVisitSummary) ? 'PASS' : 'FAIL'
};
console.log(`Flow 3 (Consultation Signing): ${regressionResults.crossRoleFlows.consultationSigning.verdict}`);

// Flow 4: Plan Versioning
console.log('Testing Flow 4: Treatment Plan Versioning v1 -> v2...');
await evaluate('window.ccaEpisodeStore.setRole("doctor")');
await evaluate('window.ccaEpisodeStore.navigateDoctor("Plan")');
await sleep(300);
await evaluate('document.getElementById("btnCreatePlanRevision").click()');
await sleep(300);
await evaluate('document.getElementById("btnSignPlanDraftModal").click()');
await sleep(250);
await evaluate('document.getElementById("btnConfirmSignPlan").click()');
await sleep(350);

const plan1Status = await evaluate('window.ccaEpisodeStore.state.treatmentPlans.find(p => p.version === 1).status');
const plan2Status = await evaluate('window.ccaEpisodeStore.state.treatmentPlans.find(p => p.version === 2).status');
const v1Superseded = (plan1Status === 'SUPERSEDED' && plan2Status === 'SIGNED');

regressionResults.crossRoleFlows.planVersioning = {
  plan1Status,
  plan2Status,
  v1Superseded,
  verdict: v1Superseded ? 'PASS' : 'FAIL'
};
console.log(`Flow 4 (Plan Versioning): ${regressionResults.crossRoleFlows.planVersioning.verdict}`);

// Safety Header Check
const safetyHeaderVisible = await evaluate('document.getElementById("doctorSafetyHeader").style.display !== "none"');
const safetyHasPatient = await evaluate('document.getElementById("doctorSafetyHeader").innerText.includes("Ananya Sharma")');
const safetyHasAllergy = await evaluate('document.getElementById("doctorSafetyHeader").innerText.includes("Penicillin")');
regressionResults.crossRoleFlows.safetyHeader = {
  safetyHeaderVisible,
  safetyHasPatient,
  safetyHasAllergy,
  verdict: (safetyHeaderVisible && safetyHasPatient && safetyHasAllergy) ? 'PASS' : 'FAIL'
};
writeFileSync('regression_results.json', JSON.stringify(regressionResults, null, 2));
console.log('\nRegression results saved to regression_results.json');

ws.close();
chromeProc.kill();
process.exit(0);
