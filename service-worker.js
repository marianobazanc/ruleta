const CACHE_NAME = "ruleta-cache-v1";
const urlsToCache = [
    "formulario.html",
    "formulario.css",
    "formulario.js",
    "admin.html",
    "admin.css",
    "admin.js",
    "index.html",
    "styles.css",
    "index.js",
    "manifest.json",
    "logopk.ico",
    "logopk.ico"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
