const VERSION = 'v1';
const CACHE = 'menteviva-' + VERSION;
const FILES = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open(CACHE).then(cache =>
      fetch(e.request).then(res => {
        cache.put(e.request, res.clone());
        return res;
      }).catch(() => caches.match(e.request))
    )
  );
});
