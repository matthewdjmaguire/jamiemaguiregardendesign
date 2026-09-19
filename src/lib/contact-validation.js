// Contact-form validation, shared by the browser (friendly errors) and the server (the real check).
// Plain JS with JSDoc so Node can run the tests without a build step.

export const LIMITS = { name: 100, email: 254, message: 5000, messageMin: 10 };

/** Remove line breaks so a value can never inject extra email headers. */
export const singleLine = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();

/**
 * @param {Record<string, unknown>} input
 * @returns {{ ok: true, value: { name: string, email: string, message: string } } | { ok: false, errors: Record<string, string> }}
 */
export function validateEnquiry(input) {
  const name = singleLine(input?.name);
  const email = singleLine(input?.email);
  const message = String(input?.message ?? '').trim();
  const errors = {};

  if (!name) errors.name = 'Please tell me your name.';
  else if (name.length > LIMITS.name) errors.name = 'That name is too long.';

  // Deliberately simple: something@something.tld. The real proof is whether the reply arrives.
  if (!email) errors.email = 'Please enter your email address so I can reply.';
  else if (email.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'That email address does not look right.';
  }

  if (message.length < LIMITS.messageMin) errors.message = 'Please tell me a little about your garden (at least a sentence).';
  else if (message.length > LIMITS.message) errors.message = 'That message is too long. Please shorten it.';

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { name, email, message } };
}
