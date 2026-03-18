import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log('Navigating to vercel...');
    await page.goto('https://eduprime-hardware.vercel.app/', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'vercel-screenshot.png' });
    console.log('Vercel screenshot saved as vercel-screenshot.png');
  } catch (e) {
    console.error('Error on Vercel:', e.message);
  }

  try {
    console.log('Navigating to local docker...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 5000 });
    await page.screenshot({ path: 'local-screenshot.png' });
    console.log('Local screenshot saved as local-screenshot.png');
  } catch (e) {
    console.log('No local app running on 5173');
  }

  try {
    console.log('Navigating to local docker via Nginx gateway...');
    await page.goto('http://localhost/hardware/', { waitUntil: 'networkidle0', timeout: 5000 });
    await page.screenshot({ path: 'local-gateway-screenshot.png' });
    console.log('Local screenshot saved as local-gateway-screenshot.png');
  } catch (e) {
    console.log('No local gateway running on 80');
  }

  await browser.close();
})();
