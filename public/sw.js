self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("campussync-v1").then((cache) => cache.addAll(["/"]))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone()
        caches.open("campussync-v1").then((cache) => cache.put(request, copy))
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  )
})
