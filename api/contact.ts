// Vercel Function: receives the contact form and emails Jamie through Resend's REST API.
// Enquiries are forwarded, never stored. Needs env vars (set in Vercel, never committed):
//   RESEND_API_KEY  required
//   CONTACT_TO      required, where enquiries are delivered
//   CONTACT_FROM    optional, must be on a domain verified in Resend
import { validateEnquiry, singleLine } from '../src/lib/contact-validation.js';

const MAX_BODY_BYTES = 20_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function POST(request: Request): Promise<Response> {
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return json({ error: 'Message too large.' }, 413);

  let data: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json({ error: 'Message too large.' }, 413);
    data = JSON.parse(text);
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  // Honeypot: real people never see this field. Pretend success so bots learn nothing.
  if (typeof data.website === 'string' && data.website.trim() !== '') return json({ ok: true });

  const result = validateEnquiry(data);
  if (!result.ok) return json({ error: 'Please check the form.', errors: result.errors }, 400);
  const { name, email, message } = result.value;

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  if (!apiKey || !to) return json({ error: 'The contact form is not switched on yet.' }, 503);

  const from = process.env.CONTACT_FROM || 'Website enquiry <enquiries@jamiemaguiregardendesign.com>';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email, // hitting Reply in Gmail answers the visitor directly
      subject: `Website enquiry from ${singleLine(name).slice(0, 80)}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}\n`, // plain text only, so nothing can be interpreted as HTML
    }),
  });

  if (!response.ok) {
    console.error('Resend rejected the enquiry', response.status);
    return json({ error: 'Sorry, that did not send. Please email me directly.' }, 502);
  }
  return json({ ok: true });
}
