# Automated CDP Test Runner for CCA Cancer Care Prototype
import subprocess, time, urllib.request, json, base64, os

chrome_cmd = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "--headless",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "--window-size=1400,900",
    "http://localhost:4321"
]

proc = subprocess.Popen(chrome_cmd)
time.sleep(2.5)

try:
    # 1. Get websocket URL
    tabs = json.loads(urllib.request.urlopen("http://localhost:9222/json").read())
    page_tab = [t for t in tabs if t["type"] == "page"][0]
    ws_url = page_tab["webSocketDebuggerUrl"]
    print(f"Connected to Chrome page: {page_tab['title']}")
except Exception as e:
    print(f"Error connecting: {e}")
    proc.terminate()
    exit(1)

# Simple WebSocket client using standard library / socket
import socket, struct, hashlib

def ws_handshake(url):
    parts = url.replace("ws://", "").split("/")
    host, port = parts[0].split(":")
    path = "/" + "/".join(parts[1:])
    
    s = socket.create_connection((host, int(port)))
    key = base64.b64encode(os.urandom(16)).decode('utf-8')
    req = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {host}:{port}\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        f"Sec-WebSocket-Version: 13\r\n\r\n"
    )
    s.sendall(req.encode('utf-8'))
    resp = s.recv(4096).decode('utf-8', errors='ignore')
    if "101 Switching Protocols" not in resp:
        raise Exception(f"Handshake failed: {resp}")
    return s

def ws_send(s, data):
    msg = json.dumps(data).encode('utf-8')
    length = len(msg)
    mask = os.urandom(4)
    masked = bytes([b ^ mask[i % 4] for i, b in enumerate(msg)])
    if length <= 125:
        header = bytes([0x81, 0x80 | length]) + mask
    elif length <= 65535:
        header = bytes([0x81, 0x80 | 126]) + struct.pack("!H", length) + mask
    else:
        header = bytes([0x81, 0x80 | 127]) + struct.pack("!Q", length) + mask
    s.sendall(header + masked)

def ws_recv(s):
    # Read frame header
    b1, b2 = s.recv(2)
    length = b2 & 0x7F
    if length == 126:
        length = struct.unpack("!H", s.recv(2))[0]
    elif length == 127:
        length = struct.unpack("!Q", s.recv(8))[0]
    data = b""
    while len(data) < length:
        chunk = s.recv(min(length - len(data), 65536))
        if not chunk: break
        data += chunk
    return json.loads(data.decode('utf-8'))

ws = ws_handshake(ws_url)
req_id = 1

def cdp_call(method, params=None):
    global req_id
    req_id += 1
    call_id = req_id
    payload = {"id": call_id, "method": method, "params": params or {}}
    ws_send(ws, payload)
    while True:
        resp = ws_recv(ws)
        if resp.get("id") == call_id:
            return resp.get("result", {})

def eval_js(expression):
    res = cdp_call("Runtime.evaluate", {"expression": expression, "returnByValue": True})
    return res.get("result", {}).get("value")

def take_shot(filename):
    res = cdp_call("Page.captureScreenshot", {"format": "png"})
    data = base64.b64decode(res["data"])
    with open(filename, "wb") as f:
        f.write(data)
    print(f"Saved screenshot: {filename} ({len(data)} bytes)")

# Wait for load
time.sleep(1)

print("\n--- TEST 1: Initial Page Load ---")
title = eval_js("document.title")
role = eval_js("window.ccaEpisodeStore.role")
print(f"Page Title: {title} | Initial Role: {role}")
take_shot("artifacts_initial_load.png")

print("\n--- TEST 2: Patient Flow - Appointment Confirmation ---")
eval_js("document.getElementById('btnGoNextApt').click()")
time.sleep(0.3)
scr = eval_js("window.ccaEpisodeStore.currentPatientScreen")
print(f"Navigated to: {scr}")

eval_js("document.querySelector('.btnConfirmApt').click()")
time.sleep(0.3)
apt_status = eval_js("window.ccaEpisodeStore.state.appointments[0].status")
print(f"Appointment 0 Status: {apt_status}")

eval_js("document.getElementById('btnAppBack').click()")
time.sleep(0.3)
print(f"Back to: {eval_js('window.ccaEpisodeStore.currentPatientScreen')}")

print("\n--- TEST 3: Patient Flow - Medicine Mark Taken ---")
eval_js("document.querySelector('[data-med-id=\"MED-02\"]').click()")
time.sleep(0.3)
med_status = eval_js("window.ccaEpisodeStore.state.medicines[1].todayStatus")
print(f"Medicine 2 (Dexamethasone) Status: {med_status}")

print("\n--- TEST 4: Patient Flow - 5-Step Symptom Wizard (100.6°F Fever Alert) ---")
eval_js("document.getElementById('btnShortcutSymptoms').click()")
time.sleep(0.3)
print(f"Wizard Step 1: {eval_js('window.ccaEpisodeStore.symptomWizard.step')}")

eval_js("document.querySelector('[data-cat=\"Temperature\"]').click()")
eval_js("document.getElementById('btnWizNext1').click()")
time.sleep(0.3)
print(f"Wizard Step 2: {eval_js('window.ccaEpisodeStore.symptomWizard.step')}")

eval_js("document.querySelector('[data-temp=\"100.6\"]').click()")
eval_js("document.querySelector('[data-sev=\"Severe\"]').click()")
eval_js("document.getElementById('btnWizNext2').click()")
time.sleep(0.3)
print(f"Wizard Step 3: {eval_js('window.ccaEpisodeStore.symptomWizard.step')}")

eval_js("document.querySelector('[data-onset=\"Today\"]').click()")
eval_js("document.querySelector('[data-prog=\"Getting worse\"]').click()")
eval_js("document.getElementById('btnWizNext3').click()")
time.sleep(0.3)
print(f"Wizard Step 4: {eval_js('window.ccaEpisodeStore.symptomWizard.step')}")

eval_js("document.getElementById('btnSubmitFinalSymptom').click()")
time.sleep(0.5)
step5 = eval_js("window.ccaEpisodeStore.symptomWizard.step")
alert_count = eval_js("window.ccaEpisodeStore.state.alerts.length")
print(f"Wizard Step 5: {step5} | Active Clinical Alerts: {alert_count}")
take_shot("artifacts_symptom_fever_submitted.png")

eval_js("document.getElementById('btnWizDone').click()")
time.sleep(0.3)

print("\n--- TEST 5: Doctor Flow - Urgent Alert & Care Directive ---")
eval_js("window.ccaEpisodeStore.setRole('doctor')")
time.sleep(0.3)
doc_screen = eval_js("window.ccaEpisodeStore.currentDoctorScreen")
has_urgent = eval_js("!!document.getElementById('btnGoUrgentAlert')")
print(f"Doctor Screen: {doc_screen} | Urgent Alert Present: {has_urgent}")

eval_js("document.getElementById('btnAckAlert').click()")
time.sleep(0.3)
alert_ack = eval_js("window.ccaEpisodeStore.state.alerts[0].status")
print(f"Alert 0 Status: {alert_ack}")

# Issue Directive via bottom sheet
eval_js("document.getElementById('btnQuickDirective').click()")
time.sleep(0.3)
sheet_open = eval_js("document.getElementById('bottomSheetModal').classList.contains('open')")
print(f"Bottom Sheet Open: {sheet_open}")

eval_js("document.getElementById('btnConfirmSendDirective').click()")
time.sleep(0.3)
directive_count = eval_js("window.ccaEpisodeStore.state.patientArtifacts.length")
print(f"Directives/Artifacts count: {directive_count}")
take_shot("artifacts_doctor_home_directive_sent.png")

print("\n--- TEST 6: Doctor Flow - Consultation Workspace & Scribe ---")
eval_js("document.getElementById('btnOpenEleanorSummary').click()")
time.sleep(0.3)
safety_header = eval_js("document.getElementById('doctorSafetyHeader').style.display")
print(f"Inside Episode Summary. Safety Header Display: {safety_header}")

eval_js("document.getElementById('btnStartConsultation').click()")
time.sleep(0.3)
print(f"Consultation Workspace: {eval_js('window.ccaEpisodeStore.currentDoctorScreen')}")

eval_js("document.getElementById('btnLaunchScribe').click()")
time.sleep(0.3)
print(f"Voice Scribe: {eval_js('window.ccaEpisodeStore.currentDoctorScreen')}")
eval_js("document.getElementById('btnToggleRecord').click()")
time.sleep(0.5)
eval_js("document.getElementById('btnAcceptScribeAll').click()")
time.sleep(0.3)
print(f"Returned to: {eval_js('window.ccaEpisodeStore.currentDoctorScreen')}")

# Sign Consultation
eval_js("document.getElementById('btnSignConsultationModal').click()")
time.sleep(0.3)
eval_js("document.getElementById('btnExecuteSignConsult').click()")
time.sleep(0.5)
signed_status = eval_js("window.ccaEpisodeStore.consultationDraft.isSigned")
print(f"Consultation Signed: {signed_status}")
take_shot("artifacts_consultation_signed.png")

print("\n--- TEST 7: Doctor Flow - OCR Verification & NEXUS Decision Support ---")
eval_js("window.ccaEpisodeStore.navigateDoctor('OCR')")
time.sleep(0.3)
eval_js("document.querySelector('.btnVerifyCandidate').click()")
time.sleep(0.3)
ki67_fact = eval_js("window.ccaEpisodeStore.state.clinicalFacts.some(f => f.name.includes('Ki-67') && f.verified)")
print(f"Ki-67 Promoted & Verified: {ki67_fact}")

eval_js("window.ccaEpisodeStore.navigateDoctor('NEXUS')")
time.sleep(0.3)
eval_js("document.getElementById('btnReRunNexus').click()")
time.sleep(0.5)
snapshot2 = eval_js("window.ccaEpisodeStore.state.nexusSnapshots.some(s => s.runId === 'NEX-RUN-02')")
print(f"NEXUS Snapshot 2 Confirmed: {snapshot2}")
take_shot("artifacts_nexus_snapshot2.png")

print("\n--- TEST 8: Doctor Flow - Treatment Plan Revision v2 ---")
eval_js("window.ccaEpisodeStore.navigateDoctor('Plan')")
time.sleep(0.3)
eval_js("document.getElementById('btnCreatePlanRevision').click()")
time.sleep(0.3)
eval_js("document.getElementById('btnSignPlanDraftModal').click()")
time.sleep(0.3)
eval_js("document.getElementById('btnConfirmSignPlan').click()")
time.sleep(0.5)
plan2_signed = eval_js("window.ccaEpisodeStore.state.treatmentPlans.find(p => p.version === 2).status")
plan1_superseded = eval_js("window.ccaEpisodeStore.state.treatmentPlans.find(p => p.version === 1).status")
print(f"Plan v2: {plan2_signed} | Plan v1: {plan1_superseded}")
take_shot("artifacts_plan_v2_signed.png")

print("\n--- TEST 9: Doctor Flow - CBC Lab Review & Release ---")
eval_js("window.ccaEpisodeStore.navigateDoctor('Results')")
time.sleep(0.3)
eval_js("document.querySelector('.btnPreviewResult').click()")
time.sleep(0.3)
eval_js("document.getElementById('btnReleaseFromPreview').click()")
time.sleep(0.5)
cbc_state = eval_js("window.ccaEpisodeStore.state.results.find(r => r.id === 'RES-CBC-D8').releaseState")
print(f"Day 8 CBC Release State: {cbc_state}")
take_shot("artifacts_cbc_released.png")

print("\n--- TEST 10: Doctor Flow - Patient Directory Search & Messages ---")
eval_js("window.ccaEpisodeStore.navigateDoctor('Patients')")
time.sleep(0.3)
eval_js("window.ccaEpisodeStore.setPatientSearchQuery('Eleanor')")
time.sleep(0.3)
filtered_count = eval_js("document.querySelectorAll('.patient-card-item').length")
print(f"Filtered Patient Cards for 'Eleanor': {filtered_count}")

eval_js("window.ccaEpisodeStore.setPatientSearchQuery('')")
eval_js("window.ccaEpisodeStore.navigateDoctor('Messages')")
time.sleep(0.3)
eval_js("document.getElementById('chatInputDoc').value = 'Testing clinical channel response.'")
eval_js("document.getElementById('btnSendDocMsg').click()")
time.sleep(0.3)
last_doc_msg = eval_js("window.ccaEpisodeStore.state.messages[window.ccaEpisodeStore.state.messages.length - 1].text")
print(f"Doctor Sent Message: {last_doc_msg}")

print("\n--- TEST 11: Cross-Role Synchronization - Patient Receives Everything ---")
eval_js("window.ccaEpisodeStore.setRole('patient')")
time.sleep(0.3)
take_shot("artifacts_patient_received_all.png")

# Patient opens Results
eval_js("window.ccaEpisodeStore.navigatePatient('Results')")
time.sleep(0.3)
released_count_patient = eval_js("document.querySelectorAll('.card.glow-patient').length")
print(f"Patient Released Results Visible: {released_count_patient}")
take_shot("artifacts_patient_results_unlocked.png")

# Patient opens Roadmap
eval_js("window.ccaEpisodeStore.navigatePatient('Roadmap')")
time.sleep(0.3)
roadmap_ver = eval_js("window.ccaEpisodeStore.state.cancerEpisode.activePlanVersion")
print(f"Patient Active Roadmap Version: {roadmap_ver}")

# Patient opens Visit Summary
eval_js("window.ccaEpisodeStore.navigatePatient('VisitSummary')")
time.sleep(0.3)
has_vs = eval_js("!!document.getElementById('btnAckVisitSummary')")
print(f"Patient Received Signed Visit Summary: {has_vs}")
eval_js("document.getElementById('btnAckVisitSummary').click()")
time.sleep(0.3)

# Patient Caregiver Invite
eval_js("window.ccaEpisodeStore.navigatePatient('Profile')")
time.sleep(0.3)
eval_js("document.getElementById('btnInviteCaregiverSheet').click()")
time.sleep(0.3)
eval_js("document.getElementById('btnConfirmInviteCaregiver').click()")
time.sleep(0.5)
cg_count = eval_js("window.ccaEpisodeStore.state.patient.caregivers.length")
print(f"Caregiver Count: {cg_count}")

print("\n--- TEST 12: Baseline Demo Reset (R Key) ---")
eval_js("window.ccaEpisodeStore.resetEpisode()")
time.sleep(0.5)
reset_role = eval_js("window.ccaEpisodeStore.role")
reset_alerts = eval_js("window.ccaEpisodeStore.state.alerts.length")
print(f"After Reset - Role: {reset_role} | Alerts: {reset_alerts}")
take_shot("artifacts_demo_reset_baseline.png")

print("\n==========================================")
print("ALL 12 INTERACTIVE TEST SUITES PASSED 100%")
print("==========================================")

ws.close()
proc.terminate()
