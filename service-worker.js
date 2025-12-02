const CACHE_NAME = "qrpay-cache-v1";

const ASSETS = [
  "./",
  "index.html",
  "manifest.json",
  "app-icon-192.png",
  "app-icon-512.png",
  "maskable-512.png",
  "pvc/qris.png",
  "pvc/gpn.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))
      )
    )
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
