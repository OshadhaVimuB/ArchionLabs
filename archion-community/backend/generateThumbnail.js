const puppeteer = require("puppeteer");
const path = require("path");

async function generateThumbnail(modelUrl, outputPath) {

  const browser = await puppeteer.launch({
    headless: "new"
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: 600,
    height: 600
  });

  const viewerPath = path.resolve(__dirname, "../thumbnail-viewer.html");

  const viewerUrl = `file://${viewerPath}?model=${modelUrl}`;

  console.log("Opening viewer:", viewerUrl);

  await page.goto(viewerUrl, { waitUntil: "networkidle0" });

  await page.waitForTimeout(3000);

  await page.screenshot({
    path: outputPath
  });

  await browser.close();
}

module.exports = generateThumbnail;