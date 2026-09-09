const CACHE_NAME = 'family-todo-v1';
const ASSETS = ['./', './index.html', './style.css', './quick-add.css', './calendar-items.css', './app.js', './calendar-items.js', './app-icon.svg', './manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
