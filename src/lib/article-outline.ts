/** Add anchors to the trusted, build-time article fragments, preserving their prose. */
export function prepareArticle(html: string) {
  const sections: { id: string; labelHtml: string; level: number }[] = [];
  const ids = new Set(
    Array.from(html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi), (m) => m[2]),
  );
  let sequence = 0;
  const body = html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (original, level: string, attrs: string, labelHtml: string) => {
      if (!labelHtml.replace(/<[^>]*>/g, "").trim()) return original;
      const existing = attrs.match(/\bid\s*=\s*(["'])(.*?)\1/i)?.[2];
      let id = existing;
      if (!id) {
        do {
          id = `article-section-${++sequence}`;
        } while (ids.has(id));
        ids.add(id);
      }
      sections.push({ id, labelHtml, level: Number(level) });
      return existing
        ? original
        : `<h${level}${attrs} id="${id}">${labelHtml}</h${level}>`;
    },
  );
  return { body, sections };
}
