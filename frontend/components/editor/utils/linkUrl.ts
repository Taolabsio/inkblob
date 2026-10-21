/** A pasted hostname becomes an HTTPS link; non-navigation URL schemes stay rejected. */
export function normalizeLinkUrl(value: string): string | null {
  const text = value.trim();
  if (!text || /\s/.test(text)) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return null;
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.hostname) return null;
    if ((url.protocol === 'mailto:' || url.protocol === 'tel:') && !url.pathname) return null;
    return url.href;
  } catch { return null; }
}
