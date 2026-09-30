const CACHE_NAME = "ruleta-cache-v3";
const urlsToCache = [
    "formulario.html",
    "formulario.css",
    "formulario.js",
    "admin.html",
    "admin.css",
    "admin.js",
    "ruleta.html",
    "ruleta.css",
    "ruleta.js",
    "manifest.json",
    "logopk.png",
    "logouktransparente.png",
    "confetti.browser.min.js"
];

self.addEventListener("install", event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.all(urlsToCache.map(url =>
                cache.add(new Request(url, { cache: "reload" }))
            ))
        )
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
