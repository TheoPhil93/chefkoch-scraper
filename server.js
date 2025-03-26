const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/chefkoch', async (req, res) => {
  const recipeUrl = req.query.url;

  if (!recipeUrl || !recipeUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Ungültiger Link' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.goto(recipeUrl, { waitUntil: 'networkidle2' });

    const zutaten = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.ds-recipe-ingredients__list-item'));
      return rows.map((row) => {
        const menge = row.querySelector('.ds-quantity')?.textContent?.trim() || '';
        const name = row.querySelector('.ds-ingredient-name')?.textContent?.trim() || '';
        return { menge, name };
      }).filter(item => item.name);
    });

    await browser.close();

    res.json({ zutaten });
  } catch (err) {
    console.error('Scraping Error:', err);
    res.status(500).json({ error: 'Fehler beim Scraping' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
