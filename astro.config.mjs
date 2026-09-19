// @ts-check
import { defineConfig } from 'astro/config';

// Static output: pages are built once and served from the CDN (content delivery network).
export default defineConfig({
  site: 'https://jamiemaguiregardendesign.com',
  trailingSlash: 'never',
});
