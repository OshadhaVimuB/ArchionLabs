const puppeteer = require("puppeteer");
const path = require("path");

async function generateThumbnail(modelPath, outputPath) {

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({
    width: 600,
    height: 600
  });

  const viewerPath = path.resolve(__dirname, "../thumbnail-viewer.html");

  await page.goto(`file://${viewerPath}?model=${modelPath}`);

  await page.waitForTimeout(3000);

  await page.screenshot({
    path: outputPath
  });

  await browser.close();
}

module.exports = generateThumbnail;