// @vitest-environment jsdom

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ARTICLE_META } from '../../src/data/articles';
import expansion from '../../src/data/article-expansion.json';
import { prepareArticle } from '../../src/lib/article-outline';
import { computeReadMins, deriveBlurb } from '../../src/lib/article-summary';

const directory = resolve('src/articles');
const bodyFor = (id: string) => readFileSync(`${directory}/${id}.html`, 'utf8');
const normalizedTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, '');
const fragmentFor = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
};

describe('article catalog integrity', () => {
  it('has a one-to-one relationship between routes and article bodies', () => {
    const ids = ARTICLE_META.map(article => article.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(id => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))).toBe(true);
    expect(ARTICLE_META.every(article => article.title.trim().length > 0)).toBe(true);
    expect(readdirSync(directory).filter(file => file.endsWith('.html')).sort())
      .toEqual(ids.map(id => `${id}.html`).sort());
  });

  it('registers exactly 200 additions without reusing an existing title or body', () => {
    expect(expansion.articles).toHaveLength(200);
    const addedIds = new Set(expansion.articles.map(article => article.id));
    expect(addedIds.size).toBe(200);
    const titles = new Set(ARTICLE_META.filter(article => !addedIds.has(article.id))
      .map(article => normalizedTitle(article.title)));
    const fingerprints = new Set<string>();
    for (const article of expansion.articles) {
      expect(ARTICLE_META.find(meta => meta.id === article.id)).toEqual({ id: article.id, title: article.title });
      const title = normalizedTitle(article.title);
      expect(titles.has(title), article.id).toBe(false);
      titles.add(title);
      const text = fragmentFor(bodyFor(article.id)).textContent!.replace(/\s+/g, ' ').trim();
      const fingerprint = createHash('sha256').update(text).digest('hex');
      expect(fingerprints.has(fingerprint), article.id).toBe(false);
      fingerprints.add(fingerprint);
    }
  });

  it('keeps new guides substantial, attributed, and safe to render as HTML', () => {
    for (const article of expansion.articles) {
      const html = bodyFor(article.id);
      const fragment = fragmentFor(html);
      const words = fragment.textContent!.trim().split(/\s+/).length;
      expect(words, article.id).toBeGreaterThanOrEqual(900);
      expect(words, article.id).toBeLessThanOrEqual(4500);
      expect(fragment.querySelector('p')?.textContent?.trim().length, article.id).toBeGreaterThan(40);
      expect(deriveBlurb(html).length, article.id).toBeGreaterThan(40);
      expect(computeReadMins(html), article.id).toBeGreaterThanOrEqual(4);
      expect(fragment.querySelector('script,style,iframe,object,embed,form,input,button,img,h1'), article.id).toBeNull();
      expect(html, article.id).not.toMatch(/\b(?:TODO|FIXME|lorem ipsum)\b/i);
      for (const element of fragment.querySelectorAll('*')) {
        for (const attribute of element.attributes) {
          expect(attribute.name, article.id).not.toMatch(/^on|^style$|^srcdoc$/i);
        }
      }
      const links = [...fragment.querySelectorAll('a')];
      for (const link of links) {
        expect(link.textContent?.trim().length, article.id).toBeGreaterThan(0);
        expect(link.getAttribute('href'), article.id).toMatch(/^(https?:\/\/|mailto:|tel:|\/articles\/)/);
      }
      expect(article.sources.length, article.id).toBeGreaterThan(0);
      for (const source of article.sources) {
        expect(new URL(source.url).hostname).toMatch(/\.gov$/);
        expect(links.some(link => link.getAttribute('href') === source.url), article.id).toBe(true);
      }
      expect(fragment.textContent, article.id).toContain('public domain');
      const prepared = prepareArticle(html);
      expect(prepared.sections.length, article.id).toBeGreaterThanOrEqual(2);
      expect(new Set(prepared.sections.map(section => section.id)).size, article.id)
        .toBe(prepared.sections.length);
      const rendered = fragmentFor(prepared.body);
      for (const section of prepared.sections) {
        expect(rendered.getElementById(section.id), article.id).not.toBeNull();
      }
    }
  });

  it('keeps comparison table headers aligned with the values below them', () => {
    const fragment = fragmentFor(bodyFor('brokered-cds-deposit-insurance-liquidity-and-call-risk'));
    const rows = [...fragment.querySelectorAll('table tr')];
    expect(rows).toHaveLength(7);
    expect(rows.every(row => row.children.length === 3)).toBe(true);
    expect(rows[0]?.children[1]?.textContent).toBe('Simple Interest');
    expect(rows[0]?.children[2]?.textContent).toBe('Compound Interest');
    expect(rows[6]?.children[2]?.textContent).toBe('$1276.28');
  });
});
