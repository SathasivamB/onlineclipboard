/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'online-clipboard-v3';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // First, cache the root path
      await cache.add('/');
      
      try {
        // Fetch the CRA asset manifest to find the hashed filenames
        const response = await fetch('/asset-manifest.json');
        if (response.ok) {
          const manifest = await response.json();
          // Extract the URLs to cache (JS, CSS, images, etc.)
          const urlsToCache = Object.values(manifest.files).filter(url => 
            !url.endsWith('.map') // Ignore source maps
          );
          await cache.addAll(urlsToCache);
        }
      } catch (error) {
        console.error('Failed to pre-cache manifest assets:', error);
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('googleapis.com')) return;
  if (event.request.url.includes('firebaseio.com')) return;
  if (event.request.url.includes('chrome-extension')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Serve from cache if available
      }
      
      // Otherwise, fetch from network and cache it
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        
        // Only cache valid basic/cors responses
        if (response.type !== 'basic' && response.type !== 'cors') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // If offline and requesting a page navigation, return the cached root shell
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        
        // Prevent "TypeError: Failed to convert value to 'Response'"
        return Response.error();
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
  self.clients.claim();
});
