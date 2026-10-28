import { test, expect } from '@playwright/test';
import expansion from '../../src/data/article-expansion-1000.json' with { type: 'json' };

test('all 1,000 additional guides serve their reviewed content and source links', async ({ request }) => {
  test.setTimeout(120_000);
  for (let offset = 0; offset < expansion.articles.length; offset += 12) {
    await Promise.all(expansion.articles.slice(offset, offset + 12).map(async article => {
      const response = await request.get(`/articles/${article.id}`);
      expect(response.status(), article.id).toBe(200);
      const html = await response.text();
      expect(html, article.id).toContain('id="article-title"');
      expect(html, article.id).toContain('class="reader-body"');
      expect(html, article.id).toMatch(/public[ -]domain/i);
      for (const source of article.sources) {
        expect(html, article.id).toContain(source.url.replaceAll('&', '&amp;'));
      }
      await response.dispose();
    }));
  }
});

for (const lane of ['tax', 'consumer', 'investing', 'workplace', 'medicare']) {
  test(`${lane} additions are searchable and preserve read progress`, async ({ page }) => {
    const article = expansion.articles.find(entry => entry.collection === lane)!;
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/articles');
    await expect(page.locator('.article-card:not([hidden])')).toHaveCount(12);
    await page.locator('#search-input').fill(article.title);
    const card = page.locator(`.article-card[href="/articles/${article.id}"]`);
    await expect(card).toBeVisible();
    await card.click();
    await expect(page.locator('#article-title')).toHaveText(article.title);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ff_articles_read') ?? '[]')))
      .toContain(article.id);
    await page.goto('/articles');
    await page.locator('#search-input').fill(article.title);
    await expect(card).toHaveClass(/is-read/);
    await page.locator('#unread-toggle').click();
    await expect(card).toBeHidden();
    expect(errors).toEqual([]);
  });
}

test('long tax titles and source tables fit a mobile reader with working section links', async ({ page }) => {
  const article = expansion.articles.find(entry => entry.collection === 'tax' && entry.tableCount > 0 && entry.title.length > 80)!;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/articles/${article.id}`);
  await expect(page.locator('#article-title')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const table = page.locator('.article-table-scroll').first();
  await expect(table).toHaveAttribute('tabindex', '0');
  await table.scrollIntoViewIfNeeded();
  await expect(table).toBeVisible();
  const outline = page.locator('.reader-outline-details');
  await outline.locator('summary').click();
  const link = outline.locator('a').first();
  const href = await link.getAttribute('href');
  expect(href).toBeTruthy();
  await link.click();
  await expect(page.locator(href!)).toBeVisible();
});
