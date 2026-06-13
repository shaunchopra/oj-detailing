export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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
