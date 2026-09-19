// Generates the temporary placeholder "photos" (soft sage landscapes) until Jamie's real photography arrives.
// Run: node scripts/make-placeholders.mjs   Output: src/assets/placeholders/*.svg
import { writeFileSync, mkdirSync } from 'node:fs';

const out = new URL('../src/assets/placeholders/', import.meta.url);
mkdirSync(out, { recursive: true });

// Small seeded random so the output is stable between runs.
const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const palettes = [
  ['#dfe7d2', '#a9bb98', '#5f7550', '#2f3f2a'],
  ['#ecefe4', '#c2cfb0', '#7f9670', '#3d5033'],
  ['#e3e8d6', '#b3c3a0', '#6d8460', '#34462e'],
  ['#f1efe6', '#cfd6bd', '#8a9c78', '#46583a'],
  ['#dde5d0', '#9fb28c', '#587049', '#2a3924'],
  ['#e8ece0', '#bccaa9', '#75896a', '#3a4c34'],
];

function svg(w, h, pal, seed, label) {
  const r = rng(seed);
  const [bg, mid, deep, dark] = pal;
  let shapes = '';
  // Layered "planting" blobs, back to front, darker towards the foreground.
  for (let layer = 0; layer < 3; layer++) {
    const colour = [mid, deep, dark][layer];
    for (let i = 0; i < 7; i++) {
      const cx = r() * w, cy = h * (0.45 + layer * 0.17) + r() * h * 0.12;
      const rx = w * (0.08 + r() * 0.14), ry = h * (0.05 + r() * 0.1);
      shapes += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" fill="${colour}" opacity="${(0.35 + layer * 0.2).toFixed(2)}" transform="rotate(${(r() * 40 - 20).toFixed(0)} ${cx.toFixed(0)} ${cy.toFixed(0)})"/>`;
    }
  }
  const fs = Math.round(w / 70);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="0.55" stop-color="${mid}"/><stop offset="1" stop-color="${deep}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>${shapes}
<text x="${Math.round(w * 0.025)}" y="${h - Math.round(w * 0.025)}" font-family="Helvetica, Arial, sans-serif" font-size="${fs}" fill="#ffffff" opacity="0.85" letter-spacing="2">PLACEHOLDER PHOTO</text>
</svg>
`;
}

const files = { 'hero.svg': [2400, 1350, 0, 11], 'about.svg': [2400, 900, 3, 23] };
for (let p = 1; p <= 6; p++) for (const s of ['a', 'b']) files[`project-${p}-${s}.svg`] = [1600, 1200, (p - 1) % 6, p * 7 + (s === 'a' ? 1 : 2)];

for (const [name, [w, h, pal, seed]] of Object.entries(files)) {
  writeFileSync(new URL(name, out), svg(w, h, palettes[pal], seed, 'Placeholder image'));
}
console.log(`Wrote ${Object.keys(files).length} placeholders`);
