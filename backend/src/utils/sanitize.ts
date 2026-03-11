/**
 * Input sanitization utilities — defense-in-depth against XSS/injection.
 * React auto-escapes JSX, but we sanitize server-side as well.
 */

/** Strip HTML tags and trim whitespace from user-supplied text */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

/** Sanitize user text content: strip HTML, normalize Unicode, cap length */
export function sanitizeText(input: string, maxLength = 5000): string {
  if (typeof input !== 'string') return '';
  return stripHtml(input.normalize('NFC')).slice(0, maxLength);
}
