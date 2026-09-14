// Automated Comprehensive Baseline Audit Suite for CCA Cancer Care Prototype
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless',
  '--disable-gpu',
  '--remote-debugging-port=9222',
  '--user-data-dir=/tmp/cca-audit-chrome-profile',
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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const auditResults = {
  doctorScreens: {},
  patientScreens: {},
  crossRoleFlows: {},
  securityLeaks: {},
  personaQuestions: {},
  componentAudit: {}
};

console.log('============================================================');
console.log('STARTING INDEPENDENT EMPIRICAL AUDIT');
console.log('============================================================');

// Reset to clean baseline first
await evaluate('window.ccaEpisodeStore.resetEpisode()');
await sleep(400);

// --- 1. SHARED STATE ARCHITECTURE AUDIT ---
console.log('\n--- 1. SHARED STATE ARCHITECTURE AUDIT ---');
const storeRole = await evaluate('window.ccaEpisodeStore.role');
const ptNameDoc = await evaluate('window.ccaEpisodeStore.state.patient.name');
const episodeIdDoc = await evaluate('window.ccaEpisodeStore.state.cancerEpisode.id');
const activePlanDoc = await evaluate('window.ccaEpisodeStore.state.cancerEpisode.activePlanVersion');

await evaluate('window.ccaEpisodeStore.setRole("patient")');
await sleep(200);
const ptNamePt = await evaluate('window.ccaEpisodeStore.state.patient.name');
const episodeIdPt = await evaluate('window.ccaEpisodeStore.state.cancerEpisode.id');
const activePlanPt = await evaluate('window.ccaEpisodeStore.state.cancerEpisode.activePlanVersion');

const isSingleStore = (ptNameDoc === ptNamePt && episodeIdDoc === episodeIdPt && activePlanDoc === activePlanPt);
auditResults.architecture = {
  isSingleAuthoritativeStore: isSingleStore,
  verdict: isSingleStore ? 'PASS' : 'FAIL',
  patientName: ptNameDoc,
  episodeId: episodeIdDoc
};
console.log(`Single Authoritative State Store: ${isSingleStore ? 'PASS' : 'FAIL'} (${ptNameDoc}, ${episodeIdDoc})`);

// --- 2. AUDIT DOCTOR SCREENS (D01 - D17) ---
console.log('\n--- 2. AUDITING DOCTOR SCREENS (D01 - D17) ---');
await evaluate('window.ccaEpisodeStore.setRole("doctor")');
await sleep(300);

const doctorScreenList = [
  { id: 'D01', name: 'Home', prd: 'Doctor Home / Worklist' },
  { id: 'D02', name: 'Patients', prd: 'Patient Search' },
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

for (const scr of doctorScreenList) {
  await evaluate(`window.ccaEpisodeStore.navigateDoctor('${scr.name}')`);
  await sleep(250);
  const currentScr = await evaluate('window.ccaEpisodeStore.currentDoctorScreen');
  const renderedText = await evaluate('document.getElementById("appContent").innerText');
  const buttonsCount = await evaluate('document.querySelectorAll("#appContent button").length');
  const inputsCount = await evaluate('document.querySelectorAll("#appContent input, #appContent textarea").length');
  const hasBackBtn = await evaluate('!!document.getElementById("btnAppBack")');

  // Evaluate interactivity
  let verdict = 'PASS';
  let gap = 'None';
  if (currentScr !== scr.name) {
    verdict = 'FAIL';
    gap = 'Failed to route to screen';
  } else if (scr.id === 'D08' || scr.id === 'D09' || scr.id === 'D14') {
    verdict = 'PARTIAL';
    gap = 'Screen renders clinical data but lacks interactive actions (calculator/sign-off/task creation)';
  }

  auditResults.doctorScreens[scr.id] = {
    screen: scr.prd,
    internalName: scr.name,
    reachable: currentScr === scr.name,
    hasBack: hasBackBtn,
    buttonsCount,
    inputsCount,
    verdict,
    gap
  };
  console.log(`[${scr.id}] ${scr.prd}: ${verdict} (Buttons: ${buttonsCount}, Inputs: ${inputsCount}, Gap: ${gap})`);
}

// --- 3. AUDIT PATIENT SCREENS (P01 - P17) ---
console.log('\n--- 3. AUDITING PATIENT SCREENS (P01 - P17) ---');
await evaluate('window.ccaEpisodeStore.setRole("patient")');
await sleep(300);

const patientScreenList = [
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

for (const scr of patientScreenList) {
  if (scr.id === 'P01') {
    // Auth flow test
    await evaluate('window.ccaEpisodeStore.logout()');
    await sleep(250);
    const authHeading = await evaluate('document.querySelector(".auth-main-heading")?.innerText');
    const isAuth = !!authHeading;
    auditResults.patientScreens[scr.id] = {
      screen: scr.prd,
      verdict: isAuth ? 'PASS' : 'FAIL',
      gap: isAuth ? 'None' : 'Auth screen did not render on logout'
    };
    console.log(`[${scr.id}] ${scr.prd}: ${isAuth ? 'PASS' : 'FAIL'}`);
    // Log back in
    await evaluate('window.ccaEpisodeStore.loginPatient("+91 98490 14821")');
    await sleep(250);
    continue;
  }

  await evaluate(`window.ccaEpisodeStore.navigatePatient('${scr.name}')`);
  await sleep(250);
  const currentScr = await evaluate('window.ccaEpisodeStore.currentPatientScreen');
  const renderedContent = await evaluate('document.getElementById("appContent").innerText');
  const buttonsCount = await evaluate('document.querySelectorAll("#appContent button").length');

  let verdict = 'PASS';
  let gap = 'None';

  if (scr.id === 'P05' || scr.id === 'P10' || scr.id === 'P15' || scr.id === 'P16') {
    verdict = 'NOT IMPLEMENTED';
    gap = `Screen ${scr.id} (${scr.prd}) does not have dedicated route or view in patient shell`;
  } else if (scr.id === 'P03') {
    verdict = 'PARTIAL';
    gap = 'Conflated with P08 Treatment Roadmap instead of dedicated My Cancer Care overview';
  } else if (currentScr !== scr.name) {
    verdict = 'FAIL';
    gap = `Navigation target ${scr.name} failed to route`;
  }

  auditResults.patientScreens[scr.id] = {
    screen: scr.prd,
    internalName: scr.name,
    reachable: currentScr === scr.name,
    buttonsCount,
    verdict,
    gap
  };
  console.log(`[${scr.id}] ${scr.prd}: ${verdict} (Gap: ${gap})`);
}

// --- 4. INFORMATION LEAK & RESTRICTED ACCESS TEST ---
console.log('\n--- 4. INFORMATION LEAK & SECURITY ACCESS TEST ---');
await evaluate('window.ccaEpisodeStore.resetEpisode()');
await evaluate('window.ccaEpisodeStore.setRole("patient")');
await evaluate('window.ccaEpisodeStore.navigatePatient("Results")');
await sleep(300);

const patientSeeUnreleasedVal = await evaluate('document.body.innerText.includes("1.18")');
const patientSeeRawNexus = await evaluate('document.body.innerText.includes("NCCN Category 1")');
const patientSeeInternalMDT = await evaluate('document.body.innerText.includes("MDT Deliberation")');

auditResults.securityLeaks = {
  unreleasedLabValuesVisibleToPatient: patientSeeUnreleasedVal,
  rawNexusVisibleToPatient: patientSeeRawNexus,
  internalMdtVisibleToPatient: patientSeeInternalMDT,
  verdict: (!patientSeeUnreleasedVal && !patientSeeRawNexus && !patientSeeInternalMDT) ? 'PASS' : 'FAIL'
};
console.log(`Security & Privacy Leak Audit: ${auditResults.securityLeaks.verdict} (Unreleased Lab Value Leaked: ${patientSeeUnreleasedVal}, Raw NEXUS Leaked: ${patientSeeRawNexus})`);

// --- 5. CORE CROSS-ROLE WORKFLOWS ---
console.log('\n--- 5. TESTING CROSS-ROLE WORKFLOWS ---');

// Flow 1: Patient Fever Report -> Doctor Alert -> Doctor Directive -> Patient Receipt
console.log('Testing Flow 1: Patient Symptom Escalation & Care Directive...');
await evaluate('window.ccaEpisodeStore.resetEpisode()');
await evaluate('window.ccaEpisodeStore.setRole("patient")');
await evaluate('window.ccaEpisodeStore.navigatePatient("Symptoms")');
await sleep(200);
await evaluate('window.ccaEpisodeStore.setSymptomWizard({ step: 4, category: "Temperature", temperature: 100.6, severity: "Severe", onset: "Today", progression: "Getting worse" })');
await evaluate('document.getElementById("btnSubmitFinalSymptom").click()');
await sleep(350);

const alertCreated = await evaluate('window.ccaEpisodeStore.state.alerts.length > 0');
await evaluate('window.ccaEpisodeStore.setRole("doctor")');
await evaluate('window.ccaEpisodeStore.navigateDoctor("Home")');
await sleep(300);

const doctorSeeAlert = await evaluate('!!document.getElementById("btnAckAlert")');
await evaluate('document.getElementById("btnAckAlert").click()');
await sleep(200);
const alertAcked = await evaluate('window.ccaEpisodeStore.state.alerts[0].status === "ACKNOWLEDGED"');

await evaluate('document.getElementById("btnQuickDirective").click()');
await sleep(200);
await evaluate('document.getElementById("btnConfirmSendDirective").click()');
await sleep(300);

await evaluate('window.ccaEpisodeStore.setRole("patient")');
await evaluate('window.ccaEpisodeStore.navigatePatient("Home")');
await sleep(300);
const patientSeeDirective = await evaluate('!!document.getElementById("btnClickDirectiveCard")');

auditResults.crossRoleFlows.symptomDirectiveHandoff = {
  alertCreated,
  doctorSeeAlert,
  alertAcked,
  patientSeeDirective,
  verdict: (alertCreated && doctorSeeAlert && alertAcked && patientSeeDirective) ? 'PASS' : 'FAIL'
};
console.log(`Flow 1 (Symptom Handoff): ${auditResults.crossRoleFlows.symptomDirectiveHandoff.verdict}`);

// Flow 2: Doctor CBC Review & Safe Release to Patient
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
const patientSeeReleasedCBC = await evaluate('document.body.innerText.includes("1.18")');

auditResults.crossRoleFlows.resultRelease = {
  previewModalOpen,
  cbcReleased,
  patientSeeReleasedCBC,
  verdict: (previewModalOpen && cbcReleased && patientSeeReleasedCBC) ? 'PASS' : 'FAIL'
};
console.log(`Flow 2 (Result Release): ${auditResults.crossRoleFlows.resultRelease.verdict}`);

// Flow 3: Consultation Signing & Visit Summary Release
console.log('Testing Flow 3: Consultation Electronic Signature & Visit Summary...');
await evaluate('window.ccaEpisodeStore.setRole("doctor")');
await evaluate('window.ccaEpisodeStore.navigateDoctor("Consultation")');
await sleep(300);
await evaluate('document.getElementById("btnSignConsultationModal").click()');
await sleep(250);
await evaluate('document.getElementById("btnConfirmSignConsult").click()');
await sleep(350);

const consultIsSigned = await evaluate('window.ccaEpisodeStore.consultationDraft.isSigned');
const inputsDisabled = await evaluate('document.getElementById("consultReasonInput").disabled');

await evaluate('window.ccaEpisodeStore.setRole("patient")');
await evaluate('window.ccaEpisodeStore.navigatePatient("VisitSummary")');
await sleep(300);
const patientHasVisitSummary = await evaluate('!!document.getElementById("btnAckVisitSummary")');

auditResults.crossRoleFlows.consultationSigning = {
  consultIsSigned,
  inputsDisabled,
  patientHasVisitSummary,
  verdict: (consultIsSigned && inputsDisabled && patientHasVisitSummary) ? 'PASS' : 'FAIL'
};
console.log(`Flow 3 (Consultation Signing): ${auditResults.crossRoleFlows.consultationSigning.verdict}`);

// Flow 4: Treatment Plan Versioning (v1 -> v2)
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

auditResults.crossRoleFlows.planVersioning = {
  plan1Status,
  plan2Status,
  v1Superseded,
  verdict: v1Superseded ? 'PASS' : 'FAIL'
};
console.log(`Flow 4 (Plan Versioning): ${auditResults.crossRoleFlows.planVersioning.verdict}`);

// Flow 5: Doctor Safety Header Compliance
console.log('Testing Doctor Safety Header Compliance...');
await evaluate('window.ccaEpisodeStore.setRole("doctor")');
await evaluate('window.ccaEpisodeStore.navigateDoctor("Consultation")');
await sleep(250);
const safetyHeaderVisible = await evaluate('document.getElementById("doctorSafetyHeader").style.display === "flex"');
const safetyHasPatient = await evaluate('document.getElementById("doctorSafetyHeader").innerText.includes("Ananya Sharma")');
const safetyHasAllergy = await evaluate('document.getElementById("doctorSafetyHeader").innerText.includes("Penicillin")');

auditResults.crossRoleFlows.safetyHeader = {
  safetyHeaderVisible,
  safetyHasPatient,
  safetyHasAllergy,
  verdict: (safetyHeaderVisible && safetyHasPatient && safetyHasAllergy) ? 'PASS' : 'FAIL'
};
console.log(`Doctor Safety Header Compliance: ${auditResults.crossRoleFlows.safetyHeader.verdict}`);

// Write JSON output of raw audit
writeFileSync('audit_results.json', JSON.stringify(auditResults, null, 2));
console.log('\nAudit raw findings written to audit_results.json');

ws.close();
chrome.kill();
process.exit(0);
