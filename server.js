const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const { URL } = require('url');

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
  const browser = await puppeteer.launch({ defaultViewport: { width: 1920, height: 1080 } });

  const page = await browser.newPage();

  const validatedUrl = validateUrl(url);

  const strippedUrl = stripHTTP(validatedUrl);

  await page.goto(validatedUrl);
  await page.waitFor(1000);
  await page.screenshot({ path: `./screenshots/${strippedUrl}.png` });
  await browser.close();

  return strippedUrl;
};

app.use('/:url', async (req, res) => {
  const { url } = req.params;

  const decodedUrl = decodeURIComponent(url);

  const downloadName = await getScreenshot(decodedUrl);

  res.send({ status: 'done', downloadUrl: `${req.headers.referer}screenshots/${downloadName}` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
