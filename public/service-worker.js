/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'online-clipboard-v4';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Safely attempt to pre-cache the root and index
      try {
        await cache.add('/index.html');
        await cache.add('/');
      } catch (e) {
        console.warn('Failed to cache root shell', e);
      }
      
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
      }).catch(async () => {
        // If offline and requesting a page navigation, return the cached root shell
        if (event.request.mode === 'navigate') {
          const cache = await caches.open(CACHE_NAME);
          const cachedRoot = await cache.match('/') || await cache.match('/index.html');
          if (cachedRoot) {
            return cachedRoot;
          }
          // If we somehow still don't have the HTML cached, show a clean error instead of a dinosaur
          return new Response(
            '<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>App is offline</h2><p>Please connect to the internet to load the app for the first time.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
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
