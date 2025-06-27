self.addEventListener("install", (event) => {
  console.log("Service Worker installé.");
});

self.addEventListener("fetch", function (event) {
  // simple : laisse passer les requêtes
});
