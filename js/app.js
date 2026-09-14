/**
 * CCA Cancer Care — Single App: Doctor + Patient
 * Master Application Controller & Screen Renderer
 * 
 * Fully Clickable End-to-End Mobile Prototype
 * Every visually clickable element is fully wired with real state mutations and navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.ccaEpisodeStore;

  // DOM Elements - Presentation Chrome
  const deviceWrapper = document.getElementById('deviceWrapper');
  const hotspotOverlay = document.getElementById('hotspotOverlay');
  const presenterPanel = document.getElementById('presenterPanel');
  const panelToggleBtn = document.getElementById('panelToggleBtn');
  const zoomSelect = document.getElementById('zoomSelect');
  const hotspotsBtn = document.getElementById('hotspotsBtn');
  const restartBtn = document.getElementById('restartBtn');
  const guidedDemoBtn = document.getElementById('guidedDemoBtn');
  const resetConfirmModal = document.getElementById('resetConfirmModal');
  const cancelResetBtn = document.getElementById('cancelResetBtn');
  const confirmResetBtn = document.getElementById('confirmResetBtn');
  const guidedDemoBanner = document.getElementById('guidedDemoBanner');
  const guidedStepText = document.getElementById('guidedStepText');
  const guidedNextBtn = document.getElementById('guidedNextBtn');
  const guidedCloseBtn = document.getElementById('guidedCloseBtn');

  // DOM Elements - Device & Mobile App
  const roleBtnPatient = document.getElementById('roleBtnPatient');
  const roleBtnDoctor = document.getElementById('roleBtnDoctor');
  const appContent = document.getElementById('appContent');
  const dynamicIsland = document.getElementById('dynamicIsland');
  const statusTime = document.getElementById('statusTime');
  const tabBar = document.getElementById('tabBar');
  const bottomSheetModal = document.getElementById('bottomSheetModal');
  const screenToast = document.getElementById('screenToast');
  const doctorSafetyHeader = document.getElementById('doctorSafetyHeader');
  const doctorSubnavBar = document.getElementById('doctorSubnavBar');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  let hotspotsActive = false;
  let guidedDemoStep = 0;
  let scribeRecording = false;

  // 10 Guided Demo Steps
  const GUIDED_STEPS = [
    { text: "1. Patient: Click 'Report Symptoms' on Home to check in Day 8 nadir.", action: () => { store.resetSymptomWizard(); store.navigatePatient("Symptoms"); } },
    { text: "2. Patient: Choose Temperature -> 100.6°F -> Moderate -> Submit.", action: () => { store.setSymptomWizard({ step: 2, category: "Temperature", temperature: 100.6, severity: "Severe" }); } },
    { text: "3. Switch to Doctor: See immediate Urgent Alert on worklist.", action: () => store.navigateDoctor("Home") },
    { text: "4. Doctor: Review urgent alert and click 'Acknowledge'.", action: () => { const a = store.state.alerts[0]; if (a) store.acknowledgeAlert(a.id); store.navigateDoctor("Tasks"); } },
    { text: "5. Doctor: Issue care directive (Hydration & Pre-Med Protocol).", action: () => { store.sendCareInstruction("Hydration & Pre-Med Protocol", "Drink at least 3L fluids daily. Take prescribed anti-emetics 30 min before meals."); store.navigateDoctor("Messages"); } },
    { text: "6. Return to Patient: See care directive on Home & in Messages.", action: () => store.navigatePatient("Home") },
    { text: "7. Doctor: Review unreleased Day 8 CBC in Results queue.", action: () => store.navigateDoctor("Results") },
    { text: "8. Doctor: Preview patient view and release CBC to Ananya.", action: () => { store.releaseResult("RES-CBC-D8"); store.navigatePatient("Results"); } },
    { text: "9. Doctor: Open NEXUS Clinical Reasoning decision support.", action: () => store.navigateDoctor("NEXUS") },
    { text: "10. Doctor: Create & sign Treatment Plan Revision v2.", action: () => { store.createTreatmentPlanVersion({}); store.signTreatmentPlanVersion(2); store.navigatePatient("Roadmap"); } }
  ];

  // Status Clock
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    if (statusTime) statusTime.textContent = `${hours}:${minutes}`;
  }
  updateClock();
  setInterval(updateClock, 10000);

  // Audio / Haptic Simulation
  function playClickHaptic() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(460, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }

  // Toast
  function showToast(msg, isAlert = false) {
    if (!screenToast) return;
    screenToast.textContent = msg;
    screenToast.className = `screen-toast show ${isAlert ? 'alert' : ''}`;
    setTimeout(() => {
      screenToast.className = 'screen-toast';
    }, 2800);
  }

  // Bottom Sheet Modal Controller
  function openBottomSheet(title, bodyHtml, onAttach) {
    if (!bottomSheetModal) return;
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = bodyHtml;
    bottomSheetModal.classList.add('open');
    if (onAttach) onAttach(bodyEl);
  }

  function closeBottomSheet() {
    if (bottomSheetModal) bottomSheetModal.classList.remove('open');
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeBottomSheet);
  if (bottomSheetModal) {
    bottomSheetModal.addEventListener('click', (e) => {
      if (e.target === bottomSheetModal) closeBottomSheet();
    });
  }

  // Hotspot Click Flash (Figma Blue Glow)
  document.addEventListener('click', (e) => {
    const screen = e.target.closest('.iphone-screen');
    if (!screen) return;

    const clickable = e.target.closest('[data-clickable="true"], button, input, select, textarea, .scenario-card, .screen-chip, .dynamic-island, .subnav-btn, .tab-item, .facility-option-card, .wizard-choice-btn, .wizard-severity-btn, .action-item, .patient-card-item, .roadmap-step');
    if (!clickable) {
      hotspotOverlay.classList.remove('flash');
      void hotspotOverlay.offsetWidth;
      hotspotOverlay.classList.add('flash');
    } else {
      playClickHaptic();
    }
  });

  // Hotspots Toggle
  if (hotspotsBtn) {
    hotspotsBtn.addEventListener('click', () => {
      hotspotsActive = !hotspotsActive;
      hotspotsBtn.classList.toggle('active', hotspotsActive);
      document.body.classList.toggle('hotspots-visible', hotspotsActive);
    });
  }

  // Keyboard Shortcuts (D, P, F, H, R)
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    const key = e.key.toUpperCase();
    if (key === 'D') {
      store.setRole('doctor');
    } else if (key === 'P') {
      store.setRole('patient');
    } else if (key === 'F') {
      applyZoom('fit');
      if (zoomSelect) zoomSelect.value = 'fit';
    } else if (key === 'H') {
      if (hotspotsBtn) hotspotsBtn.click();
    } else if (key === 'R') {
      openResetModal();
    }
  });

  // Zoom & Fit
  function applyZoom(mode) {
    if (!deviceWrapper) return;
    if (mode === '100') {
      deviceWrapper.style.transform = 'scale(1)';
    } else if (mode === '85') {
      deviceWrapper.style.transform = 'scale(0.85)';
    } else if (mode === '75') {
      deviceWrapper.style.transform = 'scale(0.75)';
    } else if (mode === 'fit') {
      const stage = document.querySelector('.prototype-stage');
      const stageHeight = stage.clientHeight - 70;
      const scale = Math.min(1, Math.max(0.65, stageHeight / 920));
      deviceWrapper.style.transform = `scale(${scale.toFixed(2)})`;
    }
  }

  if (zoomSelect) {
    zoomSelect.addEventListener('change', (e) => applyZoom(e.target.value));
    window.addEventListener('resize', () => {
      if (zoomSelect.value === 'fit') applyZoom('fit');
    });
    applyZoom('fit');
  }

  // Reset Modal
  function openResetModal() {
    if (resetConfirmModal) resetConfirmModal.classList.add('open');
  }
  function closeResetModal() {
    if (resetConfirmModal) resetConfirmModal.classList.remove('open');
  }

  if (restartBtn) restartBtn.addEventListener('click', openResetModal);
  if (cancelResetBtn) cancelResetBtn.addEventListener('click', closeResetModal);
  if (confirmResetBtn) {
    confirmResetBtn.addEventListener('click', () => {
      store.resetEpisode();
      closeResetModal();
      showToast('Baseline demo state restored');
    });
  }

  // Guided Demo Tour
  if (guidedDemoBtn) {
    guidedDemoBtn.addEventListener('click', () => {
      guidedDemoStep = 0;
      guidedDemoBanner.classList.add('active');
      guidedStepText.textContent = GUIDED_STEPS[0].text;
    });

    if (guidedCloseBtn) {
      guidedCloseBtn.addEventListener('click', () => guidedDemoBanner.classList.remove('active'));
    }

    if (guidedNextBtn) {
      guidedNextBtn.addEventListener('click', () => {
        GUIDED_STEPS[guidedDemoStep].action();
        guidedDemoStep = (guidedDemoStep + 1) % GUIDED_STEPS.length;
        guidedStepText.textContent = GUIDED_STEPS[guidedDemoStep].text;
      });
    }
  }

  // Presenter Panel Drawer Toggle
  if (panelToggleBtn && presenterPanel) {
    panelToggleBtn.addEventListener('click', () => {
      presenterPanel.classList.toggle('open');
    });

    const panelClose = document.getElementById('panelClose');
    if (panelClose) {
      panelClose.addEventListener('click', () => {
        presenterPanel.classList.remove('open');
      });
    }
  }

  // Dynamic Island Click Interaction
  if (dynamicIsland) {
    dynamicIsland.addEventListener('click', (e) => {
      store.toggleDynamicIsland();
    });
  }

  // Presentation Studio Role Switchers
  if (roleBtnPatient) roleBtnPatient.addEventListener('click', () => store.setRole('patient'));
  if (roleBtnDoctor) roleBtnDoctor.addEventListener('click', () => store.setRole('doctor'));

  // Scenario Cards Execution
  document.querySelectorAll('.scenario-card').forEach(card => {
    card.addEventListener('click', () => {
      const scenId = card.getAttribute('data-scenario');
      executeScenario(scenId);
    });
  });

  function executeScenario(id) {
    switch(id) {
      case 'scen-symptom-fever':
        store.setRole('patient');
        store.setSymptomWizard({ step: 4, category: 'Temperature', temperature: 100.6, severity: 'Severe', onset: 'Today', progression: 'Getting worse' });
        store.navigatePatient('Symptoms');
        showToast('Scenario 1: Ready to submit 100.6°F fever check-in');
        break;
      case 'scen-triage-ack':
        store.setRole('doctor');
        store.navigateDoctor('Home');
        const alert = store.state.alerts[0];
        if (alert) store.acknowledgeAlert(alert.id);
        showToast('Scenario 2: Triage alert acknowledged by Dr Menon');
        break;
      case 'scen-directive-send':
        store.setRole('doctor');
        store.sendCareInstruction('Emergency Hydration Protocol', 'Drink at least 3 Liters of fluid daily. Contact clinic immediately if chills develop.');
        store.navigatePatient('Home');
        showToast('Scenario 3: Directive sent & received on Eleanor\'s Home');
        break;
      case 'scen-cbc-unreleased':
        store.setRole('patient');
        store.navigatePatient('Results');
        showToast('Scenario 4: Day 8 CBC is unreleased (Under Review)');
        break;
      case 'scen-cbc-release':
        store.setRole('doctor');
        store.releaseResult('RES-CBC-D8');
        store.navigatePatient('Results');
        showToast('Scenario 5: Result released with Dr Menon plain-language explanation');
        break;
      case 'scen-plan-v2':
        store.setRole('doctor');
        store.createTreatmentPlanVersion({});
        store.signTreatmentPlanVersion(2);
        store.navigatePatient('Roadmap');
        showToast('Scenario 6: Plan v2 signed · Roadmap updated');
        break;
      case 'scen-doc-upload':
        store.setRole('patient');
        store.uploadPatientDocument({ title: 'St. Jude Pathology Supplement', fileType: 'PDF' });
        store.navigateDoctor('OCR');
        showToast('Scenario 7: Document uploaded · OCR Candidate queued for Dr Menon');
        break;
      case 'scen-ocr-verify':
        store.setRole('doctor');
        const cand = store.state.ocrCandidates[0];
        if (cand) store.verifyOCRCandidate(cand.id);
        store.navigateDoctor('OCR');
        showToast('Scenario 8: Ki-67 verified and promoted to clinical record');
        break;
      case 'scen-nexus-run2':
        store.setRole('doctor');
        store.runNexusScenario();
        store.navigateDoctor('NEXUS');
        showToast('Scenario 9: NEXUS Snapshot 2 re-evaluated with verified evidence');
        break;
      case 'scen-consult-sign':
        store.setRole('doctor');
        store.signConsultation({
          assessment: 'Stage IIA IDC. Tolerating AC Day 8 nadir without neutropenic sepsis.',
          planNotes: 'Prepare for Friday pre-cycle blood test at 9:30 AM.'
        });
        store.navigatePatient('VisitSummary');
        showToast('Scenario 10: Consultation signed · Visit Summary released to Ananya');
        break;
      case 'scen-reset':
        store.resetEpisode();
        showToast('Scenario 11: Demo episode reset to pristine baseline');
        break;
    }
  }

  // Presenter Screen Jump Chips
  document.querySelectorAll('.screen-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const screenId = chip.getAttribute('data-screen');
      const isDoc = chip.classList.contains('doc-screen');
      if (isDoc) {
        store.navigateDoctor(screenId);
      } else {
        store.navigatePatient(screenId);
      }
      showToast(`Jumped to ${screenId}`);
    });
  });

  // Launch Flow Simulation Button in Presenter Bar
  const btnLaunchFlow = document.getElementById('btnLaunchFlow');
  if (btnLaunchFlow) {
    btnLaunchFlow.addEventListener('click', () => {
      store.startLaunchFlow('patient');
      showToast('Simulating native app cold launch...');
    });
  }

  // ========================================================
  // MASTER RENDER FUNCTION (REACTIVE ON EPISODE STORE)
  // ========================================================
  function render(state) {
    const isDoc = store.role === 'doctor';
    if (roleBtnDoctor) roleBtnDoctor.className = `role-btn ${isDoc ? 'active doctor-active' : ''}`;
    if (roleBtnPatient) roleBtnPatient.className = `role-btn ${!isDoc ? 'active patient-active' : ''}`;

    renderDynamicIsland(state);

    const appHeader = document.querySelector('.app-header');
    if (!store.auth.isLoggedIn) {
      if (appHeader) appHeader.style.display = 'none';
      if (doctorSafetyHeader) doctorSafetyHeader.style.display = 'none';
      if (doctorSubnavBar) doctorSubnavBar.style.display = 'none';
      if (tabBar) tabBar.style.display = 'none';
      renderAuthFlow(store.auth.step);
      return;
    }

    if (appHeader) appHeader.style.display = 'flex';
    if (tabBar) tabBar.style.display = 'flex';

    // Header Back Button & Breadcrumbs Hierarchy
    const navStack = isDoc ? store.doctorNavStack : store.patientNavStack;
    const isSubScreen = navStack.length > 1;

    const appBrand = document.querySelector('.app-brand');
    if (appBrand) {
      if (isSubScreen) {
        appBrand.innerHTML = `
          <button class="app-back-btn" id="btnAppBack" data-clickable="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            <span>Back</span>
          </button>
        `;
        const btnBack = document.getElementById('btnAppBack');
        if (btnBack) {
          btnBack.addEventListener('click', () => {
            if (isDoc) store.doctorGoBack();
            else store.patientGoBack();
          });
        }
      } else {
        appBrand.innerHTML = `
          <div class="app-brand-logo">CCA</div>
          <div class="app-title-text">
            <div class="app-name">
              CCA Cancer Care
              <span class="role-tag-pill ${isDoc ? 'doctor' : 'patient'}">${isDoc ? 'Oncologist' : 'Patient'}</span>
            </div>
            <span class="episode-tagline">${isDoc ? 'Dr Anjali Menon · Ananya Sharma (Cycle 3/6)' : 'Ananya Sharma · Adjuvant AC-T Cycle 3 of 6'}</span>
          </div>
        `;
      }
    }

    // Doctor Safety Header & Subnav: Only visible when deep inside Ananya's episode
    const isEpisodeContext = isDoc && !['Home', 'Patients', 'Tasks', 'Messages', 'Profile'].includes(store.currentDoctorScreen);
    if (isEpisodeContext) {
      if (doctorSafetyHeader) doctorSafetyHeader.style.display = 'flex';
      if (doctorSubnavBar) {
        doctorSubnavBar.style.display = 'flex';
        renderDoctorSubnav(state);
      }
    } else {
      if (doctorSafetyHeader) doctorSafetyHeader.style.display = 'none';
      if (doctorSubnavBar) doctorSubnavBar.style.display = 'none';
    }

    // Render Active Screen
    if (isDoc) {
      renderDoctorScreen(state, store.currentDoctorScreen);
    } else {
      renderPatientScreen(state, store.currentPatientScreen);
    }

    // Render Bottom Tab Bar
    renderTabBar(state, isDoc);
  }

  // ========================================================
  // AUTHENTICATION FLOWS (PRD Section 5-7)
  // ========================================================
  function renderAuthFlow(step) {
    let html = '';

    if (step === 'splash') {
      html = `
        <div class="auth-viewport">
          <div class="splash-container">
            <div class="splash-logo-box">CCA</div>
            <div class="splash-title">CCA Cancer Care</div>
            <div class="splash-subtitle">Connected care throughout your cancer journey.</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 24px;">Loading clinical environment...</div>
          </div>
        </div>
      `;
    } else if (step === 'authLanding') {
      html = `
        <div class="auth-viewport">
          <div class="auth-header-block">
            <div class="auth-brand-badge">
              <span style="font-size: 14px;">🏥</span> CCA Cancer Care
            </div>
            <div class="auth-main-heading">Welcome to Connected Care</div>
            <div class="auth-sub-desc">One authoritative cancer episode connecting patients and their oncology care team.</div>
          </div>

          <div class="auth-form-card">
            <div style="font-size: 12px; font-weight: 700; color: #0369a1; text-transform:uppercase; margin-bottom: 12px;">
              Select Access Channel
            </div>

            <button class="facility-option-card" id="btnChooseDoctorAuth" data-clickable="true">
              <div>
                <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Doctor Access</div>
                <div style="font-size: 11.5px; color: #94a3b8;">For treating oncologists, navigators, and clinical staff.</div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            <button class="facility-option-card" id="btnChoosePatientAuth" data-clickable="true">
              <div>
                <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Patient Access</div>
                <div style="font-size: 11.5px; color: #94a3b8;">For patients and authorized caregivers.</div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div style="text-align: center; font-size: 11px; color: #64748b;">
            🔒 End-to-End Encrypted · Hospital Data Governance Compliant
          </div>
        </div>
      `;
    } else if (step === 'doctorLogin') {
      html = `
        <div class="auth-viewport">
          <div class="auth-header-block">
            <button class="app-back-btn" id="btnBackToLanding" data-clickable="true" style="margin-bottom: 12px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              <span>Back</span>
            </button>
            <div class="auth-brand-badge" style="color: #818cf8;">Clinician Authentication</div>
            <div class="auth-main-heading">Doctor Sign In</div>
            <div class="auth-sub-desc">Secure access for authorized CCA clinical practitioners.</div>
          </div>

          <div class="auth-form-card">
            <div class="auth-input-group">
              <label class="auth-input-label">Work Email / Practitioner ID</label>
              <input type="email" class="auth-text-input" id="docEmailInput" value="anjali.menon@cca-oncology.org" data-clickable="true" />
            </div>

            <div class="auth-input-group">
              <label class="auth-input-label">Password / Passkey</label>
              <input type="password" class="auth-text-input" value="••••••••••••" data-clickable="true" />
            </div>

            <button class="btn-primary-action doctor-btn" id="btnDocContinueMfa" data-clickable="true">
              Continue to MFA Verification →
            </button>
          </div>
        </div>
      `;
    } else if (step === 'doctorMfa') {
      html = `
        <div class="auth-viewport">
          <div class="auth-header-block">
            <div class="auth-brand-badge" style="color: #818cf8;">Step 2 of 3 · Two-Factor Auth</div>
            <div class="auth-main-heading">Verify It's You</div>
            <div class="auth-sub-desc">Enter the 6-digit verification code from your CCA Authenticator app.</div>
          </div>

          <div class="auth-form-card" style="text-align: center;">
            <div class="otp-boxes-wrapper" style="margin-bottom: 16px;">
              <div class="otp-digit">7</div>
              <div class="otp-digit">4</div>
              <div class="otp-digit">9</div>
              <div class="otp-digit">2</div>
              <div class="otp-digit">0</div>
              <div class="otp-digit active">1</div>
            </div>

            <button class="btn-primary-action doctor-btn" id="btnDocProceedFacility" data-clickable="true">
              Verify Code ✓
            </button>
          </div>
        </div>
      `;
    } else if (step === 'doctorFacility') {
      html = `
        <div class="auth-viewport">
          <div class="auth-header-block">
            <div class="auth-brand-badge" style="color: #818cf8;">Active Location</div>
            <div class="auth-main-heading">Select Facility Context</div>
            <div class="auth-sub-desc">Choose your clinical working facility for today's oncology service.</div>
          </div>

          <div class="auth-form-card">
            <div class="facility-option-card selected" data-clickable="true">
              <div>
                <div style="font-size: 13.5px; font-weight: 700; color: #0f172a;">CCA Cancer Centre — Hyderabad</div>
                <div style="font-size: 11px; color: #0369a1;">Main Inpatient & Outpatient Pavilion · Active Duty</div>
              </div>
              <span class="status-pill signed">Selected</span>
            </div>

            <div class="facility-option-card" style="opacity: 0.7;" data-clickable="true">
              <div>
                <div style="font-size: 13.5px; font-weight: 700; color: #0f172a;">CCA Oncology Day Care — Jubilee Hills</div>
                <div style="font-size: 11px; color: #94a3b8;">Outpatient Infusion Suite</div>
              </div>
            </div>

            <button class="btn-primary-action doctor-btn" id="btnEnterDoctorHome" data-clickable="true" style="margin-top: 14px;">
              Confirm & Enter Doctor Worklist →
            </button>
          </div>
        </div>
      `;
    } else if (step === 'patientLogin') {
      html = `
        <div class="auth-viewport">
          <div class="auth-header-block">
            <button class="app-back-btn" id="btnBackToLanding" data-clickable="true" style="margin-bottom: 12px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              <span>Back</span>
            </button>
            <div class="auth-brand-badge">Patient Portal</div>
            <div class="auth-main-heading">Sign In</div>
            <div class="auth-sub-desc">Access your appointments, results, medicines, and care team.</div>
          </div>

          <div class="auth-form-card">
            <div class="auth-input-group">
              <label class="auth-input-label">Mobile Phone Number</label>
              <input type="tel" class="auth-text-input" id="patientPhoneInput" value="+91 98490 14821" data-clickable="true" />
            </div>

            <button class="btn-primary-action" id="btnSendPatientOtp" data-clickable="true">
              Send One-Time Passcode (OTP) →
            </button>
          </div>
        </div>
      `;
    } else if (step === 'patientOtp') {
      html = `
        <div class="auth-viewport">
          <div class="auth-header-block">
            <div class="auth-brand-badge">Step 2 of 4 · Verification</div>
            <div class="auth-main-heading">Enter Verification Code</div>
            <div class="auth-sub-desc">Sent to +91 •••••• 4821</div>
          </div>

          <div class="auth-form-card" style="text-align: center;">
            <div class="otp-boxes-wrapper" style="margin-bottom: 16px;">
              <div class="otp-digit">4</div>
              <div class="otp-digit">8</div>
              <div class="otp-digit">2</div>
              <div class="otp-digit">1</div>
              <div class="otp-digit">0</div>
              <div class="otp-digit active">9</div>
            </div>

            <button class="btn-primary-action" id="btnVerifyPatientOtp" data-clickable="true">
              Verify Code ✓
            </button>
          </div>
        </div>
      `;
    } else if (step === 'patientLink') {
      html = `
        <div class="auth-viewport">
          <div class="auth-header-block">
            <div class="auth-brand-badge">Step 3 of 4 · Record Linkage</div>
            <div class="auth-main-heading">Connect Your Record</div>
            <div class="auth-sub-desc">We found an active cancer care record matching your identity.</div>
          </div>

          <div class="auth-form-card">
            <div class="facility-option-card selected" style="border-color: #10b981; margin-bottom: 14px;" data-clickable="true">
              <div>
                <div style="font-size: 14.5px; font-weight: 800; color: #0f172a;">Ananya Sharma (52 F)</div>
                <div style="font-size: 11.5px; color: #334155;">MRN: DEMO-CCA-10482 · CCA Cancer Centre</div>
                <div style="font-size: 11px; color: #34d399; margin-top: 4px;">Active Episode: Adjuvant AC-T Breast Cancer</div>
              </div>
              <span class="status-pill signed">Record Found</span>
            </div>

            <button class="btn-primary-action" id="btnConfirmPatientRecord" data-clickable="true">
              Confirm This Is Me →
            </button>
          </div>
        </div>
      `;
    } else if (step === 'patientConsent') {
      html = `
        <div class="auth-viewport">
          <div class="auth-header-block">
            <div class="auth-brand-badge">Step 4 of 4 · Privacy & Care</div>
            <div class="auth-main-heading">Your Data Is Protected</div>
            <div class="auth-sub-desc">CCA Cancer Care securely shares your clinical updates directly with Dr Anjali Menon and your navigator.</div>
          </div>

          <div class="auth-form-card">
            <div style="font-size: 12px; color: #334155; line-height: 1.5; background: rgba(255,255,255,0.6); padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 1px solid rgba(0,0,0,0.05);">
              • Your symptom logs directly inform acute triage protocols.<br/>
              • Lab results are held for doctor review before patient release.<br/>
              • Emergency contacts can be authorized as caregivers anytime.
            </div>

            <button class="btn-primary-action" id="btnAgreeAndEnterPatient" data-clickable="true">
              Agree & Open Patient Home →
            </button>
          </div>
        </div>
      `;
    }

    appContent.innerHTML = html;
    attachAuthListeners(step);
  }

  function attachAuthListeners(step) {
    const btnBackToLanding = document.getElementById('btnBackToLanding');
    if (btnBackToLanding) btnBackToLanding.addEventListener('click', () => store.setAuthStep('authLanding'));

    const btnChooseDoctorAuth = document.getElementById('btnChooseDoctorAuth');
    if (btnChooseDoctorAuth) btnChooseDoctorAuth.addEventListener('click', () => store.setAuthStep('doctorLogin'));

    const btnChoosePatientAuth = document.getElementById('btnChoosePatientAuth');
    if (btnChoosePatientAuth) btnChoosePatientAuth.addEventListener('click', () => store.setAuthStep('patientLogin'));

    const btnDocContinueMfa = document.getElementById('btnDocContinueMfa');
    if (btnDocContinueMfa) btnDocContinueMfa.addEventListener('click', () => store.setAuthStep('doctorMfa'));

    const btnDocProceedFacility = document.getElementById('btnDocProceedFacility');
    if (btnDocProceedFacility) btnDocProceedFacility.addEventListener('click', () => store.setAuthStep('doctorFacility'));

    const btnEnterDoctorHome = document.getElementById('btnEnterDoctorHome');
    if (btnEnterDoctorHome) {
      btnEnterDoctorHome.addEventListener('click', () => {
        store.loginDoctor('CCA Cancer Centre — Hyderabad (Main Pavilion)');
        showToast('Good morning, Dr Anjali Menon · Connected to CCA Hyderabad');
      });
    }

    const btnSendPatientOtp = document.getElementById('btnSendPatientOtp');
    if (btnSendPatientOtp) btnSendPatientOtp.addEventListener('click', () => store.setAuthStep('patientOtp'));

    const btnVerifyPatientOtp = document.getElementById('btnVerifyPatientOtp');
    if (btnVerifyPatientOtp) btnVerifyPatientOtp.addEventListener('click', () => store.setAuthStep('patientLink'));

    const btnConfirmPatientRecord = document.getElementById('btnConfirmPatientRecord');
    if (btnConfirmPatientRecord) btnConfirmPatientRecord.addEventListener('click', () => store.setAuthStep('patientConsent'));

    const btnAgreeAndEnterPatient = document.getElementById('btnAgreeAndEnterPatient');
    if (btnAgreeAndEnterPatient) {
      btnAgreeAndEnterPatient.addEventListener('click', () => {
        store.loginPatient();
        showToast('Welcome Ananya Sharma · Connected to Cancer Care');
      });
    }
  }

  // Dynamic Island
  function renderDynamicIsland(state) {
    if (!dynamicIsland) return;
    const d = state.dynamicIsland;

    if (d.expanded) {
      dynamicIsland.classList.add('expanded');
    } else {
      dynamicIsland.classList.remove('expanded');
    }

    const compactText = document.getElementById('islandCompactText');
    const expTitle = document.getElementById('islandExpTitle');
    const expSubtitle = document.getElementById('islandExpSubtitle');
    const expBadge = document.getElementById('islandExpBadge');

    if (compactText) compactText.textContent = d.title;
    if (expTitle) expTitle.textContent = d.title;
    if (expSubtitle) expSubtitle.textContent = d.subtitle;
    if (expBadge) {
      expBadge.textContent = d.badge;
      expBadge.className = `panel-badge ${d.tone === 'URGENT' ? 'status-pill urgent' : ''}`;
    }
  }

  // Doctor Subnav (When inside Ananya Sharma's Episode)
  function renderDoctorSubnav(state) {
    const subScreens = [
      { id: 'Summary', label: 'Summary' },
      { id: 'Consultation', label: 'Consultation' },
      { id: 'Scribe', label: 'Voice Scribe' },
      { id: 'NEXUS', label: 'NEXUS CDS' },
      { id: 'Plan', label: 'Treatment Plan' },
      { id: 'Cycle', label: 'Cycle Decision' },
      { id: 'Results', label: 'Results' },
      { id: 'OCR', label: 'OCR Review' },
      { id: 'Staging', label: 'Staging' },
      { id: 'Pathway', label: 'Pathway' },
      { id: 'MDT', label: 'MDT Case' },
      { id: 'Timeline', label: 'Timeline' }
    ];

    doctorSubnavBar.innerHTML = subScreens.map(s => `
      <button class="subnav-btn ${store.currentDoctorScreen === s.id ? 'active' : ''}" data-screen="${s.id}" data-clickable="true">
        ${s.label}
      </button>
    `).join('');

    doctorSubnavBar.querySelectorAll('.subnav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = btn.getAttribute('data-screen');
        store.navigateDoctor(s);
      });
    });
  }

  // ========================================================
  // DOCTOR SCREENS (D01 - D17)
  // ========================================================
  function renderDoctorScreen(state, screenName) {
    let html = '';

    if (screenName === 'Home') {
      // D01: Doctor Home Worklist
      const activeAlerts = state.alerts.filter(a => a.status !== 'RESOLVED');
      const unreleasedRes = state.results.filter(r => r.releaseState === 'UNRELEASED');

      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div>
            <div class="card-title" style="font-size: 15px;">Good morning, Dr Anjali Menon</div>
            <div class="card-subtitle">CCA Cancer Centre · Medical Oncology Day Service</div>
          </div>
          <span class="status-pill signed">● On Duty</span>
        </div>

        <!-- URGENT ALERTS SECTION (D01) -->
        ${activeAlerts.length > 0 ? `
          <div class="card alert-card glow-doctor" data-clickable="true" id="btnGoUrgentAlert">
            <div class="card-header">
              <div class="card-title" style="color: #9f1239;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                ! URGENT SYMPTOM ALERT
              </div>
              <span class="status-pill ${activeAlerts[0].status === 'ACKNOWLEDGED' ? 'verified' : 'urgent'}">
                ${activeAlerts[0].status === 'ACKNOWLEDGED' ? '✓ Acknowledged' : 'Immediate Action'}
              </span>
            </div>
            <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${activeAlerts[0].title}</div>
            <div style="font-size: 12px; color: #9f1239; line-height: 1.45; margin-bottom: 12px;">${activeAlerts[0].details}</div>
            
            <div style="display:flex; gap: 8px;">
              ${activeAlerts[0].status === 'OPEN' ? `
                <button class="btn-primary-action doctor-btn" id="btnAckAlert" data-alert-id="${activeAlerts[0].id}" data-clickable="true" style="min-height: 44px; font-size: 13.5px; flex: 1;">
                  Acknowledge Alert
                </button>
              ` : `
                <button class="btn-secondary" id="btnAckAlert" disabled style="min-height: 44px; font-size: 13.5px; flex: 1; color: #34d399; border-color: rgba(52, 211, 153, 0.4);">
                  ✓ Acknowledged
                </button>
              `}
              <button class="btn-secondary" id="btnQuickDirective" data-clickable="true" style="min-height: 44px; font-size: 13.5px; flex: 1;">
                Issue Directive
              </button>
            </div>
          </div>
        ` : ''}

        <!-- WHAT CHANGED SINCE LAST REVIEW (P1-03 / Doctor Q2) -->
        <div class="card" style="border-left: 4px solid #3b82f6; margin-bottom: 10px;">
          <div class="card-header" style="margin-bottom: 4px;">
            <div class="card-title" style="color: #1e3a8a;">New since last review (What Changed)</div>
          </div>
          <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #334155; line-height: 1.6;">
            ${state.symptomReports.length > 0 ? `<li><strong>PROMs Update:</strong> Patient reported new symptoms (Temp: ${state.symptomReports[0].temperature}°F)</li>` : `<li>No new patient-reported symptoms.</li>`}
            ${unreleasedRes.length > 0 ? `<li><strong>New Labs:</strong> Day 8 Nadir CBC is pending your review.</li>` : `<li>No new unreviewed lab results.</li>`}
            ${state.documents.some(d => d.status === 'AWAITING_VERIFICATION') ? `<li><strong>External Data:</strong> New patient document uploaded awaiting OCR verification.</li>` : `<li>No new external documents.</li>`}
          </ul>
        </div>

        <!-- ELEANOR VANCE ACTIVE EPISODE CARD -->
        <div class="card glow-doctor" data-clickable="true" id="btnOpenEleanorSummary">
          <div class="card-header">
            <div>
              <div class="card-title" style="font-size: 14.5px;">${state.patient.name}</div>
              <div class="card-subtitle">MRN: ${state.patient.mrn} · ${state.patient.age}y ${state.patient.gender}</div>
            </div>
            <span class="status-pill verified">Stage IIA IDC</span>
          </div>

          <div style="font-size: 12px; color: #334155; margin-bottom: 8px;">
            <strong>Regimen:</strong> ${state.cancerEpisode.activeRegimen}<br/>
            <strong>Current Phase:</strong> Cycle 3/6 · Day 8 Nadir Monitoring
          </div>

          <div style="display:flex; justify-content: space-between; font-size: 11.5px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 10px;">
            <span>ANC: <strong style="color: #b45309;">1.18 k/µL</strong></span>
            <span>Temp: <strong>${state.symptomReports[0] ? state.symptomReports[0].temperature : 98.6}°F</strong></span>
            <span>Next: <strong>Friday Blood Test</strong></span>
          </div>

          <button class="btn-secondary" style="width: 100%; font-size: 12px;" data-clickable="true">
            Open Cancer Episode Summary →
          </button>
        </div>

        <!-- NEEDS REVIEW WORKLIST -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
              Needs Clinician Review
            </div>
            <span class="status-pill awaiting">${unreleasedRes.length + state.tasks.filter(t => t.status === 'OPEN').length} Items</span>
          </div>

          ${unreleasedRes.map(r => `
            <div class="action-item" style="border-left: 3px solid #f59e0b; margin-bottom: 8px;" data-clickable="true" id="btnGoResult-${r.id}">
              <div class="action-content">
                <div class="action-title" style="font-size: 12.5px;">${r.title}</div>
                <div class="action-desc">ANC 1.18 k/µL · Awaiting physician sign-off & patient release</div>
              </div>
              <span class="status-pill draft">Unreleased</span>
            </div>
          `).join('')}

          ${state.ocrCandidates.filter(c => c.verificationState === 'UNVERIFIED').map(c => `
            <div class="action-item" style="border-left: 3px solid #38bdf8; margin-bottom: 8px;" data-clickable="true" id="btnGoOCRReview">
              <div class="action-content">
                <div class="action-title" style="font-size: 12.5px;">OCR Candidate: ${c.extractedFact}</div>
                <div class="action-desc">${c.documentTitle} · Extracted ${c.extractedValue} (${c.aiConfidence} conf)</div>
              </div>
              <span class="status-pill awaiting">Verify Fact</span>
            </div>
          `).join('')}
        </div>

        <!-- TODAY'S SCHEDULE -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Today's Scheduled Encounters</div>
            <span class="status-pill signed">4 Patients</span>
          </div>

          <div class="patient-card-item" id="btnScheduleEleanor" data-clickable="true">
            <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
              <strong style="color:#0f172a; font-size:13px;">Ananya Sharma · 10:15 AM</strong>
              <span class="status-pill verified">Day Suite #3</span>
            </div>
            <div style="font-size:11.5px; color:#94a3b8;">Cycle 3 Nadir Evaluation & Supportive Care</div>
          </div>
        </div>
      `;
    } else if (screenName === 'Patients' || screenName === 'Search') {
      // D02: Patients Directory & Search
      const query = store.patientSearchQuery.toLowerCase().trim();
      const allPatients = [
        { id: 'PT-CCA-10482', name: 'Ananya Sharma', age: 52, gender: 'F', mrn: 'DEMO-CCA-10482', diagnosis: 'Breast IDC Stage IIA', status: 'Active Adjuvant AC-T' },
        { id: 'PT-CCA-09241', name: 'Ramesh Kulkarni', age: 64, gender: 'M', mrn: 'DEMO-CCA-09241', diagnosis: 'Colon Adenocarcinoma Stage III', status: 'Adjuvant CAPOX (Cycle 4/8)' },
        { id: 'PT-CCA-11028', name: 'Sunita Deshmukh', age: 48, gender: 'F', mrn: 'DEMO-CCA-11028', diagnosis: 'Early Stage NSCLC (cT1b N0)', status: 'Post-Surgical Surveillance' },
        { id: 'PT-CCA-08492', name: 'Devendra Patel', age: 59, gender: 'M', mrn: 'DEMO-CCA-08492', diagnosis: 'Prostate Adenocarcinoma', status: 'Active Surveillance / PSA 4.2' }
      ];

      const filtered = allPatients.filter(p => 
        !query || p.name.toLowerCase().includes(query) || p.mrn.toLowerCase().includes(query) || p.diagnosis.toLowerCase().includes(query) || (query === 'eleanor' && p.id === 'PT-CCA-10482')
      );

      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Patient Directory</div>
          <span class="status-pill verified">${filtered.length} Patients</span>
        </div>

        <div class="patient-search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" class="patient-search-input" id="patientSearchInput" placeholder="Search patient name, MRN, diagnosis..." value="${store.patientSearchQuery}" data-clickable="true" />
          ${store.patientSearchQuery ? `<button id="btnClearSearch" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;" data-clickable="true">&times;</button>` : ''}
        </div>

        <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">
          Assigned Patients · Dr Anjali Menon
        </div>

        ${filtered.map(p => `
          <div class="patient-card-item" data-patient-id="${p.id}" data-clickable="true">
            <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
              <strong style="color: #0f172a; font-size: 13.5px;">${p.name}</strong>
              <span class="status-pill ${p.id === 'PT-CCA-10482' ? 'verified' : 'draft'}">${p.gender}, ${p.age}y</span>
            </div>
            <div style="font-size: 12px; color: #0369a1; margin-bottom: 2px;">${p.diagnosis}</div>
            <div style="display:flex; justify-content:space-between; font-size: 11px; color: #94a3b8;">
              <span>MRN: ${p.mrn}</span>
              <span style="color: #334155;">${p.status}</span>
            </div>
          </div>
        `).join('')}
      `;
    } else if (screenName === 'Summary') {
      // D03: Patient / Episode Summary
      html = `
        <div class="card glow-doctor" style="margin-bottom: 10px;">
          <div class="card-header">
            <div>
              <div class="card-title" style="font-size: 15px;">${state.patient.name}</div>
              <div class="card-subtitle">MRN ${state.patient.mrn} · ${state.patient.age} ${state.patient.gender === 'Female' ? 'F' : 'M'} · ${state.patient.facility || 'CCA Cancer Centre'}</div>
            </div>
            <span class="status-pill verified">✓ Active Episode</span>
          </div>

          <div style="background: ${state.patient.allergies && state.patient.allergies.length > 0 ? '#fee2e2' : '#f0fdf4'}; border-left: 3px solid ${state.patient.allergies && state.patient.allergies.length > 0 ? '#ef4444' : '#22c55e'}; padding: 6px 10px; border-radius: 4px; font-size: 12px; color: ${state.patient.allergies && state.patient.allergies.length > 0 ? '#991b1b' : '#166534'}; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <div>
              <strong style="display:block; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">Allergies</strong>
              ${state.patient.allergies && state.patient.allergies.length > 0 ? 
                state.patient.allergies.map(a => `${a.allergen} — ${a.reaction}`).join(' · ') : 
                (state.patient.allergyStatus === 'NO_KNOWN_DRUG_ALLERGIES' ? 'No known drug allergies' : 'Not recorded')}
            </div>
          </div>

          <div style="font-size: 12.5px; line-height: 1.5; color: #1e293b; margin-bottom: 10px;">
            <strong>Diagnosis:</strong> ${state.cancerEpisode.diagnosis}<br/>
            <strong>Histology:</strong> ${state.cancerEpisode.histology}<br/>
            <strong>Biomarkers:</strong> ER 90%+, PR 70%+, HER2 1- (Neg), Ki-67 32%<br/>
            <strong>Stage:</strong> ${state.staging.overallStage} (${state.staging.t}, ${state.staging.n}, ${state.staging.m})<br/>
            <strong>Performance:</strong> ${state.cancerEpisode.performanceStatus} · Intent: ${state.cancerEpisode.intent}
          </div>

          <div class="cycle-progress-wrap" id="btnClickCycleProgress" data-clickable="true">
            <div class="cycle-steps-bar">
              <div class="cycle-bar-segment completed"></div>
              <div class="cycle-bar-segment completed"></div>
              <div class="cycle-bar-segment active" style="background: linear-gradient(90deg, #4f46e5, #818cf8);"></div>
              <div class="cycle-bar-segment"></div>
              <div class="cycle-bar-segment"></div>
              <div class="cycle-bar-segment"></div>
            </div>
            <div class="cycle-meta">
              <span>Current: <strong>Cycle 3 of 6 (Day 8 Nadir)</strong></span>
              <span>Next Infusion: <strong>Sep 2 (Cycle 4)</strong></span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;">
            <button class="btn-primary-action doctor-btn" id="btnStartConsultation" data-clickable="true" style="padding: 8px; font-size: 12px;">
              Start Consultation
            </button>
            <button class="btn-secondary" id="btnNavNexus" data-clickable="true" style="padding: 8px; font-size: 12px;">
              NEXUS Reasoning
            </button>
          </div>
        </div>

        <!-- WHAT CHANGED SINCE LAST REVIEW (P1-03) -->
        <div class="card" style="border-left: 4px solid #3b82f6; margin-bottom: 10px;">
          <div class="card-header" style="margin-bottom: 4px;">
            <div class="card-title" style="color: #1e3a8a;">What Changed Since Last Review</div>
          </div>
          <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #334155; line-height: 1.6;">
            ${state.symptomReports.length > 0 ? `<li><strong>PROMs Update:</strong> Patient reported new symptoms (Temp: ${state.symptomReports[0].temperature}°F)</li>` : `<li>No new patient-reported symptoms.</li>`}
            ${state.results.some(r => r.releaseState === 'UNRELEASED') ? `<li><strong>New Labs:</strong> Day 8 Nadir CBC is pending your review.</li>` : `<li>No new unreviewed lab results.</li>`}
            ${state.documents.some(d => d.status === 'AWAITING_VERIFICATION') ? `<li><strong>External Data:</strong> New patient document uploaded awaiting OCR verification.</li>` : `<li>No new external documents.</li>`}
          </ul>
        </div>

        <!-- RECENT SYMPTOM STREAM -->
        <div class="card" id="btnClickSymptomStream" data-clickable="true">
          <div class="card-header">
            <div class="card-title">Recent Symptom Stream (PROMs)</div>
            <span class="status-pill ${state.symptomReports[0] && state.symptomReports[0].temperature >= 100.4 ? 'urgent' : 'verified'}">
              ${state.symptomReports[0] && state.symptomReports[0].temperature >= 100.4 ? '! Fever Escalation' : '✓ Stable'}
            </span>
          </div>

          <div class="lab-metric-grid">
            <div class="lab-stat-box">
              <div class="lab-stat-label">Oral Temperature</div>
              <div class="lab-stat-val" style="color: ${state.symptomReports[0] && state.symptomReports[0].temperature >= 100.4 ? '#f43f5e' : '#fff'};">
                ${state.symptomReports[0] ? state.symptomReports[0].temperature : 98.6} <span class="lab-stat-unit">°F</span>
              </div>
            </div>
            <div class="lab-stat-box">
              <div class="lab-stat-label">Day 8 Nadir ANC</div>
              <div class="lab-stat-val" style="color: #b45309;">
                1.18 <span class="lab-stat-unit">k/µL</span>
              </div>
            </div>
          </div>
        </div>

        <!-- QUICK EPISODE SHORTCUTS -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <button class="btn-secondary" id="btnSummResults" data-clickable="true" style="font-size:11.5px;">
            🧪 Lab Results (${state.results.length})
          </button>
          <button class="btn-secondary" id="btnSummPlan" data-clickable="true" style="font-size:11.5px;">
            📋 Treatment Plan (v${state.cancerEpisode.activePlanVersion || 1})
          </button>
          <button class="btn-secondary" id="btnSummOCR" data-clickable="true" style="font-size:11.5px;">
            📄 OCR Review (${state.ocrCandidates.length})
          </button>
          <button class="btn-secondary" id="btnSummMDT" data-clickable="true" style="font-size:11.5px;">
            👥 MDT Discussion
          </button>
        </div>
      `;
    } else if (screenName === 'Consultation') {
      // D04: Consultation Workspace & Scribe
      const enc = state.encounters[0];
      const draft = store.consultationDraft;

      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Consultation Workspace</div>
          <span class="status-pill ${draft.isSigned ? 'signed' : 'draft'}">
            ${draft.isSigned ? '✓ SIGNED' : '● DRAFT'}
          </span>
        </div>

        <div class="card">
          <div style="font-size: 11.5px; color: #4338ca; margin-bottom: 8px;">
            <strong>Attending:</strong> Dr Anjali Menon · Treating Medical Oncologist
          </div>

          <div style="display:flex; justify-content: space-between; margin-bottom: 10px;">
            <button class="btn-secondary" id="btnLaunchScribe" data-clickable="true" style="font-size: 11.5px; padding: 6px 12px;">
              🎙️ Open Voice Scribe
            </button>
            <span class="status-pill awaiting">Consent Active</span>
          </div>

          <div style="font-size: 12.5px; color: #334155; line-height: 1.45; display:flex; flex-direction:column; gap: 14px;">
            <div>
              <label style="display:block; font-size:12px; font-weight:600; color:#334155; margin-bottom:6px;">Reason for Review:</label>
              <input type="text" class="app-text-input" id="consultReasonInput" value="${draft.reason}" ${draft.isSigned ? 'disabled' : ''} data-clickable="true" />
            </div>

            <div>
              <label style="display:block; font-size:12px; font-weight:600; color:#334155; margin-bottom:6px;">History of Present Illness (HPI):</label>
              <textarea class="app-textarea" id="consultHpiInput" rows="2" ${draft.isSigned ? 'disabled' : ''} data-clickable="true">${draft.hpi}</textarea>
            </div>

            <div>
              <label style="display:block; font-size:12px; font-weight:600; color:#334155; margin-bottom:6px;">Physical Examination:</label>
              <textarea class="app-textarea" id="consultExamInput" rows="2" ${draft.isSigned ? 'disabled' : ''} data-clickable="true">${draft.examination}</textarea>
            </div>

            <div>
              <label style="display:block; font-size:12px; font-weight:600; color:#334155; margin-bottom:6px;">Assessment & Plan:</label>
              <textarea class="app-textarea" id="consultAssessmentInput" rows="3" ${draft.isSigned ? 'disabled' : ''} data-clickable="true">${draft.assessment}\n\n${draft.plan}</textarea>
            </div>
          </div>

          ${!draft.isSigned ? `
            <div style="margin-top: 14px; display:flex; gap: 8px;">
              <button class="btn-secondary" id="btnSaveConsultDraft" data-clickable="true" style="flex:1;">
                Save Draft
              </button>
              <button class="btn-primary-action doctor-btn" id="btnSignConsultationModal" data-clickable="true" style="flex:2;">
                ✓ Review & Sign
              </button>
            </div>
          ` : `
            <div style="margin-top: 12px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 10px; border-radius: 8px;">
              <div style="font-size: 12px; font-weight: 700; color: #34d399;">✓ Note Electronically Signed</div>
              <div style="font-size: 11px; color: #334155;">By Dr Anjali Menon (PKI-CCA-84920) · Patient Visit Summary released.</div>
              <button class="btn-secondary" id="btnAddAddendum" data-clickable="true" style="margin-top: 8px; width: 100%; font-size: 11.5px;">
                + Add Formal Addendum
              </button>
            </div>
          `}
        </div>
      `;
    } else if (screenName === 'Scribe') {
      // D05: Voice Scribe
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Simulated Voice Scribe</div>
          <span class="status-pill draft">● AI Assistant · Draft</span>
        </div>

        <div class="scribe-container">
          <div class="scribe-header">
            <div class="scribe-recording-indicator">
              <div class="scribe-rec-dot" style="${scribeRecording ? 'animation: pulse-red 1s infinite;' : 'background:#64748b;'}"></div>
              <span>${scribeRecording ? 'Recording Clinical Dialogue...' : 'Ready to Record'}</span>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="btn-secondary" id="btnToggleRecord" data-clickable="true" style="padding:4px 8px; font-size:10.5px;">
                ${scribeRecording ? 'Pause' : 'Start Recording'}
              </button>
            </div>
          </div>

          <div class="waveform-bar-container">
            ${Array.from({length: 22}).map((_, i) => `<div class="wave-bar" style="animation-play-state: ${scribeRecording ? 'running' : 'paused'}; animation-delay: ${i * 0.05}s;"></div>`).join('')}
          </div>

          <div class="scribe-transcript-box">
            <strong style="color:#0369a1;">Dr Menon:</strong> "Eleanor, your Day 8 white blood cell count dipped to 1.18, which is completely expected. How is the nausea?"<br/>
            <strong style="color:#334155;">Ananya:</strong> "Mild queasiness after toast, drinking water regularly. No chills."<br/>
            <strong style="color:#0369a1;">Dr Menon:</strong> "Good. Keep taking Ondansetron and use Prochlorperazine if needed. See you Friday for labs."
          </div>

          <div class="scribe-ai-draft-card">
            <div style="font-size: 10px; font-weight: 800; color: #4338ca; text-transform:uppercase; margin-bottom: 4px;">
              [AI Suggestion · Awaiting Clinician Acceptance]
            </div>
            <strong>Assessment:</strong> Tolerating Cycle 3 nadir well. Mild nausea responsive to anti-emetics. No signs of neutropenic sepsis.<br/>
            <strong>Plan:</strong> Continue supportive hydration. Friday pre-Cycle 4 labs ordered.
            <div style="display:flex; gap: 6px; margin-top: 8px;">
              <button class="btn-secondary" id="btnAcceptAssessment" data-clickable="true" style="padding:4px 8px; font-size:10.5px;">✓ Accept Assessment</button>
              <button class="btn-secondary" id="btnRejectAssessment" data-clickable="true" style="padding:4px 8px; font-size:10.5px;">Reject</button>
            </div>
          </div>

          <div style="display:flex; gap: 8px;">
            <button class="btn-primary-action doctor-btn" id="btnAcceptScribeAll" data-clickable="true" style="padding: 8px; font-size: 12px;">
              Accept All & Insert into Note
            </button>
            <button class="btn-secondary" id="btnReturnConsult" data-clickable="true" style="font-size: 12px;">
              Back to Note
            </button>
          </div>
        </div>
      `;
    } else if (screenName === 'OCR') {
      // D06: OCR Review
      const cands = state.ocrCandidates;
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">OCR Document Review</div>
          <span class="status-pill awaiting">${cands.filter(c => c.verificationState === 'UNVERIFIED').length} Unverified</span>
        </div>

        <div class="ocr-preview-card">
          <div style="font-size: 12.5px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Document: St. Jude Pathology Supplement</div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">Source: Patient Uploaded PDF · Extracted today</div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px; font-family: monospace; font-size: 11px; color: #334155; margin-bottom: 10px;">
            "...Immunohistochemical staining reveals Ki-67 nuclear antigen expression in 35% of tumor nuclei, indicative of high proliferative activity..."
          </div>

          ${cands.map(c => `
            <div class="ocr-candidate-row">
              <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 4px;">
                <strong style="color:#0f172a; font-size:12.5px;">${c.extractedFact}: ${c.extractedValue}</strong>
                <span class="status-pill ${c.verificationState === 'VERIFIED' ? 'verified' : 'draft'}">
                  ${c.verificationState === 'VERIFIED' ? '✓ VERIFIED' : '○ UNVERIFIED'}
                </span>
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">
                Confidence: <strong style="color:#0369a1;">${c.aiConfidence}</strong> · Page ${c.sourcePage}, ${c.sourceRegion}
              </div>
              ${c.verificationState !== 'VERIFIED' ? `
                <button class="btn-primary-action doctor-btn btnVerifyCandidate" data-cand-id="${c.id}" data-clickable="true" style="padding: 7px; font-size: 11.5px;">
                  ✓ Verify & Promote to Clinical Facts
                </button>
              ` : `
                <div style="font-size: 11px; color: #34d399;">✓ Promoted to authoritative Staging & NEXUS facts</div>
              `}
            </div>
          `).join('')}
        </div>
      `;
    } else if (screenName === 'NEXUS') {
      // D07: NEXUS Clinical Decision Support
      const s1 = state.nexusSnapshots.find(s => s.runId === 'NEX-RUN-01');
      const s2 = state.nexusSnapshots.find(s => s.runId === 'NEX-RUN-02');
      const ki67Verified = state.clinicalFacts.some(f => f.name.includes('Ki-67') && f.verified);

      html = `
        <div class="nexus-cds-banner">
          <div class="nexus-disclaimer">NEXUS CLINICAL DECISION SUPPORT · NOT AN AI DOCTOR</div>
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
            Evidence-Based Treatment Guidance
          </div>
          <div style="font-size: 11.5px; color: #334155;">NCCN v2.2026 Guidelines · Invasive Breast Cancer Stage IIA</div>
        </div>

        <!-- SNAPSHOT 2 (If Run) -->
        ${s2 ? `
          <div class="card glow-doctor" style="border-left: 4px solid #10b981;">
            <div class="card-header">
              <div class="card-title" style="font-size: 13.5px;">Snapshot 2 (Latest Execution)</div>
              <span class="status-pill verified">✓ Evidence Confirmed</span>
            </div>
            <div style="font-size: 12px; color: #334155; margin-bottom: 8px;">${s2.clinicalPicture}</div>

            <div class="nexus-option-card">
              <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                <strong style="color:#0f172a; font-size:12.5px;">Curative Adjuvant Dose-Dense AC-T</strong>
                <span class="nexus-evidence-tag">Category 1</span>
              </div>
              <div style="font-size: 11.5px; color: #94a3b8;">High proliferation (Ki-67 35% verified) and 2.6cm tumor size confirms systemic chemotherapy benefit.</div>
            </div>

            <div style="display:flex; gap:6px; margin-top:8px;">
              <button class="btn-secondary" id="btnAttachSnapshotPlan" data-clickable="true" style="flex:1; font-size:11px;">
                Attach to Treatment Plan
              </button>
              <button class="btn-secondary" id="btnNavPathway" data-clickable="true" style="flex:1; font-size:11px;">
                View Guideline Trace →
              </button>
            </div>
          </div>
        ` : ''}

        <!-- SNAPSHOT 1 -->
        <div class="card" style="border-left: 4px solid ${s2 ? '#64748b' : '#f59e0b'};">
          <div class="card-header">
            <div class="card-title" style="font-size: 13.5px;">Snapshot 1 (Initial Evaluation)</div>
            <span class="status-pill ${s2 ? 'superseded' : 'draft'}">
              ${s2 ? '↻ Historical Run' : '! Needs Information'}
            </span>
          </div>

          ${!s2 && !ki67Verified ? `
            <div class="nexus-missing-info-box">
              <strong>Missing Pathway-Changing Fact:</strong><br/>
              Ki-67 proliferation index or Genomic Recurrence Score is required to confirm chemotherapy benefit.
            </div>
            <div style="display:flex; gap:6px; margin-bottom:8px;">
              <button class="btn-secondary" id="btnResolveMissingFact" data-clickable="true" style="flex:1; font-size:11.5px;">
                Verify Ki-67 Fact →
              </button>
              <button class="btn-secondary" id="btnOpenEvidence" data-clickable="true" style="flex:1; font-size:11.5px;">
                Open Evidence Snippet
              </button>
            </div>
          ` : ''}

          <div style="font-size: 11.5px; color: #334155; margin-top: 6px;">
            ${s1 ? s1.clinicalPicture : ''}
          </div>

          ${!s2 ? `
            <button class="btn-primary-action doctor-btn" id="btnReRunNexus" data-clickable="true" style="margin-top: 10px; font-size: 12px; padding: 8px;">
              ⚡ Re-run NEXUS with Verified Evidence
            </button>
          ` : ''}
        </div>
      `;
    } else if (screenName === 'Plan') {
      // D10: Treatment Plan
      const currentPlan = state.treatmentPlans.find(p => p.status === 'SIGNED');
      const draftPlan = state.treatmentPlans.find(p => p.status === 'DRAFT');
      const supersededPlans = state.treatmentPlans.filter(p => p.status === 'SUPERSEDED');

      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Treatment Plan Management</div>
          <span class="status-pill signed">✓ PLAN v${currentPlan ? currentPlan.version : 1} SIGNED</span>
        </div>

        <!-- DRAFT PLAN (If initiated) -->
        ${draftPlan ? `
          <div class="card glow-doctor" style="border-left: 4px solid #f59e0b;">
            <div class="card-header">
              <div class="card-title" style="font-size: 13.5px;">Plan v${draftPlan.version} (Draft Revision)</div>
              <span class="status-pill draft">● DRAFT</span>
            </div>
            <div style="font-size: 12px; color: #334155; margin-bottom: 8px;">
              <strong>Revised Patient Instructions:</strong><br/>
              <textarea id="draftPlanNotesInput" rows="2" style="width:100%; background:#f8fafc; border:1px solid #e2e8f0; border:1px solid rgba(255,255,255,0.1); color:#0f172a; padding:6px; border-radius:6px; margin-top:4px; font-size:12px;" data-clickable="true">${draftPlan.patientInstructions}</textarea>
            </div>
            <button class="btn-primary-action doctor-btn" id="btnSignPlanDraftModal" data-version="${draftPlan.version}" data-clickable="true">
              ✓ Review & Sign Plan v${draftPlan.version}
            </button>
          </div>
        ` : `
          <div style="margin-bottom: 10px;">
            <button class="btn-secondary" id="btnCreatePlanRevision" data-clickable="true" style="width: 100%;">
              + Create Plan Revision (Draft v2)
            </button>
          </div>
        `}

        <!-- CURRENT SIGNED PLAN -->
        <div class="card glow-doctor">
          <div class="card-header">
            <div class="card-title" style="font-size: 13.5px;">Plan v${currentPlan ? currentPlan.version : 1} (Current Active)</div>
            <span class="status-pill signed">✓ Active Protocol</span>
          </div>

          <!-- P1-04: Patient Delivery State -->
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(59, 130, 246, 0.05); padding: 8px; border-radius: 6px; margin-bottom: 8px;">
            <div style="font-size: 11.5px; font-weight: 600; color: #1e3a8a;">Patient App Delivery Status:</div>
            <span class="status-pill verified">✓ Received & Reviewed by Patient</span>
          </div>

          <div style="font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 8px;">
            <strong>Intent:</strong> Curative Adjuvant · 1st Line<br/>
            <strong>Signed by:</strong> ${currentPlan ? currentPlan.signedBy : 'Dr Anjali Menon'} · ${currentPlan ? currentPlan.signedAt : 'July 20'}<br/>
            <strong>Patient Instructions:</strong> ${currentPlan ? currentPlan.patientInstructions : ''}
          </div>

          <div style="font-size: 11.5px; font-weight: 700; color: #4338ca; margin-bottom: 4px;">Treatment Modality Sequence:</div>
          ${(currentPlan ? currentPlan.modalities : []).map(m => `
            <div style="font-size: 11.5px; color: #1e293b; display:flex; justify-content:space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span>${m.modality}: ${m.description}</span>
              <span class="status-pill ${m.status === 'COMPLETED' ? 'signed' : (m.status === 'IN_PROGRESS' ? 'verified' : 'awaiting')}">${m.status}</span>
            </div>
          `).join('')}
        </div>

        <!-- SUPERSEDED PLANS -->
        ${supersededPlans.map(sp => `
          <div class="card" style="opacity: 0.75; border-left: 4px solid #64748b;">
            <div class="card-header">
              <div class="card-title" style="font-size: 12.5px;">Plan v${sp.version} (Superseded)</div>
              <span class="status-pill superseded">↻ Superseded by ${sp.supersededBy}</span>
            </div>
            <div style="font-size: 11.5px; color: #94a3b8;">
              Reason: ${sp.supersededReason}<br/>
              Signed originally: ${sp.signedAt}
            </div>
          </div>
        `).join('')}
      `;
    } else if (screenName === 'Cycle') {
      // D11: Cycle Decision
      const dec = state.cancerEpisode.cycle4Decision;
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Pre-Cycle 4 Chemotherapy Decision</div>
          <span class="status-pill ${dec ? (dec.decision === 'CLEARED' ? 'signed' : 'urgent') : 'awaiting'}">
            ${dec ? dec.decision : 'Needs Decision'}
          </span>
        </div>

        <div class="card glow-doctor">
          <div style="font-size: 12px; color: #334155; margin-bottom: 10px;">
            <strong>Target:</strong> Dose-Dense AC-T Cycle 4 Infusion (Sep 2)<br/>
            <strong>Day 8 Nadir ANC:</strong> 1.18 k/µL (Safe nadir threshold)<br/>
            <strong>Symptom Burden:</strong> Afebrile at baseline, nausea responsive to anti-emetics
          </div>

          <div style="margin-bottom: 12px;">
            <label style="font-size: 11.5px; color: #94a3b8; font-weight: 700;">Clinical Action Rationale:</label>
            <textarea id="cycleRationaleInput" rows="2" style="width:100%; background:#f8fafc; border:1px solid #e2e8f0; border:1px solid rgba(255,255,255,0.1); color:#0f172a; padding:6px; border-radius:6px; margin-top:4px; font-size:12px;" data-clickable="true">Pre-cycle nadir is physiological. Proceed with scheduled Cycle 4 following Friday pre-cycle CBC/CMP confirmation.</textarea>
          </div>

          <div style="display:flex; gap:8px;">
            <button class="btn-primary-action doctor-btn" id="btnClearCycle4" data-clickable="true" style="flex:1;">
              ✓ Clear for Cycle 4
            </button>
            <button class="btn-secondary" id="btnDeferCycle4" data-clickable="true" style="flex:1; border-color:#f43f5e; color:#f43f5e;">
              Hold / Defer 48h
            </button>
          </div>
        </div>
      `;
    } else if (screenName === 'Results') {
      // D12: Results Inbox
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Results Inbox & Clinical Release</div>
          <span class="status-pill awaiting">Ananya Sharma</span>
        </div>

        ${state.results.map(res => `
          <div class="card ${res.releaseState === 'RELEASED' ? 'glow-doctor' : ''}" style="border-left: 4px solid ${res.releaseState === 'RELEASED' ? '#10b981' : '#f59e0b'};">
            <div class="card-header">
              <div class="card-title" style="font-size: 13.5px;">${res.title}</div>
              <span class="status-pill ${res.releaseState === 'RELEASED' ? 'released' : 'draft'}">
                ${res.releaseState === 'RELEASED' ? '↗ RELEASED' : '● UNRELEASED'}
              </span>
            </div>

            <div style="font-size: 11.5px; color: #94a3b8; margin-bottom: 6px;">
              ${res.category} · Specimen: ${res.specimenDate} · Lab: ${res.laboratory}
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; margin-bottom: 8px;">
              ${res.metrics.map(m => `
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                  <span style="color:#e2e8f0;">${m.name}:</span>
                  <span style="font-weight:700; color:${m.flag === 'LOW' ? '#fbbf24' : '#fff'};">${m.value} ${m.unit}</span>
                </div>
              `).join('')}
            </div>

            <div style="font-size: 12px; color: #334155; margin-bottom: 8px;">
              <strong>Clinical Impression:</strong> ${res.clinicalImpression}
            </div>

            ${res.releaseState !== 'RELEASED' ? `
              <div style="display:flex; gap: 6px;">
                <button class="btn-secondary btnPreviewResult" data-res-id="${res.id}" data-clickable="true" style="flex:1; font-size:11.5px;">
                  Preview Patient View
                </button>
                <button class="btn-primary-action doctor-btn btnReleaseResult" data-res-id="${res.id}" data-clickable="true" style="flex:1; font-size:11.5px;">
                  ↗ Release to Patient
                </button>
              </div>
            ` : `
              <div style="font-size: 11.5px; color: #34d399; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 8px;">
                ✓ Released by Dr Anjali Menon on ${res.releasedAt}. Patient-friendly explanation active.
              </div>
            `}
          </div>
        `).join('')}
      `;
    } else if (screenName === 'Tasks') {
      // D16: Tasks & Alerts
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Tasks & Escalation Alerts</div>
          <span class="status-pill urgent">${state.tasks.filter(t => t.status === 'OPEN').length} Open</span>
        </div>

        ${state.tasks.map(t => `
          <div class="action-item" style="border-left: 3px solid ${t.priority === 'URGENT' ? '#f43f5e' : '#38bdf8'}; margin-bottom: 8px;" data-task-id="${t.id}" data-task-type="${t.type}" data-clickable="true">
            <div class="action-content">
              <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                <span class="action-title" style="font-size: 13px;">${t.title}</span>
                <span class="status-pill ${t.status === 'RESOLVED' ? 'signed' : (t.priority === 'URGENT' ? 'urgent' : 'draft')}">${t.status}</span>
              </div>
              <div class="action-desc">Assigned to: ${t.assignedTo} · Due: ${t.dueAt}</div>
            </div>
          </div>
        `).join('')}
      `;
    } else if (screenName === 'Timeline') {
      // D15: Longitudinal Timeline
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Longitudinal Episode Timeline</div>
          <span class="status-pill verified">Authoritative Audit</span>
        </div>

        <div class="roadmap-timeline">
          ${state.auditEvents.map(ev => `
            <div class="roadmap-step completed" data-audit-action="${ev.action}" data-clickable="true">
              <div class="roadmap-node">✓</div>
              <div class="roadmap-step-title" style="font-size: 12px;">${ev.action}</div>
              <div class="roadmap-step-desc">${ev.summary}</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${ev.actor} · ${ev.timestamp}</div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (screenName === 'Messages') {
      // D13: Messages
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Care Team Messaging · Ananya Sharma</div>
          <span class="status-pill verified">Secure Thread</span>
        </div>

        <div class="chat-container">
          ${state.messages.map(m => `
            <div class="chat-bubble ${m.senderRole === 'doctor' ? 'doctor-message' : 'patient-message'}">
              <div>${m.text}</div>
              <div class="chat-meta">
                <span>${m.author} (${m.title})</span>
                <span>${m.timestamp}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display:flex; gap:6px; margin-bottom:8px; overflow-x:auto;">
          <button class="btn-secondary btnQuickDocReply" data-reply="Drink at least 3 Liters daily and take anti-emetic before meals." data-clickable="true" style="font-size:10.5px; white-space:nowrap; padding:4px 8px;">Hydration Directive</button>
          <button class="btn-secondary btnQuickDocReply" data-reply="Pre-cycle blood draw is scheduled for Friday 9:30 AM at Outpatient Lab." data-clickable="true" style="font-size:10.5px; white-space:nowrap; padding:4px 8px;">Lab Reminder</button>
        </div>

        <div class="chat-composer">
          <input type="text" class="chat-input" id="chatInputDoc" placeholder="Reply to Ananya Sharma..." data-clickable="true" />
          <button class="chat-send-btn" id="btnSendDocMsg" data-clickable="true" style="background: #4f46e5;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      `;
    } else if (screenName === 'Staging') {
      // D08: Staging
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">TNM Staging & Anatomical Extent</div>
          <span class="status-pill signed">✓ ${state.staging.status}</span>
        </div>

        <div class="card glow-doctor">
          <div style="font-size: 11.5px; color: #94a3b8; margin-bottom: 8px;">AJCC 8th Edition · Breast Cancer</div>

          <div class="lab-metric-grid" style="margin-bottom: 10px;">
            <div class="lab-stat-box">
              <div class="lab-stat-label">Tumor (T)</div>
              <div class="lab-stat-val" style="font-size:14px;">cT2 (2.6 cm)</div>
            </div>
            <div class="lab-stat-box">
              <div class="lab-stat-label">Nodes (N)</div>
              <div class="lab-stat-val" style="font-size:14px;">pN0 (0/3 SLN)</div>
            </div>
            <div class="lab-stat-box">
              <div class="lab-stat-label">Metastasis (M)</div>
              <div class="lab-stat-val" style="font-size:14px;">cM0 (Clear CT)</div>
            </div>
            <div class="lab-stat-box">
              <div class="lab-stat-label">Overall Stage</div>
              <div class="lab-stat-val" style="font-size:14px; color:#0369a1;">Stage IIA</div>
            </div>
          </div>

          <div style="font-size: 11px; color: #334155; margin-bottom: 12px;">
            Signed by: <strong>${state.staging.signedBy}</strong> on ${state.staging.signedAt}
          </div>

          <button class="btn-primary-action doctor-btn" id="btnOpenStageCalculator" data-clickable="true" style="width:100%; font-size:12px;">
            ⚡ Interactive TNM Calculator & Restage Tool
          </button>
        </div>
      `;
    } else if (screenName === 'Pathway') {
      // D09: Guideline Pathway
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">NCCN Guideline Pathway Position</div>
          <span class="status-pill verified">v2.2026</span>
        </div>

        <div class="card glow-doctor">
          <div style="font-size: 11.5px; color: #0369a1; font-weight: 700; margin-bottom: 4px;">
            Node: Adjuvant Systemic Therapy for Hormone-Receptor Positive Early Breast Cancer
          </div>
          <div style="font-size: 11px; color: #334155; line-height: 1.45; margin-bottom: 10px;">
            Stage IIA (pT2 pN0 M0) · High Ki-67 (32%) confirms high recurrence risk warranting adjuvant dose-dense chemotherapy preceding adjuvant endocrine therapy.
          </div>

          <div class="roadmap-timeline" style="margin-top: 6px; margin-bottom: 12px;">
            <div class="roadmap-step completed">
              <div class="roadmap-node">✓</div>
              <div class="roadmap-step-title" style="font-size: 11.5px;">Surgical Resection & Margins (Clear)</div>
            </div>
            <div class="roadmap-step active">
              <div class="roadmap-node">●</div>
              <div class="roadmap-step-title" style="font-size: 11.5px;">Dose-Dense AC-T Chemotherapy (Current Selected)</div>
            </div>
            <div class="roadmap-step">
              <div class="roadmap-node">○</div>
              <div class="roadmap-step-title" style="font-size: 11.5px;">Adjuvant Endocrine Therapy (Letrozole)</div>
            </div>
          </div>

          <button class="btn-primary-action doctor-btn" id="btnRecordPathwayCompliance" data-clickable="true" style="width:100%; font-size:12px;">
            ✓ Confirm Guideline Compliance & Rationale
          </button>
        </div>
      `;
    } else if (screenName === 'MDT') {
      // D14: MDT
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">MDT Deliberation (Clinician Only)</div>
          <span class="status-pill signed">Breast MDT</span>
        </div>

        <div class="card glow-doctor">
          <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
            Case Discussion: Ananya Sharma (DEMO-CCA-10482)
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            Attendees: Dr Anjali Menon (Med Onc), Dr Ramesh Kulkarni (Surg Onc), Dr Sunita Deshmukh (Rad Onc)
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.45; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; margin-bottom: 12px;">
            <strong>Consensus Recommendation:</strong> Complete adjuvant dose-dense AC-T prior to initiating 5-year adjuvant Aromatase Inhibitor. Radiation oncology review upon completion of systemic treatment.
          </div>

          <button class="btn-primary-action doctor-btn" id="btnConvertMdtToTask" data-clickable="true" style="width:100%; font-size:12px;">
            ⚡ Convert MDT Consensus to Clinical Action Task
          </button>
        </div>
      `;
    } else if (screenName === 'Profile') {
      // D17: Profile
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Clinician Profile</div>
          <span class="status-pill verified">Verified Credential</span>
        </div>

        <div class="card glow-doctor">
          <div style="font-size: 14.5px; font-weight: 800; color: #0f172a;">${state.careTeam.oncologist.name}</div>
          <div style="font-size: 12px; color: #0369a1; margin-bottom: 6px;">${state.careTeam.oncologist.title} · ${state.careTeam.oncologist.credentials}</div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.45; margin-bottom: 12px;">
            Facility: ${state.careTeam.oncologist.facility}<br/>
            Digital Signature Credential: <strong>ACTIVE (PKI-CCA-84920)</strong><br/>
            Contact: ${state.careTeam.oncologist.phone}
          </div>

          <button class="btn-secondary" id="btnSignOutDoctor" data-clickable="true" style="width:100%;">
            Sign Out & Return to Login
          </button>
        </div>
      `;
    }

    appContent.innerHTML = html;
    attachDoctorListeners(state);
  }

  function attachDoctorListeners(state) {
    // D01 Urgent Alert
    const btnGoUrgentAlert = document.getElementById('btnGoUrgentAlert');
    if (btnGoUrgentAlert) {
      btnGoUrgentAlert.addEventListener('click', (e) => {
        if (e.target.closest('#btnAckAlert') || e.target.closest('#btnQuickDirective')) return;
        store.navigateDoctor('Summary');
      });
    }

    const btnAckAlert = document.getElementById('btnAckAlert');
    if (btnAckAlert) {
      btnAckAlert.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btnAckAlert.getAttribute('data-alert-id');
        store.acknowledgeAlert(id);
        showToast('✓ Alert acknowledged · Triage opened');
      });
    }

    const btnQuickDirective = document.getElementById('btnQuickDirective');
    if (btnQuickDirective) {
      btnQuickDirective.addEventListener('click', (e) => {
        e.stopPropagation();
        openBottomSheet('Issue Clinical Care Directive', `
          <div style="font-size:12px; color:#334155; margin-bottom:10px;">
            This instruction will be published immediately to Ananya Sharma's home screen and chat thread.
          </div>
          <div class="selector-chip-group">
            <div class="selector-chip active chipPreset" data-text="Drink at least 3 Liters of fluid daily and take Ondansetron 30 min before meals.">Oral Hydration Protocol</div>
            <div class="selector-chip chipPreset" data-text="Take Paracetamol 650mg every 6 hours if oral temperature exceeds 100.4°F.">Fever & Antipyretic Cover</div>
            <div class="selector-chip chipPreset" data-text="Please present directly to the CCA Emergency Room for stat blood cultures.">Urgent Triage Transfer</div>
          </div>
          <textarea id="modalDirectiveText" rows="3" style="width:100%; background:#f8fafc; border:1px solid #e2e8f0; border:1px solid rgba(255,255,255,0.15); color:#0f172a; padding:8px; border-radius:8px; font-size:12px; margin-bottom:12px;" data-clickable="true">Drink at least 3 Liters of fluid daily and take Ondansetron 30 min before meals.</textarea>
          <button class="btn-primary-action doctor-btn" id="btnConfirmSendDirective" data-clickable="true">
            Send Directive to Ananya Sharma →
          </button>
        `, (body) => {
          body.querySelectorAll('.chipPreset').forEach(chip => {
            chip.addEventListener('click', () => {
              body.querySelectorAll('.chipPreset').forEach(c => c.classList.remove('active'));
              chip.classList.add('active');
              const textInput = body.querySelector('#modalDirectiveText');
              if (textInput) textInput.value = chip.getAttribute('data-text');
            });
          });
          const btnSend = body.querySelector('#btnConfirmSendDirective');
          if (btnSend) {
            btnSend.addEventListener('click', () => {
              const text = body.querySelector('#modalDirectiveText').value;
              store.sendCareInstruction('Clinical Care Directive', text);
              closeBottomSheet();
              showToast('📋 Care directive sent to Ananya Sharma');
            });
          }
        });
      });
    }

    // D08 Staging Calculator
    const btnOpenStageCalculator = document.getElementById('btnOpenStageCalculator');
    if (btnOpenStageCalculator) {
      btnOpenStageCalculator.addEventListener('click', () => {
        openBottomSheet('AJCC 8th TNM Staging Tool', `
          <div style="font-size:12px; color:#334155; margin-bottom:10px;">
            Recalculate clinical / pathological stage based on pathology and clinical findings:
          </div>
          <div style="display:flex; flex-direction:column; gap:8px; font-size:12px; margin-bottom:12px;">
            <div>
              <label style="color:#4338ca; font-weight:700;">Primary Tumor (T):</label>
              <select id="selTumorT" class="app-select" style="width:100%; background:rgba(0,0,0,0.5); color:#0f172a; padding:6px; border-radius:6px; border:1px solid rgba(255,255,255,0.15);">
                <option value="cT1">cT1 (≤ 20 mm)</option>
                <option value="cT2" selected>cT2 (> 20 mm to ≤ 50 mm - Current 2.6cm)</option>
                <option value="cT3">cT3 (> 50 mm)</option>
                <option value="cT4">cT4 (Chest wall / skin)</option>
              </select>
            </div>
            <div>
              <label style="color:#4338ca; font-weight:700;">Regional Lymph Nodes (N):</label>
              <select id="selNodesN" class="app-select" style="width:100%; background:rgba(0,0,0,0.5); color:#0f172a; padding:6px; border-radius:6px; border:1px solid rgba(255,255,255,0.15);">
                <option value="pN0" selected>pN0 (sn 0/3 - Clear sentinel nodes)</option>
                <option value="pN1">pN1 (1-3 axillary nodes)</option>
                <option value="pN2">pN2 (4-9 axillary nodes)</option>
              </select>
            </div>
            <div>
              <label style="color:#4338ca; font-weight:700;">Distant Metastasis (M):</label>
              <select id="selMetM" class="app-select" style="width:100%; background:rgba(0,0,0,0.5); color:#0f172a; padding:6px; border-radius:6px; border:1px solid rgba(255,255,255,0.15);">
                <option value="cM0" selected>cM0 (No clinical/radiographic metastasis)</option>
                <option value="cM1">cM1 (Distant metastasis present)</option>
              </select>
            </div>
          </div>
          <div style="background:rgba(14,165,233,0.1); border:1px solid rgba(14,165,233,0.3); padding:8px 10px; border-radius:6px; font-size:12px; margin-bottom:12px;">
            Calculated Stage: <strong style="color:#0369a1;">Stage IIA (cT2 pN0 cM0)</strong> · Curative Intent
          </div>
          <button class="btn-primary-action doctor-btn" id="btnConfirmStageSave" data-clickable="true">
            ✓ Verify & Commit TNM Stage
          </button>
        `, (body) => {
          const btnSave = body.querySelector('#btnConfirmStageSave');
          if (btnSave) {
            btnSave.addEventListener('click', () => {
              store.recordAuditEvent('VERIFY_STAGE', 'STG-01', 'Dr Anjali Menon verified AJCC Stage IIA (cT2 pN0 cM0).');
              closeBottomSheet();
              showToast('✓ Stage IIA verified and committed to record');
            });
          }
        });
      });
    }

    // D09 Pathway Compliance
    const btnRecordPathwayCompliance = document.getElementById('btnRecordPathwayCompliance');
    if (btnRecordPathwayCompliance) {
      btnRecordPathwayCompliance.addEventListener('click', () => {
        openBottomSheet('NCCN Guideline Adherence', `
          <div style="font-size:12px; color:#334155; margin-bottom:10px;">
            Verify guideline concordant regimen selection:
          </div>
          <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); padding:10px; border-radius:6px; font-size:12px; margin-bottom:12px;">
            <strong style="color:#34d399;">NCCN Breast Cancer 2026.1 (Category 1):</strong><br/>
            Dose-Dense Doxorubicin + Cyclophosphamide followed by Paclitaxel (AC-T) q2w with pegfilgrastim support.
          </div>
          <div style="margin-bottom:12px;">
            <label style="font-size:11.5px; color:#4338ca; font-weight:700;">Clinical Justification:</label>
            <textarea id="pathwayJustification" rows="2" class="app-textarea" style="width:100%; font-size:12px;" data-clickable="true">Adjuvant systemic chemotherapy indicated for high Ki-67 (32%) ER+ Stage IIA disease. Protocol adherence confirmed.</textarea>
          </div>
          <button class="btn-primary-action doctor-btn" id="btnConfirmPathwaySave" data-clickable="true">
            ✓ Sign Guideline Compliance
          </button>
        `, (body) => {
          const btnSave = body.querySelector('#btnConfirmPathwaySave');
          if (btnSave) {
            btnSave.addEventListener('click', () => {
              store.recordAuditEvent('GUIDELINE_COMPLIANCE', 'NCCN-BC-2026', 'Dr Anjali Menon confirmed NCCN Category 1 adherence.');
              closeBottomSheet();
              showToast('✓ Guideline adherence signed into record');
            });
          }
        });
      });
    }

    // D14 MDT Task Creation
    const btnConvertMdtToTask = document.getElementById('btnConvertMdtToTask');
    if (btnConvertMdtToTask) {
      btnConvertMdtToTask.addEventListener('click', () => {
        store.state.tasks.unshift({
          id: 'TASK-' + Date.now(),
          title: 'Order Post-Chemo Radiation Oncology Simulation Consult',
          due: 'Upon Cycle 6 Completion',
          priority: 'ROUTINE',
          assignedTo: 'Dr Anjali Menon',
          status: 'OPEN',
          source: 'MDT Tumor Board Consensus'
        });
        store.recordAuditEvent('MDT_TASK_CREATED', 'MDT-01', 'Dr Anjali Menon created clinical order from MDT consensus.');
        store.notify();
        showToast('✓ MDT consensus converted to actionable clinical task');
      });
    }

    // Eleanor Summary Navigation
    const btnOpenEleanorSummary = document.getElementById('btnOpenEleanorSummary');
    if (btnOpenEleanorSummary) btnOpenEleanorSummary.addEventListener('click', () => store.navigateDoctor('Summary'));

    const btnScheduleEleanor = document.getElementById('btnScheduleEleanor');
    if (btnScheduleEleanor) btnScheduleEleanor.addEventListener('click', () => store.navigateDoctor('Summary'));

    // Needs Review Unreleased Labs & OCR
    document.querySelectorAll('[id^="btnGoResult-"]').forEach(item => {
      item.addEventListener('click', () => store.navigateDoctor('Results'));
    });

    const btnGoOCRReview = document.getElementById('btnGoOCRReview');
    if (btnGoOCRReview) btnGoOCRReview.addEventListener('click', () => store.navigateDoctor('OCR'));

    // Patient Directory Search
    const patientSearchInput = document.getElementById('patientSearchInput');
    if (patientSearchInput) {
      patientSearchInput.addEventListener('input', (e) => {
        store.setPatientSearchQuery(e.target.value);
      });
    }

    const btnClearSearch = document.getElementById('btnClearSearch');
    if (btnClearSearch) {
      btnClearSearch.addEventListener('click', () => {
        store.setPatientSearchQuery('');
      });
    }

    document.querySelectorAll('[data-patient-id]').forEach(card => {
      card.addEventListener('click', () => {
        const pId = card.getAttribute('data-patient-id');
        if (pId === 'PT-CCA-10482') {
          store.navigateDoctor('Summary');
        } else {
          openBottomSheet('Patient Overview', `
            <div style="font-size:13.5px; font-weight:800; color:#0f172a; margin-bottom:4px;">Patient Record: ${card.querySelector('strong').textContent}</div>
            <div style="font-size:12px; color:#334155; margin-bottom:12px;">Active surveillance or routine oncology follow-up record at CCA Cancer Centre.</div>
            <button class="btn-secondary" style="width:100%;" onclick="document.getElementById('modalCloseBtn').click()">Close</button>
          `);
        }
      });
    });

    // Summary screen buttons
    const btnStartConsultation = document.getElementById('btnStartConsultation');
    if (btnStartConsultation) btnStartConsultation.addEventListener('click', () => store.navigateDoctor('Consultation'));

    const btnNavNexus = document.getElementById('btnNavNexus');
    if (btnNavNexus) btnNavNexus.addEventListener('click', () => store.navigateDoctor('NEXUS'));

    const btnClickCycleProgress = document.getElementById('btnClickCycleProgress');
    if (btnClickCycleProgress) btnClickCycleProgress.addEventListener('click', () => store.navigateDoctor('Cycle'));

    const btnClickSymptomStream = document.getElementById('btnClickSymptomStream');
    if (btnClickSymptomStream) btnClickSymptomStream.addEventListener('click', () => store.navigateDoctor('Timeline'));

    const btnSummResults = document.getElementById('btnSummResults');
    if (btnSummResults) btnSummResults.addEventListener('click', () => store.navigateDoctor('Results'));

    const btnSummPlan = document.getElementById('btnSummPlan');
    if (btnSummPlan) btnSummPlan.addEventListener('click', () => store.navigateDoctor('Plan'));

    const btnSummOCR = document.getElementById('btnSummOCR');
    if (btnSummOCR) btnSummOCR.addEventListener('click', () => store.navigateDoctor('OCR'));

    const btnSummMDT = document.getElementById('btnSummMDT');
    if (btnSummMDT) btnSummMDT.addEventListener('click', () => store.navigateDoctor('MDT'));

    // Consultation Workspace
    const btnLaunchScribe = document.getElementById('btnLaunchScribe');
    if (btnLaunchScribe) btnLaunchScribe.addEventListener('click', () => store.navigateDoctor('Scribe'));

    const btnSaveConsultDraft = document.getElementById('btnSaveConsultDraft');
    if (btnSaveConsultDraft) {
      btnSaveConsultDraft.addEventListener('click', () => {
        const r = document.getElementById('consultReasonInput');
        const a = document.getElementById('consultAssessmentInput');
        if (r && a) store.updateConsultationDraft({ reason: r.value, assessment: a.value });
        showToast('✓ Consultation draft note saved');
      });
    }

    const btnSignConsultationModal = document.getElementById('btnSignConsultationModal');
    if (btnSignConsultationModal) {
      btnSignConsultationModal.addEventListener('click', () => {
        openBottomSheet('Electronic Signature Confirmation', `
          <div class="clinical-preview-box">
            <div style="font-size:13.5px; font-weight:800; color:#0f172a; margin-bottom:4px;">You are electronically signing:</div>
            <div style="font-size:12px; color:#0369a1; margin-bottom:8px;">Post-Cycle 3 Nadir Evaluation Consultation</div>
            <div style="font-size:11.5px; color:#334155; line-height:1.45;">
              • Patient: Ananya Sharma (MRN DEMO-CCA-10482)<br/>
              • Episode: Stage IIA Breast Cancer (Adjuvant AC-T)<br/>
              • Attending: Dr Anjali Menon (PKI-CCA-84920)<br/>
              • Version: Draft v1.0
            </div>
          </div>
          <div style="font-size:11.5px; color:#94a3b8; margin-bottom:14px;">
            Upon signature, this clinical encounter will be permanently locked and an approved Visit Summary will be generated for Ananya Sharma.
          </div>
          <button class="btn-primary-action doctor-btn" id="btnConfirmSignConsult" data-clickable="true">
            Sign Consultation & Release Summary
          </button>
        `, (body) => {
          const btn = body.querySelector('#btnConfirmSignConsult');
          if (btn) {
            btn.addEventListener('click', () => {
              store.signConsultation({
                assessment: 'Stage IIA IDC. Tolerating AC Day 8 nadir without neutropenic sepsis.',
                planNotes: 'Prepare for Friday pre-cycle blood test at 9:30 AM.'
              });
              store.updateConsultationDraft({ isSigned: true, signedAt: 'Just now', signedBy: 'Dr Anjali Menon' });
              closeBottomSheet();
              showToast('✓ Consultation signed · Patient Visit Summary released');
            });
          }
        });
      });
    }

    const btnAddAddendum = document.getElementById('btnAddAddendum');
    if (btnAddAddendum) {
      btnAddAddendum.addEventListener('click', () => {
        openBottomSheet('Add Clinical Addendum', `
          <div style="font-size:12px; color:#334155; margin-bottom:8px;">Append addendum note to signed consultation:</div>
          <textarea id="addendumText" rows="3" style="width:100%; background:#f8fafc; border:1px solid #e2e8f0; border:1px solid rgba(255,255,255,0.15); color:#0f172a; padding:6px; border-radius:6px; font-size:12px; margin-bottom:12px;">Addendum: Laboratory confirmation of ANC recovery expected Friday morning before infusion clearance.</textarea>
          <button class="btn-primary-action doctor-btn" id="btnSaveAddendum" data-clickable="true">Save Addendum</button>
        `, (body) => {
          const btn = body.querySelector('#btnSaveAddendum');
          if (btn) {
            btn.addEventListener('click', () => {
              const text = body.querySelector('#addendumText').value;
              store.addConsultationAddendum('ENC-01', text);
              closeBottomSheet();
              showToast('✓ Addendum saved to permanent record');
            });
          }
        });
      });
    }

    // Voice Scribe
    const btnToggleRecord = document.getElementById('btnToggleRecord');
    if (btnToggleRecord) {
      btnToggleRecord.addEventListener('click', () => {
        scribeRecording = !scribeRecording;
        btnToggleRecord.textContent = scribeRecording ? 'Pause' : 'Start Recording';
        const wave = document.querySelector('.waveform-bar-container');
        if (wave) wave.querySelectorAll('.wave-bar').forEach(b => b.style.animationPlayState = scribeRecording ? 'running' : 'paused');
        showToast(scribeRecording ? '🎙️ Recording active dialogue' : 'Recording paused');
      });
    }

    const btnAcceptAssessment = document.getElementById('btnAcceptAssessment');
    if (btnAcceptAssessment) {
      btnAcceptAssessment.addEventListener('click', () => {
        showToast('✓ Assessment suggestion accepted');
      });
    }

    const btnRejectAssessment = document.getElementById('btnRejectAssessment');
    if (btnRejectAssessment) {
      btnRejectAssessment.addEventListener('click', () => {
        showToast('Suggestion rejected');
      });
    }

    const btnAcceptScribeAll = document.getElementById('btnAcceptScribeAll');
    if (btnAcceptScribeAll) {
      btnAcceptScribeAll.addEventListener('click', () => {
        store.navigateDoctor('Consultation');
        showToast('✓ AI suggestions accepted into consultation note');
      });
    }

    const btnReturnConsult = document.getElementById('btnReturnConsult');
    if (btnReturnConsult) btnReturnConsult.addEventListener('click', () => store.navigateDoctor('Consultation'));

    // OCR Document Review
    document.querySelectorAll('.btnVerifyCandidate').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-cand-id');
        store.verifyOCRCandidate(id);
        showToast('✓ Fact verified and promoted to clinical record');
      });
    });

    // NEXUS Decision Support
    const btnResolveMissingFact = document.getElementById('btnResolveMissingFact');
    if (btnResolveMissingFact) btnResolveMissingFact.addEventListener('click', () => store.navigateDoctor('OCR'));

    const btnOpenEvidence = document.getElementById('btnOpenEvidence');
    if (btnOpenEvidence) {
      btnOpenEvidence.addEventListener('click', () => {
        openBottomSheet('Evidence Source Document', `
          <div style="font-size:13px; font-weight:800; color:#0f172a; margin-bottom:4px;">St. Jude Pathology Supplement · Page 1</div>
          <div style="font-size:11px; color:#94a3b8; margin-bottom:8px;">Source: Formal pathology report uploaded by patient</div>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:8px; font-family:monospace; font-size:11px; color:#334155; margin-bottom:12px;">
            "Immunohistochemical staining reveals Ki-67 nuclear antigen expression in 35% of tumor nuclei, indicative of high proliferative activity."
          </div>
          <button class="btn-secondary" style="width:100%;" onclick="document.getElementById('modalCloseBtn').click()">Close</button>
        `);
      });
    }

    const btnReRunNexus = document.getElementById('btnReRunNexus');
    if (btnReRunNexus) {
      btnReRunNexus.addEventListener('click', () => {
        store.runNexusScenario();
        showToast('⚡ NEXUS re-run completed with verified evidence');
      });
    }

    const btnNavPathway = document.getElementById('btnNavPathway');
    if (btnNavPathway) btnNavPathway.addEventListener('click', () => store.navigateDoctor('Pathway'));

    const btnAttachSnapshotPlan = document.getElementById('btnAttachSnapshotPlan');
    if (btnAttachSnapshotPlan) {
      btnAttachSnapshotPlan.addEventListener('click', () => {
        showToast('✓ NEXUS Snapshot attached to active treatment plan');
      });
    }

    // Treatment Plan Revision
    const btnCreatePlanRevision = document.getElementById('btnCreatePlanRevision');
    if (btnCreatePlanRevision) {
      btnCreatePlanRevision.addEventListener('click', () => {
        store.createTreatmentPlanVersion({});
        showToast('● Draft Plan v2 initiated');
      });
    }

    const btnSignPlanDraftModal = document.getElementById('btnSignPlanDraftModal');
    if (btnSignPlanDraftModal) {
      btnSignPlanDraftModal.addEventListener('click', () => {
        const ver = parseInt(btnSignPlanDraftModal.getAttribute('data-version'), 10);
        openBottomSheet(`Sign Treatment Plan v${ver}`, `
          <div class="clinical-preview-box">
            <div style="font-size:13px; font-weight:800; color:#0f172a; margin-bottom:4px;">Plan Revision v${ver}</div>
            <div style="font-size:11.5px; color:#334155;">
              • Patient: Ananya Sharma<br/>
              • Regimen: Dose-Dense AC-T x 6 cycles<br/>
              • Signer: Dr Anjali Menon (Medical Oncologist)<br/>
              • Status: Plan v1 will be marked SUPERSEDED.
            </div>
          </div>
          <button class="btn-primary-action doctor-btn" id="btnConfirmSignPlan" data-clickable="true">
            Confirm Signature & Publish v${ver} →
          </button>
        `, (body) => {
          const btn = body.querySelector('#btnConfirmSignPlan');
          if (btn) {
            btn.addEventListener('click', () => {
              store.signTreatmentPlanVersion(ver);
              closeBottomSheet();
              showToast(`✓ Plan v${ver} signed · Roadmap updated`);
            });
          }
        });
      });
    }

    // Cycle Decision
    const btnClearCycle4 = document.getElementById('btnClearCycle4');
    if (btnClearCycle4) {
      btnClearCycle4.addEventListener('click', () => {
        store.setCycleDecision('CLEARED', 'Physiological nadir; cleared for Cycle 4.');
        showToast('✓ Cycle 4 infusion cleared for Sep 2');
      });
    }

    const btnDeferCycle4 = document.getElementById('btnDeferCycle4');
    if (btnDeferCycle4) {
      btnDeferCycle4.addEventListener('click', () => {
        store.setCycleDecision('DEFERRED', 'Cycle 4 held 48 hours for ANC recovery.');
        showToast('⚠️ Cycle 4 deferred by 48 hours');
      });
    }

    // Results Release & Preview
    document.querySelectorAll('.btnPreviewResult').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-res-id');
        openBottomSheet('Preview Patient View', `
          <div class="clinical-preview-box">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
              <span class="preview-tag-visible">Visible to Ananya</span>
              <span class="preview-tag-hidden">Internal Notes Hidden</span>
            </div>
            <div style="font-size:14px; font-weight:800; color:#0f172a; margin-bottom:4px;">Blood Count Result (Day 8 Nadir)</div>
            <div style="font-size:11.5px; color:#0369a1; margin-bottom:8px;">Reviewed by Dr Anjali Menon</div>
            <div style="background:rgba(14,165,233,0.1); border-left:3px solid #0ea5e9; padding:8px; border-radius:4px; font-size:11.5px; color:#bae6fd; line-height:1.45; margin-bottom:8px;">
              "Your white blood cell count (ANC 1.18 k/µL) has dipped as expected during your Day 8 nadir period. It is safe and anticipated."
            </div>
            <div style="font-size:11px; color:#334155;">Numeric Parameters: ANC 1.18 k/µL · Platelets 182 k/µL</div>
          </div>
          <button class="btn-primary-action doctor-btn" id="btnReleaseFromPreview" data-clickable="true">
            Release Directly to Patient
          </button>
        `, (body) => {
          const btnRel = body.querySelector('#btnReleaseFromPreview');
          if (btnRel) {
            btnRel.addEventListener('click', () => {
              store.releaseResult(id);
              closeBottomSheet();
              showToast('↗ Result released to Ananya Sharma');
            });
          }
        });
      });
    });

    document.querySelectorAll('.btnReleaseResult').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-res-id');
        store.releaseResult(id);
        showToast('↗ Result released to Ananya Sharma');
      });
    });

    // Messages
    const btnSendDocMsg = document.getElementById('btnSendDocMsg');
    const chatInputDoc = document.getElementById('chatInputDoc');
    if (btnSendDocMsg && chatInputDoc) {
      btnSendDocMsg.addEventListener('click', () => {
        if (chatInputDoc.value.trim()) {
          store.sendMessage(chatInputDoc.value.trim());
          chatInputDoc.value = '';
        }
      });
    }

    document.querySelectorAll('.btnQuickDocReply').forEach(btn => {
      btn.addEventListener('click', () => {
        const reply = btn.getAttribute('data-reply');
        store.sendMessage(reply);
        showToast('Message sent');
      });
    });

    // Tasks Navigation
    document.querySelectorAll('[data-task-id]').forEach(t => {
      t.addEventListener('click', () => {
        const type = t.getAttribute('data-task-type');
        if (type === 'RESULT_REVIEW') store.navigateDoctor('Results');
        else if (type === 'URGENT_SYMPTOM') store.navigateDoctor('Summary');
        else if (type === 'OCR_VERIFICATION') store.navigateDoctor('OCR');
        else if (type === 'PLAN_SIGN') store.navigateDoctor('Plan');
        else store.navigateDoctor('Summary');
      });
    });

    // Timeline Click
    document.querySelectorAll('[data-audit-action]').forEach(ev => {
      ev.addEventListener('click', () => {
        const act = ev.getAttribute('data-audit-action');
        if (act.includes('RESULT')) store.navigateDoctor('Results');
        else if (act.includes('PLAN')) store.navigateDoctor('Plan');
        else if (act.includes('OCR')) store.navigateDoctor('OCR');
        else if (act.includes('CONSULT')) store.navigateDoctor('Consultation');
        else store.navigateDoctor('Summary');
      });
    });

    // Sign Out
    const btnSignOutDoctor = document.getElementById('btnSignOutDoctor');
    if (btnSignOutDoctor) {
      btnSignOutDoctor.addEventListener('click', () => {
        store.logout();
        showToast('Logged out');
      });
    }
  }

  // ========================================================
  // PATIENT SCREENS (P02 - P17)
  // ========================================================
  function renderPatientScreen(state, screenName) {
    let html = '';
    
    // Check Caregiver Scope Permissions
    const reqScopeMap = {
      'Appointments': 'appointments',
      'VisitSummary': 'treatmentInstructions',
      'Documents': 'documents',
      'Results': 'results',
      'Messages': 'messages',
      'Symptoms': 'symptomSubmission',
      'Billing': 'financial',
      'Roadmap': 'treatmentRoadmap',
      'MyCare': 'treatmentRoadmap',
      'Medicines': 'medicines'
    };
    const reqScope = reqScopeMap[screenName];
    if (reqScope && !store.hasPatientScope(reqScope)) {
      appContent.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; margin-top: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
          <h3 style="margin: 0 0 12px 0; color: #0f172a;">Access Restricted</h3>
          <p style="color: #64748b; font-size: 15px; margin: 0 0 24px 0; line-height: 1.5;">
            Your caregiver access level does not include permission to view or manage this section.
          </p>
          <button class="btn-primary-action" id="btnReturnHomeFromDenied" data-clickable="true" style="min-height: 44px; padding: 0 24px; font-size: 15px;">
            Return Home
          </button>
        </div>
      `;
      const btn = document.getElementById('btnReturnHomeFromDenied');
      if (btn) btn.addEventListener('click', () => store.navigatePatient('Home'));
      return;
    }


    if (screenName === 'Home') {
      // P02: Patient Home
      const nextApt = state.appointments[0];
      const releasedRes = state.results.filter(r => r.releaseState === 'RELEASED');
      const latestInstruction = state.patientArtifacts.find(a => a.type === 'PATIENT_INSTRUCTION');

      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div>
            <div class="card-title" style="font-size: 15px;">Good morning, Ananya</div>
            <div class="card-subtitle">Cycle 3 of 6 · Recovery & Nadir Monitoring</div>
          </div>
          <span class="status-pill verified">Day 8 Nadir</span>
        </div>

        <!-- P1-06: Plan Change Notification -->
        ${(state.cancerEpisode.activePlanVersion || 1) > 1 ? `
        <div class="card glow-patient" style="border-left: 4px solid #4f46e5; margin-bottom: 12px; cursor: pointer;" id="btnViewPlanChanges" data-clickable="true">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 13px; font-weight: 700; color: #312e81; margin-bottom: 2px;">⚠️ Care Plan Updated</div>
              <div style="font-size: 11.5px; color: #334155;">Dr Anjali Menon updated your plan instructions to v${state.cancerEpisode.activePlanVersion}. Review the new guidance.</div>
            </div>
            <span class="status-pill verified">New</span>
          </div>
        </div>
        ` : ''}

        <!-- DOMINANT NEXT ACTION CARD (P02) -->
        <div class="dominant-action-card glow-patient" data-clickable="true" id="btnGoNextApt">
          <div class="dominant-action-tag">Next Dominant Step</div>
          <div class="dominant-action-title">${nextApt ? nextApt.title : 'Pre-Cycle Blood Test'}</div>
          <div class="dominant-action-meta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
            <span>Friday · 9:30 AM · ${nextApt ? nextApt.facility : 'CCA Cancer Centre'}</span>
          </div>
          <button class="btn-primary-action" id="btnPatientHomeAptView" style="min-height: 44px; font-size: 14px;" data-clickable="true">
            View Appointment Details →
          </button>
        </div>

        <!-- TODAY'S MEDICINES DUE -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
              Today's Supportive Medicines
            </div>
            <span class="card-subtitle">Cycle 3 Nadir Cover</span>
          </div>

          ${state.medicines.map(m => `
            <div class="action-item ${m.todayStatus === 'TAKEN' ? 'done' : ''}" data-med-id="${m.id}" data-clickable="true">
              <div class="action-check-box">
                ${m.todayStatus === 'TAKEN' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
              </div>
              <div class="action-content">
                <div class="action-title">${m.name} (${m.timing})</div>
                <div class="action-desc">${m.purpose} · ${m.instructions}</div>
              </div>
              <span class="status-pill ${m.todayStatus === 'TAKEN' ? 'signed' : 'draft'}">${m.todayStatus}</span>
            </div>
          `).join('')}
        </div>

        <!-- LATEST CARE DIRECTIVE FROM DR LIN -->
        ${latestInstruction ? `
          <div class="card glow-doctor" id="btnClickDirectiveCard" data-clickable="true">
            <div class="card-header">
              <div class="card-title" style="color: #4338ca;">Care Instruction from Dr Anjali Menon</div>
              <span class="status-pill verified">Just Now</span>
            </div>
            <div style="font-size: 12.5px; color: #0f172a; line-height: 1.45;">
              "${latestInstruction.content.directive}"
            </div>
          </div>
        ` : ''}

        <!-- EXPANDED ONCOLOGY NAVIGATION SHORTCUTS (P03, P04, P05, P09, P10, P11, P13, P15, P16) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <button class="btn-secondary" id="btnShortcutMyCare" data-clickable="true" style="font-size:12px;">
            🩺 My Cancer Care (P03)
          </button>
          <button class="btn-secondary" id="btnShortcutSymptoms" data-clickable="true" style="font-size:12px;">
            🌡️ Report Symptoms (P11)
          </button>
          <button class="btn-secondary" id="btnShortcutResults" data-clickable="true" style="font-size:12px;">
            🧪 Lab & Test Results (P13)
          </button>
          <button class="btn-secondary" id="btnShortcutApts" data-clickable="true" style="font-size:12px;">
            📅 Appointments (P04)
          </button>
          <button class="btn-secondary" id="btnShortcutPrep" data-clickable="true" style="font-size:12px;">
            📝 Visit Preparation (P05)
          </button>
          <button class="btn-secondary" id="btnShortcutTreatmentDay" data-clickable="true" style="font-size:12px;">
            🏥 Treatment Day Guide (P10)
          </button>
          <button class="btn-secondary" id="btnShortcutMeds" data-clickable="true" style="font-size:12px;">
            💊 Supportive Medicines (P09)
          </button>
          <button class="btn-secondary" id="btnShortcutBilling" data-clickable="true" style="font-size:12px;">
            💳 Bills & Insurance (P15)
          </button>
        </div>

        <button class="btn-secondary" id="btnShortcutSurvivorship" data-clickable="true" style="width:100%; font-size:12px; margin-bottom:12px;">
          🎗️ Treatment Summary & Survivorship Plan (P16) →
        </button>

        <!-- PERSISTENT URGENT HELP BUTTON -->
        <button class="btn-primary-action" id="btnGoUrgentHelp" data-clickable="true" style="background: linear-gradient(135deg, #e11d48, #be123c); min-height: 48px; font-size: 14.5px;">
          🚨 24/7 Cancer Emergency & Triage Hotline
        </button>
      `;
    } else if (screenName === 'MyCare') {
      // P03: My Cancer Care (Dedicated Disease Hub)
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">My Cancer Care · Disease Overview</div>
          <span class="status-pill signed">Stage IIA IDC</span>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">${state.cancerEpisode.diagnosis}</div>
          <div style="font-size: 11.5px; color: #0369a1; margin-bottom: 8px;">Invasive Ductal Carcinoma · Nottingham Grade 2 (Score 6/9)</div>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 10px;">
            <div style="font-size: 11px; font-weight: 700; color: #4338ca; text-transform: uppercase; margin-bottom: 6px;">Receptor Profile & Biomarkers:</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11.5px;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 4px;">
                <span style="color:#94a3b8;">Estrogen (ER):</span> <strong style="color:#34d399;">90% (+)</strong>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 4px;">
                <span style="color:#94a3b8;">Progesterone (PR):</span> <strong style="color:#34d399;">70% (+)</strong>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 4px;">
                <span style="color:#94a3b8;">HER2/neu:</span> <strong style="color:#0369a1;">1+ (Neg)</strong>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 4px;">
                <span style="color:#fbbf24;">Ki-67 Index:</span> <strong style="color:#fbbf24;">32% (High)</strong>
              </div>
            </div>
          </div>

          <div style="font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 8px;">
            <strong>Active Systemic Regimen:</strong> ${state.cancerEpisode.activeRegimen}<br/>
            <strong>Current Phase:</strong> Cycle 3 of 6 (Day 8 Physiological Nadir Recovery)
          </div>
        </div>

        <!-- CARE TEAM DIRECTORY -->
        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div class="card-header">
            <div class="card-title" style="font-size: 13px;">My Dedicated Care Team</div>
            <span class="status-pill verified">CCA Oncology</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">
              <div>
                <strong style="color:#0f172a;">Dr Anjali Menon</strong><br/>
                <span style="font-size: 11px; color: #94a3b8;">Treating Medical Oncologist · MD, DM</span>
              </div>
              <button class="btn-secondary btnCareTeamMsg" id="btnMsgDrMenon" data-name="Dr Anjali Menon" data-clickable="true" style="padding: 4px 8px; font-size: 11px;">Message</button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">
              <div>
                <strong style="color:#0f172a;">Priya Rao, RN</strong><br/>
                <span style="font-size: 11px; color: #94a3b8;">Breast Oncology Nurse Navigator</span>
              </div>
              <button class="btn-secondary btnCareTeamMsg" id="btnMsgNursePriya" data-name="Nurse Priya Rao" data-clickable="true" style="padding: 4px 8px; font-size: 11px;">Message</button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="color:#0f172a;">Dr Ramesh Kulkarni</strong><br/>
                <span style="font-size: 11px; color: #94a3b8;">Primary Breast Oncosurgeon · MS, MCh</span>
              </div>
              <span class="status-pill signed" style="font-size: 10px;">Clear Margins</span>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <button class="btn-secondary" id="btnGoRoadmapFromMyCare" data-clickable="true" style="font-size: 12px;">
            View Milestones (P08) →
          </button>
          <button class="btn-secondary" id="btnGoTreatmentDayFromMyCare" data-clickable="true" style="font-size: 12px;">
            Day Suite Guide (P10) →
          </button>
        </div>
      `;
    } else if (screenName === 'VisitPreparation') {
      // P05: Visit Preparation
      const nextApt = state.appointments[0];
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Visit Preparation Checklist</div>
          <span class="status-pill verified">Pre-Visit Guide</span>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div class="card-header">
            <div class="card-title" style="font-size: 13.5px;">Upcoming Visit: ${nextApt ? nextApt.title : 'Pre-Cycle Evaluation'}</div>
            <span class="status-pill draft">Friday 9:30 AM</span>
          </div>
          <div style="font-size: 12px; color: #334155; line-height: 1.45; margin-bottom: 8px;">
            Clinician: <strong>Dr Anjali Menon</strong> · Facility: <strong>${nextApt ? nextApt.facility : 'CCA Cancer Centre'}</strong><br/>
            Preparation Instructions: <em>Fast 4 hours prior for comprehensive metabolic panel. Maintain normal hydration with water.</em>
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div style="font-size: 12px; font-weight: 700; color: #4338ca; margin-bottom: 8px;">Checklist: What to Bring</div>
          <div style="display:flex; flex-direction:column; gap: 8px; font-size: 12px;">
            <label style="display:flex; align-items:center; gap: 8px; color: #1e293b;" data-clickable="true">
              <input type="checkbox" checked style="accent-color:#0ea5e9; width:16px; height:16px;" />
              Government Photo ID (Aadhaar / Passport) & UHID Card
            </label>
            <label style="display:flex; align-items:center; gap: 8px; color: #1e293b;" data-clickable="true">
              <input type="checkbox" checked style="accent-color:#0ea5e9; width:16px; height:16px;" />
              Current supportive medication strips (Ondansetron, Prochlorperazine)
            </label>
            <label style="display:flex; align-items:center; gap: 8px; color: #1e293b;" data-clickable="true">
              <input type="checkbox" checked style="accent-color:#0ea5e9; width:16px; height:16px;" />
              Daily oral temperature & home symptom log
            </label>
            <label style="display:flex; align-items:center; gap: 8px; color: #1e293b;" data-clickable="true">
              <input type="checkbox" style="accent-color:#0ea5e9; width:16px; height:16px;" />
              Insurance pre-authorization cashless confirmation copy
            </label>
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 12px;">
          <div style="font-size: 12px; font-weight: 700; color: #4338ca; margin-bottom: 6px;">Questions for Dr Anjali Menon</div>
          <textarea id="prepQuestionsInput" rows="2" class="app-textarea" placeholder="Note down any symptoms, questions, or side-effects you want to discuss..." data-clickable="true">Inquiring about cold sensation in fingers and Friday blood test timing.</textarea>
          
          <button class="btn-primary-action" id="btnSaveVisitPrep" data-clickable="true" style="margin-top: 10px; width: 100%;">
            ✓ Save & Share Preparation Notes
          </button>
        </div>
      `;
    } else if (screenName === 'TreatmentDay') {
      // P10: Treatment Day
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Treatment Day Infusion Guide</div>
          <span class="status-pill verified">Day Suite Protocol</span>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">Cycle 4 Infusion Day: Wednesday, Sep 2</div>
          <div style="font-size: 11.5px; color: #0369a1; margin-bottom: 8px;">
            Venue: <strong>CCA South Hospital · 3rd Floor Day Oncology Unit</strong>
          </div>
          <div style="display:flex; justify-content:space-between; background:#f8fafc; border:1px solid #e2e8f0; padding:8px 12px; border-radius:6px; font-size:11.5px;">
            <span>Arrival: <strong>8:30 AM</strong></span>
            <span>Bay: <strong style="color:#0369a1;">Infusion Suite #4</strong></span>
            <span>Nurse: <strong>Priya Rao, RN</strong></span>
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div style="font-size: 12px; font-weight: 700; color: #4338ca; margin-bottom: 10px; text-transform:uppercase;">
            Expected Infusion Protocol Sequence:
          </div>
          <div class="roadmap-timeline">
            <div class="roadmap-step completed" data-clickable="true">
              <div class="roadmap-node">1</div>
              <div class="roadmap-step-title">8:30 AM · Arrival & Triage Vitals</div>
              <div class="roadmap-step-desc">Weight check, blood pressure, peripheral cannula / port access flush</div>
            </div>
            <div class="roadmap-step completed" data-clickable="true">
              <div class="roadmap-node">2</div>
              <div class="roadmap-step-title">9:00 AM · Supportive Pre-Medications</div>
              <div class="roadmap-step-desc">IV Ondansetron 8mg + IV Dexamethasone 12mg anti-emetic prophylaxis (30 min)</div>
            </div>
            <div class="roadmap-step active" data-clickable="true">
              <div class="roadmap-node">3</div>
              <div class="roadmap-step-title">9:45 AM · Chemotherapy Drug 1 (Doxorubicin)</div>
              <div class="roadmap-step-desc">Slow IV push over 20 min. Cold therapy gloves and ice chips provided</div>
            </div>
            <div class="roadmap-step" data-clickable="true">
              <div class="roadmap-node">4</div>
              <div class="roadmap-step-title">10:15 AM · Chemotherapy Drug 2 (Cyclophosphamide)</div>
              <div class="roadmap-step-desc">IV infusion in 500 mL normal saline (60 min) with hyperhydration</div>
            </div>
            <div class="roadmap-step" data-clickable="true">
              <div class="roadmap-node">5</div>
              <div class="roadmap-step-title">11:15 AM · Saline Flush & Safe Discharge</div>
              <div class="roadmap-step-desc">Observation vitals check, take-home prescription handover, next appointment card</div>
            </div>
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div style="font-size: 12px; font-weight: 700; color: #4338ca; margin-bottom: 6px;">Day Suite Packing List</div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.5;">
            • Cozy warm blanket or shawl (infusion suites are air-conditioned)<br/>
            • 1-Liter water bottle (sip water throughout the infusion)<br/>
            • Mint or lemon lozenges to counteract drug taste<br/>
            • Fully charged phone & headphones with downloaded music/audiobooks<br/>
            • One adult accompanying companion (Rajesh Sharma)
          </div>
        </div>

        <button class="btn-primary-action" id="btnCallDayNurse" data-clickable="true" style="width: 100%; background: linear-gradient(135deg, #0284c7, #0369a1);">
          🔔 Ring Bay Suite Nurse Priya Rao (Bay #4)
        </button>
      `;
    } else if (screenName === 'Billing') {
      // P15: Bills & Insurance
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Cashless Insurance & Hospital Billing</div>
          <span class="status-pill signed">✓ Pre-Auth Approved</span>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div class="card-header">
            <div class="card-title" style="font-size: 13.5px;">Star Health & Allied Insurance</div>
            <span class="status-pill verified">Policy #SH-CCA-99201</span>
          </div>
          <div style="font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 8px;">
            Insured: <strong>Ananya Sharma</strong> (UHID: CCA-DEL-2026-0892)<br/>
            Cashless TPA Desk Ref: <strong>TPA-CCA-2026-88910</strong><br/>
            Authorized Limit: <strong style="color:#34d399;">₹ 1,85,000 per Chemotherapy Cycle</strong>
          </div>
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 8px 10px; border-radius: 6px; font-size: 11.5px; color: #6ee7b7;">
            ✓ 100% Cashless Pre-Approval active. Zero estimated out-of-pocket copay for scheduled protocol medications.
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div style="font-size: 12px; font-weight: 700; color: #4338ca; margin-bottom: 8px;">Cycle 3 Estimate & Hospital Breakdown</div>
          <div style="display:flex; flex-direction:column; gap: 6px; font-size: 11.5px;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
              <span style="color:#334155;">Day Care Suite & Clinical Nursing:</span>
              <span style="color:#0f172a; font-weight:600;">₹ 8,500 (Covered)</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
              <span style="color:#334155;">Doxorubicin & Cyclophosphamide IV:</span>
              <span style="color:#0f172a; font-weight:600;">₹ 24,000 (Covered)</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
              <span style="color:#334155;">Anti-Emetics & Supportive Infusions:</span>
              <span style="color:#0f172a; font-weight:600;">₹ 4,200 (Covered)</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
              <span style="color:#334155;">Medical Oncologist Consultation:</span>
              <span style="color:#0f172a; font-weight:600;">₹ 3,500 (Covered)</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding-top:4px;">
              <span style="color:#34d399; font-weight:700;">Patient Payable Amount:</span>
              <span style="color:#34d399; font-weight:800; font-size:13px;">₹ 0.00</span>
            </div>
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 12px;">
          <div style="font-size: 12px; font-weight: 700; color: #4338ca; margin-bottom: 6px;">CCA Cashless Insurance Helpdesk</div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.45; margin-bottom: 10px;">
            Officer: <strong>Mr. Vikram Seth</strong> · Ground Floor Room 12<br/>
            Direct Helpline: <strong>080-4567-8900 (Ext 4402)</strong>
          </div>
          <button class="btn-secondary" id="btnDownloadInsuranceLetter" data-clickable="true" style="width:100%; font-size:11.5px;">
            📄 Download Pre-Auth Approval Letter (PDF)
          </button>
        </div>
      `;
    } else if (screenName === 'Survivorship') {
      // P16: Treatment Summary & Survivorship
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Treatment Summary & Survivorship Care Plan</div>
          <span class="status-pill verified">Longitudinal Care</span>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">Ananya Sharma · Curative Pathway</div>
          <div style="font-size: 11.5px; color: #0369a1; margin-bottom: 8px;">Stage IIA (cT2 pN0 cM0) Invasive Ductal Carcinoma</div>
          
          <div style="font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 10px;">
            <strong>Primary Surgery:</strong> Right Lumpectomy + SLNB (Clear margins, 0/3 positive nodes)<br/>
            <strong>Systemic Therapy:</strong> Dose-Dense AC-T x 6 Cycles (Target completion: Oct 2026)<br/>
            <strong>Endocrine Therapy:</strong> Oral Letrozole 2.5mg daily x 5 years post-chemotherapy
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 6px;">
            <div style="font-size: 11px; font-weight: 700; color: #4338ca; text-transform: uppercase; margin-bottom: 4px;">Cumulative Anthracycline Dose Monitoring:</div>
            <div style="font-size: 12px; color: #0f172a;">
              Doxorubicin Received: <strong>180 mg/m²</strong> (Planned: 240 mg/m²)<br/>
              <span style="font-size: 10.5px; color: #94a3b8;">Cardiovascular safety threshold: 450 mg/m² lifetime limit</span>
            </div>
            <div style="width: 100%; background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; margin-top: 6px; overflow:hidden;">
              <div style="background: #38bdf8; height: 100%; width: 40%;"></div>
            </div>
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div style="font-size: 12px; font-weight: 700; color: #4338ca; margin-bottom: 8px;">Long-Term Surveillance Schedule</div>
          <div style="display:flex; flex-direction:column; gap: 6px; font-size: 11.5px; color: #334155;">
            <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
              <strong style="color:#0f172a;">Cardio-Oncology Echocardiogram:</strong><br/>
              Baseline LVEF: 64% (Normal). Repeat scheduled 6 months post-anthracycline.
            </div>
            <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
              <strong style="color:#0f172a;">Annual Breast Imaging:</strong><br/>
              Bilateral diagnostic mammogram + breast ultrasound scheduled for July 2027.
            </div>
            <div>
              <strong style="color:#0f172a;">Clinical Oncology Follow-Up:</strong><br/>
              Every 3 months for first 2 years; every 6 months for years 3-5 with Dr Anjali Menon.
            </div>
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 12px;">
          <div style="font-size: 12px; font-weight: 700; color: #4338ca; margin-bottom: 6px;">Wellness & Lymphedema Guidance</div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.45;">
            • Right arm precautions: avoid venipuncture, IV lines, and blood pressure cuffs on right arm.<br/>
            • 150 minutes of weekly moderate physical exercise (walking, light yoga).<br/>
            • Bone health: Calcium 1,200mg + Vitamin D3 daily; baseline DEXA scan scheduled.
          </div>
        </div>

        <button class="btn-secondary" id="btnDownloadCarePlan" data-clickable="true" style="width:100%; font-size:12px;">
          📄 Download Complete Survivorship Plan (PDF)
        </button>
      `;
    } else if (screenName === 'Roadmap') {
      // P08: My Care / Roadmap
      const activePlanVer = state.cancerEpisode.activePlanVersion || 1;
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Treatment Journey & Milestones</div>
          <span class="status-pill signed">Active Plan v${activePlanVer}</span>
        </div>

        <div class="card glow-patient" style="margin-bottom:10px;">
          <div style="font-size: 13.5px; font-weight:800; color:#0f172a; margin-bottom:2px;">${state.cancerEpisode.diagnosis}</div>
          <div style="font-size: 11.5px; color:#0369a1; margin-bottom:8px;">${state.staging.overallStage} · Regimen: ${state.cancerEpisode.activeRegimen}</div>
          <div style="font-size: 11.5px; color:#334155; line-height:1.45;">
            Treating Oncologist: <strong>Dr Anjali Menon</strong><br/>
            Nurse Navigator: <strong>Priya Rao</strong> · CCA Cancer Centre
          </div>
        </div>

        <!-- P1-05: Authoritative Current Instructions -->
        <div class="card" style="border-left: 4px solid #4f46e5; margin-bottom: 10px; background: rgba(79, 70, 229, 0.03);">
          <div class="card-header" style="margin-bottom: 4px;">
            <div class="card-title" style="color: #4f46e5; font-size: 13px;">Current Care Instructions</div>
            <span class="status-pill signed">From Dr Menon</span>
          </div>
          <div style="font-size: 12px; color: #1e293b; line-height: 1.6;">
            Drink 2.5L of water daily.<br/>
            ${(() => {
              const cp = state.treatmentPlans.find(p => p.status === 'SIGNED');
              return cp ? cp.patientInstructions : 'No active specific instructions at this time.';
            })()}
          </div>
        </div>

        <div class="card glow-patient">
          <div style="font-size: 12px; font-weight:700; color:#4338ca; text-transform:uppercase; margin-bottom: 10px;">
            Treatment Journey Milestones:
          </div>

          <div class="roadmap-timeline">
            <div class="roadmap-step completed" data-clickable="true">
              <div class="roadmap-node">✓</div>
              <div class="roadmap-step-title">1. Surgical Removal & SLNB</div>
              <div class="roadmap-step-desc">Completed July 2 · Clear margins achieved</div>
            </div>
            <div class="roadmap-step completed" data-clickable="true">
              <div class="roadmap-node">✓</div>
              <div class="roadmap-step-title">2. Chemotherapy Cycle 1 & 2</div>
              <div class="roadmap-step-desc">Completed with good tolerance</div>
            </div>
            <div class="roadmap-step active" data-clickable="true">
              <div class="roadmap-node">●</div>
              <div class="roadmap-step-title">3. Chemotherapy Cycle 3 (Current)</div>
              <div class="roadmap-step-desc">Day 8 physiological nadir recovery period</div>
            </div>
            <div class="roadmap-step" data-clickable="true">
              <div class="roadmap-node">○</div>
              <div class="roadmap-step-title">4. Chemotherapy Cycles 4, 5 & 6</div>
              <div class="roadmap-step-desc">Scheduled through September 2026</div>
            </div>
            <div class="roadmap-step" data-clickable="true">
              <div class="roadmap-node">○</div>
              <div class="roadmap-step-title">5. Hormone Maintenance Therapy</div>
              <div class="roadmap-step-desc">Oral Letrozole x 5 years post-chemotherapy</div>
            </div>
          </div>
        </div>
      `;
    } else if (screenName === 'Symptoms') {
      // P06: 5-Step Symptom Wizard
      const wiz = store.symptomWizard;

      if (wiz.step === 1) {
        const categories = [
          { id: 'Temperature', label: '🌡️ Temperature / Fever' },
          { id: 'Nausea', label: '🤢 Nausea & Appetite' },
          { id: 'Fatigue', label: '😴 Fatigue & Energy' },
          { id: 'Pain', label: '⚡ Body Pain' },
          { id: 'Neuropathy', label: '🖐️ Tingling / Numbness' },
          { id: 'Other', label: '📝 Other Sensation' }
        ];

        html = `
          <div class="card-header" style="margin-bottom: 8px;">
            <div class="card-title">Report a Symptom</div>
            <span class="status-pill verified">Step 1 of 4</span>
          </div>

          <div class="wizard-progress-bar">
            <div class="wizard-progress-seg active"></div>
            <div class="wizard-progress-seg"></div>
            <div class="wizard-progress-seg"></div>
            <div class="wizard-progress-seg"></div>
          </div>

          <div class="card glow-patient">
            <div style="font-size: 14.5px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">How are you feeling?</div>
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 16px;">Select the primary symptom you are experiencing today:</div>

            <div class="wizard-choice-grid">
              ${categories.map(c => `
                <button class="wizard-choice-btn ${wiz.category === c.id ? 'selected' : ''}" data-cat="${c.id}" data-clickable="true">
                  ${c.label}
                </button>
              `).join('')}
            </div>

            <button class="btn-primary-action" id="btnWizNext1" data-clickable="true">
              Continue to Severity →
            </button>
          </div>
        `;
      } else if (wiz.step === 2) {
        html = `
          <div class="card-header" style="margin-bottom: 8px;">
            <div class="card-title">Report a Symptom</div>
            <span class="status-pill verified">Step 2 of 4</span>
          </div>

          <div class="wizard-progress-bar">
            <div class="wizard-progress-seg active"></div>
            <div class="wizard-progress-seg active"></div>
            <div class="wizard-progress-seg"></div>
            <div class="wizard-progress-seg"></div>
          </div>

          <div class="card glow-patient">
            <div style="font-size: 14.5px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">How severe is the ${wiz.category}?</div>
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 14px;">Choose the level that best describes your sensation:</div>

            ${wiz.category === 'Temperature' ? `
              <div class="temp-control-card">
                <div class="temp-label">Current Oral Reading</div>
                <div class="temp-stepper-row">
                  <button class="stepper-btn" id="btnTempMinus" data-clickable="true" aria-label="Decrease temperature">−</button>
                  <div class="temp-value-display">
                    <span class="temp-value-num" id="tempDisplay">${wiz.temperature || 100.6}</span>
                    <span class="temp-value-unit">°F</span>
                  </div>
                  <button class="stepper-btn" id="btnTempPlus" data-clickable="true" aria-label="Increase temperature">+</button>
                </div>

                <div class="temp-quick-pills">
                  <button class="temp-btn ${wiz.temperature === 98.6 ? 'active' : ''}" data-temp="98.6" data-clickable="true">98.6° (Normal)</button>
                  <button class="temp-btn ${wiz.temperature === 99.2 ? 'active' : ''}" data-temp="99.2" data-clickable="true">99.2° (Mild)</button>
                  <button class="temp-btn danger ${wiz.temperature >= 100.4 ? 'active' : ''}" data-temp="100.6" data-clickable="true">100.6° (Fever Alert)</button>
                </div>

                <div class="temp-semantic-status ${wiz.temperature >= 100.4 ? 'danger' : 'normal'}">
                  ${wiz.temperature >= 100.4 ? `
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>Above configured demo alert threshold (≥ 100.4°F)</span>
                  ` : `
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Within normal range (&lt; 100.4°F)</span>
                  `}
                </div>
              </div>
            ` : ''}

            ${wiz.category === 'Pain' ? `
              <div style="margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                  <span style="font-size:13px; font-weight:600; color:#0f172a;">⚡ Continuous Pain Scale</span>
                  <span style="font-size:16px; font-weight:800; color:#0369a1;">${wiz.painScore || 6} / 10</span>
                </div>
                <input type="range" min="0" max="10" value="${wiz.painScore || 6}" id="painRangeInput" style="width:100%; accent-color:#0284c7; cursor:pointer;" data-clickable="true" />
                <div style="display:flex; justify-content:space-between; font-size:11px; color:#64748b; margin-top:4px;">
                  <span>0 (No Pain)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Worst Possible)</span>
                </div>
              </div>
            ` : ''}

            <div class="wizard-severity-row">
              <button class="wizard-severity-btn ${wiz.severity === 'Mild' ? 'selected' : ''}" data-sev="Mild" data-clickable="true">Mild</button>
              <button class="wizard-severity-btn ${wiz.severity === 'Moderate' ? 'selected' : ''}" data-sev="Moderate" data-clickable="true">Moderate</button>
              <button class="wizard-severity-btn severe ${wiz.severity === 'Severe' ? 'selected' : ''}" data-sev="Severe" data-clickable="true">Severe</button>
            </div>

            <div style="display:flex; gap: 8px;">
              <button class="btn-secondary" id="btnWizBack" data-clickable="true" style="flex:1;">Back</button>
              <button class="btn-primary-action" id="btnWizNext2" data-clickable="true" style="flex:2;">Continue →</button>
            </div>
          </div>
        `;
      } else if (wiz.step === 3) {
        html = `
          <div class="card-header" style="margin-bottom: 8px;">
            <div class="card-title">Report a Symptom</div>
            <span class="status-pill verified">Step 3 of 4</span>
          </div>

          <div class="wizard-progress-bar">
            <div class="wizard-progress-seg active"></div>
            <div class="wizard-progress-seg active"></div>
            <div class="wizard-progress-seg active"></div>
            <div class="wizard-progress-seg"></div>
          </div>

          <div class="card glow-patient">
            <div style="font-size: 14.5px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">When did this start?</div>
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">Timeline helps Dr Anjali Menon evaluate treatment patterns.</div>

            <div class="wizard-choice-grid" style="grid-template-columns:1fr 1fr 1fr; margin-bottom:14px;">
              <button class="wizard-choice-btn ${wiz.onset === 'Today' ? 'selected' : ''}" data-onset="Today" data-clickable="true">Today</button>
              <button class="wizard-choice-btn ${wiz.onset === 'Yesterday' ? 'selected' : ''}" data-onset="Yesterday" data-clickable="true">Yesterday</button>
              <button class="wizard-choice-btn ${wiz.onset === 'A few days ago' ? 'selected' : ''}" data-onset="A few days ago" data-clickable="true">2-3 Days</button>
            </div>

            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Is it getting:</div>
            <div class="wizard-choice-grid" style="grid-template-columns:1fr 1fr 1fr; margin-bottom:14px;">
              <button class="wizard-choice-btn ${wiz.progression === 'Getting better' ? 'selected' : ''}" data-prog="Getting better" data-clickable="true">Better</button>
              <button class="wizard-choice-btn ${wiz.progression === 'About the same' ? 'selected' : ''}" data-prog="About the same" data-clickable="true">Same</button>
              <button class="wizard-choice-btn ${wiz.progression === 'Getting worse' ? 'selected' : ''}" data-prog="Getting worse" data-clickable="true">Worse</button>
            </div>

            <div style="display:flex; gap: 8px;">
              <button class="btn-secondary" id="btnWizBack" data-clickable="true" style="flex:1;">Back</button>
              <button class="btn-primary-action" id="btnWizNext3" data-clickable="true" style="flex:2;">Review & Send →</button>
            </div>
          </div>
        `;
      } else if (wiz.step === 4) {
        html = `
          <div class="card-header" style="margin-bottom: 8px;">
            <div class="card-title">Review & Submit Report</div>
            <span class="status-pill verified">Step 4 of 4</span>
          </div>

          <div class="card glow-patient">
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 10px;">Summary of Your Report:</div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; font-size: 12px; line-height: 1.5; color: #1e293b; margin-bottom: 12px;">
              • <strong>Symptom:</strong> ${wiz.category}<br/>
              • <strong>Severity:</strong> <span style="color:${wiz.severity === 'Severe' || wiz.temperature >= 100.4 ? '#f43f5e' : '#38bdf8'}; font-weight:700;">${wiz.severity} (${wiz.temperature ? wiz.temperature + '°F' : ''})</span><br/>
              • <strong>Started:</strong> ${wiz.onset}<br/>
              • <strong>Progression:</strong> ${wiz.progression}
            </div>

            <div style="margin-bottom: 12px;">
              <label style="font-size: 11.5px; color: #94a3b8; font-weight: 600;">Optional note for Dr Anjali Menon & Nurse Priya:</label>
              <textarea id="wizNoteInput" rows="2" placeholder="e.g. Mild headache after waking up..." style="width:100%; background:#f8fafc; border:1px solid #e2e8f0; border:1px solid rgba(255,255,255,0.1); color:#0f172a; padding:6px; border-radius:6px; margin-top:4px; font-size:12px;" data-clickable="true"></textarea>
            </div>

            <button class="btn-primary-action" id="btnSubmitFinalSymptom" data-clickable="true">
              Send to Care Team
            </button>
          </div>
        `;
      } else if (wiz.step === 5) {
        const isFever = wiz.temperature >= 100.4 || wiz.severity === 'Severe';
        html = `
          <div class="card-header" style="margin-bottom: 8px;">
            <div class="card-title">Check-In Confirmation</div>
            <span class="status-pill signed">✓ Delivered</span>
          </div>

          <div class="card glow-patient" style="border-left: 4px solid ${isFever ? '#f43f5e' : '#10b981'};">
            <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
              ✓ Sent to Your Care Team
            </div>
            <div style="font-size: 11.5px; color: #94a3b8; margin-bottom: 12px;">
              Submitted at 9:41 AM · Received by Medical Oncology Service
            </div>

            ${isFever ? `
              <div style="background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.35); border-radius: 10px; padding: 12px; margin-bottom: 14px;">
                <div style="font-size: 12px; font-weight: 800; color: #9f1239; margin-bottom: 4px;">
                  ⚠️ Your Care Team Has Been Alerted
                </div>
                <div style="font-size: 11.5px; color: #9f1239; line-height: 1.45;">
                  Because your reading (${wiz.temperature}°F) represents potential neutropenic fever on Day 8, Dr Anjali Menon and the triage fellow have received an urgent alert. Stay warm, rest, and keep fluids handy.
                </div>
              </div>

              <button class="btn-primary-action" id="btnCallTriageEmergency" style="background:#e11d48; margin-bottom:8px;" data-clickable="true">
                📞 Call Triage Hotline (1-800-555-CCACARE)
              </button>
            ` : `
              <div style="font-size: 12px; color: #334155; line-height: 1.45; margin-bottom: 12px;">
                Your report has been logged in Ananya's active Cancer Episode. We will notify you if Dr Menon issues new instructions.
              </div>
            `}

            <button class="btn-secondary" id="btnWizDone" data-clickable="true" style="width:100%;">
              Done · Return to Home
            </button>
          </div>
        `;
      }

      appContent.innerHTML = html;
      attachSymptomWizardListeners();
      return;
    } else if (screenName === 'Results') {
      // P08: Patient Results
      const released = state.results.filter(r => r.releaseState === 'RELEASED');
      const unreleased = state.results.filter(r => r.releaseState === 'UNRELEASED');

      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">My Lab & Test Results</div>
          <span class="status-pill verified">Care Team Verified</span>
        </div>

        <!-- UNRELEASED RESULTS (NO SENSITIVE/ANXIOUS METRICS EXPOSED) -->
        ${unreleased.map(u => `
          <div class="card" style="border-left: 4px solid #f59e0b;" data-clickable="true">
            <div class="card-header">
              <div class="card-title" style="font-size: 13px;">${u.title}</div>
              <span class="status-pill draft">Under Review</span>
            </div>
            <div style="font-size: 12px; color: #334155; line-height: 1.45;">
              Your test has been completed by the lab and is currently being evaluated by Dr Anjali Menon. You will receive an instant notification when your doctor releases the summary.
            </div>
          </div>
        `).join('')}

        <!-- RELEASED RESULTS WITH DOCTOR INTERPRETATION -->
        ${released.map(r => `
          <div class="card glow-patient" style="border-left: 4px solid #10b981;">
            <div class="card-header">
              <div class="card-title" style="font-size: 13.5px;">${r.title}</div>
              <span class="status-pill released">✓ Reviewed by Dr Anjali Menon</span>
            </div>
            <div style="font-size: 11px; color: #0369a1; margin-bottom: 6px;">
              Released on ${r.releasedAt} · ${r.laboratory}
            </div>
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-left: 3px solid #0ea5e9; padding: 10px 12px; border-radius: 4px; font-size: 12px; color: #0369a1; line-height: 1.45; margin-bottom: 8px;">
              <strong>What this means:</strong><br/>
              ${r.patientExplanation}
            </div>
            ${r.category === 'Hematology' ? `
              <div style="font-size: 11.5px; color: #334155; margin-bottom: 8px;">
                ANC Level: <strong>${(r.metrics.find(m => m.name.includes('ANC')) || {}).value || '1.18'} k/µL (Safe Nadir Range)</strong> · Platelets: <strong>182 k/µL (Normal)</strong>
              </div>
            ` : `
              <div style="font-size: 11.5px; color: #334155; margin-bottom: 8px;">
                ${r.metrics.slice(0, 2).map(m => `${m.name}: <strong>${m.value}</strong>`).join(' · ')}
              </div>
            `}
            <button class="btn-secondary btnAskAboutResult" id="btnAskAboutResult_${r.id}" data-res-title="${r.title}" data-clickable="true" style="width:100%; font-size:11.5px;">
              Ask Care Team a Question About This Result
            </button>
          </div>
        `).join('')}
      `;
    } else if (screenName === 'Appointments') {
      // P04: Appointments
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">My Appointments</div>
          <span class="status-pill verified">Upcoming Visits</span>
        </div>

        ${state.appointments.map(apt => `
          <div class="card glow-patient" style="margin-bottom: 10px;">
            <div class="card-header">
              <div class="card-title" style="font-size: 13.5px;">${apt.title}</div>
              <span class="status-pill ${apt.status.includes('CONFIRMED') ? 'signed' : 'verified'}">${apt.status}</span>
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #0369a1; margin-bottom: 4px;">
              ${apt.date} at ${apt.time}
            </div>
            <div style="font-size: 11.5px; color: #334155; margin-bottom: 6px;">
              Location: ${apt.facility}<br/>
              Doctor: ${apt.doctor}
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px; font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
              <strong>Preparation:</strong> ${apt.preparation}
            </div>
            <div style="display:flex; gap: 6px;">
              <button class="btn-secondary btnConfirmApt" id="btnConfirmApt_${apt.id}" data-apt-id="${apt.id}" data-clickable="true" style="flex:1; font-size:11px;">
                ✓ Confirm Attendance
              </button>
              <button class="btn-secondary btnChangeApt" id="btnChangeApt_${apt.id}" data-apt-id="${apt.id}" data-clickable="true" style="flex:1; font-size:11px;">
                Request Change
              </button>
            </div>
          </div>
        `).join('')}
      `;
    } else if (screenName === 'Medicines') {
      // P05: Medicines
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">My Supportive Medicines</div>
          <span class="status-pill verified">Cycle 3 Nadir Cover</span>
        </div>

        ${state.medicines.map(m => `
          <div class="card glow-patient" style="margin-bottom: 10px;">
            <div class="card-header">
              <div class="card-title" style="font-size: 13.5px;">${m.name}</div>
              <span class="status-pill ${m.todayStatus === 'TAKEN' ? 'signed' : 'draft'}">${m.todayStatus}</span>
            </div>
            <div style="font-size: 12px; color: #0369a1; font-weight: 600; margin-bottom: 4px;">${m.purpose}</div>
            <div style="font-size: 11.5px; color: #334155; margin-bottom: 8px;">
              Dose: <strong>${m.dose}</strong> · Schedule: <strong>${m.schedule}</strong><br/>
              Instructions: ${m.instructions}
            </div>
            <div style="display:flex; gap:6px;">
              ${m.todayStatus !== 'TAKEN' ? `
                <div style="flex:1; display:flex; align-items:center; gap:8px;">
                  <input type="checkbox" class="action-check-box btnMarkTaken" data-med-id="${m.id}" data-clickable="true" style="width:22px; height:22px; cursor:pointer;" />
                  <span style="font-size: 13px; font-weight: 600; color: #0f172a;">Mark Taken</span>
                </div>
              ` : `
                <div style="flex:1; font-size: 11.5px; color: #34d399; padding:7px;">✓ Taken today at 8:00 AM</div>
              `}
              <button class="btn-secondary btnMissedDose" id="btnMissedDose_${m.id}" data-med-name="${m.name}" data-clickable="true" style="font-size:11px;">
                Missed Dose Info
              </button>
            </div>
          </div>
        `).join('')}
      `;
    } else if (screenName === 'Documents') {
      // P10: Documents & Upload
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">My Health Documents</div>
          <span class="status-pill verified">${state.documents.length} Files</span>
        </div>

        <button class="btn-primary-action" id="btnUploadDocSheet" data-clickable="true" style="margin-bottom: 12px;">
          + Upload New Document / Report
        </button>

        ${state.documents.map(d => `
          <div class="card glow-patient" style="margin-bottom: 8px;" data-clickable="true">
            <div class="card-header">
              <div class="card-title" style="font-size: 13px;">${d.title}</div>
              <span class="status-pill ${d.status === 'VERIFIED' ? 'signed' : 'draft'}">
                ${d.status === 'VERIFIED' ? '✓ Verified' : 'Awaiting Review'}
              </span>
            </div>
            <div style="font-size: 11.5px; color: #94a3b8;">
              ${d.category} · ${d.fileType} · Uploaded ${d.date}
            </div>
          </div>
        `).join('')}
      `;
    } else if (screenName === 'VisitSummary') {
      // P11: Visit Summary
      const vs = state.patientArtifacts.find(a => a.type === 'VISIT_SUMMARY');
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Doctor Visit Summary</div>
          <span class="status-pill signed">Approved by Dr Anjali Menon</span>
        </div>

        <div class="card glow-patient">
          ${vs ? `
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${vs.title}</div>
            <div style="font-size: 11.5px; color: #0369a1; margin-bottom: 12px;">Signed & Released on ${vs.releasedAt}</div>

            <div style="display:flex; flex-direction:column; gap: 10px; font-size: 12px; color: #1e293b; line-height: 1.45;">
              <div>
                <strong style="color:#0f172a;">What we discussed:</strong><br/>
                ${vs.content.whatDiscussed}
              </div>
              <div>
                <strong style="color:#0f172a;">Your Current Care Plan:</strong><br/>
                ${vs.content.currentPlan}<br/>
                <div style="margin-top: 4px; padding: 6px; background: rgba(59, 130, 246, 0.05); border-left: 2px solid #3b82f6;">
                  <strong style="color:#1e3a8a;">Current Instructions:</strong> Drink 2.5L of water daily. Continue medications.
                </div>
              </div>
              <div>
                <strong style="color:#0f172a;">Medicines:</strong><br/>
                ${vs.content.medicinesPrescribed || vs.content.medicinesChanged || 'Continue current doses.'}
              </div>
              <div>
                <strong style="color:#0f172a;">Important Precautions:</strong><br/>
                ${vs.content.precautions}
              </div>
              <div>
                <strong style="color:#0f172a;">Next Scheduled Visit:</strong><br/>
                ${vs.content.nextVisit}
              </div>
            </div>

            <div style="display:flex; gap:6px; margin-top:14px;">
              <button class="btn-primary-action" id="btnAckVisitSummary" data-clickable="true" style="flex:1;">
                ${vs.acknowledgedByPatient ? '✓ Acknowledged' : '✓ Mark Acknowledged'}
              </button>
              <button class="btn-secondary" id="btnAskVisitSummary" data-clickable="true" style="flex:1;">
                Ask a Question
              </button>
            </div>
          ` : `
            <div style="font-size: 12px; color: #94a3b8;">No visit summaries currently active.</div>
          `}
        </div>
      `;
    } else if (screenName === 'UrgentHelp') {
      // P07: Urgent Help
      const openAlert = state.alerts[0];
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title" style="color: #f43f5e;">24/7 Cancer Emergency Support</div>
          <span class="status-pill urgent">Direct Triage</span>
        </div>

        <div class="card alert-card">
          <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
            When to call immediately:
          </div>
          <div style="font-size: 12px; color: #9f1239; line-height: 1.45; margin-bottom: 14px;">
            • Single oral temperature of <strong>100.4°F (38.0°C)</strong> or higher<br/>
            • Shaking chills or severe shivering<br/>
            • Inability to keep fluids down for over 12 hours
          </div>

          <button class="btn-primary-action" id="btnCallTriageNow" style="background:#e11d48; margin-bottom:8px;" data-clickable="true">
            📞 Call On-Call Oncology Fellow (1-800-555-CCACARE)
          </button>
        </div>

        ${openAlert ? `
          <div class="card">
            <div class="card-header">
              <div class="card-title" style="font-size: 13px;">Recently Reported Escalation</div>
              <span class="status-pill ${openAlert.status === 'RESOLVED' ? 'signed' : (openAlert.status === 'ACKNOWLEDGED' ? 'verified' : 'urgent')}">
                ${openAlert.status === 'ACKNOWLEDGED' ? '✓ Received by Dr Menon' : openAlert.status}
              </span>
            </div>
            <div style="font-size: 12px; color: #334155;">
              Reported: ${openAlert.title}<br/>
              Status: <strong>${openAlert.status === 'ACKNOWLEDGED' ? 'Reviewed by care team' : 'Sent to nurse pager'}</strong>
            </div>
          </div>
        ` : ''}
      `;
    } else if (screenName === 'Messages') {
      // P09 & P14: Messages
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Care Team Messages</div>
          <span class="status-pill verified">Dr Menon & Nurse Priya</span>
        </div>

        <div class="chat-container">
          ${state.messages.map(m => `
            <div class="chat-bubble ${m.senderRole === 'doctor' ? 'doctor-message' : 'patient-message'}">
              <div>${m.text}</div>
              <div class="chat-meta">
                <span>${m.author} (${m.title})</span>
                <span>${m.timestamp}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display:flex; gap:6px; margin-bottom:8px; overflow-x:auto;">
          <button class="btn-secondary btnQuickPatientReply" data-text="I have a question about my medication timing." data-clickable="true" style="font-size:10.5px; white-space:nowrap; padding:4px 8px;">Medication question</button>
          <button class="btn-secondary btnQuickPatientReply" data-text="Confirming I will be there Friday at 9:30 AM for the blood test." data-clickable="true" style="font-size:10.5px; white-space:nowrap; padding:4px 8px;">Confirm blood test</button>
        </div>

        <div class="chat-composer">
          <input type="text" class="chat-input" id="chatInputPatient" placeholder="Message Dr Anjali Menon..." data-clickable="true" />
          <button class="chat-send-btn" id="btnSendPatientMsg" data-clickable="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      `;
    } else if (screenName === 'Profile') {
      // P13: Patient Profile & Caregiver Access
      const cgs = state.patient.caregivers || [];
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">Patient Profile</div>
          <span class="status-pill verified">Verified Account</span>
        </div>

        <div class="card glow-patient" style="margin-bottom:10px;">
          <div style="font-size: 14.5px; font-weight:800; color:#0f172a;">${state.patient.name}</div>
          <div style="font-size: 12px; color:#0369a1; margin-bottom:6px;">MRN: ${state.patient.mrn} · ${state.patient.age} F</div>
          <div style="font-size: 11.5px; color:#334155; line-height:1.45;">
            Emergency Contact: ${state.patient.emergencyContact}<br/>
            Allergies: <strong>Penicillin (Urticaria/Rash)</strong>
          </div>
        </div>

        <!-- CAREGIVER ACCESS MANAGEMENT -->
        <div class="card glow-patient" style="margin-bottom:10px;">
          <div class="card-header">
            <div class="card-title" style="font-size:13px;">Authorized Caregivers</div>
            <button class="btn-secondary" id="btnInviteCaregiverSheet" data-clickable="true" style="padding:4px 8px; font-size:11px;">+ Invite</button>
          </div>

          ${cgs.map(cg => `
            <div class="caregiver-card">
              <div>
                <strong style="color:#0f172a; font-size:12.5px;">${cg.name}</strong> (${cg.relationship})<br/>
                <span style="font-size:11px; color:#94a3b8;">${cg.phone} · ${cg.scope}</span>
              </div>
              <button class="btn-secondary btnRevokeCaregiver" data-cg-id="${cg.id}" data-clickable="true" style="padding:4px 8px; font-size:10.5px; color:#f43f5e; border-color:rgba(244,63,94,0.3);">Revoke</button>
            </div>
          `).join('')}
        </div>

        <button class="btn-secondary" id="btnSignOutPatient" data-clickable="true" style="width:100%;">
          Sign Out & Return to Login
        </button>
      `;
    }

    appContent.innerHTML = html;
    attachPatientListeners(state);
  }

  function attachPatientListeners(state) {
    // Dominant Next Action Card
    const btnGoNextApt = document.getElementById('btnGoNextApt');
    if (btnGoNextApt) btnGoNextApt.addEventListener('click', () => store.navigatePatient('Appointments'));

    // Expanded Shortcuts
    const btnShortcutMyCare = document.getElementById('btnShortcutMyCare');
    if (btnShortcutMyCare) btnShortcutMyCare.addEventListener('click', () => store.navigatePatient('MyCare'));

    const btnShortcutPrep = document.getElementById('btnShortcutPrep');
    if (btnShortcutPrep) btnShortcutPrep.addEventListener('click', () => store.navigatePatient('VisitPreparation'));

    const btnShortcutTreatmentDay = document.getElementById('btnShortcutTreatmentDay');
    if (btnShortcutTreatmentDay) btnShortcutTreatmentDay.addEventListener('click', () => store.navigatePatient('TreatmentDay'));

    const btnShortcutBilling = document.getElementById('btnShortcutBilling');
    if (btnShortcutBilling) btnShortcutBilling.addEventListener('click', () => store.navigatePatient('Billing'));

    const btnShortcutSurvivorship = document.getElementById('btnShortcutSurvivorship');
    if (btnShortcutSurvivorship) btnShortcutSurvivorship.addEventListener('click', () => store.navigatePatient('Survivorship'));

    const btnGoRoadmapFromMyCare = document.getElementById('btnGoRoadmapFromMyCare');
    if (btnGoRoadmapFromMyCare) btnGoRoadmapFromMyCare.addEventListener('click', () => store.navigatePatient('Roadmap'));

    const btnGoTreatmentDayFromMyCare = document.getElementById('btnGoTreatmentDayFromMyCare');
    if (btnGoTreatmentDayFromMyCare) btnGoTreatmentDayFromMyCare.addEventListener('click', () => store.navigatePatient('TreatmentDay'));

    const btnSaveVisitPrep = document.getElementById('btnSaveVisitPrep');
    if (btnSaveVisitPrep) {
      btnSaveVisitPrep.addEventListener('click', () => {
        showToast('✓ Visit preparation notes saved for Dr Anjali Menon');
      });
    }

    const btnCallDayNurse = document.getElementById('btnCallDayNurse');
    if (btnCallDayNurse) {
      btnCallDayNurse.addEventListener('click', () => {
        showToast('🔔 Infusion Suite #4 call bell rang. Nurse Priya responding.');
      });
    }

    const btnDownloadInsuranceLetter = document.getElementById('btnDownloadInsuranceLetter');
    if (btnDownloadInsuranceLetter) {
      btnDownloadInsuranceLetter.addEventListener('click', () => {
        showToast('📄 Pre-Authorization approval PDF downloaded');
      });
    }

    const btnDownloadCarePlan = document.getElementById('btnDownloadCarePlan');
    if (btnDownloadCarePlan) {
      btnDownloadCarePlan.addEventListener('click', () => {
        showToast('📄 Comprehensive Survivorship Plan PDF downloaded');
      });
    }

    document.querySelectorAll('.btnCareTeamMsg').forEach(btn => {
      btn.addEventListener('click', () => store.navigatePatient('Messages'));
    });

    // Shortcuts
    const btnShortcutSymptoms = document.getElementById('btnShortcutSymptoms');
    if (btnShortcutSymptoms) {
      btnShortcutSymptoms.addEventListener('click', () => {
        store.resetSymptomWizard();
        store.navigatePatient('Symptoms');
      });
    }

    const btnShortcutResults = document.getElementById('btnShortcutResults');
    if (btnShortcutResults) btnShortcutResults.addEventListener('click', () => store.navigatePatient('Results'));

    const btnShortcutApts = document.getElementById('btnShortcutApts');
    if (btnShortcutApts) btnShortcutApts.addEventListener('click', () => store.navigatePatient('Appointments'));

    const btnShortcutMeds = document.getElementById('btnShortcutMeds');
    if (btnShortcutMeds) btnShortcutMeds.addEventListener('click', () => store.navigatePatient('Medicines'));

    const btnGoUrgentHelp = document.getElementById('btnGoUrgentHelp');
    if (btnGoUrgentHelp) btnGoUrgentHelp.addEventListener('click', () => store.navigatePatient('UrgentHelp'));

    const btnClickDirectiveCard = document.getElementById('btnClickDirectiveCard');
    if (btnClickDirectiveCard) btnClickDirectiveCard.addEventListener('click', () => store.navigatePatient('Messages'));

    // Medicine checkboxes
    document.querySelectorAll('[data-med-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = el.getAttribute('data-med-id');
        store.completeMedication(id);
        showToast('💊 Medication marked as taken');
      });
    });

    document.querySelectorAll('.btnMarkTaken').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-med-id');
        store.completeMedication(id);
        showToast('💊 Medication marked as taken');
      });
    });

    document.querySelectorAll('.btnMissedDose').forEach(btn => {
      btn.addEventListener('click', () => {
        const medName = btn.getAttribute('data-med-name');
        openBottomSheet('Missed Dose Guidance', `
          <div style="font-size:13.5px; font-weight:800; color:#0f172a; margin-bottom:4px;">Guidance for ${medName}</div>
          <div style="font-size:12px; color:#334155; line-height:1.45; margin-bottom:12px;">
            If you missed your morning dose by less than 4 hours, take it now with water. If it is already close to your next scheduled dose, skip the missed dose. Do not take two doses at once.
          </div>
          <button class="btn-primary-action" style="width:100%;" onclick="document.getElementById('modalCloseBtn').click()">Understood</button>
        `);
      });
    });

    // Appointments Actions
    document.querySelectorAll('.btnConfirmApt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-apt-id');
        store.confirmAppointment(id);
        showToast('✓ Attendance confirmed for blood test');
      });
    });

    document.querySelectorAll('.btnChangeApt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-apt-id');
        openBottomSheet('Request Appointment Change', `
          <div style="font-size:12px; color:#334155; margin-bottom:10px;">Select preferred timing for reschedule:</div>
          <div class="selector-chip-group">
            <div class="selector-chip active">Friday Afternoon</div>
            <div class="selector-chip">Saturday Morning</div>
            <div class="selector-chip">Monday Morning</div>
          </div>
          <button class="btn-primary-action" id="btnConfirmAptChange" data-clickable="true">Submit Reschedule Request</button>
        `, (body) => {
          const btnSubmit = body.querySelector('#btnConfirmAptChange');
          if (btnSubmit) {
            btnSubmit.addEventListener('click', () => {
              store.requestChangeAppointment(id, 'Patient requested morning slot adjustment');
              closeBottomSheet();
              showToast('Reschedule request sent to Care Coordinator');
            });
          }
        });
      });
    });

    // Results Actions
    document.querySelectorAll('.btnAskAboutResult').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.getAttribute('data-res-title');
        store.navigatePatient('Messages');
        const input = document.getElementById('chatInputPatient');
        if (input) input.value = `Hi Dr Menon, I have a question regarding my ${title}.`;
      });
    });

    // Documents Upload Sheet
    const btnUploadDocSheet = document.getElementById('btnUploadDocSheet');
    if (btnUploadDocSheet) {
      btnUploadDocSheet.addEventListener('click', () => {
        openBottomSheet('Upload Health Document', `
          <div class="upload-dropzone" id="dropzoneSim" data-clickable="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" style="margin-bottom:6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <div style="font-size:13px; font-weight:700; color:#0f172a;">Tap to Select Document</div>
            <div style="font-size:11px; color:#94a3b8;">Pathology report, external scan, or lab slip (PDF, JPG)</div>
          </div>
          <div style="font-size:11.5px; color:#334155; margin-bottom:12px;">
            Selected: <strong>St. Jude Pathology Supplement (Ki-67 Assay).pdf</strong>
          </div>
          <button class="btn-primary-action" id="btnConfirmUploadDoc" data-clickable="true">
            Upload & Process OCR Verification →
          </button>
        `, (body) => {
          const btnConfirm = body.querySelector('#btnConfirmUploadDoc');
          if (btnConfirm) {
            btnConfirm.addEventListener('click', () => {
              store.uploadPatientDocument({ title: 'St. Jude Pathology Supplement', fileType: 'PDF', category: 'Pathology' });
              closeBottomSheet();
              showToast('✓ Document uploaded · In verification queue for Dr Menon');
            });
          }
        });
      });
    }

    // Visit Summary
    const btnAckVisitSummary = document.getElementById('btnAckVisitSummary');
    if (btnAckVisitSummary) {
      btnAckVisitSummary.addEventListener('click', () => {
        const vs = state.patientArtifacts.find(a => a.type === 'VISIT_SUMMARY');
        if (vs) store.acknowledgeVisitSummary(vs.id);
        showToast('✓ Visit summary acknowledged');
      });
    }

    const btnAskVisitSummary = document.getElementById('btnAskVisitSummary');
    if (btnAskVisitSummary) {
      btnAskVisitSummary.addEventListener('click', () => {
        store.navigatePatient('Messages');
        const input = document.getElementById('chatInputPatient');
        if (input) input.value = 'Hi Dr Menon, could you clarify the precaution about temperature checks?';
      });
    }

    // Urgent Help
    const btnCallTriageNow = document.getElementById('btnCallTriageNow');
    if (btnCallTriageNow) {
      btnCallTriageNow.addEventListener('click', () => {
        openBottomSheet('24/7 Triage Hotline', `
          <div style="text-align:center; padding:12px 0;">
            <div style="font-size:32px; margin-bottom:8px;">📞</div>
            <div style="font-size:15px; font-weight:800; color:#0f172a; margin-bottom:4px;">Connecting to CCA Emergency Triage</div>
            <div style="font-size:13px; color:#0369a1; margin-bottom:14px;">1-800-555-CCACARE (Extension 1 for Oncology Triage)</div>
            <div style="font-size:11.5px; color:#94a3b8; margin-bottom:16px;">Average clinical nurse response time: under 90 seconds.</div>
            <button class="btn-primary-action" style="background:#e11d48;" onclick="document.getElementById('modalCloseBtn').click()">Simulate Call Connected</button>
          </div>
        `);
      });
    }

    // Caregivers
    const btnInviteCaregiverSheet = document.getElementById('btnInviteCaregiverSheet');
    if (btnInviteCaregiverSheet) {
      btnInviteCaregiverSheet.addEventListener('click', () => {
        openBottomSheet('Invite Family Caregiver', `
          <div style="font-size:12px; color:#334155; margin-bottom:10px;">
            Authorized caregivers can view appointment reminders, lab results, and message your care team on your behalf.
          </div>
          <div class="auth-input-group" style="margin-bottom:8px;">
            <label class="auth-input-label">Full Name</label>
            <input type="text" class="auth-text-input" id="cgNameInput" value="Rajesh Sharma" data-clickable="true" />
          </div>
          <div class="auth-input-group" style="margin-bottom:8px;">
            <label class="auth-input-label">Mobile Phone Number</label>
            <input type="tel" class="auth-text-input" id="cgPhoneInput" value="+91 98490 33812" data-clickable="true" />
          </div>
          <button class="btn-primary-action" id="btnConfirmInviteCaregiver" data-clickable="true">Send Invitation</button>
        `, (body) => {
          const btn = body.querySelector('#btnConfirmInviteCaregiver');
          if (btn) {
            btn.addEventListener('click', () => {
              const name = body.querySelector('#cgNameInput').value;
              const phone = body.querySelector('#cgPhoneInput').value;
              store.inviteCaregiver({ name, phone, relationship: 'Son', scope: 'Full Access' });
              closeBottomSheet();
              showToast(`✓ Invitation sent to ${name}`);
            });
          }
        });
      });
    }

    document.querySelectorAll('.btnRevokeCaregiver').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-cg-id');
        store.revokeCaregiver(id);
        showToast('Caregiver access revoked');
      });
    });

    // Chat
    const btnSendPatientMsg = document.getElementById('btnSendPatientMsg');
    const chatInputPatient = document.getElementById('chatInputPatient');
    if (btnSendPatientMsg && chatInputPatient) {
      btnSendPatientMsg.addEventListener('click', () => {
        if (chatInputPatient.value.trim()) {
          store.sendMessage(chatInputPatient.value.trim());
          chatInputPatient.value = '';
        }
      });
    }

    document.querySelectorAll('.btnQuickPatientReply').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        store.sendMessage(text);
        showToast('Message sent');
      });
    });

    // Sign Out
    const btnSignOutPatient = document.getElementById('btnSignOutPatient');
    if (btnSignOutPatient) {
      btnSignOutPatient.addEventListener('click', () => {
        store.logout();
        showToast('Logged out');
      });
    }
  }

  // Symptom Wizard Multi-Step Listeners
  function attachSymptomWizardListeners() {
    document.querySelectorAll('[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat');
        store.setSymptomWizard({ category: cat });
      });
    });

    const btnWizNext1 = document.getElementById('btnWizNext1');
    if (btnWizNext1) {
      btnWizNext1.addEventListener('click', () => store.setSymptomWizard({ step: 2 }));
    }

    const btnTempMinus = document.getElementById('btnTempMinus');
    if (btnTempMinus) {
      btnTempMinus.addEventListener('click', () => {
        const cur = store.symptomWizard.temperature || 100.6;
        const next = Math.round((cur - 0.2) * 10) / 10;
        store.setSymptomWizard({ temperature: next, severity: next >= 100.4 ? 'Severe' : (next >= 99.0 ? 'Moderate' : 'Mild') });
      });
    }

    const btnTempPlus = document.getElementById('btnTempPlus');
    if (btnTempPlus) {
      btnTempPlus.addEventListener('click', () => {
        const cur = store.symptomWizard.temperature || 100.6;
        const next = Math.round((cur + 0.2) * 10) / 10;
        store.setSymptomWizard({ temperature: next, severity: next >= 100.4 ? 'Severe' : (next >= 99.0 ? 'Moderate' : 'Mild') });
      });
    }

    const painRangeInput = document.getElementById('painRangeInput');
    if (painRangeInput) {
      painRangeInput.addEventListener('input', (e) => {
        store.setSymptomWizard({ painScore: parseInt(e.target.value, 10) });
      });
    }

    document.querySelectorAll('.temp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = parseFloat(btn.getAttribute('data-temp'));
        store.setSymptomWizard({ temperature: t, severity: t >= 100.4 ? 'Severe' : 'Mild' });
      });
    });

    document.querySelectorAll('[data-sev]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sev = btn.getAttribute('data-sev');
        store.setSymptomWizard({ severity: sev });
      });
    });

    const btnWizBack = document.getElementById('btnWizBack');
    if (btnWizBack) {
      btnWizBack.addEventListener('click', () => {
        const cur = store.symptomWizard.step;
        store.setSymptomWizard({ step: Math.max(1, cur - 1) });
      });
    }

    const btnWizNext2 = document.getElementById('btnWizNext2');
    if (btnWizNext2) {
      btnWizNext2.addEventListener('click', () => store.setSymptomWizard({ step: 3 }));
    }

    document.querySelectorAll('[data-onset]').forEach(btn => {
      btn.addEventListener('click', () => {
        store.setSymptomWizard({ onset: btn.getAttribute('data-onset') });
      });
    });

    document.querySelectorAll('[data-prog]').forEach(btn => {
      btn.addEventListener('click', () => {
        store.setSymptomWizard({ progression: btn.getAttribute('data-prog') });
      });
    });

    const btnWizNext3 = document.getElementById('btnWizNext3');
    if (btnWizNext3) {
      btnWizNext3.addEventListener('click', () => store.setSymptomWizard({ step: 4 }));
    }

    const btnSubmitFinalSymptom = document.getElementById('btnSubmitFinalSymptom');
    if (btnSubmitFinalSymptom) {
      btnSubmitFinalSymptom.addEventListener('click', () => {
        const noteInput = document.getElementById('wizNoteInput');
        const note = noteInput ? noteInput.value : '';
        const wiz = store.symptomWizard;

        store.submitSymptomReport({
          temperature: wiz.temperature || 98.6,
          nausea: wiz.category === 'Nausea' ? wiz.severity.toUpperCase() : 'MILD',
          fatigue: wiz.category === 'Fatigue' ? wiz.severity.toUpperCase() : 'MODERATE',
          neuropathy: wiz.category === 'Neuropathy' ? wiz.severity.toUpperCase() : 'NONE',
          patientNote: note
        });

        store.setSymptomWizard({ step: 5 });
      });
    }

    const btnWizDone = document.getElementById('btnWizDone');
    if (btnWizDone) {
      btnWizDone.addEventListener('click', () => {
        store.resetSymptomWizard();
        store.navigatePatient('Home');
      });
    }

    const btnCallTriageEmergency = document.getElementById('btnCallTriageEmergency');
    if (btnCallTriageEmergency) {
      btnCallTriageEmergency.addEventListener('click', () => {
        openBottomSheet('24/7 Triage Hotline', `
          <div style="text-align:center; padding:12px 0;">
            <div style="font-size:32px; margin-bottom:8px;">📞</div>
            <div style="font-size:15px; font-weight:800; color:#0f172a; margin-bottom:4px;">Connecting to CCA Emergency Triage</div>
            <div style="font-size:13px; color:#0369a1; margin-bottom:14px;">1-800-555-CCACARE (Extension 1 for Oncology Triage)</div>
            <div style="font-size:11.5px; color:#94a3b8; margin-bottom:16px;">Prioritized routing for Ananya Sharma (Fever Risk).</div>
            <button class="btn-primary-action" style="background:#e11d48;" onclick="document.getElementById('modalCloseBtn').click()">Simulate Call Connected</button>
          </div>
        `);
      });
    }
  }

  // ========================================================
  // NATIVE BOTTOM TAB BAR (PRD Section 25 & 26)
  // ========================================================
  function renderTabBar(state, isDoc) {
    let tabs = [];
    if (isDoc) {
      const openAlertsCount = state.alerts.filter(a => a.status === 'OPEN').length;
      tabs = [
        { id: 'Home', label: 'Home', badge: openAlertsCount > 0 ? '!' : null, icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
        { id: 'Patients', label: 'Patients', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
        { id: 'Tasks', label: 'Tasks', badge: state.tasks.filter(t => t.status === 'OPEN').length || null, icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
        { id: 'Messages', label: 'Messages', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
        { id: 'Profile', label: 'Profile', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' }
      ];
    } else {
      tabs = [
        { id: 'Home', label: 'Home', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
        { id: 'Roadmap', label: 'My Care', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
        { id: 'Messages', label: 'Messages', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
        { id: 'Documents', label: 'Documents', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
        { id: 'Profile', label: 'Profile', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' }
      ];
    }

    const currentScreen = isDoc ? store.currentDoctorScreen : store.currentPatientScreen;

    tabBar.innerHTML = tabs.map(t => `
      <div class="tab-item ${t.id === currentScreen ? 'active' : ''} ${isDoc ? 'doctor-tab' : ''}" data-tab="${t.id}" data-clickable="true">
        <div class="tab-icon-wrap">
          ${t.icon}
          ${t.badge ? `<span class="tab-badge">${t.badge}</span>` : ''}
        </div>
        <span>${t.label}</span>
      </div>
    `).join('');

    tabBar.querySelectorAll('.tab-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-tab');
        if (isDoc) {
          store.navigateDoctor(id);
        } else {
          store.navigatePatient(id);
        }
      });
    });
  }

  // Subscribe and initial render
  store.subscribe(render);
  render(store.state);
});
