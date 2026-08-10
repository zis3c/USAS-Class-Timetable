import { describe, expect, it } from 'vitest';
import { normalizeSafeHref } from '../src/shared/lib/errorPage';

describe('error page href safety', () => {
  it('allows same-origin relative links', () => {
    expect(normalizeSafeHref('/login', 'https://example.com')).toBe('/login');
    expect(normalizeSafeHref('offline.html', 'https://example.com')).toBe('/offline.html');
  });

  it('rejects unsafe or cross-origin links', () => {
    expect(normalizeSafeHref('javascript:alert(1)', 'https://example.com')).toBeNull();
    expect(normalizeSafeHref('data:text/html,alert(1)', 'https://example.com')).toBeNull();
    expect(normalizeSafeHref('https://evil.com/login', 'https://example.com')).toBeNull();
  });
});
