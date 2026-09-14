# CCA Cancer Care / OncoSync — Interactive Demo Prototype

A fully clickable, end-to-end interactive mobile app prototype for **CCA (Cancer Care Alliance) Single App — Doctor + Patient**.

> **One cancer episode. One authoritative state. Two role-appropriate experiences.**

---

## 🚀 Quick Start

Run a local HTTP server in this directory and open in your browser:

```bash
# Python 3 (recommended)
python3 -m http.server 4321
```

Then open: **[http://localhost:4321](http://localhost:4321)**

---

## 🏥 What Is This?

This is a **presentation-ready, fully interactive mobile prototype** built to demonstrate the OncoSync / CCA Cancer Care app concept to hospital stakeholders. It simulates an iPhone 16 Pro running the app with:

- **Doctor Mode** — Medical Oncologist (Dr. Anjali Menon, MD, DM)
- **Patient Mode** — Cancer Patient (Ananya Sharma, 52 years, Breast Cancer Stage IIA IDC)

Both roles share a **single authoritative episode state** (`EP-2026-BR-08`), so every action in Doctor Mode is immediately reflected in Patient Mode and vice versa.

---

## 📱 Screens Covered (34 total)

### Doctor Shell (D01–D17)
| ID | Screen |
|---|---|
| D01 | Home / Worklist |
| D02 | Patient Search |
| D03 | Patient / Episode Summary |
| D04 | Consultation Workspace |
| D05 | Voice Scribe |
| D06 | OCR / External Document Review |
| D07 | NEXUS Clinical Reasoning (AI CDS) |
| D08 | Staging (Interactive TNM Calculator) |
| D09 | Guideline Pathway |
| D10 | Treatment Plan |
| D11 | Treatment / Cycle Decision |
| D12 | Results Inbox |
| D13 | Patient Messages / Questions |
| D14 | MDT Deliberations |
| D15 | Clinical Timeline |
| D16 | Tasks & Alerts |
| D17 | Profile / Availability |

### Patient Shell (P01–P17)
| ID | Screen |
|---|---|
| P01 | Login / Record Link (OTP) |
| P02 | My Care Today |
| P03 | My Cancer Care |
| P04 | Appointments |
| P05 | Visit Preparation Checklist |
| P06 | Documents Upload |
| P07 | Visit Summary |
| P08 | Treatment Roadmap |
| P09 | Medicines |
| P10 | Treatment Day Guide |
| P11 | Symptoms / PROMs |
| P12 | Urgent Help |
| P13 | Results |
| P14 | Messages |
| P15 | Bills / Insurance |
| P16 | Treatment Summary / Survivorship |
| P17 | Profile / Caregiver Access |

---

## 🔄 Cross-Role Workflows

| Flow | Description |
|---|---|
| **Symptom Escalation** | Patient reports 100.6°F fever → Doctor alert → Care directive → Patient receives update |
| **Result Release** | Doctor reviews CBC → Adds interpretation → Releases → Patient results unlocked |
| **Consultation Signing** | Doctor signs consultation note → Freezes → Patient visit summary generated |
| **Treatment Plan Versioning** | Doctor creates v2 plan → v1 superseded → Patient roadmap updated |
| **Clinical Safety Gate** | Penicillin allergy banner enforced across all Doctor write screens |

---

## 🎨 Design System

- **Theme**: Radiant Bright Mode — Apple iOS-inspired clean clinical light theme
- **Typography**: SF Pro Text / Inter / System font stack
- **Color Palette**: Clinical blue (`#0284c7`), Deep slate text (`#0f172a`), White surfaces
- **Frame**: Apple iPhone 16 Pro — Natural Silver / White Titanium bezel
- **Spacing**: 8-point grid system
- **Interactive elements**: 44px minimum touch targets (Apple HIG compliant)

---

## 🗂 Project Structure

```
APP prototype/
├── index.html              # Main entry point
├── css/
│   ├── figma-canvas.css    # Presentation studio & outer canvas
│   ├── iphone-frame.css    # Simulated iPhone 16 Pro hardware
│   └── app.css             # Mobile component design system
├── js/
│   ├── state.js            # Single authoritative CCAEpisodeStore
│   └── app.js              # All 34 screen renderers + navigation
├── build_app.py            # Source-of-truth template builder
└── run_regression_suite.mjs # Automated test harness (Node.js + CDP)
```

---

## 🧪 Running Tests

Requires Node.js 20+ and Chrome installed:

```bash
# Start the server first
python3 -m http.server 4321

# In another terminal
node run_regression_suite.mjs
```

All 34 screens should report **PASS**.

---

## 👤 Clinical Personas

| Role | Name | Details |
|---|---|---|
| **Patient** | Ananya Sharma | 52 years · Breast Cancer Stage IIA IDC · Adjuvant AC-T · Cycle 3 of 6 |
| **Doctor** | Dr. Anjali Menon, MD, DM | Medical Oncologist · CCA Cancer Centre |
| **Nurse Navigator** | Priya Rao | Care coordinator |

---

## ⚠️ Disclaimer

This is a **PROTOTYPE / DEMO BUILD only**, not a production clinical system. All data is **synthetic** and for demonstration purposes exclusively. No real patient health data is used or stored.

---

*Built with HTML, CSS, and vanilla JavaScript. No framework dependencies.*
