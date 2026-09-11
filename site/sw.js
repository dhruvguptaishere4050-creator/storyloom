const CACHE = 'storyloom-landing-v2';
const FILES = ['./', './index.html', './about.html', './privacy.html', './terms.html', './safety.html', './contact.html', './info.css', './manifest.webmanifest', './favicon.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
