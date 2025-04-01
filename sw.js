const CACHE_NAME = 'wiezy-v1';
const ASSETS_TO_CACHE = [
  '/wiezy/',
  '/wiezy/index.html',
  '/wiezy/app.js',
  '/wiezy/game.js',
  '/wiezy/scoring.js',
  '/wiezy/styles.css',
  '/wiezy/icon-192x192.png',
  '/wiezy/icon-512x512.png',
  '/wiezy/manifest.json'
];

// Install service worker and cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => {
        // If both cache and network fail, you might want to show an offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/wiezy/index.html');
        }
        return new Response('Offline');
      })
  );
});

// Clean up old caches when a new version is available
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
}); 