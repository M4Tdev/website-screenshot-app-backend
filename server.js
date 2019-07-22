const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const { URL } = require('url');
const path = require('path');

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

const getScreenshot = async url => {
  const browser = await puppeteer.launch({
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const validatedUrl = validateUrl(url);

  const strippedUrl = stripHTTP(validatedUrl);

  await page.goto(validatedUrl);
  await page.waitFor(1000);
  await page.screenshot({ path: `./screenshots/${strippedUrl}.png` });
  await browser.close();

  return strippedUrl;
};

app.use('/download/:fileName', (req, res) => {
  const { fileName } = req.params;

  const filePath = path.join(__dirname, 'screenshots', `${fileName}.png`);

  res.download(filePath);
});

app.use('/:url', async (req, res) => {
  const { url } = req.params;

  const decodedUrl = decodeURIComponent(url);

  const downloadName = await getScreenshot(decodedUrl);

  res.send({
    status: 'done',
    downloadUrl: `<a href="${`http://${req.headers.host}/download/${downloadName}`}">Go to Download</a>`,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
