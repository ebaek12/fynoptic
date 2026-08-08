// Build-time derivation of the card metadata for the articles index.
//
// js/articles-data.js only ever carried { id, title, content } for all 327
// entries — there are no tags, dates, blurbs or read times in the source data.
// The legacy page synthesised them in the browser on every load. These two
// functions are the half of that synthesis that is derived from real content,
// so they run once at build time instead. The half that was invented outright
// (tags: ['Guides'] for everything, and a date of 2025-01-01 + array index) is
// deliberately not reproduced — see IMPLEMENTATION.md Q6.

const WORDS_PER_MINUTE = 225;
const BLURB_CHARS = 160;

function toPlainText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Estimated reading time in whole minutes, floored at 3 as the legacy page did. */
export function computeReadMins(html: string): number {
  const words = toPlainText(html).split(' ').filter(Boolean).length;
  return Math.max(3, Math.round(words / WORDS_PER_MINUTE));
}

/** First ~160 characters of body text, cut on a word boundary. */
export function deriveBlurb(html: string): string {
  const text = toPlainText(html);
  if (text.length <= BLURB_CHARS) return text;
  const cut = text.slice(0, BLURB_CHARS);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:—-]+$/, '')}…`;
}
