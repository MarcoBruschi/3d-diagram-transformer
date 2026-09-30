/**
 * Security Sanitizer Utility
 * High-performance, zero-dependency HTML/SVG sanitizer safe for all Node.js environments (Alpine, Docker, Serverless).
 * Eliminates jsdom/webidl compatibility issues while strictly enforcing XSS & tag injection prevention.
 */

/**
 * Strips all HTML tags and invisible control characters, leaving plain text only.
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // remove control chars
    .trim();
}

/**
 * Escapes HTML characters to prevent XSS.
 */
export function escapeHtml(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes plain text input (e.g. user names, YAML text):
 * Strips tags and trims whitespace.
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  return stripHtml(input);
}

/**
 * Sanitizes SVG markup to prevent script execution, XXE, and event handlers.
 */
export function sanitizeSVG(svgContent: string): string {
  if (!svgContent || typeof svgContent !== 'string') return '';

  // Reject entity declarations & custom doctype (XXE defense)
  if (/<!ENTITY/i.test(svgContent) || /<!DOCTYPE[^>]*\[/i.test(svgContent)) {
    throw new Error('SVG with external entities or custom DOCTYPE is prohibited.');
  }

  // Remove dangerous executable tags
  let clean = svgContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '');

  // Remove inline event handlers (e.g., onload, onclick, onerror, onmouseover)
  clean = clean.replace(/\s+on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '');

  // Remove javascript:, vbscript: links
  clean = clean.replace(/(?:href|xlink:href)\s*=\s*["']\s*(?:javascript|vbscript):[^"']*["']/gi, '');

  return clean;
}
