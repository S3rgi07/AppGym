/* Service Worker: GymTrack Pro PWA - cache para funcionar sin conexión */
const CACHE_NAME = 'gymtrack-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((res) => {
            if (res.ok && request.method === 'GET') {
              const clone = res.clone()
              cache.put(request, clone)
            }
            return res
          })
          .catch(() => cached || (request.mode === 'navigate' ? getOfflinePage() : undefined))
        return cached && request.mode !== 'navigate' ? cached : fetchPromise
      })
    )
  )
})

function getOfflinePage() {
  return caches.match('/').then((cached) => cached || new Response(
    '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Sin conexión - GymTrack Pro</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:system-ui;padding:2rem;text-align:center;background:#1a1a2e;color:#fff;"><h1>Sin conexión</h1><p>Los datos del gimnasio se guardan en tu dispositivo (localStorage) y no se pierden.</p><p>Conecta a internet y recarga para seguir.</p><button onclick="location.reload()" style="padding:0.5rem 1rem;font-size:1rem;cursor:pointer;">Reintentar</button></body></html>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  ))
}
