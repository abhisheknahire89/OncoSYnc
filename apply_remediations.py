# apply_remediations.py
import re

build_file = "/Users/abhishekpravinnahire/Desktop/APP prototype/build_app.py"
with open(build_file, "r") as f:
    code = f.read()

# 1. P0 FIX: In Patient Results (P13), replace hardcoded ANC nadir on all cards with conditional rendering
old_res_metric = """            <div style="font-size: 11.5px; color: #cbd5e1; margin-bottom: 8px;">
              ANC Level: <strong>1.18 k/µL (Safe Nadir Range)</strong> · Platelets: <strong>182 k/µL (Normal)</strong>
            </div>"""

new_res_metric = """            ${r.category === 'Hematology' ? `
              <div style="font-size: 11.5px; color: #cbd5e1; margin-bottom: 8px;">
                ANC Level: <strong>${(r.metrics.find(m => m.name.includes('ANC')) || {}).value || '1.18'} k/µL (Safe Nadir Range)</strong> · Platelets: <strong>182 k/µL (Normal)</strong>
              </div>
            ` : `
              <div style="font-size: 11.5px; color: #cbd5e1; margin-bottom: 8px;">
                ${r.metrics.slice(0, 2).map(m => `${m.name}: <strong>${m.value}</strong>`).join(' · ')}
              </div>
            `}"""

if old_res_metric in code:
    code = code.replace(old_res_metric, new_res_metric, 1)
    print("✓ Replaced hardcoded result metric on P13")
else:
    print("! Could not find old_res_metric")

# 2. DOCTOR D01: Active alerts section - do not completely hide when acknowledged
old_d01_alerts = """      // D01: Doctor Home Worklist
      const openAlerts = state.alerts.filter(a => a.status === 'OPEN');
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
        ${openAlerts.length > 0 ? `
          <div class="card alert-card glow-doctor" data-clickable="true" id="btnGoUrgentAlert">
            <div class="card-header">
              <div class="card-title" style="color: #fda4af;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                ! URGENT SYMPTOM ALERT
              </div>
              <span class="status-pill urgent">Immediate Action</span>
            </div>
            <div style="font-size: 13.5px; font-weight: 800; color: #fff; margin-bottom: 4px;">${openAlerts[0].title}</div>
            <div style="font-size: 12px; color: #fecdd3; line-height: 1.45; margin-bottom: 12px;">${openAlerts[0].details}</div>
            
            <div style="display:flex; gap: 8px;">
              <button class="btn-primary-action doctor-btn" id="btnAckAlert" data-alert-id="${openAlerts[0].id}" data-clickable="true" style="min-height: 44px; font-size: 13.5px; flex: 1;">
                Acknowledge Alert
              </button>
              <button class="btn-secondary" id="btnQuickDirective" data-clickable="true" style="min-height: 44px; font-size: 13.5px; flex: 1;">
                Issue Directive
              </button>
            </div>
          </div>
        ` : ''}"""

new_d01_alerts = """      // D01: Doctor Home Worklist
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
              <div class="card-title" style="color: #fda4af;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                ! URGENT SYMPTOM ALERT
              </div>
              <span class="status-pill ${activeAlerts[0].status === 'ACKNOWLEDGED' ? 'verified' : 'urgent'}">
                ${activeAlerts[0].status === 'ACKNOWLEDGED' ? '✓ Acknowledged' : 'Immediate Action'}
              </span>
            </div>
            <div style="font-size: 13.5px; font-weight: 800; color: #fff; margin-bottom: 4px;">${activeAlerts[0].title}</div>
            <div style="font-size: 12px; color: #fecdd3; line-height: 1.45; margin-bottom: 12px;">${activeAlerts[0].details}</div>
            
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
        ` : ''}"""

if old_d01_alerts in code:
    code = code.replace(old_d01_alerts, new_d01_alerts, 1)
    print("✓ Updated D01 active alert persistence")
else:
    print("! Could not find old_d01_alerts")

# 3. DOCTOR D08 Staging, D09 Pathway, D14 MDT interactive components
old_d08_d14 = """    } else if (screenName === 'Staging') {
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
              <div class="lab-stat-val" style="font-size:14px; color:#38bdf8;">Stage IIA</div>
            </div>
          </div>

          <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 8px;">
            Signed by: <strong>${state.staging.signedBy}</strong> on ${state.staging.signedAt}
          </div>
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
          <div style="font-size: 11.5px; color: #38bdf8; font-weight: 700; margin-bottom: 4px;">
            Node: Adjuvant Systemic Therapy for Hormone-Receptor Positive Early Breast Cancer
          </div>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.45; margin-bottom: 10px;">
            Stage IIA (pT2 pN0 M0) · High Ki-67 (32%) confirms high recurrence risk warranting adjuvant dose-dense chemotherapy preceding adjuvant endocrine therapy.
          </div>

          <div class="roadmap-timeline" style="margin-top: 6px;">
            <div class="roadmap-step completed">
              <div class="roadmap-node">✓</div>
              <div class="roadmap-step-title" style="font-size: 11.5px;">Surgical Resection & Margins (Clear)</div>
            </div>
            <div class="roadmap-step active">
              <div class="roadmap-node">●</div>
              <div class="roadmap-step-title" style="font-size: 11.5px;">Dose-Dense AC-T Chemotherapy (Current)</div>
            </div>
            <div class="roadmap-step">
              <div class="roadmap-node">○</div>
              <div class="roadmap-step-title" style="font-size: 11.5px;">Adjuvant Endocrine Therapy (Letrozole)</div>
            </div>
          </div>
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
          <div style="font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 4px;">
            Case Discussion: Ananya Sharma (DEMO-CCA-10482)
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            Attendees: Dr Anjali Menon (Med Onc), Dr Robert Shaw (Surg Onc), Dr Angela Wu (Path)
          </div>
          <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.45; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
            <strong>Consensus Recommendation:</strong> Complete adjuvant dose-dense AC-T prior to initiating 5-year adjuvant Aromatase Inhibitor. Radiation oncology review upon completion of systemic treatment.
          </div>
        </div>
      `;"""

new_d08_d14 = """    } else if (screenName === 'Staging') {
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
              <div class="lab-stat-val" style="font-size:14px; color:#38bdf8;">Stage IIA</div>
            </div>
          </div>

          <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 12px;">
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
          <div style="font-size: 11.5px; color: #38bdf8; font-weight: 700; margin-bottom: 4px;">
            Node: Adjuvant Systemic Therapy for Hormone-Receptor Positive Early Breast Cancer
          </div>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.45; margin-bottom: 10px;">
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
          <div style="font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 4px;">
            Case Discussion: Ananya Sharma (DEMO-CCA-10482)
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            Attendees: Dr Anjali Menon (Med Onc), Dr Ramesh Kulkarni (Surg Onc), Dr Sunita Deshmukh (Rad Onc)
          </div>
          <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.45; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; margin-bottom: 12px;">
            <strong>Consensus Recommendation:</strong> Complete adjuvant dose-dense AC-T prior to initiating 5-year adjuvant Aromatase Inhibitor. Radiation oncology review upon completion of systemic treatment.
          </div>

          <button class="btn-primary-action doctor-btn" id="btnConvertMdtToTask" data-clickable="true" style="width:100%; font-size:12px;">
            ⚡ Convert MDT Consensus to Clinical Action Task
          </button>
        </div>
      `;"""

if old_d08_d14 in code:
    code = code.replace(old_d08_d14, new_d08_d14, 1)
    print("✓ Added interactive controls to D08 Staging, D09 Pathway, and D14 MDT")
else:
    print("! Could not find old_d08_d14")

# 4. In attachDoctorListeners: wire listeners for D08, D09, D14 interactive actions
target_doc_listeners = "    // Eleanor Summary Navigation\n    const btnOpenEleanorSummary = document.getElementById('btnOpenEleanorSummary');"
new_doc_listeners = """    // D08 Staging Calculator
    const btnOpenStageCalculator = document.getElementById('btnOpenStageCalculator');
    if (btnOpenStageCalculator) {
      btnOpenStageCalculator.addEventListener('click', () => {
        openBottomSheet('AJCC 8th TNM Staging Tool', `
          <div style="font-size:12px; color:#cbd5e1; margin-bottom:10px;">
            Recalculate clinical / pathological stage based on pathology and clinical findings:
          </div>
          <div style="display:flex; flex-direction:column; gap:8px; font-size:12px; margin-bottom:12px;">
            <div>
              <label style="color:#a5b4fc; font-weight:700;">Primary Tumor (T):</label>
              <select id="selTumorT" class="app-select" style="width:100%; background:rgba(0,0,0,0.5); color:#fff; padding:6px; border-radius:6px; border:1px solid rgba(255,255,255,0.15);">
                <option value="cT1">cT1 (≤ 20 mm)</option>
                <option value="cT2" selected>cT2 (> 20 mm to ≤ 50 mm - Current 2.6cm)</option>
                <option value="cT3">cT3 (> 50 mm)</option>
                <option value="cT4">cT4 (Chest wall / skin)</option>
              </select>
            </div>
            <div>
              <label style="color:#a5b4fc; font-weight:700;">Regional Lymph Nodes (N):</label>
              <select id="selNodesN" class="app-select" style="width:100%; background:rgba(0,0,0,0.5); color:#fff; padding:6px; border-radius:6px; border:1px solid rgba(255,255,255,0.15);">
                <option value="pN0" selected>pN0 (sn 0/3 - Clear sentinel nodes)</option>
                <option value="pN1">pN1 (1-3 axillary nodes)</option>
                <option value="pN2">pN2 (4-9 axillary nodes)</option>
              </select>
            </div>
            <div>
              <label style="color:#a5b4fc; font-weight:700;">Distant Metastasis (M):</label>
              <select id="selMetM" class="app-select" style="width:100%; background:rgba(0,0,0,0.5); color:#fff; padding:6px; border-radius:6px; border:1px solid rgba(255,255,255,0.15);">
                <option value="cM0" selected>cM0 (No clinical/radiographic metastasis)</option>
                <option value="cM1">cM1 (Distant metastasis present)</option>
              </select>
            </div>
          </div>
          <div style="background:rgba(14,165,233,0.1); border:1px solid rgba(14,165,233,0.3); padding:8px 10px; border-radius:6px; font-size:12px; margin-bottom:12px;">
            Calculated Stage: <strong style="color:#38bdf8;">Stage IIA (cT2 pN0 cM0)</strong> · Curative Intent
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
          <div style="font-size:12px; color:#cbd5e1; margin-bottom:10px;">
            Verify guideline concordant regimen selection:
          </div>
          <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); padding:10px; border-radius:6px; font-size:12px; margin-bottom:12px;">
            <strong style="color:#34d399;">NCCN Breast Cancer 2026.1 (Category 1):</strong><br/>
            Dose-Dense Doxorubicin + Cyclophosphamide followed by Paclitaxel (AC-T) q2w with pegfilgrastim support.
          </div>
          <div style="margin-bottom:12px;">
            <label style="font-size:11.5px; color:#a5b4fc; font-weight:700;">Clinical Justification:</label>
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
    const btnOpenEleanorSummary = document.getElementById('btnOpenEleanorSummary');"""

if target_doc_listeners in code:
    code = code.replace(target_doc_listeners, new_doc_listeners, 1)
    print("✓ Wired listeners for D08, D09, D14")
else:
    print("! Could not find target_doc_listeners")

# 5. PATIENT HOME (P02): Expanded oncology navigation shortcuts
old_patient_shortcuts = """        <!-- QUICK SHORTCUTS GRID -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <button class="btn-secondary" id="btnShortcutSymptoms" data-clickable="true">
            🌡️ Report Symptoms
          </button>
          <button class="btn-secondary" id="btnShortcutResults" data-clickable="true">
            🧪 View My Results
          </button>
          <button class="btn-secondary" id="btnShortcutApts" data-clickable="true">
            📅 Appointments
          </button>
          <button class="btn-secondary" id="btnShortcutMeds" data-clickable="true">
            💊 Medicines
          </button>
        </div>"""

new_patient_shortcuts = """        <!-- EXPANDED ONCOLOGY NAVIGATION SHORTCUTS (P03, P04, P05, P09, P10, P11, P13, P15, P16) -->
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
        </button>"""

if old_patient_shortcuts in code:
    code = code.replace(old_patient_shortcuts, new_patient_shortcuts, 1)
    print("✓ Added expanded navigation grid to Patient Home (P02)")
else:
    print("! Could not find old_patient_shortcuts")

# 6. PATIENT SCREENS: Add P03 MyCare, P05 VisitPreparation, P10 TreatmentDay, P15 Billing, P16 Survivorship
old_roadmap_block = """    } else if (screenName === 'Roadmap') {
      // P08 & P03: My Care / Roadmap
      const activePlanVer = state.cancerEpisode.activePlanVersion || 1;
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">My Cancer Care & Treatment Plan</div>
          <span class="status-pill signed">Active Plan v${activePlanVer}</span>
        </div>

        <div class="card glow-patient" style="margin-bottom:10px;">
          <div style="font-size: 13.5px; font-weight:800; color:#fff; margin-bottom:2px;">${state.cancerEpisode.diagnosis}</div>
          <div style="font-size: 11.5px; color:#38bdf8; margin-bottom:8px;">${state.staging.overallStage} · Regimen: ${state.cancerEpisode.activeRegimen}</div>
          <div style="font-size: 11.5px; color:#cbd5e1; line-height:1.45;">
            Treating Oncologist: <strong>Dr Anjali Menon</strong><br/>
            Nurse Navigator: <strong>Priya Rao</strong> · CCA Cancer Centre
          </div>
        </div>

        <div class="card glow-patient">
          <div style="font-size: 12px; font-weight:700; color:#a5b4fc; text-transform:uppercase; margin-bottom: 10px;">
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
      `;"""

new_screens_block = """    } else if (screenName === 'MyCare') {
      // P03: My Cancer Care (Dedicated Disease Hub)
      html = `
        <div class="card-header" style="margin-bottom: 8px;">
          <div class="card-title">My Cancer Care · Disease Overview</div>
          <span class="status-pill signed">Stage IIA IDC</span>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div style="font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 2px;">${state.cancerEpisode.diagnosis}</div>
          <div style="font-size: 11.5px; color: #38bdf8; margin-bottom: 8px;">Invasive Ductal Carcinoma · Nottingham Grade 2 (Score 6/9)</div>
          
          <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px; margin-bottom: 10px;">
            <div style="font-size: 11px; font-weight: 700; color: #a5b4fc; text-transform: uppercase; margin-bottom: 6px;">Receptor Profile & Biomarkers:</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11.5px;">
              <div style="background: rgba(255,255,255,0.04); padding: 6px; border-radius: 4px;">
                <span style="color:#94a3b8;">Estrogen (ER):</span> <strong style="color:#34d399;">90% (+)</strong>
              </div>
              <div style="background: rgba(255,255,255,0.04); padding: 6px; border-radius: 4px;">
                <span style="color:#94a3b8;">Progesterone (PR):</span> <strong style="color:#34d399;">70% (+)</strong>
              </div>
              <div style="background: rgba(255,255,255,0.04); padding: 6px; border-radius: 4px;">
                <span style="color:#94a3b8;">HER2/neu:</span> <strong style="color:#38bdf8;">1+ (Neg)</strong>
              </div>
              <div style="background: rgba(255,255,255,0.04); padding: 6px; border-radius: 4px;">
                <span style="color:#fbbf24;">Ki-67 Index:</span> <strong style="color:#fbbf24;">32% (High)</strong>
              </div>
            </div>
          </div>

          <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5; margin-bottom: 8px;">
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
                <strong style="color:#fff;">Dr Anjali Menon</strong><br/>
                <span style="font-size: 11px; color: #94a3b8;">Treating Medical Oncologist · MD, DM</span>
              </div>
              <button class="btn-secondary btnCareTeamMsg" data-name="Dr Anjali Menon" data-clickable="true" style="padding: 4px 8px; font-size: 11px;">Message</button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">
              <div>
                <strong style="color:#fff;">Priya Rao, RN</strong><br/>
                <span style="font-size: 11px; color: #94a3b8;">Breast Oncology Nurse Navigator</span>
              </div>
              <button class="btn-secondary btnCareTeamMsg" data-name="Nurse Priya Rao" data-clickable="true" style="padding: 4px 8px; font-size: 11px;">Message</button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="color:#fff;">Dr Ramesh Kulkarni</strong><br/>
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
          <div style="font-size: 12px; color: #cbd5e1; line-height: 1.45; margin-bottom: 8px;">
            Clinician: <strong>Dr Anjali Menon</strong> · Facility: <strong>${nextApt ? nextApt.facility : 'CCA Cancer Centre'}</strong><br/>
            Preparation Instructions: <em>Fast 4 hours prior for comprehensive metabolic panel. Maintain normal hydration with water.</em>
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div style="font-size: 12px; font-weight: 700; color: #a5b4fc; margin-bottom: 8px;">Checklist: What to Bring</div>
          <div style="display:flex; flex-direction:column; gap: 8px; font-size: 12px;">
            <label style="display:flex; align-items:center; gap: 8px; color: #e2e8f0;" data-clickable="true">
              <input type="checkbox" checked style="accent-color:#0ea5e9; width:16px; height:16px;" />
              Government Photo ID (Aadhaar / Passport) & UHID Card
            </label>
            <label style="display:flex; align-items:center; gap: 8px; color: #e2e8f0;" data-clickable="true">
              <input type="checkbox" checked style="accent-color:#0ea5e9; width:16px; height:16px;" />
              Current supportive medication strips (Ondansetron, Prochlorperazine)
            </label>
            <label style="display:flex; align-items:center; gap: 8px; color: #e2e8f0;" data-clickable="true">
              <input type="checkbox" checked style="accent-color:#0ea5e9; width:16px; height:16px;" />
              Daily oral temperature & home symptom log
            </label>
            <label style="display:flex; align-items:center; gap: 8px; color: #e2e8f0;" data-clickable="true">
              <input type="checkbox" style="accent-color:#0ea5e9; width:16px; height:16px;" />
              Insurance pre-authorization cashless confirmation copy
            </label>
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 12px;">
          <div style="font-size: 12px; font-weight: 700; color: #a5b4fc; margin-bottom: 6px;">Questions for Dr Anjali Menon</div>
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
          <div style="font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 2px;">Cycle 4 Infusion Day: Wednesday, Sep 2</div>
          <div style="font-size: 11.5px; color: #38bdf8; margin-bottom: 8px;">
            Venue: <strong>CCA South Hospital · 3rd Floor Day Oncology Unit</strong>
          </div>
          <div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px; font-size:11.5px;">
            <span>Arrival: <strong>8:30 AM</strong></span>
            <span>Bay: <strong style="color:#38bdf8;">Infusion Suite #4</strong></span>
            <span>Nurse: <strong>Priya Rao, RN</strong></span>
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div style="font-size: 12px; font-weight: 700; color: #a5b4fc; margin-bottom: 10px; text-transform:uppercase;">
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
          <div style="font-size: 12px; font-weight: 700; color: #a5b4fc; margin-bottom: 6px;">Day Suite Packing List</div>
          <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.5;">
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
          <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5; margin-bottom: 8px;">
            Insured: <strong>Ananya Sharma</strong> (UHID: CCA-DEL-2026-0892)<br/>
            Cashless TPA Desk Ref: <strong>TPA-CCA-2026-88910</strong><br/>
            Authorized Limit: <strong style="color:#34d399;">₹ 1,85,000 per Chemotherapy Cycle</strong>
          </div>
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 8px 10px; border-radius: 6px; font-size: 11.5px; color: #6ee7b7;">
            ✓ 100% Cashless Pre-Approval active. Zero estimated out-of-pocket copay for scheduled protocol medications.
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div style="font-size: 12px; font-weight: 700; color: #a5b4fc; margin-bottom: 8px;">Cycle 3 Estimate & Hospital Breakdown</div>
          <div style="display:flex; flex-direction:column; gap: 6px; font-size: 11.5px;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
              <span style="color:#cbd5e1;">Day Care Suite & Clinical Nursing:</span>
              <span style="color:#fff; font-weight:600;">₹ 8,500 (Covered)</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
              <span style="color:#cbd5e1;">Doxorubicin & Cyclophosphamide IV:</span>
              <span style="color:#fff; font-weight:600;">₹ 24,000 (Covered)</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
              <span style="color:#cbd5e1;">Anti-Emetics & Supportive Infusions:</span>
              <span style="color:#fff; font-weight:600;">₹ 4,200 (Covered)</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
              <span style="color:#cbd5e1;">Medical Oncologist Consultation:</span>
              <span style="color:#fff; font-weight:600;">₹ 3,500 (Covered)</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding-top:4px;">
              <span style="color:#34d399; font-weight:700;">Patient Payable Amount:</span>
              <span style="color:#34d399; font-weight:800; font-size:13px;">₹ 0.00</span>
            </div>
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 12px;">
          <div style="font-size: 12px; font-weight: 700; color: #a5b4fc; margin-bottom: 6px;">CCA Cashless Insurance Helpdesk</div>
          <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.45; margin-bottom: 10px;">
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
          <div style="font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 2px;">Ananya Sharma · Curative Pathway</div>
          <div style="font-size: 11.5px; color: #38bdf8; margin-bottom: 8px;">Stage IIA (cT2 pN0 cM0) Invasive Ductal Carcinoma</div>
          
          <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5; margin-bottom: 10px;">
            <strong>Primary Surgery:</strong> Right Lumpectomy + SLNB (Clear margins, 0/3 positive nodes)<br/>
            <strong>Systemic Therapy:</strong> Dose-Dense AC-T x 6 Cycles (Target completion: Oct 2026)<br/>
            <strong>Endocrine Therapy:</strong> Oral Letrozole 2.5mg daily x 5 years post-chemotherapy
          </div>

          <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px; margin-bottom: 6px;">
            <div style="font-size: 11px; font-weight: 700; color: #a5b4fc; text-transform: uppercase; margin-bottom: 4px;">Cumulative Anthracycline Dose Monitoring:</div>
            <div style="font-size: 12px; color: #fff;">
              Doxorubicin Received: <strong>180 mg/m²</strong> (Planned: 240 mg/m²)<br/>
              <span style="font-size: 10.5px; color: #94a3b8;">Cardiovascular safety threshold: 450 mg/m² lifetime limit</span>
            </div>
            <div style="width: 100%; background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; margin-top: 6px; overflow:hidden;">
              <div style="background: #38bdf8; height: 100%; width: 40%;"></div>
            </div>
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 10px;">
          <div style="font-size: 12px; font-weight: 700; color: #a5b4fc; margin-bottom: 8px;">Long-Term Surveillance Schedule</div>
          <div style="display:flex; flex-direction:column; gap: 6px; font-size: 11.5px; color: #cbd5e1;">
            <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
              <strong style="color:#fff;">Cardio-Oncology Echocardiogram:</strong><br/>
              Baseline LVEF: 64% (Normal). Repeat scheduled 6 months post-anthracycline.
            </div>
            <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
              <strong style="color:#fff;">Annual Breast Imaging:</strong><br/>
              Bilateral diagnostic mammogram + breast ultrasound scheduled for July 2027.
            </div>
            <div>
              <strong style="color:#fff;">Clinical Oncology Follow-Up:</strong><br/>
              Every 3 months for first 2 years; every 6 months for years 3-5 with Dr Anjali Menon.
            </div>
          </div>
        </div>

        <div class="card glow-patient" style="margin-bottom: 12px;">
          <div style="font-size: 12px; font-weight: 700; color: #a5b4fc; margin-bottom: 6px;">Wellness & Lymphedema Guidance</div>
          <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.45;">
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
          <div style="font-size: 13.5px; font-weight:800; color:#fff; margin-bottom:2px;">${state.cancerEpisode.diagnosis}</div>
          <div style="font-size: 11.5px; color:#38bdf8; margin-bottom:8px;">${state.staging.overallStage} · Regimen: ${state.cancerEpisode.activeRegimen}</div>
          <div style="font-size: 11.5px; color:#cbd5e1; line-height:1.45;">
            Treating Oncologist: <strong>Dr Anjali Menon</strong><br/>
            Nurse Navigator: <strong>Priya Rao</strong> · CCA Cancer Centre
          </div>
        </div>

        <div class="card glow-patient">
          <div style="font-size: 12px; font-weight:700; color:#a5b4fc; text-transform:uppercase; margin-bottom: 10px;">
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
      `;"""

if old_roadmap_block in code:
    code = code.replace(old_roadmap_block, new_screens_block, 1)
    print("✓ Added P03, P05, P10, P15, P16 screens")
else:
    print("! Could not find old_roadmap_block")

# 7. In attachPatientListeners: wire all new buttons
target_pat_listeners = "    // Shortcuts\n    const btnShortcutSymptoms = document.getElementById('btnShortcutSymptoms');"
new_pat_listeners = """    // Expanded Shortcuts
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
    const btnShortcutSymptoms = document.getElementById('btnShortcutSymptoms');"""

if target_pat_listeners in code:
    code = code.replace(target_pat_listeners, new_pat_listeners, 1)
    print("✓ Wired listeners for new patient screens")
else:
    print("! Could not find target_pat_listeners")

with open(build_file, "w") as f:
    f.write(code)

print("Saved updated build_app.py successfully")
