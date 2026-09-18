/*
 * reTire service worker.
 *
 * The rule that shapes this file: a saved adventure has to open on a forest
 * road with no bars, and nothing may ever be served as current when it is not.
 * So the app shell is cached aggressively, and the weather API is deliberately
 * never cached here -- that request is allowed to fail so the app can fall back
 * to its own stored forecast and label it as stale.
 */

const VERSION = 'retire-v1'
const SHELL = `${VERSION}-shell`
const ASSETS = `${VERSION}-assets`

const SCOPE = new URL(self.registration.scope)
const INDEX = new URL('./index.html', SCOPE).pathname

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) =>
        // One failed optional file must not sink the whole install.
        Promise.all(
          PRECACHE.map((path) =>
            cache.add(new Request(path, { cache: 'reload' })).catch(() => undefined),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Cross-origin (the forecast API, brewery sites, maps hand-off) is never
  // cached. A stale forecast presented as live is exactly the failure mode
  // this app exists to avoid.
  if (url.origin !== self.location.origin) return

  // Navigations: try the network so a deploy lands, fall back to the shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(SHELL).then((cache) => cache.put(INDEX, copy))
          return response
        })
        .catch(() =>
          caches
            .match(INDEX)
            .then((cached) => cached ?? caches.match('./')),
        ),
    )
    return
  }

  // Everything else: serve from cache immediately, refresh in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone()
            caches.open(ASSETS).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
      return cached ?? network
    }),
  )
})
