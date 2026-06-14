/** Accepts Australian mobile (04…) and landline (02/03/07/08…) in common national or +61 formats. */
export function isValidAustralianPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');

  if (digits.startsWith('61') && digits.length === 11) {
    return isValidAustralianNational('0' + digits.slice(2));
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    return isValidAustralianNational(digits);
  }

  return false;
}

function isValidAustralianNational(digits: string): boolean {
  if (digits.length !== 10) return false;
  if (digits.startsWith('04')) return true;
  return /^0[2378]/.test(digits);
}

/** Detects ASCII control characters that could break email headers or inject new headers. */
export function hasControlChars(value: string): boolean {
  return /[\x00-\x1f\x7f]/.test(value);
}

/** Strip control characters from a string for safe use in email headers. */
export function stripControlChars(value: string): string {
  return value.replace(/[\x00-\x1f\x7f]/g, '');
}

/** RFC 5322–safe Reply-To using a validated email and a display name. */
export function formatReplyTo(name: string, email: string): string {
  const safeName = stripControlChars(name).replace(/["\\]/g, '').trim();
  return safeName ? `"${safeName}" <${email}>` : email;
}

/** Minimal HTML-entity escaping for user-supplied strings inserted into email HTML */
export function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (value != null) return [String(value)];
  return [];
}
