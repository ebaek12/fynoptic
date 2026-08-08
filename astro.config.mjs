import { defineConfig } from 'astro/config';

// build.format 'file' emits about.html, not about/index.html — the default
// ('directory') would silently change every public URL on the site.
export default defineConfig({
  site: 'https://fynoptic.org',
  build: { format: 'file' },
  trailingSlash: 'never',
});
