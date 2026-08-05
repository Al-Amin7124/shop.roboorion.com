/**
 * sw.js — Robo Orion Service Worker
 * ═══════════════════════════════════════════════════════════════
 *
 * Purpose: make IMAGES load instantly on repeat visits by caching them
 * persistently on the visitor's device, while guaranteeing product DATA
 * (items.json — prices, stock, titles, everything) is NEVER served from
 * a cache and always comes fresh from the network.
 *
 * Why this exists: GitHub Pages doesn't let you set custom Cache-Control
 * headers, and its default cache lifetime is short — so images get
 * re-requested more often than they need to be, even though they rarely
 * change. A service worker is the only way to control caching behavior
 * yourself on a static host like this.
 *
 * Strategy used for images: "stale-while-revalidate" — the cached image
 * is returned immediately (fast), and a fresh copy is fetched in the
 * background to update the cache for NEXT time. This means if you ever
 * replace an image file at the same URL, visitors will see the old one
 * once more before it self-corrects on their following visit. If you
 * want an image change to show up immediately for everyone, rename the
 * file (which is good practice anyway, since it also busts the browser's
 * own HTTP cache).
 *
 * items.json (and any other .json file) is explicitly never intercepted
 * — those requests pass straight through to the network untouched.
 * JS and CSS files are also left alone on purpose (they're already
 * handled via manual ?v= cache-busting elsewhere in this project, and
 * having two different caching systems fight over the same files would
 * cause exactly the kind of "stale script" bugs that were a headache
 * earlier — see render-products.js / cart.js's version query strings).
 */

const IMAGE_CACHE_NAME = "ro-images-v1";
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|svg|avif)$/i;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("ro-images-") && key !== IMAGE_CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only same-origin requests — never intercept third-party resources
  // (Google Fonts, Tailwind CDN, etc.), that's not what this is for.
  if (url.origin !== self.location.origin) return;

  // Not an image at all — do nothing, let it pass through to the network
  // exactly as if this service worker didn't exist. This is what keeps
  // items.json (and every other non-image request) always fresh.
  if (!IMAGE_EXTENSIONS.test(url.pathname)) return;

  event.respondWith(
    caches.open(IMAGE_CACHE_NAME).then((cache) =>
      cache.match(request).then((cachedResponse) => {
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse); // offline fallback — reuse whatever's cached, if anything

        // Cached copy wins the race if we have one (instant); otherwise
        // wait for the network, same as a normal first-time image load.
        return cachedResponse || networkFetch;
      })
    )
  );
});
