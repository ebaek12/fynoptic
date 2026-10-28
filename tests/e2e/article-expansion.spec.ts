import { test, expect } from '@playwright/test';
import expansion from '../../src/data/article-expansion.json' with { type: 'json' };
import { ARTICLE_META } from '../../src/data/articles';

test('every added article has a working detail route and source attribution', async ({ request }) => {
  test.setTimeout(120_000);
  for (let offset = 0; offset < expansion.articles.length; offset += 8) {
    await Promise.all(expansion.articles.slice(offset, offset + 8).map(async article => {
      const response = await request.get(`/articles/${article.id}`);
      expect(response.status(), article.id).toBe(200);
      const html = await response.text();
      expect(html, article.id).toContain('id="article-title"');
      expect(html, article.id).toContain('class="reader-body"');
      expect(html, article.id).toContain('public domain');
      const source = article.sources[0];
      if (!source) throw new Error(`Missing source for ${article.id}`);
      expect(html, article.id).toContain(source.url.replaceAll('&', '&amp;'));
    }));
  }
});

test('new articles are searchable, readable, and included in unread filtering', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const article = expansion.articles[expansion.articles.length - 1];
  if (!article) throw new Error('The article expansion is empty');
  await page.goto('/articles');
  await expect(page.locator('.article-card:not([hidden])')).toHaveCount(12);
  await expect(page.locator('#result-count')).toHaveText(`${ARTICLE_META.length} results`);
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
  await expect(card).toBeVisible();
  await page.locator('#unread-toggle').click();
  await expect(card).toBeHidden();
  expect(errors).toEqual([]);
});

test('pagination can reach the entire expanded catalog without duplicate cards', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/articles');
  const visible = page.locator('.article-card:not([hidden])');
  await expect(visible).toHaveCount(12);
  for (let count = 12; count < ARTICLE_META.length; count += 12) {
    await page.locator('#load-more').click();
    await expect(visible).toHaveCount(Math.min(count + 12, ARTICLE_META.length));
  }
  await expect(page.locator('#load-more')).toBeHidden();
  const hrefs = await visible.evaluateAll(cards => cards.map(card => card.getAttribute('href')));
  expect(new Set(hrefs).size).toBe(ARTICLE_META.length);
});

test('a new guide keeps its comparison table and section links usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/articles/brokered-cds-deposit-insurance-liquidity-and-call-risk');
  await expect(page.locator('#article-title')).toBeVisible();
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits).toBe(true);
  const table = page.locator('.article-table-scroll').first();
  await expect(table).toHaveAttribute('tabindex', '0');
  await table.scrollIntoViewIfNeeded();
  await expect(table).toBeVisible();
  const outline = page.locator('.reader-outline-details');
  await expect(outline).not.toHaveAttribute('open', '');
  await outline.locator('summary').click();
  const sectionLink = outline.locator('a').first();
  const href = await sectionLink.getAttribute('href');
  if (!href) throw new Error('Missing article section anchor');
  await sectionLink.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.locator(href)).toBeVisible();
});
