/* Focus — Service Worker für Push-Benachrichtigungen */
self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (list.length > 0) {
        list[0].focus()
        list[0].navigate('/app/tasks')
        return
      }
      return self.clients.openWindow('/app/tasks')
    }),
  )
})
