import type { APIRoute } from 'astro';
import { site } from '../data/site';

// Hand-written sitemap (saves adding a dependency): the pages are few and fixed.
const paths = [...site.nav.map((n) => n.href), '/privacy'];

export const GET: APIRoute = () => {
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site.url).href}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'content-type': 'application/xml' },
  });
};
