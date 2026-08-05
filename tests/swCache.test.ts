import { describe, expect, it } from 'vitest';
import { shouldCacheServiceWorkerRequest } from '../src/shared/lib/swCache';

describe('service worker cache policy', () => {
  it('caches shell and static assets', () => {
    expect(shouldCacheServiceWorkerRequest('/index.html', 'navigate')).toBe(true);
    expect(shouldCacheServiceWorkerRequest('/assets/index-abc.js', 'script')).toBe(true);
    expect(shouldCacheServiceWorkerRequest('/usas-logo.png', 'image')).toBe(true);
  });

  it('skips api and dynamic paths', () => {
    expect(shouldCacheServiceWorkerRequest('/api/usas/student/login_student.php', 'fetch')).toBe(false);
    expect(shouldCacheServiceWorkerRequest('/profile', 'fetch')).toBe(false);
  });
});
