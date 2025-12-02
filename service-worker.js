const CACHE_NAME = "qrpay-cache-v3";

const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/app-icon-192.png",
  "/app-icon-512.png",
  "/maskable-512.png",
  "/pvc/qris.png",
  "/pvc/gpn.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : null))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Bypass all external API
  if (
    url.includes("qrserver") ||
    url.includes("quickchart") ||
    url.includes("googleapis") ||
    url.includes("supabase")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((resp) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, resp.clone());
              return resp;
            });
          })
          .catch(() => {
            if (event.request.destination === "document") {
              return caches.match("/index.html");
            }
          })
      );
    })
  );
});
