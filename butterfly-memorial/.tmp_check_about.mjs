import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();

await page.goto('http://localhost:5173/about', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
await page.screenshot({ path: '/Users/shanelagesse/butterfly-memorial-main/butterflies/butterfly-memorial/.tmp_about.png' });

await browser.close();
