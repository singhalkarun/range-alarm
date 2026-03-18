const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCRIPT_DIR = __dirname;
const TEMPLATE_PATH = path.join(SCRIPT_DIR, 'template.html');

const CAPTIONS = {
  '01-home-empty': 'Set Once. Wake Up Right.',
  '02-home-with-alarms': 'Manage All Your Alarms',
  '03-create-time': 'Pick Your Wake-Up Time',
  '04-create-range': 'Set Your Range',
  '05-create-sound': 'Choose Your Intensity',
  '06-create-preview': 'Preview Your Alarm Sequence',
  '07-ringing': 'Wake Up Gradually, Not Abruptly',
};

const DEVICES = [
  { dir: 'phone', cssClass: 'phone', width: 1080, height: 1920 },
  { dir: 'tablet-7', cssClass: 'tablet tablet-7', width: 1200, height: 1920 },
  { dir: 'tablet-10', cssClass: 'tablet tablet-10', width: 1200, height: 1920 },
];

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const device of DEVICES) {
    const inputDir = path.join(SCRIPT_DIR, 'screenshots', device.dir);
    const outputDir = path.join(SCRIPT_DIR, 'framed', device.dir);
    fs.mkdirSync(outputDir, { recursive: true });

    if (!fs.existsSync(inputDir)) {
      console.log(`Skipping ${device.dir}: no screenshots directory`);
      continue;
    }

    const screenshots = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));
    if (screenshots.length === 0) {
      console.log(`Skipping ${device.dir}: no screenshots found`);
      continue;
    }

    console.log(`Processing ${device.dir} (${screenshots.length} screenshots)...`);

    for (const filename of screenshots) {
      const baseName = path.basename(filename, '.png');
      const caption = CAPTIONS[baseName] || baseName;
      const screenshotPath = path.join(inputDir, filename);
      const outputPath = path.join(outputDir, filename);

      const page = await browser.newPage();
      await page.setViewport({
        width: device.width,
        height: device.height,
        deviceScaleFactor: 1,
      });

      // Load the template
      await page.goto(`file://${TEMPLATE_PATH}`, { waitUntil: 'networkidle0' });

      // Inject the screenshot and caption
      const screenshotDataUrl = `data:image/png;base64,${fs.readFileSync(screenshotPath).toString('base64')}`;

      await page.evaluate(({ caption, screenshotDataUrl, cssClass }) => {
        document.getElementById('caption').textContent = caption;
        document.getElementById('screenshot').src = screenshotDataUrl;
        const frame = document.getElementById('device-frame');
        frame.className = `device-frame ${cssClass}`;
      }, { caption, screenshotDataUrl, cssClass: device.cssClass });

      // Wait for font and image to load
      await page.waitForFunction(() => {
        return document.fonts.ready.then(() => {
          const img = document.getElementById('screenshot');
          return img.complete && img.naturalWidth > 0;
        });
      }, { timeout: 10000 });

      // Take screenshot
      await page.screenshot({ path: outputPath, type: 'png' });
      await page.close();

      console.log(`  ${baseName} → ${outputPath}`);
    }
  }

  await browser.close();
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
