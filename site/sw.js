const CACHE = 'storyloom-landing-v3';
const FILES = ['./', './index.html', './about.html', './privacy.html', './terms.html', './safety.html', './contact.html', './info.css', './manifest.webmanifest', './favicon.svg', './app/', './app/index.html', './app/app.css', './app/visibility.css', './app/app.js', './app/config.js'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
])));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
