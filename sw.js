/* ============================================================
   RYMDSKEPPSARKIVET – SERVICE WORKER
   Strikt versionerad och medvetet "fällsäker":

   1. NETWORK-FIRST för allt på samma origin → sidan kan ALDRIG
      fastna i en gammal cache (jfr Live Server-fällan där en
      kvarglömd SW på 127.0.0.1:5500 serverade en månad gammal
      sida). Cachen används bara offline.
   2. Versionsstämplat cachenamn – bumpa VERSION vid större
      ändringar så gammalt städas bort på activate.
   3. Rensar ENDAST cachar med eget prefix – rör aldrig andra
      projekts cachar på samma origin (t.ex. via Live Server).
   ============================================================ */

const VERSION = 'rymdskeppsarkivet-v1';

const CORE = [
    './',
    './index.html',
    './css/style.css',
    './js/ships.js',
    './js/main.js',
    './js/chat.js',
    './manifest.json',
    './images/icons/icon-192.png',
    './images/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(VERSION)
            .then(c => c.addAll(CORE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys
                .filter(k => k.startsWith('rymdskeppsarkivet-') && k !== VERSION)
                .map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return; // rör aldrig POST (t.ex. Gemini-API)

    const url = new URL(req.url);
    if (!url.protocol.startsWith('http')) return;

    if (url.origin === location.origin) {
        // Samma origin: NETWORK-FIRST. Färskt innehåll alltid; cache = offline-reserv.
        e.respondWith(
            fetch(req)
                .then(res => {
                    if (res.ok) {
                        const copy = res.clone();
                        caches.open(VERSION).then(c => c.put(req, copy));
                    }
                    return res;
                })
                .catch(() =>
                    caches.match(req).then(m =>
                        m || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())
                    )
                )
        );
    } else {
        // Extern CDN/bilder: stale-while-revalidate (offline visas senast sedda version).
        e.respondWith(
            caches.match(req).then(cached => {
                const network = fetch(req)
                    .then(res => {
                        const copy = res.clone();
                        caches.open(VERSION).then(c => c.put(req, copy));
                        return res;
                    })
                    .catch(() => cached);
                return cached || network;
            })
        );
    }
});
