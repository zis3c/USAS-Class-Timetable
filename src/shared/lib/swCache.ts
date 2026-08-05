export const STATIC_CACHEABLE_PATHS = new Set([
  '/',
  '/index.html',
  '/offline.html',
  '/404.html',
  '/500.html',
  '/502.html',
  '/503.html',
  '/504.html',
  '/error.css',
  '/error-page.js',
  '/usas-logo.png',
]);

export function shouldCacheServiceWorkerRequest(pathname: string, destination: string): boolean {
  if (pathname.startsWith('/api/')) return false;
  if (STATIC_CACHEABLE_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/assets/')) return true;

  return destination === 'script' || destination === 'style' || destination === 'image' || destination === 'font';
}
