import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  let errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.toString()));

  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForSelector('#appContent');

  let results = [];
  const logClick = (role, screen, element, expected, actual, mutation, dest, err, verdict) => {
    results.push(`| ${role} | ${screen} | ${element} | ${expected} | ${actual} | ${mutation} | ${dest} | ${err} | **${verdict}** |`);
  };

  const clickId = async (id) => {
     await page.evaluate((btnId) => { document.getElementById(btnId).click(); }, id);
     await new Promise(r => setTimeout(r, 400));
  };
  const clickSelector = async (sel) => {
     await page.evaluate((sel) => { document.querySelector(sel).click(); }, sel);
     await new Promise(r => setTimeout(r, 400));
  };

  try {
     // Patient Mode Login
     await clickId('btnChoosePatientAuth');
     await clickId('btnAgreeAndEnterPatient');
     
     // 1. Patient Home -> Appointments via view details
     await clickId('btnPatientHomeAptView');
     let scr = await page.evaluate(() => window.ccaEpisodeStore.currentPatientScreen);
     logClick('Patient', 'Home', 'View Appointment Details', 'Navigate to Appointments', 'Navigated to ' + scr, 'Screen state updated', 'Appointments', errors.length > 0 ? 'Yes' : 'No', scr === 'Appointments' ? 'PASS' : 'FAIL');
     errors = [];

     await clickId('btnAppBack');

     // 2. Patient MyCare -> Care Team Message
     await clickId('btnTabMyCare');
     await clickId('btnMsgDrMenon');
     scr = await page.evaluate(() => window.ccaEpisodeStore.currentPatientScreen);
     logClick('Patient', 'MyCare', 'Message Dr Menon', 'Navigate to Messages', 'Navigated to ' + scr, 'Screen state updated', 'Messages', errors.length > 0 ? 'Yes' : 'No', scr === 'Messages' ? 'PASS' : 'FAIL');
     errors = [];

     await clickId('btnAppBack');

     // 3. Appointments -> Confirm Attendance
     await clickId('btnTabAppointments');
     await clickId('btnConfirmApt_APT-1002');
     const aptStatus = await page.evaluate(() => window.ccaEpisodeStore.appointments.find(a => a.id === 'APT-1002').status);
     logClick('Patient', 'Appointments', 'Confirm Attendance', 'Status = CONFIRMED', 'Status = ' + aptStatus, 'State mutated', 'Same screen', errors.length > 0 ? 'Yes' : 'No', aptStatus === 'CONFIRMED' ? 'PASS' : 'FAIL');
     errors = [];

     // 4. Medicines -> Mark Taken
     await clickId('btnTabRoadmap');
     await clickSelector('.action-check-box'); // Click the checkbox
     const medStatus = await page.evaluate(() => window.ccaEpisodeStore.medicines[0].todayStatus);
     logClick('Patient', 'Medicines', 'Checkbox: Mark Taken', 'Status = TAKEN', 'Status = ' + medStatus, 'State mutated', 'Same screen', errors.length > 0 ? 'Yes' : 'No', medStatus === 'TAKEN' ? 'PASS' : 'FAIL');
     errors = [];

     // 5. Results -> View Report
     await clickId('btnTabResults');
     await clickId('btnAskAboutResult_RES-CBC-D8');
     scr = await page.evaluate(() => window.ccaEpisodeStore.currentPatientScreen);
     logClick('Patient', 'Results', 'Ask About Result', 'Navigate to Messages', 'Navigated to ' + scr, 'Screen state updated', 'Messages', errors.length > 0 ? 'Yes' : 'No', scr === 'Messages' ? 'PASS' : 'FAIL');
     errors = [];

  } catch(e) {
     console.error(e);
  }

  let md = "# Final Clickability Matrix\n\n";
  md += "| Role | Screen | Visible Element | Expected Behavior | Actual Result | State Mutation | Destination | Console Error? | Verdict |\n";
  md += "|---|---|---|---|---|---|---|---|---|\n";
  md += results.join('\n');
  fs.writeFileSync('FINAL_CLICKABILITY_MATRIX.md', md);

  await browser.close();
})();
