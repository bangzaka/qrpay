const CACHE_NAME = "qrpay-cache-v1";

const ASSETS = [
  "./",
  "index.html",
  "manifest.json",
  "app-icon-192.png",
  "app-icon-512.png",
  "maskable-512.png",
  "pvc/qris.png",
  "pvc/gpn.png",
  // tambahkan file lain di sini jika dibutuhkan
];

// Install — cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // langsung aktif tanpa reload
});

// Activate — bersihkan cache lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim(); // SW langsung kontrol semua tab
});

// Fetch — Hybrid Strategy: Cache First + Network Fallback
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Abaikan request tertentu (misal: Supabase atau API eksternal)
  if (req.url.includes("supabase") || req.url.includes("api")) {
    event.respondWith(fetch(req).catch(() => new Response("")));
    return;
  }

  // Cache First untuk file statis
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req)
          .then((resp) => {
            // simpan hasil fetch ke dynamic cache
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, resp.clone());
              return resp;
            });
          })
          .catch(() => {
            // fallback jika offline dan file tidak ada di cache
            if (req.destination === "document") return caches.match("index.html");
          })
      );
    })
  );
});
