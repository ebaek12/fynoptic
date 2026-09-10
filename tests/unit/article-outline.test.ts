import { describe, expect, it } from "vitest";
import { prepareArticle } from "../../src/lib/article-outline";

describe("article section outline", () => {
  it("preserves the article text and inline formatting while adding unique anchors", () => {
    const html =
      "<p>Original introduction &amp; context.</p><h3>Read <em>carefully</em></h3><p>Keep this paragraph.</p><h3>Read <em>carefully</em></h3>";
    const result = prepareArticle(html);
    expect(result.sections.map((section) => section.id)).toEqual([
      "article-section-1",
      "article-section-2",
    ]);
    expect(result.sections[0]?.labelHtml).toBe("Read <em>carefully</em>");
    expect(result.body.replace(/ id="article-section-\d+"/g, "")).toBe(html);
  });

  it("keeps existing deep links and avoids ids already in the document", () => {
    const result = prepareArticle(
      '<p id="article-section-1">Intro</p><h2 id="rights">Your rights</h2><h3>Next steps</h3>',
    );
    expect(result.sections.map((section) => section.id)).toEqual([
      "rights",
      "article-section-2",
    ]);
    expect(result.body).toContain('<h2 id="rights">Your rights</h2>');
  });

  it("does not create empty outline entries or change articles without headings", () => {
    const html = "<p>A short article.</p><h3> </h3>";
    expect(prepareArticle(html)).toEqual({ body: html, sections: [] });
  });
});
