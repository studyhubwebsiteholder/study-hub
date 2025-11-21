// Improved service worker with cache-first for assets and network-first for navigations.
// Cache strategy: static assets -> 'studyhub-static-v1', dynamic API/fetches -> 'studyhub-dynamic-v1'
const STATIC_CACHE = 'studyhub-static-v1';
const DYNAMIC_CACHE = 'studyhub-dynamic-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/sw-cache.js',
  '/offline.html'
];

// On install: populate static cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// On activate: cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch handler: navigation -> network-first fallback to cache, assets -> cache-first
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET
  if (req.method !== 'GET') return;

  // Bypass for Cloudflare Worker proxy endpoint paths used by this site (if deployed)
  if (url.pathname.startsWith('/proxy')) {
    // let the worker proxy handle this on the server-side if available
    return;
  }

  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(DYNAMIC_CACHE).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(cacheRes => cacheRes || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // For other requests (assets): cache first
  event.respondWith(
    caches.match(req).then(cacheRes => {
      if (cacheRes) return cacheRes;
      return fetch(req).then(fetchRes => {
        return caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(req, fetchRes.clone());
          return fetchRes;
        });
      }).catch(() => {
        // if image requested and offline, return a tiny placeholder (could be inline image)
        if (req.destination === 'image') {
          return new Response('', { headers: { 'Content-Type': 'image/svg+xml' }});
        }
      });
    })
  );
});
