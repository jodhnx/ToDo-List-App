const SW_PATH = '/sw.js'

/** Service Worker für Offline-App-Shell registrieren */
export async function registerOfflineSupport() {
  if (!('serviceWorker' in navigator)) return false
  try {
    await navigator.serviceWorker.register(SW_PATH, { scope: '/' })
    return true
  } catch (e) {
    console.warn('Service Worker nicht registriert:', e)
    return false
  }
}

export function isBrowserOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export async function clearOfflineCache() {
  if (!('caches' in window)) return
  const keys = await caches.keys()
  await Promise.all(keys.filter((k) => k.startsWith('focus-')).map((k) => caches.delete(k)))
}
