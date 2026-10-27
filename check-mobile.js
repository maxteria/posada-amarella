const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
  });
  const page = await context.newPage();
  await page.goto('http://localhost:4321/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'mobile-header-check.png', fullPage: false });
  console.log('done');
  await browser.close();
})();
