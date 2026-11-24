const CACHE_STATIC = 'cpns-static-v1';
const CACHE_DATA = 'cpns-data-v1';
const PRECACHE_URLS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const validCaches = new Set([CACHE_STATIC, CACHE_DATA]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => (validCaches.has(key) ? Promise.resolve(true) : caches.delete(key))),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache Cloudflare D1 / Worker API responses
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Immutable hashed assets & figure images: Cache-First
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/figures/')) {
    event.respondWith(
      caches.open(CACHE_STATIC).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
          void cache.put(request, fresh.clone());
        }
        return fresh;
      }),
    );
    return;
  }

  // Split package JSONs & search index: Stale-While-Revalidate
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(
      caches.open(CACHE_DATA).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((fresh) => {
            if (fresh && fresh.ok) {
              void cache.put(request, fresh.clone());
            }
            return fresh;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      }),
    );
    return;
  }

  // SPA navigation requests: Network-First with /index.html offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put('/index.html', copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(async () => {
          const cachedShell = await caches.match('/index.html');
          if (cachedShell) return cachedShell;
          return Response.error();
        }),
    );
  }
});
