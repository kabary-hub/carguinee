/**
 * Service Worker — Carguinée PWA
 *
 * Stratégies de cache :
 * - App Shell : Cache-First (CSS, JS, fonts)
 * - API Data : Network-First (avec fallback cache)
 * - Images : Stale-While-Revalidate
 * - Pages : Network-First (SPA navigation)
 */

const CACHE_NAME = "carguinee-v1";
const STATIC_CACHE = "carguinee-static-v1";
const API_CACHE = "carguinee-api-v1";

// Assets statiques à cacher dès l'installation
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/locales/fr/translation.json",
  "/locales/en/translation.json",
];

// Installation : cacher les assets statiques
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// Activation : nettoyer les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

// Interception des requêtes
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── API requests → Network-First ──
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // ── Static assets → Cache-First ──
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    url.pathname.match(/\.(js|css|woff2?|ttf|eot|ico|svg)$/i)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Images → Stale-While-Revalidate ──
  if (request.destination === "image" || url.pathname.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // ── SPA Navigation → Network-First with offline fallback ──
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // ── Default → Network-First ──
  event.respondWith(networkFirst(request, API_CACHE));
});

// ── Stratégies de cache ─────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    // Fallback pour la navigation SPA
    if (request.mode === "navigate") {
      const indexResponse = await cache.match("/index.html");
      if (indexResponse) return indexResponse;
    }

    return new Response(
      JSON.stringify({ error: "Vous êtes hors ligne. Vérifiez votre connexion." }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
