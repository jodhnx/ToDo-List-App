import { supabase, isSupabaseConfigured } from './supabase'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/

export function normalizeUsername(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
}

export function validateUsernameFormat(username) {
  if (!username) return 'Benutzername eingeben'
  if (!USERNAME_RE.test(username)) {
    return 'Nur Buchstaben, Zahlen und Unterstrich (3–24 Zeichen)'
  }
  return null
}

/** Live-Verfügbarkeit prüfen */
export async function checkUsernameAvailable(username) {
  const name = normalizeUsername(username)
  const formatErr = validateUsernameFormat(name)
  if (formatErr) return { available: false, error: formatErr }

  if (!isSupabaseConfigured || !supabase) {
    return { available: true, username: name }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', name)
    .maybeSingle()

  if (error) return { available: false, error: error.message }
  return { available: !data, username: name }
}

export function usernameFromEmail(email) {
  const base = (email || 'user').split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20)
  return base.length >= 3 ? base : `user_${Date.now().toString(36).slice(-4)}`
}
