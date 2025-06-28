/* === cache hors‑ligne inchangé ================================== */
const CACHE_NAME = "drinkbetter-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});

/* ===  NOUVEAU : gestion du clic sur notification ================ */
self.addEventListener("notificationclick", event => {
  event.notification.close();              // ferme la notif
  const addAmount = 250;                   // ml à ajouter

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(clientList => {
        // 1) si une fenêtre DrinkBetter est déjà ouverte ➜ on la focus + message
        for (const client of clientList) {
          if (client.url.includes("/") && "focus" in client) {
            client.postMessage({ action: "addWater", amount: addAmount });
            return client.focus();
          }
        }
        // 2) sinon on ouvre la PWA et on passe l'info dans l'URL
        return self.clients.openWindow(`/?add=${addAmount}`);
      })
  );
});
