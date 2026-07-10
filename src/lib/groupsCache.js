const PREFIX = 'focus_groups_cache_'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* quota exceeded — ignore */
  }
}

export function getCachedGroups(userId) {
  if (!userId) return []
  const entry = read(userId, null)
  if (!entry || !Array.isArray(entry.groups)) return []
  return entry.groups
}

export function setCachedGroups(userId, groups) {
  if (!userId) return
  write(userId, { groups, savedAt: Date.now() })
}

export function getGroupsCacheAge(userId) {
  const entry = read(userId, null)
  if (!entry?.savedAt) return Infinity
  return Date.now() - entry.savedAt
}
