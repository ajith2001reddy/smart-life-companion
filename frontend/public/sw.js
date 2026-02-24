// ============================================================
// public/sw.js — Smart Life Service Worker
// Caches the shell pages for offline access
// ============================================================

const CACHE_NAME = "smartlife-v1";

const PRECACHE_URLS = [
    "/",
    "/dashboard",
    "/login",
    "/register",
    "/manifest.json",
];

// ── Install: precache shell ──────────────────────────────────
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// ── Activate: remove old caches ──────────────────────────────
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k !== CACHE_NAME)
                        .map((k) => caches.delete(k))
                )
            )
            .then(() => self.clients.claim())
    );
});

// ── Fetch: network-first with cache fallback ─────────────────
self.addEventListener("fetch", (event) => {
    // Only intercept GET requests for same-origin pages/assets
    if (event.request.method !== "GET") return;
    if (!event.request.url.startsWith(self.location.origin)) return;

    // Skip API requests — always go to network
    if (event.request.url.includes("/api/")) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache fresh response for next time
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clone);
                });
                return response;
            })
            .catch(() =>
                // Network failed — serve from cache
                caches.match(event.request).then(
                    (cached) => cached || caches.match("/dashboard")
                )
            )
    );
});