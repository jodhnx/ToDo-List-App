const PREFIX = 'focus_settings_'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export function getSettings() {
  return read('prefs', {
    notifications: false,
    notifyOverdue: true,
    notifyToday: true,
    notifyMorning: true,
    morningHour: 8,
    rememberEmail: '',
    offlineCache: true,
    simpleMode: false,
    themeId: 'modern-dark',
  })
}

export function saveSettings(partial) {
  const next = { ...getSettings(), ...partial }
  write('prefs', next)
  window.dispatchEvent?.(new CustomEvent('focus-settings-change', { detail: next }))
  return next
}

export function getAiApiKey() {
  return import.meta.env.VITE_OPENAI_API_KEY || read('ai_key', '') || ''
}

export function setAiApiKey(key) {
  write('ai_key', key?.trim() || '')
}
