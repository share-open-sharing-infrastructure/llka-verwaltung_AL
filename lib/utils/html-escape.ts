/**
 * HTML-escape a string for safe interpolation into raw HTML templates
 * (e.g. the print views that write into a popup window via document.write).
 * Without this, fields like a customer's `remark` or `street` can carry
 * `<img src=x onerror=...>` and execute script in a same-origin context.
 */
export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
