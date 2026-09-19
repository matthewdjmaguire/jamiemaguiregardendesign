import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../api/contact.ts';

const valid = { name: 'Sam Jones', email: 'sam@example.com', message: 'I would like help with a small London garden.' };
const req = (body, headers = {}) =>
  new Request('https://example.com/api/contact', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });

const realFetch = globalThis.fetch;
let calls;
beforeEach(() => {
  calls = [];
  delete process.env.RESEND_API_KEY;
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); return new Response('{}', { status: 200 }); };
});
afterEach(() => { globalThis.fetch = realFetch; });

test('rejects invalid JSON', async () => {
  assert.equal((await POST(req('{nope'))).status, 400);
});

test('rejects invalid fields with per-field errors', async () => {
  const res = await POST(req({ ...valid, email: 'bad' }));
  assert.equal(res.status, 400);
  assert.ok((await res.json()).errors.email);
});

test('honeypot: pretends success and sends nothing', async () => {
  process.env.RESEND_API_KEY = 'test';
  const res = await POST(req({ ...valid, website: 'http://spam.example' }));
  assert.equal(res.status, 200);
  assert.equal(calls.length, 0);
});

test('returns 503 when the email service is not configured', async () => {
  assert.equal((await POST(req(valid))).status, 503);
  assert.equal(calls.length, 0);
});

test('sends plain-text email with reply_to set to the visitor', async () => {
  process.env.RESEND_API_KEY = 'test-key';
  const res = await POST(req({ ...valid, name: 'Sam\r\nBcc: x@y.com' }));
  assert.equal(res.status, 200);
  const sent = JSON.parse(calls[0].init.body);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal(calls[0].init.headers.authorization, 'Bearer test-key');
  assert.equal(sent.reply_to, 'sam@example.com');
  assert.ok(!sent.subject.includes('\n'));
  assert.equal(sent.html, undefined);
});

test('reports a failure if the email provider rejects the send', async () => {
  process.env.RESEND_API_KEY = 'test-key';
  globalThis.fetch = async () => new Response('{}', { status: 422 });
  assert.equal((await POST(req(valid))).status, 502);
});

test('rejects oversized bodies', async () => {
  assert.equal((await POST(req('x'.repeat(25_000)))).status, 413);
});
