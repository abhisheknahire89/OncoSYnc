# convert_bright_mode.py
import re

# ========================================================
# 1. UPDATE css/iphone-frame.css FOR BRIGHT / SILVER TITANIUM
# ========================================================
iphone_css_file = "/Users/abhishekpravinnahire/Desktop/APP prototype/css/iphone-frame.css"
with open(iphone_css_file, "r") as f:
    iphone_css = f.read()

# Make status bar dark text by default
iphone_css = re.sub(
    r'\.ios-status-bar\s*\{[^}]*color:\s*#ffffff;',
    '.ios-status-bar {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 50px;\n  padding: 12px 28px 0 28px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  z-index: 80;\n  pointer-events: none;\n  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;\n  color: #0f172a;',
    iphone_css
)

# Refine iPhone chassis to a gorgeous White Titanium / Natural Silver
old_chassis = """  background: linear-gradient(145deg, #71706b 0%, #3e3d39 25%, #8a8883 50%, #2f2e2b 75%, #595854 100%);
  padding: var(--phone-bezel);
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.2) inset,
    0 0 0 2px rgba(0, 0, 0, 0.6),
    0 25px 60px -15px rgba(0, 0, 0, 0.8),
    0 40px 100px -20px rgba(0, 0, 0, 0.7);"""

new_chassis = """  background: linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 25%, #f1f5f9 50%, #94a3b8 75%, #cbd5e1 100%);
  padding: var(--phone-bezel);
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.9) inset,
    0 0 0 2px rgba(148, 163, 184, 0.4),
    0 25px 60px -15px rgba(15, 23, 42, 0.18),
    0 40px 90px -20px rgba(15, 23, 42, 0.14);"""

if old_chassis in iphone_css:
    iphone_css = iphone_css.replace(old_chassis, new_chassis)

with open(iphone_css_file, "w") as f:
    f.write(iphone_css)
print("✓ Updated css/iphone-frame.css for bright mode")

# ========================================================
# 2. UPDATE css/figma-canvas.css FOR BRIGHT MODE STUDIO
# ========================================================
figma_css_file = "/Users/abhishekpravinnahire/Desktop/APP prototype/css/figma-canvas.css"
with open(figma_css_file, "r") as f:
    figma_css = f.read()

# Replace root variables
old_figma_root = """:root {
  --figma-bg: #131518;
  --figma-bar-bg: #1e2126;
  --figma-border: #2e333b;
  --figma-text-primary: #ffffff;
  --figma-text-secondary: #9aa2ad;
  --figma-blue: #0ea5e9;
  --figma-blue-glow: rgba(14, 165, 233, 0.4);
  --figma-hover: #292d35;
  --figma-active: #323843;
  --cca-navy: #0b1528;
  --cca-teal: #0ea5e9;
}"""

new_figma_root = """:root {
  --figma-bg: #e2e8f0;
  --figma-bar-bg: #ffffff;
  --figma-border: #cbd5e1;
  --figma-text-primary: #0f172a;
  --figma-text-secondary: #475569;
  --figma-blue: #0284c7;
  --figma-blue-glow: rgba(2, 132, 199, 0.25);
  --figma-hover: #f1f5f9;
  --figma-active: #e2e8f0;
  --cca-navy: #0f172a;
  --cca-teal: #0284c7;
}"""

if old_figma_root in figma_css:
    figma_css = figma_css.replace(old_figma_root, new_figma_root)

# Replace stage background
figma_css = figma_css.replace(
    "radial-gradient(circle at 45% 40%, #1c222b 0%, #101216 100%)",
    "radial-gradient(circle at 45% 40%, #f1f5f9 0%, #e2e8f0 100%)"
)
figma_css = figma_css.replace(
    "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
    "linear-gradient(rgba(15, 23, 42, 0.04) 1px, transparent 1px)"
)
figma_css = figma_css.replace(
    "linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
    "linear-gradient(90deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px)"
)

# Toolbar box shadow & background
figma_css = figma_css.replace(
    "box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);",
    "box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);"
)

# Role switcher background
figma_css = figma_css.replace(
    "background: #121417;",
    "background: #f1f5f9;"
)

# Figma buttons
figma_css = figma_css.replace(
    "background: #252930;",
    "background: #ffffff;"
)
figma_css = figma_css.replace(
    "color: #e2e8f0;",
    "color: #1e293b;"
)
figma_css = figma_css.replace(
    "background: #2e333c;\n  color: #ffffff;",
    "background: #f8fafc;\n  color: #0f172a;"
)

# Presenter panel styling
figma_css = figma_css.replace(
    "background: rgba(22, 25, 30, 0.94);",
    "background: rgba(255, 255, 255, 0.98);"
)
figma_css = figma_css.replace(
    "border: 1px solid rgba(255, 255, 255, 0.1);",
    "border: 1px solid #cbd5e1;"
)
figma_css = figma_css.replace(
    "box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);",
    "box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);"
)
figma_css = figma_css.replace(
    "background: #191c21;",
    "background: #ffffff;"
)
figma_css = figma_css.replace(
    "background: #1e2229;",
    "background: #f8fafc;"
)
figma_css = figma_css.replace(
    "border: 1px solid #2d333e;",
    "border: 1px solid #e2e8f0;"
)
figma_css = figma_css.replace(
    "background: #252a33;",
    "background: #f1f5f9;"
)

with open(figma_css_file, "w") as f:
    f.write(figma_css)
print("✓ Updated css/figma-canvas.css for bright mode")

# ========================================================
# 3. UPDATE css/app.css FOR BRIGHT CLINICAL THEME
# ========================================================
app_css_file = "/Users/abhishekpravinnahire/Desktop/APP prototype/css/app.css"
with open(app_css_file, "r") as f:
    app_css = f.read()

# Replace root variables
old_app_vars = """  /* Surface System — Deep, Calm, Low-Glare Dark Mode */
  --cca-bg-dark: #070c17;
  --cca-surface-card: rgba(16, 25, 44, 0.85);
  --cca-surface-elevated: rgba(23, 35, 60, 0.85);
  --cca-surface-hover: rgba(30, 46, 78, 0.95);
  --cca-surface-active: rgba(255, 255, 255, 0.08);
  --cca-surface-input: rgba(4, 8, 17, 0.55);

  /* Separators & Subtle Borders (No loud neon outlines) */
  --cca-card-border: rgba(255, 255, 255, 0.07);
  --cca-border-separator: rgba(255, 255, 255, 0.06);
  --cca-border-subtle: rgba(255, 255, 255, 0.09);
  --cca-border-focus: rgba(14, 165, 233, 0.5);

  /* Typography Colors */
  --cca-text-primary: #ffffff;
  --cca-text-secondary: #94a3b8;
  --cca-text-muted: #64748b;"""

new_app_vars = """  /* Surface System — Radiant, Crisp, Clinical Bright Mode */
  --cca-bg-dark: #f8fafc;
  --cca-surface-card: #ffffff;
  --cca-surface-elevated: #ffffff;
  --cca-surface-hover: #f1f5f9;
  --cca-surface-active: #e2e8f0;
  --cca-surface-input: #ffffff;

  /* Separators & Subtle Borders */
  --cca-card-border: rgba(15, 23, 42, 0.09);
  --cca-border-separator: rgba(15, 23, 42, 0.06);
  --cca-border-subtle: rgba(15, 23, 42, 0.1);
  --cca-border-focus: #0284c7;

  /* Typography Colors */
  --cca-text-primary: #0f172a;
  --cca-text-secondary: #475569;
  --cca-text-muted: #64748b;"""

if old_app_vars in app_css:
    app_css = app_css.replace(old_app_vars, new_app_vars)

# App Container & Header
app_css = app_css.replace(
    "background: rgba(7, 12, 23, 0.95);",
    "background: rgba(255, 255, 255, 0.95);"
)
app_css = app_css.replace(
    "color: #ffffff;\n  display: flex;\n  align-items: center;\n  gap: 6px;",
    "color: #0f172a;\n  display: flex;\n  align-items: center;\n  gap: 6px;"
)
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.05);\n  border: 1px solid var(--cca-card-border);",
    "background: #f1f5f9;\n  border: 1px solid var(--cca-card-border);"
)

# Doctor Persistent Safety Header & Subnav
app_css = app_css.replace(
    "background: rgba(13, 20, 36, 0.98);",
    "background: #f8fafc;"
)
app_css = app_css.replace(
    "background: rgba(10, 15, 28, 0.94);",
    "background: #ffffff;"
)
app_css = app_css.replace(
    "border-bottom: 1px solid rgba(255, 255, 255, 0.07);",
    "border-bottom: 1px solid #e2e8f0;"
)
app_css = app_css.replace(
    "border-bottom: 1px solid rgba(255, 255, 255, 0.05);",
    "border-bottom: 1px solid #e2e8f0;"
)
app_css = app_css.replace(
    "color: #fff;\n  font-weight: 600;\n}",
    "color: #0f172a;\n  font-weight: 600;\n}"
)
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.04);\n  border: 1px solid rgba(255, 255, 255, 0.07);",
    "background: #f1f5f9;\n  border: 1px solid #e2e8f0;"
)
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.08);\n  color: #fff;",
    "background: #e2e8f0;\n  color: #0f172a;"
)

# Cards & surfaces
app_css = app_css.replace(
    "border-color: rgba(255, 255, 255, 0.12);",
    "border-color: rgba(15, 23, 42, 0.16);"
)
app_css = app_css.replace(
    "background: rgba(18, 28, 48, 0.88);\n  border-color: rgba(14, 165, 233, 0.18);\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);",
    "background: #ffffff;\n  border-color: rgba(2, 132, 199, 0.25);\n  box-shadow: 0 4px 16px rgba(2, 132, 199, 0.08);"
)
app_css = app_css.replace(
    "background: rgba(20, 26, 48, 0.88);\n  border-color: rgba(99, 102, 241, 0.18);\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);",
    "background: #ffffff;\n  border-color: rgba(79, 70, 229, 0.25);\n  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.08);"
)
app_css = app_css.replace(
    "background: linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(18, 25, 42, 0.95) 100%);\n  border: 1px solid rgba(244, 63, 94, 0.28);",
    "background: #fff1f2;\n  border: 1px solid #fecdd3;"
)
app_css = app_css.replace(
    "font-size: 15px;\n  font-weight: 650;\n  color: #ffffff;",
    "font-size: 15px;\n  font-weight: 650;\n  color: #0f172a;"
)
app_css = app_css.replace(
    "background: linear-gradient(135deg, rgba(2, 132, 199, 0.18) 0%, rgba(15, 23, 42, 0.95) 100%);\n  border: 1px solid rgba(14, 165, 233, 0.25);",
    "background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);\n  border: 1px solid #bae6fd;"
)
app_css = app_css.replace(
    "font-size: 18px;\n  font-weight: 700;\n  color: #ffffff;\n  margin-bottom: 6px;",
    "font-size: 18px;\n  font-weight: 700;\n  color: #0c4a6e;\n  margin-bottom: 6px;"
)
app_css = app_css.replace(
    "color: #cbd5e1;\n  display: flex;\n  align-items: center;\n  gap: var(--space-2);\n  margin-bottom: var(--space-3);",
    "color: #0369a1;\n  display: flex;\n  align-items: center;\n  gap: var(--space-2);\n  margin-bottom: var(--space-3);"
)

# Secondary Buttons
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.06);\n  color: #e2e8f0;\n  border: 1px solid rgba(255, 255, 255, 0.08);",
    "background: #ffffff;\n  color: #0f172a;\n  border: 1px solid #cbd5e1;"
)
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.1);\n  border-color: rgba(255, 255, 255, 0.15);",
    "background: #f8fafc;\n  border-color: #94a3b8;"
)
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.12);",
    "background: #f1f5f9;"
)

# Action item
app_css = app_css.replace(
    "background: rgba(18, 27, 45, 0.7);",
    "background: #ffffff;"
)
app_css = app_css.replace(
    "background: rgba(26, 40, 68, 0.85);",
    "background: #f8fafc;"
)
app_css = app_css.replace(
    "background: rgba(16, 185, 129, 0.05);\n  border-color: rgba(16, 185, 129, 0.18);",
    "background: #f0fdf4;\n  border-color: #bbf7d0;"
)
app_css = app_css.replace(
    "border: 2px solid rgba(255, 255, 255, 0.28);",
    "border: 2px solid #cbd5e1;"
)
app_css = app_css.replace(
    "font-size: 15px;\n  font-weight: 600;\n  color: #ffffff;\n  line-height: 1.3;",
    "font-size: 15px;\n  font-weight: 600;\n  color: #0f172a;\n  line-height: 1.3;"
)
app_css = app_css.replace(
    "color: #cbd5e1;\n}",
    "color: #334155;\n}"
)

# Segmented control & choices
app_css = app_css.replace(
    "background: rgba(0, 0, 0, 0.35);\n  border: 1px solid rgba(255, 255, 255, 0.08);",
    "background: #f1f5f9;\n  border: 1px solid #e2e8f0;"
)
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.16);\n  color: #ffffff;\n  font-weight: 600;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);",
    "background: #ffffff;\n  color: #0f172a;\n  font-weight: 600;\n  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);"
)
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.04);\n  border: 1px solid rgba(255, 255, 255, 0.08);",
    "background: #ffffff;\n  border: 1px solid #e2e8f0;"
)
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.08);\n  border-color: rgba(255, 255, 255, 0.18);",
    "background: #f8fafc;\n  border-color: #cbd5e1;"
)
app_css = app_css.replace(
    "color: #ffffff;\n  font-size: 13.5px;\n  font-weight: 600;",
    "color: #0f172a;\n  font-size: 13.5px;\n  font-weight: 600;"
)
app_css = app_css.replace(
    "background: rgba(2, 132, 199, 0.18);\n  border-color: rgba(56, 189, 248, 0.4);\n  color: #38bdf8;",
    "background: #e0f2fe;\n  border-color: #0284c7;\n  color: #0369a1;"
)

# Temperature
app_css = app_css.replace(
    "background: rgba(0, 0, 0, 0.28);\n  border: 1px solid rgba(255, 255, 255, 0.07);",
    "background: #f8fafc;\n  border: 1px solid #e2e8f0;"
)
app_css = app_css.replace(
    "font-size: 32px;\n  font-weight: 800;\n  color: #ffffff;",
    "font-size: 32px;\n  font-weight: 800;\n  color: #0f172a;"
)
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.08);\n  border: 1px solid rgba(255, 255, 255, 0.12);\n  color: #ffffff;",
    "background: #ffffff;\n  border: 1px solid #cbd5e1;\n  color: #0f172a;"
)
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.05);\n  color: #cbd5e1;",
    "background: #ffffff;\n  color: #334155;"
)
app_css = app_css.replace(
    "border: 1px solid rgba(255, 255, 255, 0.08);",
    "border: 1px solid #cbd5e1;"
)

# Inputs
app_css = app_css.replace(
    "background: rgba(15, 23, 42, 0.75);\n  border: 1px solid rgba(255, 255, 255, 0.08);",
    "background: #ffffff;\n  border: 1px solid #cbd5e1;"
)
app_css = app_css.replace(
    "border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: var(--radius-md);\n  padding: 0 var(--space-3);\n  color: #ffffff;",
    "border: 1px solid #cbd5e1;\n  border-radius: var(--radius-md);\n  padding: 0 var(--space-3);\n  color: #0f172a;"
)
app_css = app_css.replace(
    "border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: var(--radius-md);\n  padding: 12px 14px;\n  color: #ffffff;",
    "border: 1px solid #cbd5e1;\n  border-radius: var(--radius-md);\n  padding: 12px 14px;\n  color: #0f172a;"
)

# Chat
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.08);\n  color: #ffffff;\n  border-radius: 18px 18px 18px 4px;",
    "background: #f1f5f9;\n  color: #0f172a;\n  border: 1px solid #e2e8f0;\n  border-radius: 18px 18px 18px 4px;"
)
app_css = app_css.replace(
    "background: rgba(15, 23, 42, 0.95);\n  border: 1px solid rgba(255, 255, 255, 0.1);",
    "background: #ffffff;\n  border: 1px solid #cbd5e1;"
)

# Tab Bar
app_css = app_css.replace(
    "background: rgba(7, 12, 23, 0.96);",
    "background: rgba(255, 255, 255, 0.95);"
)
app_css = app_css.replace(
    "border-top: 1px solid var(--cca-card-border);",
    "border-top: 1px solid #e2e8f0;"
)

# Bottom Sheet
app_css = app_css.replace(
    "background: #0e1626;\n  border-top: 1px solid rgba(255, 255, 255, 0.12);",
    "background: #ffffff;\n  border-top: 1px solid #e2e8f0;"
)
app_css = app_css.replace(
    "background: rgba(0, 0, 0, 0.72);",
    "background: rgba(15, 23, 42, 0.45);"
)
app_css = app_css.replace(
    "font-size: 16px;\n  font-weight: 700;\n  color: #ffffff;",
    "font-size: 16px;\n  font-weight: 700;\n  color: #0f172a;"
)
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.08);\n  border: none;\n  width: 32px;\n  height: 32px;\n  min-width: var(--touch-min);\n  min-height: var(--touch-min);\n  border-radius: 50%;\n  color: var(--cca-text-secondary);",
    "background: #f1f5f9;\n  border: none;\n  width: 32px;\n  height: 32px;\n  min-width: var(--touch-min);\n  min-height: var(--touch-min);\n  border-radius: 50%;\n  color: #475569;"
)
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.2);",
    "background: #cbd5e1;"
)

# Patient card & caregiver card
app_css = app_css.replace(
    "background: rgba(15, 23, 42, 0.75);\n  border: 1px solid rgba(255, 255, 255, 0.07);",
    "background: #ffffff;\n  border: 1px solid #e2e8f0;"
)
app_css = app_css.replace(
    "background: rgba(15, 23, 42, 0.7);\n  border: 1px solid rgba(255, 255, 255, 0.07);",
    "background: #ffffff;\n  border: 1px solid #e2e8f0;"
)

# Timeline
app_css = app_css.replace(
    "background: #1e293b;\n  border: 2px solid rgba(255, 255, 255, 0.25);",
    "background: #f1f5f9;\n  border: 2px solid #cbd5e1;"
)
app_css = app_css.replace(
    "font-size: 13.5px;\n  font-weight: 650;\n  color: #ffffff;",
    "font-size: 13.5px;\n  font-weight: 650;\n  color: #0f172a;"
)
app_css = app_css.replace(
    "background: rgba(255, 255, 255, 0.1);\n}",
    "background: #cbd5e1;\n}"
)

# Scribe
app_css = app_css.replace(
    "background: rgba(15, 23, 42, 0.95);\n  border: 1px solid rgba(99, 102, 241, 0.25);",
    "background: #ffffff;\n  border: 1px solid #e0e7ff;"
)
app_css = app_css.replace(
    "background: rgba(0, 0, 0, 0.35);\n  border: 1px solid rgba(255, 255, 255, 0.06);",
    "background: #f8fafc;\n  border: 1px solid #e2e8f0;"
)
app_css = app_css.replace(
    "color: #cbd5e1;\n  margin-bottom: var(--space-3);",
    "color: #1e293b;\n  margin-bottom: var(--space-3);"
)

# Status pills
app_css = app_css.replace(
    "background: rgba(16, 185, 129, 0.14);\n  color: #34d399;\n  border: 1px solid rgba(16, 185, 129, 0.28);",
    "background: #dcfce7;\n  color: #15803d;\n  border: 1px solid #bbf7d0;"
)
app_css = app_css.replace(
    "background: rgba(14, 165, 233, 0.14);\n  color: #38bdf8;\n  border: 1px solid rgba(14, 165, 233, 0.28);",
    "background: #e0f2fe;\n  color: #0369a1;\n  border: 1px solid #bae6fd;"
)
app_css = app_css.replace(
    "background: rgba(245, 158, 11, 0.14);\n  color: #fbbf24;\n  border: 1px solid rgba(245, 158, 11, 0.28);",
    "background: #fef3c7;\n  color: #92400e;\n  border: 1px solid #fde68a;"
)
app_css = app_css.replace(
    "background: rgba(244, 63, 94, 0.18);\n  color: #fda4af;\n  border: 1px solid rgba(244, 63, 94, 0.35);",
    "background: #fee2e2;\n  color: #b91c1c;\n  border: 1px solid #fca5a5;"
)
app_css = app_css.replace(
    "background: rgba(100, 116, 139, 0.18);\n  color: #94a3b8;\n  border: 1px solid rgba(100, 116, 139, 0.25);",
    "background: #f1f5f9;\n  color: #475569;\n  border: 1px solid #cbd5e1;"
)

with open(app_css_file, "w") as f:
    f.write(app_css)
print("✓ Updated css/app.css for bright clinical theme")

# ========================================================
# 4. UPDATE build_app.py TEMPLATES FOR BRIGHT MODE
# ========================================================
build_file = "/Users/abhishekpravinnahire/Desktop/APP prototype/build_app.py"
with open(build_file, "r") as f:
    code = f.read()

# Replace inline dark styles in HTML templates
code = code.replace("color: #fff;", "color: #0f172a;")
code = code.replace("color:#fff;", "color:#0f172a;")
code = code.replace("color: #ffffff;", "color: #0f172a;")
code = code.replace("color: #cbd5e1;", "color: #334155;")
code = code.replace("color:#cbd5e1;", "color:#334155;")
code = code.replace("color: #e2e8f0;", "color: #1e293b;")
code = code.replace("color: #a5b4fc;", "color: #4338ca;")
code = code.replace("color:#a5b4fc;", "color:#4338ca;")
code = code.replace("color: #38bdf8;", "color: #0369a1;")
code = code.replace("color:#38bdf8;", "color:#0369a1;")
code = code.replace("color: #fbbf24;", "color: #b45309;")
code = code.replace("color: #fecdd3;", "color: #9f1239;")
code = code.replace("color: #fda4af;", "color: #9f1239;")
code = code.replace("color: #bae6fd;", "color: #0369a1;")
code = code.replace("background: rgba(0,0,0,0.3);", "background: #f8fafc; border: 1px solid #e2e8f0;")
code = code.replace("background: rgba(0,0,0,0.4);", "background: #f8fafc; border: 1px solid #e2e8f0;")
code = code.replace("background:rgba(0,0,0,0.3);", "background:#f8fafc; border:1px solid #e2e8f0;")
code = code.replace("background:rgba(0,0,0,0.4);", "background:#f8fafc; border:1px solid #e2e8f0;")
code = code.replace("background: rgba(0,0,0,0.28);", "background: #f8fafc; border: 1px solid #e2e8f0;")
code = code.replace("border: 1px solid rgba(255,255,255,0.05);", "border: 1px solid #e2e8f0;")
code = code.replace("border: 1px solid rgba(255,255,255,0.06);", "border: 1px solid #e2e8f0;")
code = code.replace("border: 1px solid rgba(255,255,255,0.07);", "border: 1px solid #e2e8f0;")
code = code.replace("border: 1px solid rgba(255,255,255,0.08);", "border: 1px solid #e2e8f0;")
code = code.replace("border: 1px solid rgba(255,255,255,0.1);", "border: 1px solid #cbd5e1;")
code = code.replace("border: 1px solid rgba(255,255,255,0.15);", "border: 1px solid #cbd5e1;")
code = code.replace("background: rgba(255,255,255,0.04);", "background: #f8fafc; border: 1px solid #e2e8f0;")
code = code.replace("background: rgba(14, 165, 233, 0.08);", "background: #f0f9ff; border: 1px solid #bae6fd;")
code = code.replace("background: rgba(16, 185, 129, 0.08);", "background: #f0fdf4; border: 1px solid #bbf7d0;")

# Ensure primary action buttons retain crisp white text
code = code.replace("class=\"btn-primary-action\" style=\"color: #0f172a;\"", "class=\"btn-primary-action\" style=\"color: #ffffff;\"")

with open(build_file, "w") as f:
    f.write(code)
print("✓ Updated build_app.py for bright mode templates")
