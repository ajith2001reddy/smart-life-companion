// ============================================================
// public/sw.js — Smart Life Service Worker
// ============================================================

const CACHE_NAME = "smartlife-v3"; // ✅ bumped version to force re-install

const PRECACHE_URLS = [
    "/dashboard",
    "/login",
    "/register",
    "/manifest.json",
    // ✅ FIX: Removed "/" from precache — the root just redirects to /dashboard
    // and caching it can interfere with Firebase's OAuth redirect handling.
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
    // Only intercept GET requests
    if (event.request.method !== "GET") return;

    const url = event.request.url;

    // ✅ FIX 1: Skip cross-origin requests entirely
    if (!url.startsWith(self.location.origin)) return;

    // ✅ FIX 2: Skip API requests
    if (url.includes("/api/")) return;

    // ✅ FIX 3: Skip Firebase auth redirect URLs — these MUST hit the network
    // so Firebase can extract the OAuth result from the URL hash/query params.
    if (
        url.includes("/__/auth/") ||          // Firebase auth handler path
        url.includes("firebaseapp.com") ||    // Firebase hosted auth domain
        url.includes("accounts.google.com") || // Google OAuth
        url.includes("?apiKey=") ||           // Firebase redirect callback
        url.includes("#state=") ||            // OAuth state param
        url.includes("&code=") ||             // OAuth code param
        url.includes("oauthCallback")
    ) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Only cache successful responses for same-origin pages
                if (response.status === 200 &&
                    response.type === "basic") {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() =>
                caches.match(event.request).then(
                    (cached) => cached || caches.match("/dashboard")
                )
            )
    );
});