const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const { URL } = require('url');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());

const stripHTTP = url => {
  const myUrl = new URL(url);
  return myUrl.hostname;
};

const validateUrl = url => {
  if (url.includes('http://') || url.includes('https://')) {
    return url;
  }

  return `http://${url}`;
};

const prepareFolderStructure = async (folderName, mode) => {
  // Check if screenshots folder exists, if no create it
  const screenshotsFolderPath = path.join(__dirname, 'screenshots');
  const ssFolder = await fs.existsSync(screenshotsFolderPath);
  if (!ssFolder) {
    await fs.mkdirSync(screenshotsFolderPath);
  }

  if (mode === 'fullpage') {
    // Create user directory
    await fs.mkdirSync(path.join(__dirname, 'screenshots', folderName));
  }
};

const getWebsiteHeight = async page => {
  const websiteHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  return websiteHeight;
};

const getFullPageScreenshot = async url => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const validatedUrl = validateUrl(url);

  const strippedUrl = stripHTTP(validatedUrl);

  await prepareFolderStructure(strippedUrl, 'fullpage');

  await page.goto(validatedUrl, { waitUntil: 'networkidle0' });

  const websiteHeight = await getWebsiteHeight(page);
  const dividedSections = Math.floor(websiteHeight / 1080);

  console.log(dividedSections);

  /* eslint-disable */
  for (let i = 0; i <= dividedSections; i++) {
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const scrollY = await page.evaluate(() => window.scrollY);
    const leftToScroll = scrollHeight - scrollY;
    await page.screenshot({ path: path.join(__dirname, 'screenshots', strippedUrl, `${i}-${strippedUrl}.png`) });
    if (leftToScroll < 1080) {
      await page.evaluate(() => window.scrollBy(0, leftToScroll));
    } else {
      await page.evaluate(() => window.scrollBy(0, 1080));
    }
  }
  /* eslint-enable */

  await browser.close();

  return strippedUrl;
};

const getScreenshot = async url => {
  const browser = await puppeteer.launch({
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const validatedUrl = validateUrl(url);

  const strippedUrl = stripHTTP(validatedUrl);

  await prepareFolderStructure(strippedUrl, 'header');

  await page.goto(validatedUrl, { waitUntil: 'networkidle0' });

  const screenshotPath = path.join(__dirname, 'screenshots', `${strippedUrl}.png`);

  await page.screenshot({ path: screenshotPath });
  await browser.close();

  return strippedUrl;
};

app.use('/download/:fileName', (req, res) => {
  const { fileName } = req.params;

  const filePath = path.join(__dirname, 'screenshots', `${fileName}.png`);

  res.download(filePath);
});

app.use('/url/:url', async (req, res) => {
  const { url } = req.params;
  const { mode } = req.query;

  const decodedUrl = decodeURIComponent(url);

  let downloadName;

  if (mode === 'fullpage') {
    downloadName = await getFullPageScreenshot(decodedUrl);
  }

  if (mode === 'header') {
    downloadName = await getScreenshot(decodedUrl);
  }

  res.send({
    status: 'done',
    downloadUrl: `<a href="${`http://${req.headers.host}/download/${downloadName}`}">Go to Download</a>`,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
