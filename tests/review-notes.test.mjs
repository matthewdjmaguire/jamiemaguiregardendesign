import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatNotes, labelOrder } from '../src/lib/review-notes.js';

const meta = { title: 'Site', url: 'https://example.com', date: '19 Sep 2026', pageOrder: ['Home', 'About', 'Contact'] };
const e = (page, label, note, extra = {}) => ({ page, label, type: 'Heading', snippet: 'Some text', note, ...extra });

test('returns an empty string when there are no notes (blank notes are ignored)', () => {
  assert.equal(formatNotes([], meta), '');
  assert.equal(formatNotes([e('Home', '1', '   ')], meta), '');
});

test('groups by page in site order and puts each note under its number', () => {
  const out = formatNotes([e('About', '2', 'Say hello'), e('Home', '3', 'Change to Hello')], meta);
  assert.ok(out.indexOf('## Home') < out.indexOf('## About'));
  assert.match(out, /\(3\) Heading: “Some text”\n {4}→ Change to Hello/);
});

test('orders page content, then header, then footer, numerically', () => {
  assert.ok(labelOrder('2') < labelOrder('10'));
  assert.ok(labelOrder('10') < labelOrder('H1'));
  assert.ok(labelOrder('H9') < labelOrder('F1'));
  const out = formatNotes([e('Home', 'F1', 'a'), e('Home', 'H2', 'b'), e('Home', '10', 'c'), e('Home', '2', 'd')], meta);
  const order = ['(2)', '(10)', '(H2)', '(F1)'].map((s) => out.indexOf(s));
  assert.deepEqual(order, [...order].sort((x, y) => x - y));
});

test('keeps multi-line notes on one line so the list stays readable', () => {
  assert.match(formatNotes([e('Home', '1', 'line one\n\nline two')], meta), /→ line one line two/);
});
