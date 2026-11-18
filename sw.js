// Mis Cartas: funciona sin conexión. Cambiá VERSION cuando subas una versión nueva de la app.
const VERSION = "mis-cartas-9";
// buscadores de cartas: siempre por internet, no se guardan
const SIN_GUARDAR = ["db.ygoprodeck.com", "api.tcgdex.net", "api.scryfall.com"];
const BASE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;
  if (SIN_GUARDAR.includes(new URL(req.url).hostname)) return;
  const guardar = res => {
    if (res && (res.ok || res.type === "opaque")) { const copia = res.clone(); caches.open(VERSION).then(c => c.put(req, copia)); }
    return res;
  };
  if (req.mode === "navigate") {
    // la app: primero internet (para tener la última versión), si no hay, la guardada
    e.respondWith(fetch(req).then(guardar).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  // lo demás (íconos, letras, lector de Excel): lo guardado al toque, y se actualiza por detrás
  e.respondWith(caches.match(req).then(hit => {
    const red = fetch(req).then(guardar).catch(() => hit);
    return hit || red;
  }));
});
