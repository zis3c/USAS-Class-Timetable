export function normalizeSafeHref(href: string, baseOrigin: string): string | null {
  const trimmed = String(href || '').trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed, baseOrigin);
    const allowedProtocol = url.protocol === 'http:' || url.protocol === 'https:';
    if (!allowedProtocol) return null;
    if (url.origin !== baseOrigin) return null;

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
