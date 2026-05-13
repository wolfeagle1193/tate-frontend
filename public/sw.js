// Taté Service Worker — Cache Shell + API NetworkFirst
// ⚠️  Incrémenter CACHE_NAME à chaque déploiement pour invalider le cache mobile
const CACHE_NAME = 'tate-v4';
const SHELL = ['/', '/index.html'];

// Installation : mise en cache du shell uniquement
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activation : supprime TOUS les anciens caches (force refresh mobile)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW] Suppression cache obsolète :', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch : stratégies selon l'URL
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Ne pas intercepter les requêtes non-GET
  if (e.request.method !== 'GET') return;

  // API → NetworkFirst SANS cache (données toujours fraîches)
  if (url.pathname.startsWith('/api') || url.hostname.includes('onrender.com')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Chunks JS/CSS hachés → NetworkFirst (Vite génère des hashes uniques)
  // On ne les met PAS en cache pour éviter de servir de vieux bundles
  if (url.pathname.match(/\.(js|css)$/) && url.pathname.includes('/assets/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Mettre en cache uniquement les réponses valides
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Images/fonts → CacheFirst (immutables)
  if (url.pathname.match(/\.(png|svg|ico|woff2?|jpg|webp)$/)) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
        return res;
      }))
    );
    return;
  }

  // Navigation HTML → NetworkFirst avec fallback shell (SPA)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Défaut : network avec fallback cache
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
