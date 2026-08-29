/* Relève — service worker : coquille hors-ligne.
   La carte (tuiles OpenStreetMap) reste le seul élément qui exige le réseau. */
const CACHE = 'releve-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Ne jamais mettre en cache les tuiles de carte (trop nombreuses).
  if (url.hostname.endsWith('tile.openstreetmap.org')) return;
  // Cache d'abord pour la coquille, réseau ensuite.
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && e.request.method === 'GET' &&
          (url.origin === location.origin || url.hostname === 'unpkg.com')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
