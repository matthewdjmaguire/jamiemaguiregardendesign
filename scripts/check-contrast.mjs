// Checks that the colour pairings we actually use meet WCAG AA (4.5:1 for text, 3:1 for UI borders).
// Reads the hex values straight from tokens.css so the check can't drift from the design.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const c = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [foreground, background, minimum ratio, where it is used]
const pairs = [
  ['ink', 'white', 4.5, 'body text'],
  ['ink', 'paper', 4.5, 'body text on off-white'],
  ['ink', 'sage-300', 4.5, 'text on sage banner'],
  ['ink', 'sage-100', 4.5, 'text on sage wash'],
  ['muted', 'white', 4.5, 'secondary text'],
  ['muted', 'paper', 4.5, 'secondary text on off-white'],
  ['muted', 'sage-100', 4.5, 'secondary text on sage wash'],
  ['olive-700', 'white', 4.5, 'links / outline buttons'],
  ['olive-700', 'paper', 4.5, 'links on off-white'],
  ['white', 'olive-700', 4.5, 'filled button text'],
  ['white', 'olive-900', 4.5, 'button hover / dark footer text'],
  ['olive-900', 'white', 3, 'form field borders (UI component)'],
];

let failed = false;
for (const [fg, bg, min, use] of pairs) {
  const r = ratio(c[fg], c[bg]);
  const ok = r >= min;
  if (!ok) failed = true;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1 (min ${min})  ${fg} on ${bg}  ${use}`);
}
if (failed) process.exit(1);
