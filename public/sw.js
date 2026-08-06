/**
 * Service worker mínimo, escrito a mano.
 *
 * Hace dos cosas y nada más: guarda en caché lo que ya se visitó para que la
 * app abra sin conexión, y sirve una respuesta útil cuando la red falla.
 * La escritura sin conexión (registrar una serie en el sótano del gimnasio y
 * que se sincronice después) está en el backlog, no aquí.
 */
const CACHE = "nerd-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo GET: nunca se cachea una mutación.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // La autenticación jamás se cachea.
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response("Sin conexión y sin copia guardada de esta página.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }),
  );
});
