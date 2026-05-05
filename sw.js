const CACHE_NAME = "cnh-brasil-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./menu.html",
  "./condutor.html",
  "./CNH.html",
  "./habilitacao.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./assets/css/style.css",
  "./assets/js/script.js",
  "./assets/js/pwa.js",
  "./assets/img/doc.png",
  "./assets/img/cnh.png",
  "./assets/img/cnh-logo.png",
  "./assets/img/footer.png",
  "./assets/img/bt1.png",
  "./assets/img/bt2.png",
  "./assets/img/bt3.png",
  "./assets/img/bt4.png",
  "./assets/img/1.png",
  "./assets/img/2.png",
  "./assets/img/3.png",
  "./assets/img/4.png",
  "./assets/img/5.png",
  "./assets/img/6.png",
  "./assets/img/7.png",
  "./assets/img/8.png",
  "./assets/img/9.png",
  "./assets/img/habilitacao.svg",
  "./assets/img/dirigir.svg",
  "./assets/img/lab.svg",
  "./assets/img/certificado.svg",
  "./assets/img/estacionar.svg",
  "./assets/img/exportar.svg",
  "./assets/img/lixo.svg",
  "./assets/img/copiar_1.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.url.includes("/assets/js/config.local.js")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./offline.html");
          }
        });
    })
  );
});
