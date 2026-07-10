/**
 * Hilfsfunktionen zum sicheren Zusammenführen von Cloud- und Cache-Daten.
 * Verhindert Datenverlust bei Netzwerkfehlern oder leeren API-Antworten.
 */

/** Datensätze nach ID zusammenführen — lokale Pending-Einträge bleiben erhalten. */
export function mergeRecordsById(remote = [], local = [], { keepLocalPending = true } = {}) {
  const remoteList = Array.isArray(remote) ? remote : []
  const localList = Array.isArray(local) ? local : []

  if (!remoteList.length && localList.length) return localList

  const map = new Map()
  for (const item of remoteList) {
    if (item?.id) map.set(item.id, item)
  }

  for (const item of localList) {
    if (!item?.id) continue
    if (keepLocalPending && item._pendingSync && !map.has(item.id)) {
      map.set(item.id, item)
    }
  }

  return Array.from(map.values())
}

/** Gruppen nach ID zusammenführen — bei leerer Cloud-Antwort Cache behalten. */
export function mergeGroups(remote = [], cached = []) {
  const remoteList = Array.isArray(remote) ? remote : []
  const cachedList = Array.isArray(cached) ? cached : []

  if (!remoteList.length && cachedList.length) return cachedList

  const map = new Map(cachedList.map((g) => [g.id, g]))
  for (const group of remoteList) {
    if (group?.id) {
      map.set(group.id, { ...map.get(group.id), ...group })
    }
  }
  return Array.from(map.values())
}

/** Favoriten nach Name+Kategorie zusammenführen. */
export function mergeFavorites(remote = [], local = []) {
  const key = (f) => `${f.name || f.product_name}::${f.category}`
  const map = new Map()

  for (const item of local) map.set(key(item), item)
  for (const item of remote) {
    const k = key(item)
    const prev = map.get(k)
    map.set(k, prev ? { ...prev, ...item, use_count: Math.max(Number(prev.use_count || 0), Number(item.use_count || 0)) } : item)
  }
  return Array.from(map.values())
}

/** Nur definierte Felder für Updates — undefined-Werte werden nicht geschrieben. */
export function pickDefinedFields(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}
