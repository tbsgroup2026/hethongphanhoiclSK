const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function generateFlowcardPNG() {
  try {
    console.log("🚀 Launching browser...");
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set viewport to a wide size for better flowchart rendering
    await page.setViewport({
      width: 1400,
      height: 2000,
      deviceScaleFactor: 2,
    });

    const htmlPath = path.join(__dirname, "../public/flow-card-incident.html");
    const fileUrl = `file://${htmlPath.replace(/\\/g, "/")}`;

    console.log(`📄 Loading HTML from: ${fileUrl}`);
    await page.goto(fileUrl, { waitUntil: "networkidle2" });

    // Wait for content to render
    await page.waitForTimeout(2000);

    // Get the full height of the page
    const bodyHeight = await page.evaluate(() => {
      return document.documentElement.scrollHeight;
    });

    console.log(`📏 Page height: ${bodyHeight}px`);

    // Set viewport to match content
    await page.setViewport({
      width: 1400,
      height: bodyHeight,
      deviceScaleFactor: 2,
    });

    const pngPath = path.join(__dirname, "../public/flow-card-incident.png");

    console.log(`📸 Generating PNG: ${pngPath}`);
    await page.screenshot({
      path: pngPath,
      fullPage: true,
      type: "png",
    });

    console.log("✅ PNG generated successfully!");
    console.log(`📍 File saved at: ${pngPath}`);

    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error generating PNG:", error);
    process.exit(1);
  }
}

generateFlowcardPNG();
