import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForSelector('#appContent');
  
  // click enter
  await page.evaluate(() => {
    document.getElementById('btnChoosePatientAuth').click();
    document.getElementById('btnAgreeAndEnterPatient').click();
  });
  await new Promise(r => setTimeout(r, 500));

  let allDead = [];
  const patientScreensToCrawl = ['Home', 'MyCare', 'Appointments', 'Medicines', 'Results', 'Profile'];
  
  for (const scr of patientScreensToCrawl) {
    await page.evaluate(`window.ccaEpisodeStore.navigatePatient("${scr}")`);
    await new Promise(r => setTimeout(r, 500));
    
    const btns = await page.evaluate(`
      Array.from(document.querySelectorAll('#appContent button')).map(b => ({
        id: b.id || '',
        text: b.innerText.trim().substring(0, 40).replace(/\\n/g, ' '),
        className: b.className
      }))
    `);
    
    btns.forEach(b => {
      if (!b.id) {
        allDead.push({ screen: scr, text: b.text, class: b.className });
      }
    });
  }
  
  fs.writeFileSync('dead_buttons.json', JSON.stringify(allDead, null, 2));
  await browser.close();
})();
