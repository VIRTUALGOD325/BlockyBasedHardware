import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        page.on('pageerror', err => {
            console.log('PAGE ERROR:', err.toString());
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('CONSOLE ERROR:', msg.text());
            }
        });

        console.log('Navigating to Vercel app...');
        await page.goto('https://eduprime-hardware.vercel.app/', { waitUntil: 'networkidle0' });

        console.log('Done waiting. Check errors above.');
        await browser.close();
    } catch (e) {
        console.error('SCRIPT ERR:', e);
    }
})();
