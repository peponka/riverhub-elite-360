// FluviaFleet Service Worker v2
const CACHE = 'ff-v2';

const STATIC_ASSETS = [
  '/fluvia.css',
  '/css/elite-bundle.css',
  '/css/global.css',
  '/css/maritime-elite.css',
  '/js/global.js',
  '/js/modules/auth.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Cross-origin: Supabase/AIS → network first, silent fallback
  if (url.origin !== location.origin) {
    if (url.hostname.includes('supabase') || url.hostname.includes('aisstream')) {
      e.respondWith(
        fetch(e.request).catch(() =>
          new Response(JSON.stringify({ offline: true, data: null }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )
      );
    }
    // Other CDNs pass through
    return;
  }

  // HTML pages: network first, cache as fallback
  if (e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() =>
          caches.match(e.request)
            .then(r => r || caches.match('/fluvia.html'))
        )
    );
    return;
  }

  // Static assets: cache first, network fallback + update cache
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      });
      return cached || network;
    })
  );
});
