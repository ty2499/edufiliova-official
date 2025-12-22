const CACHE_VERSION = 'v4';
const CACHE_NAME = `edufiliova-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

const CACHE_STRATEGIES = {
  networkFirst: ['/api/'],
  cacheFirst: ['.js', '.css', '.woff2', '.woff', '.ttf', '.svg', '.png', '.jpg', '.webp', '.ico', '.gif'],
  staleWhileRevalidate: ['/', '/index.html'],
  neverCache: ['/api/messages', '/api/auth', '/ws', '/api/conversations', '/api/notifications']
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        const cachePromises = STATIC_ASSETS.map(url => {
          return cache.add(url).catch(err => {
            console.warn(`Failed to cache ${url}:`, err.message);
            return Promise.resolve();
          });
        });
        return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.warn('Service Worker install error:', error.message);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('edufiliova-') && name !== CACHE_NAME)
            .map((name) => {
              console.log(`Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

function shouldCache(url) {
  return CACHE_STRATEGIES.cacheFirst.some(ext => url.endsWith(ext)) ||
         CACHE_STRATEGIES.staleWhileRevalidate.some(path => url.endsWith(path) || url === path);
}

function isApiRequest(url) {
  return CACHE_STRATEGIES.networkFirst.some(path => url.includes(path));
}

function shouldNeverCache(url) {
  return CACHE_STRATEGIES.neverCache.some(path => url.includes(path));
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  
  if (url.origin !== self.location.origin) {
    return;
  }

  // Never cache auth, messaging, and WebSocket endpoints - always go to network
  if (shouldNeverCache(event.request.url)) {
    return; // Let the browser handle it directly without service worker interference
  }

  if (isApiRequest(event.request.url)) {
    return;
  }

  if (CACHE_STRATEGIES.cacheFirst.some(ext => event.request.url.endsWith(ext))) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseClone);
                });
              }
              return networkResponse;
            });
        })
        .catch(() => {
          return new Response('', { status: 408, statusText: 'Request Timeout' });
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse.ok && shouldCache(event.request.url)) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            if (event.request.mode === 'navigate') {
              return caches.match('/').then((indexPage) => {
                return indexPage || new Response(
                  '<!DOCTYPE html><html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui"><div style="text-align:center"><h2>You are offline</h2><p>Please check your internet connection and try again.</p></div></body></html>',
                  { 
                    status: 503, 
                    headers: { 'Content-Type': 'text/html' } 
                  }
                );
              });
            }
            
            return new Response('', { status: 408, statusText: 'Request Timeout' });
          });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
