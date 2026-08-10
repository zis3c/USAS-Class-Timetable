import { describe, expect, it } from 'vitest';
import { shouldCacheServiceWorkerRequest, shouldUseNetworkFirst } from '../src/shared/lib/swCache';

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

  it('uses network first only for navigations', () => {
    expect(shouldUseNetworkFirst('navigate', '/profile')).toBe(true);
    expect(shouldUseNetworkFirst('navigate', '/api/usas/student/login_student.php')).toBe(false);
    expect(shouldUseNetworkFirst('same-origin', '/profile')).toBe(false);
  });
});
