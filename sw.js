const cacheName = "focus-v15";
const assets = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest", "./favicon.png", "./assets-background.png"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets))));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && new URL(event.request.url).origin === location.origin) {
          caches.open(cacheName).then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || (event.request.mode === "navigate" ? caches.match("./") : undefined)))
  );
});
