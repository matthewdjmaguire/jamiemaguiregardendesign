import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEnquiry, singleLine } from '../src/lib/contact-validation.js';

const good = { name: 'Sam Jones', email: 'sam@example.com', message: 'I would like help with a small London garden.' };

test('accepts a valid enquiry and trims whitespace', () => {
  const r = validateEnquiry({ ...good, name: '  Sam Jones  ' });
  assert.equal(r.ok, true);
  assert.equal(r.value.name, 'Sam Jones');
});

test('rejects missing and malformed fields', () => {
  const r = validateEnquiry({ name: '', email: 'not-an-email', message: 'short' });
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), ['email', 'message', 'name']);
});

test('rejects over-long input', () => {
  assert.equal(validateEnquiry({ ...good, message: 'x'.repeat(5001) }).ok, false);
  assert.equal(validateEnquiry({ ...good, name: 'x'.repeat(101) }).ok, false);
});

test('strips line breaks so email headers cannot be injected', () => {
  assert.equal(singleLine('Sam\r\nBcc: victim@example.com'), 'Sam Bcc: victim@example.com');
  const r = validateEnquiry({ ...good, email: 'sam@example.com\r\nBcc: x@y.com' });
  assert.equal(r.ok, false);
});

test('tolerates non-string input without throwing', () => {
  assert.equal(validateEnquiry({ name: 5, email: null, message: {} }).ok, false);
  assert.equal(validateEnquiry(undefined).ok, false);
});
