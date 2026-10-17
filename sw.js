const CACHE = "bookmysalon-v2";
const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./dashboard.html",
  "./register.html",
  "./my-bookings.html",
  "./salon.html"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // ADD ONLY - never cache Supabase / OneSignal / API calls, only app files
  if (
    e.request.method !== "GET" ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("onesignal.com") ||
    url.hostname.includes("cdn.jsdelivr.net")
  ) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      // Cache new app files for offline, don't cache errors
      if (res.ok && url.origin === self.location.origin) {
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, clone));
      }
      return res;
    }).catch(() => {
      // Offline fallback for navigation
      if (e.request.mode === "navigate") return caches.match("./index.html");
      return cached;
    }))
  );
});
