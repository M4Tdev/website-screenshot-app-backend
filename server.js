const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

const getScreenshot = async url => {
  const browser = await puppeteer.launch({ defaultViewport: { width: 1920, height: 1080 } });

  const page = await browser.newPage();
  await page.goto(`http://${url}`);
  await page.waitFor(1000);
  await page.screenshot({ path: `./screenshots/${url}.png` });
};

app.use('/:url', async (req, res) => {
  const { url } = req.params;

  await getScreenshot(url);

  res.download(`./screenshots/${url}.png`);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
