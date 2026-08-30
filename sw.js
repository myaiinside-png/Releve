/* Relève — service worker : coquille + carte hors-ligne.
   - Coquille (app, Leaflet, protomaps-leaflet) : cache d'abord.
   - bigouden.pmtiles : téléchargé en entier une fois, puis servi depuis le
     cache par plages d'octets (les requêtes Range de protomaps-leaflet), ce
     qui rend la carte disponible hors-ligne.
   - Tuiles OSM (repli en ligne) et géocodeur BAN : réseau direct. */
const CACHE = 'releve-v3';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/protomaps-leaflet@5.0.0/dist/protomaps-leaflet.js'
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

  // Le fichier de carte : plein téléchargement une fois, plages servies du cache.
  if (url.pathname.endsWith('.pmtiles')) { e.respondWith(handlePmtiles(e.request)); return; }

  // Réseau direct, sans cache : tuiles OSM (repli) et géocodeur BAN (dynamiques).
  if (url.hostname.endsWith('tile.openstreetmap.org') ||
      url.hostname === 'api-adresse.data.gouv.fr') return;

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

/* Sert bigouden.pmtiles hors-ligne : on met en cache le fichier complet (clé
   sans en-tête Range), puis on découpe la plage demandée depuis ce cache. */
async function handlePmtiles(req) {
  const cache = await caches.open(CACHE);
  const key = new Request(req.url); // clé stable, indépendante de l'en-tête Range
  let full = await cache.match(key);
  if (!full) {
    try {
      const res = await fetch(req.url); // fichier entier (200)
      if (res.ok) { await cache.put(key, res.clone()); full = res; }
    } catch (_) { /* hors-ligne et pas encore en cache */ }
  }
  if (!full) { try { return await fetch(req); } catch (_) { return new Response(null, {status: 504}); } }

  const range = req.headers.get('range');
  if (!range) return full.clone();

  const buf = await full.clone().arrayBuffer();
  const m = /bytes=(\d+)-(\d*)/.exec(range) || [];
  const start = +m[1] || 0;
  const end = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
  const slice = buf.slice(start, end + 1);
  return new Response(slice, {
    status: 206,
    headers: {
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(slice.byteLength),
      'Content-Type': 'application/octet-stream',
      'Accept-Ranges': 'bytes'
    }
  });
}
