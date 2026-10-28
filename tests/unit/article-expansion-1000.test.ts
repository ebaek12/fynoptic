// @vitest-environment jsdom
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ARTICLE_META } from '../../src/data/articles';
import expansion from '../../src/data/article-expansion-1000.json';
import { prepareArticle } from '../../src/lib/article-outline';
import { deriveBlurb } from '../../src/lib/article-summary';

const normalizeTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, '');

describe('1,000-guide expansion', () => {
  it('adds exactly 1,000 distinct entries to the existing library', () => {
    expect(expansion.articles).toHaveLength(1000);
    expect(ARTICLE_META).toHaveLength(expansion.previousArticleCount + 1000);
    const addedIds = new Set(expansion.articles.map(article => article.id));
    expect(addedIds.size).toBe(1000);
    const titles = new Set(ARTICLE_META.filter(article => !addedIds.has(article.id))
      .map(article => normalizeTitle(article.title)));
    for (const article of expansion.articles) {
      expect(ARTICLE_META.find(entry => entry.id === article.id), article.id)
        .toEqual({ id: article.id, title: article.title });
      expect(titles.has(normalizeTitle(article.title)), article.id).toBe(false);
      titles.add(normalizeTitle(article.title));
    }
  });

  it('preserves reviewed content, attribution, length, and usable reader markup', () => {
    const fingerprints = new Set<string>();
    for (const article of expansion.articles) {
      const html = readFileSync(`src/articles/${article.id}.html`, 'utf8');
      expect(createHash('sha256').update(html).digest('hex'), article.id).toBe(article.sha256);
      const template = document.createElement('template');
      template.innerHTML = html;
      const fragment = template.content;
      const text = fragment.textContent!.replace(/\s+/g, ' ').trim();
      const words = text.split(' ').length;
      expect(words, article.id).toBe(article.words);
      expect(words, article.id).toBeGreaterThanOrEqual(900);
      expect(words, article.id).toBeLessThanOrEqual(4500);
      const fingerprint = createHash('sha256').update(text).digest('hex');
      expect(fingerprints.has(fingerprint), article.id).toBe(false);
      fingerprints.add(fingerprint);
      expect(deriveBlurb(html).length, article.id).toBeGreaterThan(40);
      expect(text, article.id).toMatch(/public[ -]domain/i);
      expect(text, article.id).not.toMatch(/\ufffd|\b(?:TODO|FIXME|lorem ipsum)\b|Sidebar First Region|Editorial Category Menu Starts/i);
      expect(fragment.querySelector('script,style,iframe,object,embed,form,input,button,img,h1,ol>p,ul>p'), article.id).toBeNull();
      for (const element of fragment.querySelectorAll('*')) {
        for (const attribute of element.attributes) {
          expect(attribute.name, article.id).not.toMatch(/^on|^style$|^srcdoc$/i);
        }
      }
      const links = [...fragment.querySelectorAll('a')];
      for (const link of links) {
        expect(link.getAttribute('href'), article.id).toMatch(/^(https?:\/\/|mailto:|tel:|\/articles\/)/);
        expect(link.textContent!.trim().length, article.id).toBeGreaterThan(0);
      }
      expect(article.sources.length, article.id).toBeGreaterThan(0);
      for (const source of article.sources) {
        expect(new URL(source.url).hostname, article.id).toMatch(/\.gov$/);
        expect(links.some(link => link.getAttribute('href') === source.url), article.id).toBe(true);
      }
      for (const table of fragment.querySelectorAll('table')) {
        expect(table.closest('.article-table-scroll')?.getAttribute('tabindex'), article.id).toBe('0');
      }
      const prepared = prepareArticle(html);
      expect(prepared.sections.length, article.id).toBeGreaterThanOrEqual(2);
      expect(new Set(prepared.sections.map(section => section.id)).size, article.id).toBe(prepared.sections.length);
      template.innerHTML = prepared.body;
      for (const section of prepared.sections) {
        expect(template.content.getElementById(section.id), article.id).not.toBeNull();
      }
    }
  }, 90_000);
});
