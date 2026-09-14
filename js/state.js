/**
 * CCA Cancer Care — Single App: Doctor + Patient
 * Central Authoritative Episode State & Action Dispatcher
 * 
 * "One cancer episode. One authoritative state. Two role-appropriate experiences."
 * 
 * SYNTHETIC DEMO CONFIGURATION — NOT CCA CLINICAL POLICY.
 * All clinical thresholds, medicines, results and values in this prototype are SYNTHETIC.
 */

// ========================================================
// DEMO CLINICAL CONFIGURATION
// ========================================================
const demoClinicalConfig = {
  disclaimer: "SYNTHETIC DEMO CONFIGURATION — NOT CCA CLINICAL POLICY",
  feverThresholdF: 100.4,
  nadirDaysRange: [7, 10],
  ancThresholdUrgent: 1.0, // k/µL
  ancThresholdLow: 1.5, // k/µL
  curativeIntent: "Adjuvant Systemic Chemotherapy",
  regimenName: "Dose-Dense AC-T",
  plannedCycles: 6,
  currentCycle: 3,
  currentDay: 8,
  guidelineVersion: "NCCN v2.2026 Invasive Breast Cancer",
  triageContact: {
    hospital: "CCA Cancer Centre",
    department: "Medical Oncology Emergency Triage",
    phone: "1-800-555-CCACARE (Ext 104)",
    hours: "24/7 Continuous Coverage"
  }
};
window.demoClinicalConfig = demoClinicalConfig;

// ========================================================
// INITIAL DETERMINISTIC EPISODE STATE BASELINE
// ========================================================
function createInitialEpisodeState() {
  return {
    patient: {
      id: "PT-CCA-10482",
      mrn: "DEMO-CCA-10482",
      name: "Ananya Sharma",
      age: 52,
      gender: "Female",
      dob: "1974-05-18",
      phone: "+91 98490 14821",
      emergencyContact: "Rajesh Sharma (Spouse) · +91 98490 33812",
      allergies: [
        { allergen: "Penicillin", reaction: "Urticaria / Rash", severity: "Moderate" }
      ],
      facility: "CCA Cancer Centre · Medical Oncology Pavilion"
    },

    cancerEpisode: {
      id: "EP-2026-BR-08",
      status: "ACTIVE",
      activePlanVersion: 1,
      diagnosis: "Invasive Ductal Carcinoma, Right Breast",
      laterality: "Right",
      histology: "Infiltrating Ductal Carcinoma, Nottingham Grade 2",
      clinicalStage: "cT2 N0 M0 (Stage IIA)",
      pathologicalStage: "pT2 pN0(sn) cM0 (Stage IIA)",
      biomarkers: {
        er: { status: "Positive", percentage: "90%", verified: true },
        pr: { status: "Positive", percentage: "70%", verified: true },
        her2: { status: "Negative", ihc: "1+", fish: "Not amplified", verified: true },
        ki67: { value: "32%", verified: true }
      },
      performanceStatus: "ECOG 1",
      intent: "Adjuvant Curative",
      activeRegimen: "Dose-Dense AC-T (Doxorubicin + Cyclophosphamide x 4, followed by Paclitaxel x 4)",
      currentCycle: 3,
      totalCycles: 6,
      currentDayInCycle: 8,
      cycleMilestone: "Post-treatment nadir monitoring (Day 7-10)",
      startDate: "2026-07-22"
    },

    careTeam: {
      oncologist: {
        name: "Dr Anjali Menon",
        title: "Senior Consultant Medical Oncologist",
        credentials: "MD, DM (Medical Oncology)",
        facility: "CCA Cancer Centre",
        phone: "Extension 4402"
      },
      nurseNavigator: {
        name: "Priya Rao",
        title: "Specialist Oncology Nurse Navigator",
        credentials: "RN, BSN, OCN",
        facility: "CCA Cancer Centre",
        phone: "Direct Pager 8812"
      }
    },

    staging: {
      version: "AJCC 8th Edition",
      tumourSite: "Right Upper Outer Quadrant",
      t: "T2 (2.6 cm greatest dimension)",
      n: "N0 (Sentinel lymph nodes 0/3 negative)",
      m: "M0 (No distant metastasis on CT C/A/P)",
      overallStage: "Stage IIA",
      status: "SIGNED",
      signedBy: "Dr Anjali Menon",
      signedAt: "2026-07-15 14:30"
    },

    treatmentPlans: [
      {
        version: 1,
        status: "SIGNED", // SIGNED | SUPERSEDED | DRAFT
        name: "Primary Adjuvant AC-T Systemic Plan",
        signedBy: "Dr Anjali Menon",
        signedAt: "2026-07-20 16:15",
        supersededBy: null,
        supersededReason: null,
        intent: "Curative Adjuvant",
        line: "1st Line Systemic",
        modalities: [
          { modality: "Surgery", description: "Right Lumpectomy + SLNB", status: "COMPLETED", date: "2026-07-02" },
          { modality: "Systemic Therapy", description: "Dose-Dense AC-T x 6 cycles q2w", status: "IN_PROGRESS", cycle: "Cycle 3 of 6" },
          { modality: "Radiotherapy", description: "Adjuvant Whole Breast RT (40 Gy in 15 fx)", status: "PLANNED", timing: "Post-chemotherapy" },
          { modality: "Endocrine Therapy", description: "Aromatase Inhibitor (Letrozole) x 5 yrs", status: "PLANNED", timing: "Post-radiotherapy" }
        ],
        patientInstructions: "Maintain 2.5L daily hydration. Take anti-emetics prior to meals. Report oral temperature >= 100.4°F immediately."
      }
    ],

    treatmentEvents: [
      { id: "TX-01", cycle: 1, date: "2026-07-22", regimen: "AC-1", status: "COMPLETED", notes: "Uneventful infusion. Mild day 3 fatigue." },
      { id: "TX-02", cycle: 2, date: "2026-08-05", regimen: "AC-2", status: "COMPLETED", notes: "Grade 1 nausea managed with Ondansetron." },
      { id: "TX-03", cycle: 3, date: "2026-08-19", regimen: "AC-3", status: "COMPLETED", notes: "Administered on schedule. Currently Day 8 nadir." },
      { id: "TX-04", cycle: 4, date: "2026-09-02", regimen: "AC-4", status: "SCHEDULED", notes: "Pending pre-cycle CBC clearance." },
      { id: "TX-05", cycle: 5, date: "2026-09-16", regimen: "Paclitaxel-1", status: "PLANNED", notes: "Weekly Paclitaxel phase." },
      { id: "TX-06", cycle: 6, date: "2026-09-30", regimen: "Paclitaxel-2", status: "PLANNED", notes: "Final planned cycle." }
    ],

    medicines: [
      {
        id: "MED-01",
        name: "Ondansetron 8mg",
        purpose: "Delayed chemotherapy nausea control",
        dose: "8 mg oral tablet",
        schedule: "Twice daily (q12h)",
        timing: "8:00 AM & 8:00 PM",
        instructions: "Take with water 30 minutes before food.",
        todayStatus: "TAKEN", // TAKEN | PENDING | MISSED
        lastTakenAt: "Today 08:00 AM",
        category: "Anti-emetic"
      },
      {
        id: "MED-02",
        name: "Dexamethasone 4mg",
        purpose: "Supportive anti-inflammatory and nadir cover",
        dose: "4 mg oral tablet",
        schedule: "Daily with lunch",
        timing: "1:00 PM",
        instructions: "Take with food to minimize gastric irritation.",
        todayStatus: "PENDING",
        lastTakenAt: null,
        category: "Steroid"
      },
      {
        id: "MED-03",
        name: "Prochlorperazine 10mg",
        purpose: "Breakthrough nausea relief",
        dose: "10 mg tablet",
        schedule: "As needed (PRN) every 8 hours",
        timing: "PRN",
        instructions: "Only take if nausea persists despite Ondansetron.",
        todayStatus: "PRN",
        lastTakenAt: null,
        category: "Anti-emetic"
      }
    ],

    appointments: [
      {
        id: "APT-01",
        title: "Pre-Cycle 4 Blood Draw (CBC & CMP)",
        department: "CCA Outpatient Pathology Lab",
        date: "2026-08-28",
        time: "09:30 AM",
        facility: "CCA Cancer Centre · Ground Floor Lab 2B",
        doctor: "Pathology Service",
        preparation: "Light breakfast permitted. Ensure 500mL water 1 hour prior to ease venipuncture.",
        status: "CONFIRMED"
      },
      {
        id: "APT-02",
        title: "Medical Oncology Review & Infusion #4",
        department: "Medical Oncology Day Suite",
        date: "2026-09-02",
        time: "10:15 AM",
        facility: "CCA Cancer Centre · 3rd Floor Infusion Suite",
        doctor: "Dr Anjali Menon",
        preparation: "Bring symptom log and oral hydration bottle.",
        status: "SCHEDULED"
      }
    ],

    results: [
      {
        id: "RES-CBC-D8",
        title: "Complete Blood Count w/ Differential (Day 8 Nadir)",
        category: "Hematology",
        specimenDate: "Today · 07:45 AM",
        resultDate: "Today · 09:15 AM",
        laboratory: "CCA Diagnostic Pathology",
        status: "FINAL", // FINAL
        releaseState: "UNRELEASED", // UNRELEASED | RELEASED
        releasedBy: null,
        releasedAt: null,
        patientExplanation: null,
        acknowledgedByDoctor: false,
        flag: "LOW_NADIR",
        metrics: [
          { name: "Absolute Neutrophils (ANC)", value: "1.18", unit: "k/µL", ref: "1.50 - 7.50", flag: "LOW", interpretation: "Physiological chemotherapy nadir" },
          { name: "White Blood Cells (WBC)", value: "2.4", unit: "k/µL", ref: "4.0 - 11.0", flag: "LOW", interpretation: "Chemotherapy myelosuppression" },
          { name: "Hemoglobin (Hgb)", value: "10.8", unit: "g/dL", ref: "11.6 - 15.0", flag: "MILD_LOW", interpretation: "Mild anemia, stable" },
          { name: "Platelet Count", value: "182", unit: "k/µL", ref: "150 - 450", flag: "NORMAL", interpretation: "Adequate hemostasis" }
        ],
        clinicalImpression: "Expected Day 8 nadir post-AC cycle 3. ANC 1.18 k/µL represents anticipated nadir valley without acute complication."
      },
      {
        id: "RES-PATH-01",
        title: "Surgical Pathology & Receptor Histochemistry",
        category: "Pathology",
        specimenDate: "2026-07-02",
        resultDate: "2026-07-08",
        laboratory: "CCA Anatomical Pathology",
        status: "FINAL",
        releaseState: "RELEASED",
        releasedBy: "Dr Anjali Menon",
        releasedAt: "2026-07-10 11:30 AM",
        patientExplanation: "Your surgical sample confirmed the tumor was completely removed with clear margins. The tumor cells are strongly positive for estrogen and progesterone receptors, which means hormone maintenance therapy will be very effective after chemotherapy.",
        acknowledgedByDoctor: true,
        flag: "NORMAL",
        metrics: [
          { name: "Surgical Margins", value: "Negative (>5mm all aspects)", unit: "", ref: "Clear", flag: "NORMAL" },
          { name: "Sentinel Nodes", value: "0 of 3 positive", unit: "", ref: "0", flag: "NORMAL" },
          { name: "ER Expression", value: "90% Strong Nuclear", unit: "", ref: "Allred 8/8", flag: "POSITIVE" },
          { name: "HER2 by IHC", value: "1+ (Negative)", unit: "", ref: "Negative", flag: "NORMAL" }
        ],
        clinicalImpression: "pT2 pN0(sn) IDC. Favorable receptor profile. Complete surgical clearance achieved."
      }
    ],

    symptomReports: [
      {
        id: "SYM-D7",
        reportedAt: "Yesterday · 08:30 PM",
        temperature: 98.6,
        nausea: "MILD",
        fatigue: "MODERATE",
        neuropathy: "NONE",
        pain: "MILD",
        status: "REVIEWED",
        reviewedBy: "Dr Anjali Menon",
        patientNote: "Felt tired in the evening but drank 2L water."
      }
    ],

    alerts: [], // Active clinical escalation alerts

    messages: [
      {
        id: "MSG-01",
        senderRole: "doctor",
        author: "Dr Anjali Menon",
        title: "Medical Oncologist",
        text: "Good morning Ananya. You are currently at Day 8 of Cycle 3, which is the anticipated nadir period where white blood cells dip. Please check your temperature twice daily.",
        timestamp: "Today · 08:45 AM"
      },
      {
        id: "MSG-02",
        senderRole: "patient",
        author: "Ananya Sharma",
        title: "Patient",
        text: "Good morning Dr Menon. I am sipping ginger tea and following the hydration goal. Feeling a little sluggish today.",
        timestamp: "Today · 09:02 AM"
      }
    ],

    tasks: [
      {
        id: "TSK-01",
        type: "RESULT_REVIEW",
        priority: "ROUTINE",
        title: "Review Day 8 Nadir CBC for Ananya Sharma",
        status: "OPEN", // OPEN | ACKNOWLEDGED | RESOLVED
        patientId: "PT-CCA-10482",
        patientName: "Ananya Sharma",
        assignedTo: "Dr Anjali Menon",
        dueAt: "Today 12:00 PM"
      },
      {
        id: "TSK-02",
        type: "PLAN_SIGN",
        priority: "ROUTINE",
        title: "Pre-Cycle 4 Protocol Readiness Review",
        status: "OPEN",
        patientId: "PT-CCA-10482",
        patientName: "Ananya Sharma",
        assignedTo: "Dr Anjali Menon",
        dueAt: "2026-09-01"
      }
    ],

    documents: [
      {
        id: "DOC-01",
        title: "Post-Operative Pathology Report",
        source: "CCA Histology Lab",
        date: "2026-07-08",
        status: "VERIFIED",
        fileType: "PDF",
        category: "Pathology"
      },
      {
        id: "DOC-02",
        title: "Baseline Echocardiogram (LVEF 64%)",
        source: "CCA Cardio-Oncology Service",
        date: "2026-07-16",
        status: "VERIFIED",
        fileType: "PDF",
        category: "Cardiology"
      }
    ],

    ocrCandidates: [], // External documents awaiting OCR verification

    clinicalFacts: [
      { id: "CF-01", name: "Tumour Histology", value: "Invasive Ductal Carcinoma, Grade 2", verified: true, verifiedBy: "Dr Anjali Menon", source: "DOC-01 Pathology" },
      { id: "CF-02", name: "Estrogen Receptor (ER)", value: "90% Strongly Positive", verified: true, verifiedBy: "Dr Anjali Menon", source: "DOC-01 Pathology" },
      { id: "CF-03", name: "Progesterone Receptor (PR)", value: "70% Strongly Positive", verified: true, verifiedBy: "Dr Anjali Menon", source: "DOC-01 Pathology" },
      { id: "CF-04", name: "HER2 Receptor Status", value: "Negative (IHC 1+)", verified: true, verifiedBy: "Dr Anjali Menon", source: "DOC-01 Pathology" },
      { id: "CF-05", name: "Cardiac Function LVEF", value: "64% Normal Systolic Function", verified: true, verifiedBy: "Dr Anjali Menon", source: "DOC-02 Echo" }
    ],

    nexusSnapshots: [
      {
        runId: "NEX-RUN-01",
        timestamp: "2026-07-18 10:15",
        status: "NEEDS_INFORMATION",
        guideline: "NCCN Breast Cancer Guidelines v2.2026",
        node: "Invasive Breast Cancer · Stage IIA (T2 N0 M0) · ER+/PR+, HER2-",
        clinicalPicture: "52 yo postmenopausal female, 2.6cm pT2 pN0 IDC, ER+ 90%, PR+ 70%, HER2-.",
        missingInfo: [
          {
            field: "21-Gene Recurrence Score (Oncotype DX) OR Confirmed High-Risk Clinical Features",
            impact: "Distinguishes chemotherapy benefit in T2 node-negative ER+ disease.",
            resolved: false
          }
        ],
        contradictions: [],
        decisionSupportOptions: [
          {
            option: "Consider Adjuvant Dose-Dense Chemotherapy (AC-T) followed by Endocrine Therapy",
            evidenceLevel: "Category 1",
            condition: "Clinically indicated given 2.6cm tumor size and high Ki-67 (32%)."
          },
          {
            option: "Endocrine Monotherapy (Letrozole)",
            evidenceLevel: "Category 2A",
            condition: "Eligible if genomic recurrence score is confirmed low (<16)."
          }
        ]
      }
    ],

    encounters: [
      {
        id: "ENC-01",
        date: "2026-07-20",
        type: "Treatment Planning Consultation",
        clinician: "Dr Anjali Menon",
        status: "SIGNED",
        visitSummaryArtifactId: "VS-01",
        reasonForReview: "Initial post-operative chemotherapy consultation and consent.",
        assessmentPlan: "Stage IIA IDC, ER+/PR+, HER2-. Recommend Dose-Dense AC-T curative adjuvant chemotherapy.",
        signedAt: "2026-07-20 16:30"
      }
    ],

    patientArtifacts: [
      {
        id: "VS-01",
        type: "VISIT_SUMMARY",
        title: "Visit Summary · Chemotherapy Planning Consultation",
        date: "2026-07-20",
        releasedBy: "Dr Anjali Menon",
        releasedAt: "2026-07-20 16:45",
        content: {
          whatDiscussed: "We reviewed your surgical recovery and pathology findings. Because your tumor was 2.6cm, preventive chemotherapy followed by hormone therapy offers the highest chance of long-term cure.",
          currentPlan: "Start Cycle 1 of Dose-Dense AC-T on July 22, 2026.",
          medicinesPrescribed: "Ondansetron 8mg twice daily and Dexamethasone 4mg supportive tablets.",
          precautions: "Watch for fever over 100.4°F during your nadir dip around Day 7-10 of each cycle.",
          nextVisit: "Pre-infusion checkup and lab work before Cycle 2."
        }
      }
    ],

    auditEvents: [
      {
        id: "AUD-01",
        timestamp: "2026-07-20 16:30",
        actor: "Dr Anjali Menon",
        role: "Medical Oncologist",
        action: "SIGN_CONSULTATION",
        target: "ENC-01",
        summary: "Consultation note signed and locked."
      },
      {
        id: "AUD-02",
        timestamp: "2026-07-20 16:45",
        actor: "Dr Anjali Menon",
        role: "Medical Oncologist",
        action: "RELEASE_VISIT_SUMMARY",
        target: "VS-01",
        summary: "Patient-friendly Visit Summary published to Ananya Sharma's portal."
      }
    ],

    dynamicIsland: {
      expanded: false,
      title: "Cycle 3 Nadir Day 8",
      subtitle: "Medication due at 1:00 PM",
      badge: "Active Care",
      tone: "NORMAL" // NORMAL | URGENT | SUCCESS
    }
  };
}

// ========================================================
// EPISODE STORE CLASS (REACTIVE SINGLETON)
// ========================================================
class CCAEpisodeStore {
  constructor() {
    this.subscribers = [];
    this.role = "patient"; // "patient" | "doctor"
    this.currentDoctorScreen = "Home";
    this.currentPatientScreen = "Home";
    
    // Auth & Launch Experience State
    this.auth = {
      isLoggedIn: true,
      role: "patient",
      step: "authenticated", // 'splash' | 'authLanding' | 'doctorLogin' | 'doctorMfa' | 'doctorFacility' | 'patientLogin' | 'patientOtp' | 'patientLink' | 'patientConsent' | 'authenticated'
      actingAsCaregiverId: null, // genuine permission model
      selectedFacility: "CCA Cancer Centre — Hyderabad",
      availableFacilities: [
        "CCA Cancer Centre — Hyderabad (Main Pavilion)",
        "CCA Oncology Day Care — Jubilee Hills",
        "CCA Advanced Therapeutics — Gachibowli"
      ],
      tempEmail: "sarah.lin@cca-oncology.org",
      tempMobile: "+91 98490 14821"
    };

    // Navigation Stacks for Authentic Back Navigation
    this.doctorNavStack = ["Home"];
    this.patientNavStack = ["Home"];

    // Patient Symptom Wizard State (PRD Section 21)
    this.symptomWizard = {
      step: 1, // 1: Category, 2: Severity, 3: Onset, 4: Progression, 5: Review, 6: SubmittedConfirmation
      category: "Temperature",
      temperature: 100.6,
      severity: "Severe",
      onset: "Today",
      progression: "Getting worse",
      note: ""
    };

    // Active Clinical Preview Modals & State
    this.activeReleasePreview = null; // when doctor clicks Release to preview what patient sees
    this.activeSignPreview = null; // when doctor clicks Sign to review formal signature context
    this.patientSearchQuery = "";
    this.consultationDraft = {
      reason: "Cycle 3 Day 8 physiological nadir monitoring & supportive medication review.",
      hpi: "52yo female post-lumpectomy + SLNB for Stage IIA IDC (ER+ 90%, PR+ 70%, HER2-). Currently Day 8 of Cycle 3 Dose-Dense AC-T. Reports fatigue and intermittent mild nausea after meals. Afebrile at baseline.",
      examination: "ECOG Performance Status 0-1. Vitals: BP 118/74, HR 72, Temp 98.6°F, SpO2 99%. No oral stomatitis or mucositis. Surgical incision right breast well healed without erythema. Lungs clear to auscultation bilaterally.",
      assessment: "Patient is Day 8 post-AC #3. Nadir ANC 1.18 k/µL expected and afebrile. Tolerating supportive Ondansetron well. No signs of infection.",
      plan: "1. Continue strict oral hydration (minimum 2.5L/day).\n2. Refill Prochlorperazine 10mg PRN for breakthrough nausea.\n3. Pre-cycle CBC/CMP ordered for Friday 9:30 AM before Cycle 4 infusion.",
      medications: "Ondansetron 8mg bid, Dexamethasone 4mg qd, Prochlorperazine 10mg PRN q8h.",
      investigations: "Day 8 CBC reviewed: ANC 1.18 k/µL, WBC 2.4, Hgb 10.8, Plt 182.",
      followUp: "Friday Aug 28 for lab draw; Wednesday Sep 2 for Cycle 4 Day Suite infusion.",
      isSigned: false,
      signedAt: null,
      signedBy: null
    };

    this.state = this.loadPersistedState() || createInitialEpisodeState();
  }

  loadPersistedState() {
    try {
      const saved = sessionStorage.getItem("cca_episode_state_v1");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not load persisted episode state:", e);
    }
    return null;
  }

  savePersistedState() {
    try {
      sessionStorage.setItem("cca_episode_state_v1", JSON.stringify(this.state));
    } catch (e) {
      console.warn("Could not persist episode state:", e);
    }
  }

  subscribe(listener) {
    this.subscribers.push(listener);
    return () => {
      this.subscribers = this.subscribers.filter(fn => fn !== listener);
    };
  }

  notify() {
    this.savePersistedState();
    this.subscribers.forEach(fn => fn(this.state, this));
  }

  // --- Auth & Launch Transitions ---
  startLaunchFlow(targetRole = "patient") {
    this.auth.isLoggedIn = false;
    this.auth.role = targetRole;
    this.auth.step = "splash";
    this.notify();
    setTimeout(() => {
      this.auth.step = "authLanding";
      this.notify();
    }, 1100);
  }

  setAuthStep(step) {
    this.auth.step = step;
    this.notify();
  }

  loginDoctor(facility) {
    this.auth.selectedFacility = facility || this.auth.selectedFacility;
    this.auth.isLoggedIn = true;
    this.auth.role = "doctor";
    this.auth.step = "authenticated";
    this.role = "doctor";
    this.currentDoctorScreen = "Home";
    this.doctorNavStack = ["Home"];
    this.recordAuditEvent("DOCTOR_LOGIN", "AUTH", `Dr Anjali Menon logged in at ${this.auth.selectedFacility} via MFA.`);
    this.notify();
  }

  loginPatient() {
    this.auth.isLoggedIn = true;
    this.auth.role = "patient";
    this.auth.step = "authenticated";
    this.auth.actingAsCaregiverId = null;
    this.role = "patient";
    this.currentPatientScreen = "Home";
    this.patientNavStack = ["Home"];
    this.recordAuditEvent("PATIENT_LOGIN", "AUTH", "Ananya Sharma authenticated via verified OTP and confirmed record linkage.");
    this.notify();
  }

  loginAsCaregiver(cgId) {
    const cg = this.state.patient.caregivers?.find(c => c.id === cgId);
    if (!cg || cg.status !== "ACTIVE") {
      this.auth.isLoggedIn = false;
      this.auth.actingAsCaregiverId = null;
      this.auth.step = "authLanding";
    } else {
      this.auth.isLoggedIn = true;
      this.auth.role = "patient";
      this.auth.actingAsCaregiverId = cgId;
      this.auth.step = "authenticated";
      this.role = "patient";
      this.currentPatientScreen = "Home";
      this.patientNavStack = ["Home"];
      this.recordAuditEvent("CAREGIVER_LOGIN", cgId, `Caregiver ${cg.name} logged in.`);
    }
    this.notify();
  }

  hasPatientScope(scopeName) {
    if (this.role !== "patient") return true;
    if (!this.auth.actingAsCaregiverId) return true;
    const cg = this.state.patient.caregivers?.find(c => c.id === this.auth.actingAsCaregiverId);
    if (!cg || cg.status !== "ACTIVE") return false;
    return !!cg.permissions[scopeName];
  }

  logout() {
    this.auth.isLoggedIn = false;
    this.auth.step = "authLanding";
    this.notify();
  }

  setRole(newRole) {
    this.role = newRole;
    this.auth.role = newRole;
    this.auth.isLoggedIn = true;
    this.auth.step = "authenticated";
    this.notify();
  }

  // --- Hierarchical Navigation Stacks ---
  navigateDoctor(screenName, replace = false) {
    this.role = "doctor";
    this.auth.role = "doctor";
    this.auth.isLoggedIn = true;
    this.auth.step = "authenticated";
    if (replace || screenName === "Home") {
      this.doctorNavStack = [screenName];
    } else {
      if (this.doctorNavStack[this.doctorNavStack.length - 1] !== screenName) {
        this.doctorNavStack.push(screenName);
      }
    }
    this.currentDoctorScreen = screenName;
    this.notify();
  }

  doctorGoBack() {
    if (this.doctorNavStack.length > 1) {
      this.doctorNavStack.pop();
      this.currentDoctorScreen = this.doctorNavStack[this.doctorNavStack.length - 1];
    } else {
      this.currentDoctorScreen = "Home";
      this.doctorNavStack = ["Home"];
    }
    this.notify();
  }

  navigatePatient(screenName, replace = false) {
    this.role = "patient";
    this.auth.role = "patient";
    this.auth.isLoggedIn = true;
    this.auth.step = "authenticated";
    if (replace || screenName === "Home") {
      this.patientNavStack = [screenName];
    } else {
      if (this.patientNavStack[this.patientNavStack.length - 1] !== screenName) {
        this.patientNavStack.push(screenName);
      }
    }
    this.currentPatientScreen = screenName;
    this.notify();
  }

  patientGoBack() {
    if (this.patientNavStack.length > 1) {
      this.patientNavStack.pop();
      this.currentPatientScreen = this.patientNavStack[this.patientNavStack.length - 1];
    } else {
      this.currentPatientScreen = "Home";
      this.patientNavStack = ["Home"];
    }
    this.notify();
  }

  // --- Symptom Wizard Helpers ---
  setSymptomWizard(updates) {
    this.symptomWizard = { ...this.symptomWizard, ...updates };
    this.notify();
  }

  resetSymptomWizard() {
    this.symptomWizard = {
      step: 1,
      category: "Temperature",
      temperature: 100.6,
      severity: "Severe",
      onset: "Today",
      progression: "Getting worse",
      note: ""
    };
    this.notify();
  }

  toggleDynamicIsland() {
    this.state.dynamicIsland.expanded = !this.state.dynamicIsland.expanded;
    this.notify();
  }

  recordAuditEvent(action, target, summary) {
    const isDoc = this.role === "doctor";
    this.state.auditEvents.unshift({
      id: "AUD-" + Date.now(),
      timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      actor: isDoc ? "Dr Anjali Menon" : "Ananya Sharma",
      role: isDoc ? "Medical Oncologist" : "Patient",
      action,
      target,
      summary
    });
  }

  // --------------------------------------------------------
  // ACTION 01: PATIENT SUBMITS SYMPTOM REPORT (DEMO FLOW A)
  // --------------------------------------------------------
  submitSymptomReport({ temperature, nausea, fatigue, neuropathy, pain, patientNote }) {
    const tempNum = parseFloat(temperature);
    const isFever = tempNum >= demoClinicalConfig.feverThresholdF;

    const reportId = "SYM-" + Date.now();
    const newReport = {
      id: reportId,
      reportedAt: "Just now",
      temperature: tempNum,
      nausea,
      fatigue,
      neuropathy: neuropathy || "NONE",
      pain: pain || "NONE",
      status: isFever ? "ESCALATED" : "SUBMITTED",
      reviewedBy: null,
      patientNote: patientNote || "Logged via daily PRO check-in."
    };

    this.state.symptomReports.unshift(newReport);

    if (isFever) {
      const alertId = "ALT-" + Date.now();
      const newAlert = {
        id: alertId,
        reportId,
        priority: "URGENT",
        title: `⚠️ Neutropenic Fever Risk: Temp ${tempNum}°F reported`,
        patientId: this.state.patient.id,
        patientName: this.state.patient.name,
        timestamp: "Just now",
        status: "OPEN", // OPEN | ACKNOWLEDGED | RESOLVED
        acknowledgedBy: null,
        acknowledgedAt: null,
        details: `Ananya Sharma logged oral temp ${tempNum}°F on Day 8 nadir (Threshold ${demoClinicalConfig.feverThresholdF}°F). ANC 1.18 k/µL represents potential neutropenic fever.`
      };
      this.state.alerts.unshift(newAlert);

      // Add urgent task for doctor
      this.state.tasks.unshift({
        id: "TSK-" + Date.now(),
        type: "URGENT_SYMPTOM",
        priority: "URGENT",
        title: `URGENT: Triage fever report (${tempNum}°F) - Ananya Sharma`,
        status: "OPEN",
        patientId: this.state.patient.id,
        patientName: this.state.patient.name,
        assignedTo: "Dr Anjali Menon",
        dueAt: "IMMEDIATE"
      });

      // Update Dynamic Island
      this.state.dynamicIsland = {
        expanded: true,
        title: "⚠️ Neutropenic Fever Alert",
        subtitle: `Temp ${tempNum}°F · Urgent Nurse Triage Notified`,
        badge: "Urgent Escalation",
        tone: "URGENT"
      };
    } else {
      this.state.dynamicIsland = {
        expanded: true,
        title: "Symptom Check-In Sent",
        subtitle: `Temp: ${tempNum}°F · Nausea: ${nausea}`,
        badge: "Synced to Episode",
        tone: "NORMAL"
      };
    }

    this.recordAuditEvent("SUBMIT_SYMPTOMS", reportId, `Patient submitted symptoms (Temp: ${tempNum}°F, Nausea: ${nausea}).`);
    this.notify();
  }

  // --------------------------------------------------------
  // ACTION 02: DOCTOR ACKNOWLEDGES AND TRIAGES ALERT
  // --------------------------------------------------------
  acknowledgeAlert(alertId) {
    const alert = this.state.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = "ACKNOWLEDGED";
      alert.acknowledgedBy = "Dr Anjali Menon";
      alert.acknowledgedAt = "Just now";

      // Mark associated task
      const task = this.state.tasks.find(t => t.type === "URGENT_SYMPTOM" && t.status === "OPEN");
      if (task) task.status = "ACKNOWLEDGED";

      this.recordAuditEvent("ACKNOWLEDGE_ALERT", alertId, "Dr Anjali Menon acknowledged urgent neutropenic fever alert.");
      this.notify();
    }
  }

  resolveAlert(alertId, clinicalResolutionNote) {
    const alert = this.state.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = "RESOLVED";
      alert.resolution = clinicalResolutionNote;

      const task = this.state.tasks.find(t => t.type === "URGENT_SYMPTOM");
      if (task) task.status = "RESOLVED";

      this.recordAuditEvent("RESOLVE_ALERT", alertId, "Dr Anjali Menon resolved urgent alert with clinical directive.");
      this.notify();
    }
  }

  // --------------------------------------------------------
  // ACTION 05: DOCTOR SENDS CLINICAL INSTRUCTION TO PATIENT
  // --------------------------------------------------------
  sendCareInstruction(title, instructionText) {
    const artifactId = "INST-" + Date.now();
    const newInstruction = {
      id: artifactId,
      type: "PATIENT_INSTRUCTION",
      title,
      date: "Just now",
      releasedBy: "Dr Anjali Menon",
      releasedAt: "Just now",
      content: {
        directive: instructionText,
        author: "Dr Anjali Menon · Treating Medical Oncologist",
        facility: "CCA Cancer Centre"
      }
    };

    this.state.patientArtifacts.unshift(newInstruction);

    // Also update dynamic island for patient
    this.state.dynamicIsland = {
      expanded: true,
      title: "New Care Team Directive",
      subtitle: title,
      badge: "From Dr Anjali Menon",
      tone: "SUCCESS"
    };

    // Add message in chat thread
    this.state.messages.push({
      id: "MSG-" + Date.now(),
      senderRole: "doctor",
      author: "Dr Anjali Menon",
      title: "Treating Medical Oncologist",
      text: `Clinical Care Update: ${instructionText}`,
      timestamp: "Just now"
    });

    this.recordAuditEvent("SEND_INSTRUCTION", artifactId, `Dr Anjali Menon issued patient instruction: "${title}".`);
    this.notify();
  }

  // --------------------------------------------------------
  // ACTION 04: DOCTOR REVIEWS & RELEASES LAB RESULT (DEMO FLOW B)
  // --------------------------------------------------------
  releaseResult(resultId, patientExplanation) {
    const res = this.state.results.find(r => r.id === resultId);
    if (res) {
      res.releaseState = "RELEASED";
      res.releasedBy = "Dr Anjali Menon";
      res.releasedAt = "Just now";
      res.acknowledgedByDoctor = true;
      res.patientExplanation = patientExplanation || "Your white blood cell count (ANC 1.18 k/µL) has dipped as expected during your Day 8 nadir period. It is safe and anticipated. Continue regular hydration and avoid crowded places until your Friday pre-cycle check.";

      // Remove result review task
      const task = this.state.tasks.find(t => t.type === "RESULT_REVIEW" && t.status === "OPEN");
      if (task) task.status = "RESOLVED";

      this.state.dynamicIsland = {
        expanded: true,
        title: "Lab Result Released",
        subtitle: "Day 8 CBC Nadir · Reviewed by Dr Anjali Menon",
        badge: "New Patient Access",
        tone: "SUCCESS"
      };

      this.recordAuditEvent("RELEASE_RESULT", resultId, `Dr Anjali Menon authorized release of ${res.title} to patient portal.`);
      this.notify();
    }
  }

  // --------------------------------------------------------
  // ACTION 06: DOCTOR REVISES & SIGNS TREATMENT PLAN (DEMO FLOW C)
  // --------------------------------------------------------
  createTreatmentPlanVersion({ revisedInstructions, note }) {
    const currentPlan = this.state.treatmentPlans.find(p => p.status === "SIGNED");
    const nextVer = (currentPlan ? currentPlan.version : 1) + 1;

    // Create Draft v2
    const draftPlan = {
      version: nextVer,
      status: "DRAFT", // DRAFT
      name: `Adjuvant AC-T Systemic Plan (Revision ${nextVer})`,
      signedBy: null,
      signedAt: null,
      supersededBy: null,
      supersededReason: null,
      intent: currentPlan.intent,
      line: currentPlan.line,
      modalities: JSON.parse(JSON.stringify(currentPlan.modalities)),
      patientInstructions: revisedInstructions || "Maintain minimum 3L daily hydration. Take prophylactic anti-emetic 30 min before dinner. Report oral temp >= 100.4°F immediately."
    };

    // Update modality 2 instruction
    draftPlan.modalities[1].description = "Dose-Dense AC-T x 6 cycles q2w (Adjusted hydration & supportive cover)";

    this.state.treatmentPlans.unshift(draftPlan);
    this.recordAuditEvent("CREATE_PLAN_DRAFT", `PLAN-v${nextVer}`, `Dr Anjali Menon initiated Treatment Plan revision v${nextVer}.`);
    this.notify();
  }

  signTreatmentPlanVersion(versionNumber) {
    const targetPlan = this.state.treatmentPlans.find(p => p.version === versionNumber);
    if (targetPlan && targetPlan.status === "DRAFT") {
      // Supersede previous signed plan
      this.state.treatmentPlans.forEach(p => {
        if (p.version !== versionNumber && p.status === "SIGNED") {
          p.status = "SUPERSEDED";
          p.supersededBy = `v${versionNumber}`;
          p.supersededReason = "Clinical supportive regimen update & hydration escalation";
        }
      });

      targetPlan.status = "SIGNED";
      targetPlan.signedBy = "Dr Anjali Menon";
      targetPlan.signedAt = "Just now";

      // Also update cancerEpisode active roadmap instructions
      this.state.cancerEpisode.activePlanVersion = versionNumber;

      this.state.dynamicIsland = {
        expanded: true,
        title: `Treatment Plan v${versionNumber} Signed`,
        subtitle: "Roadmap updated · Published to Patient",
        badge: "Plan Updated",
        tone: "SUCCESS"
      };

      this.recordAuditEvent("SIGN_TREATMENT_PLAN", `PLAN-v${versionNumber}`, `Dr Anjali Menon electronically signed Treatment Plan v${versionNumber}. v1 superseded.`);
      this.notify();
    }
  }

  // --------------------------------------------------------
  // ACTION 07 & 08: PATIENT DOCUMENT UPLOAD & OCR VERIFICATION (DEMO FLOW D)
  // --------------------------------------------------------
  uploadPatientDocument({ title, fileType, category }) {
    const docId = "DOC-EXT-" + Date.now();
    const candidateId = "OCR-" + Date.now();

    const newDoc = {
      id: docId,
      title: title || "External Oncology Pathology Supplement",
      source: "Patient Uploaded · St. Jude Diagnostics",
      date: "Just now",
      status: "AWAITING_VERIFICATION", // AWAITING_VERIFICATION | VERIFIED
      fileType: fileType || "PDF",
      category: category || "Pathology"
    };

    const ocrCandidate = {
      id: candidateId,
      documentId: docId,
      documentTitle: newDoc.title,
      uploadedAt: "Just now",
      sourcePage: 1,
      sourceRegion: "Paragraph 3, Line 12",
      extractedFact: "Ki-67 Proliferation Index",
      extractedValue: "35% (High Proliferative Activity)",
      aiConfidence: "98.4%",
      verificationState: "UNVERIFIED", // UNVERIFIED | VERIFIED | REJECTED
      verifiedBy: null,
      verifiedAt: null
    };

    this.state.documents.unshift(newDoc);
    this.state.ocrCandidates.unshift(ocrCandidate);

    // Add task for doctor review
    this.state.tasks.unshift({
      id: "TSK-" + Date.now(),
      type: "OCR_VERIFICATION",
      priority: "ACTION_REQUIRED",
      title: `Verify OCR Candidate: Ki-67 index from ${newDoc.title}`,
      status: "OPEN",
      patientId: this.state.patient.id,
      patientName: this.state.patient.name,
      assignedTo: "Dr Anjali Menon",
      dueAt: "Today"
    });

    this.state.dynamicIsland = {
      expanded: true,
      title: "Document Uploaded",
      subtitle: "Processing OCR · Awaiting Clinical Sign-Off",
      badge: "In Verification Queue",
      tone: "NORMAL"
    };

    this.recordAuditEvent("UPLOAD_DOCUMENT", docId, `Patient uploaded ${newDoc.title}. OCR generated candidate ${candidateId}.`);
    this.notify();
  }

  verifyOCRCandidate(candidateId) {
    const cand = this.state.ocrCandidates.find(c => c.id === candidateId);
    if (cand) {
      cand.verificationState = "VERIFIED";
      cand.verifiedBy = "Dr Anjali Menon";
      cand.verifiedAt = "Just now";

      // Mark associated document as verified
      const doc = this.state.documents.find(d => d.id === cand.documentId);
      if (doc) doc.status = "VERIFIED";

      // Promote to authoritative clinicalFacts
      const factId = "CF-" + Date.now();
      this.state.clinicalFacts.unshift({
        id: factId,
        name: cand.extractedFact,
        value: cand.extractedValue,
        verified: true,
        verifiedBy: "Dr Anjali Menon",
        source: `${doc ? doc.title : "Document"} (OCR Verified)`
      });

      // Update task
      const task = this.state.tasks.find(t => t.type === "OCR_VERIFICATION" && t.status === "OPEN");
      if (task) task.status = "RESOLVED";

      this.state.dynamicIsland = {
        expanded: true,
        title: "Clinical Fact Verified",
        subtitle: `${cand.extractedFact}: ${cand.extractedValue}`,
        badge: "Staging / NEXUS Ready",
        tone: "SUCCESS"
      };

      this.recordAuditEvent("VERIFY_OCR_FACT", candidateId, `Dr Anjali Menon verified OCR candidate ${cand.extractedFact}. Promoted to authoritative episode clinical facts.`);
      this.notify();
    }
  }

  // --------------------------------------------------------
  // ACTION 09: NEXUS CLINICAL REASONING (DEMO FLOW E)
  // --------------------------------------------------------
  runNexusScenario() {
    // Check if Run 2 already exists
    const hasRun2 = this.state.nexusSnapshots.some(s => s.runId === "NEX-RUN-02");
    if (!hasRun2) {
      const run2 = {
        runId: "NEX-RUN-02",
        timestamp: "Just now",
        status: "EVIDENCE_CONFIRMED",
        guideline: "NCCN Breast Cancer Guidelines v2.2026",
        node: "Invasive Breast Cancer · Stage IIA (T2 N0 M0) · ER+/PR+, HER2- · High Ki-67",
        clinicalPicture: "52 yo postmenopausal female, 2.6cm pT2 pN0 IDC, ER+ 90%, PR+ 70%, HER2-, Ki-67 35% (Verified).",
        missingInfo: [],
        contradictions: [],
        decisionSupportOptions: [
          {
            option: "Proceed with Curative Adjuvant Dose-Dense AC-T x 6 cycles",
            evidenceLevel: "Category 1",
            condition: "Fully aligned with NCCN guidelines given confirmed high Ki-67 proliferation and 2.6cm primary tumor."
          },
          {
            option: "Sequential Adjuvant Aromatase Inhibitor (Letrozole) post-chemotherapy",
            evidenceLevel: "Category 1",
            condition: "Mandated given 90% ER positivity upon systemic therapy completion."
          }
        ]
      };
      this.state.nexusSnapshots.unshift(run2);

      this.state.dynamicIsland = {
        expanded: true,
        title: "NEXUS Re-evaluated",
        subtitle: "Decision support updated with verified Ki-67 fact",
        badge: "Run 2 Complete",
        tone: "SUCCESS"
      };

      this.recordAuditEvent("RUN_NEXUS", "NEX-RUN-02", "Dr Anjali Menon executed NEXUS Clinical Reasoning Snapshot 2 with verified evidence trace.");
      this.notify();
    }
  }

  // --------------------------------------------------------
  // ACTION 10: CONSULTATION SIGN -> PATIENT VISIT SUMMARY (DEMO FLOW F)
  // --------------------------------------------------------
  signConsultation({ assessment, planNotes, patientFriendlySummary }) {
    const encId = "ENC-" + Date.now();
    const vsId = "VS-" + Date.now();

    const signedEncounter = {
      id: encId,
      date: "Today",
      type: "Post-Cycle 3 Nadir Evaluation Consultation",
      clinician: "Dr Anjali Menon",
      status: "SIGNED",
      visitSummaryArtifactId: vsId,
      reasonForReview: "Cycle 3 Day 8 physiological nadir monitoring & toxicity review.",
      assessmentPlan: assessment || "Stage IIA IDC. Tolerating AC nadir without neutropenic sepsis. Continue hydration and supportive medicines.",
      signedAt: "Just now"
    };

    const patientVisitSummary = {
      id: vsId,
      type: "VISIT_SUMMARY",
      title: "Visit Summary · Cycle 3 Progress & Nadir Review",
      date: "Today",
      releasedBy: "Dr Anjali Menon",
      releasedAt: "Just now",
      content: {
        whatDiscussed: "Dr Anjali Menon evaluated your Day 8 progress. Your white blood cells are following the expected pattern and your body is handling Cycle 3 well.",
        currentPlan: planNotes || "Complete your rest days. Prepare for Friday pre-cycle bloodwork before Cycle 4.",
        medicinesChanged: "Prochlorperazine PRN refill authorized for backup nausea.",
        testsOrdered: "Pre-Cycle 4 CBC & Comprehensive Metabolic Panel on Friday at 9:30 AM.",
        precautions: "Maintain at least 2.5 Liters of water daily. Call emergency care immediately if temperature exceeds 100.4°F.",
        nextVisit: "Friday 9:30 AM (Blood Test) & Wednesday Sep 2 (Infusion #4)"
      }
    };

    this.consultationDraft.isSigned = true;
    this.consultationDraft.signedAt = "Just now";
    this.consultationDraft.signedBy = "Dr Anjali Menon";

    this.state.encounters.unshift(signedEncounter);
    this.state.patientArtifacts.unshift(patientVisitSummary);

    this.state.dynamicIsland = {
      expanded: true,
      title: "Consultation Signed",
      subtitle: "Patient Visit Summary published to Ananya",
      badge: "Visit Summary Ready",
      tone: "SUCCESS"
    };

    this.recordAuditEvent("SIGN_CONSULTATION", encId, `Dr Anjali Menon signed consultation note. Patient Visit Summary ${vsId} released.`);
    this.notify();
  }

  // --------------------------------------------------------
  // PATIENT ACTIONS: VISIT PREP & MEDICATION
  // --------------------------------------------------------
  submitVisitPreparation({ feltScore, newSymptoms, questionsText }) {
    const prepId = "PREP-" + Date.now();
    const newPrep = {
      id: prepId,
      submittedAt: "Just now",
      feltScore,
      newSymptoms,
      questionsText: questionsText || "Inquiring about cold sensation in fingers and Friday blood test timing."
    };

    this.state.visitPreparation = newPrep;

    // Doctor tasks
    this.state.tasks.unshift({
      id: "TSK-" + Date.now(),
      type: "VISIT_PREP",
      priority: "ROUTINE",
      title: "Review Pre-Visit Questionnaire submitted by Ananya Sharma",
      status: "OPEN",
      patientId: this.state.patient.id,
      patientName: this.state.patient.name,
      assignedTo: "Dr Anjali Menon",
      dueAt: "Upcoming Consultation"
    });

    this.state.dynamicIsland = {
      expanded: true,
      title: "Visit Prep Saved",
      subtitle: "Shared with Dr Anjali Menon for your next appointment",
      badge: "Pre-Visit Ready",
      tone: "NORMAL"
    };

    this.recordAuditEvent("SUBMIT_VISIT_PREP", prepId, "Patient completed Pre-Visit Questionnaire for Dr Anjali Menon.");
    this.notify();
  }

  completeMedication(medId) {
    const med = this.state.medicines.find(m => m.id === medId);
    if (med) {
      med.todayStatus = "TAKEN";
      med.lastTakenAt = "Just now";

      this.state.dynamicIsland = {
        expanded: true,
        title: "Medication Recorded",
        subtitle: `${med.name} marked as taken`,
        badge: "Schedule Updated",
        tone: "NORMAL"
      };

      this.recordAuditEvent("TAKE_MEDICATION", medId, `Patient marked ${med.name} as taken.`);
      this.notify();
    }
  }

  sendMessage(text) {
    const isDoc = this.role === "doctor";
    const msgId = "MSG-" + Date.now();
    this.state.messages.push({
      id: msgId,
      senderRole: isDoc ? "doctor" : "patient",
      author: isDoc ? "Dr Anjali Menon" : "Ananya Sharma",
      title: isDoc ? "Treating Medical Oncologist" : "Patient",
      text,
      timestamp: "Just now"
    });

    this.recordAuditEvent("SEND_MESSAGE", msgId, `${isDoc ? "Doctor" : "Patient"} sent secure message.`);
    this.notify();
  }

  // --- Patient Actions: Appointments & Caregivers ---
  confirmAppointment(aptId) {
    const apt = this.state.appointments.find(a => a.id === aptId);
    if (apt) {
      apt.status = "CONFIRMED ✓";
      this.recordAuditEvent("CONFIRM_APPOINTMENT", aptId, `Patient confirmed attendance for ${apt.title}.`);
      this.state.dynamicIsland = {
        expanded: true,
        title: "Appointment Confirmed",
        subtitle: `${apt.title} · Friday 9:30 AM`,
        badge: "Scheduled",
        tone: "SUCCESS"
      };
      this.notify();
    }
  }

  requestChangeAppointment(aptId, reason) {
    const apt = this.state.appointments.find(a => a.id === aptId);
    if (apt) {
      apt.status = "RESCHEDULE_REQUESTED";
      this.state.tasks.unshift({
        id: "TSK-" + Date.now(),
        type: "APPOINTMENT_CHANGE",
        priority: "ROUTINE",
        title: `Reschedule Request: ${apt.title} (Ananya Sharma)`,
        status: "OPEN",
        patientId: this.state.patient.id,
        patientName: this.state.patient.name,
        assignedTo: "Care Coordinator",
        dueAt: "Today"
      });
      this.recordAuditEvent("RESCHEDULE_APPOINTMENT", aptId, `Patient requested reschedule for ${apt.title}: ${reason}`);
      this.notify();
    }
  }

  inviteCaregiver({ name, phone, relationship, scope }) {
    if (!this.state.patient.caregivers) this.state.patient.caregivers = [];
    const actualScope = scope || "Full Access (View & Manage)";
    
    // Genuine permission model based on scope
    const isLimited = actualScope.includes("View Only") || actualScope.includes("Limited");
    const permissions = {
      appointments: true,
      treatmentInstructions: true,
      medicines: true,
      treatmentRoadmap: true,
      documents: !isLimited,
      results: !isLimited,
      messages: !isLimited,
      symptomSubmission: !isLimited,
      financial: !isLimited
    };
    
    const newCg = {
      id: "CG-" + Date.now(),
      name: name || "Thomas Vance",
      phone: phone || "+91 98490 22104",
      relationship: relationship || "Spouse",
      scope: actualScope,
      permissions,
      status: "ACTIVE",
      invitedAt: "Just now",
      revokedAt: null
    };
    this.state.patient.caregivers.push(newCg);
    this.recordAuditEvent("INVITE_CAREGIVER", newCg.id, `Ananya Sharma invited caregiver ${newCg.name} (${newCg.relationship}).`);
    this.notify();
  }

  revokeCaregiver(cgId) {
    if (this.state.patient.caregivers) {
      const cg = this.state.patient.caregivers.find(c => c.id === cgId);
      if (cg) {
        cg.status = "REVOKED";
        cg.revokedAt = "Just now";
        
        // Force access-denied if currently acting as this revoked caregiver
        if (this.auth.actingAsCaregiverId === cgId) {
          this.auth.isLoggedIn = false;
          this.auth.actingAsCaregiverId = null;
          this.auth.step = "authLanding";
        }
        
        this.recordAuditEvent("REVOKE_CAREGIVER", cgId, "Ananya Sharma revoked caregiver access.");
        this.notify();
      }
    }
  }

  acknowledgeVisitSummary(vsId) {
    const vs = this.state.patientArtifacts.find(a => a.id === vsId);
    if (vs) {
      vs.acknowledgedByPatient = true;
      vs.acknowledgedAt = "Just now";
      this.recordAuditEvent("ACKNOWLEDGE_VISIT_SUMMARY", vsId, "Ananya Sharma acknowledged receipt of Visit Summary.");
      this.notify();
    }
  }

  // --- Doctor Actions: Consultation Draft & Search & Cycle ---
  updateConsultationDraft(fields) {
    this.consultationDraft = { ...this.consultationDraft, ...fields };
  }

  addConsultationAddendum(encId, addendumText) {
    const enc = this.state.encounters.find(e => e.id === encId);
    if (enc) {
      if (!enc.addenda) enc.addenda = [];
      enc.addenda.push({
        id: "ADD-" + Date.now(),
        timestamp: "Just now",
        author: "Dr Anjali Menon",
        text: addendumText
      });
      this.recordAuditEvent("ADD_ADDENDUM", encId, `Dr Anjali Menon appended addendum to consultation ${encId}.`);
      this.notify();
    }
  }

  setPatientSearchQuery(q) {
    this.patientSearchQuery = q;
    this.notify();
  }

  setCycleDecision(decision, rationale) {
    this.state.cancerEpisode.cycle4Decision = {
      decision, // 'CLEARED' | 'DEFERRED'
      rationale,
      decidedBy: "Dr Anjali Menon",
      decidedAt: "Just now"
    };
    this.recordAuditEvent("CYCLE_DECISION", "CYCLE-04", `Dr Anjali Menon recorded decision for Cycle 4: ${decision}.`);
    this.state.dynamicIsland = {
      expanded: true,
      title: decision === "CLEARED" ? "Cycle 4 Infusion Cleared" : "Cycle 4 Deferred 48h",
      subtitle: "Medical Oncology Evaluation Complete",
      badge: decision === "CLEARED" ? "Cleared" : "Held",
      tone: decision === "CLEARED" ? "SUCCESS" : "URGENT"
    };
    this.notify();
  }

  // --------------------------------------------------------
  // DEMO RESET: RESTORE COMPLETE DETERMINISTIC BASELINE
  // --------------------------------------------------------
  resetEpisode() {
    sessionStorage.removeItem("cca_episode_state_v1");
    this.state = createInitialEpisodeState();
    this.consultationDraft = {
      reason: "Cycle 3 Day 8 physiological nadir monitoring & supportive medication review.",
      hpi: "52yo female post-lumpectomy + SLNB for Stage IIA IDC (ER+ 90%, PR+ 70%, HER2-). Currently Day 8 of Cycle 3 Dose-Dense AC-T. Reports fatigue and intermittent mild nausea after meals. Afebrile at baseline.",
      examination: "ECOG Performance Status 0-1. Vitals: BP 118/74, HR 72, Temp 98.6°F, SpO2 99%. No oral stomatitis or mucositis. Surgical incision right breast well healed without erythema. Lungs clear to auscultation bilaterally.",
      assessment: "Patient is Day 8 post-AC #3. Nadir ANC 1.18 k/µL expected and afebrile. Tolerating supportive Ondansetron well. No signs of infection.",
      plan: "1. Continue strict oral hydration (minimum 2.5L/day).\n2. Refill Prochlorperazine 10mg PRN for breakthrough nausea.\n3. Pre-cycle CBC/CMP ordered for Friday 9:30 AM before Cycle 4 infusion.",
      medications: "Ondansetron 8mg bid, Dexamethasone 4mg qd, Prochlorperazine 10mg PRN q8h.",
      investigations: "Day 8 CBC reviewed: ANC 1.18 k/µL, WBC 2.4, Hgb 10.8, Plt 182.",
      followUp: "Friday Aug 28 for lab draw; Wednesday Sep 2 for Cycle 4 Day Suite infusion.",
      isSigned: false,
      signedAt: null,
      signedBy: null
    };
    this.role = "patient";
    this.currentPatientScreen = "Home";
    this.currentDoctorScreen = "Home";
    this.recordAuditEvent("RESET_EPISODE", "ALL", "Presenter reinitialized demo episode to baseline state.");
    this.notify();
  }
}

// Global Singleton Export
window.ccaEpisodeStore = new CCAEpisodeStore();
window.episodeStore = window.ccaEpisodeStore; // Backwards compatibility for existing listeners
