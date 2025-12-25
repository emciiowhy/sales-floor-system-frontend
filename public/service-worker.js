// Service Worker for offline support and caching
// This file should be placed in the public folder

const CACHE_NAME = 'sales-floor-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.jsx'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache GET requests to API endpoints and static assets
            if (request.url.includes('/api/') || request.url.match(/\.(js|css|png|jpg|gif|svg|woff|woff2)$/)) {
              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, responseToCache));
            }

            return response;
          })
          .catch(() => {
            // Return a fallback response if offline
            return caches.match(request);
          });
      })
  );
});
