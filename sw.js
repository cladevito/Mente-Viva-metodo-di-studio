// ─────────────────────────────────────────────
// sw.js
// Incrementa CACHE_VERSION ad ogni deploy
// ─────────────────────────────────────────────
const CACHE_VERSION = 'mv-v1.0.0';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;

// File da mettere in cache per uso offline
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'
];

// ── INSTALL: cache assets e skipWaiting immediato ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // ← non aspetta che le vecchie tab chiudano
  );
});

// ── ACTIVATE: elimina cache vecchie e prendi controllo subito ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE)
          .map(key => caches.delete(key))   // ← elimina TUTTE le versioni precedenti
      ))
      .then(() => self.clients.claim())     // ← controlla subito tutte le tab aperte
      .then(() => {
        // Notifica tutte le tab aperte che c'è un aggiornamento
        self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
        });
      })
  );
});

// ── FETCH: network first per HTML, cache first per assets ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Per l'HTML principale: sempre network, fallback cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Aggiorna la cache con la versione fresca
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Per tutto il resto: cache first, fallback network
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
