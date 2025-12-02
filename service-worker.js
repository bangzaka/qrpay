const CACHE_NAME = "qrpay-cache-v2";

const ASSETS = [
  "/qrpay/",
  "/qrpay/index.html",
  "/qrpay/manifest.json",
  "/qrpay/app-icon-192.png",
  "/qrpay/app-icon-512.png",
  "/qrpay/maskable-512.png",
  "/qrpay/pvc/qris.png",
  "/qrpay/pvc/gpn.png",
];

// Install — cache statis
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — bersihkan cache lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch — pengecualian untuk API QR
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // 1️⃣ Lewatkan semua API eksternal (QR server, Supabase)
  if (
    url.includes("qrserver") ||
    url.includes("quickchart") ||
    url.includes("googleapis") ||
    url.includes("supabase")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2️⃣ Cache first untuk asset statis
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
            // fallback jika offline
            if (event.request.destination === "document") {
              return caches.match("/qrpay/index.html");
            }
          })
      );
    })
  );
});
