import { supabase, isSupabaseConfigured } from './supabase'
import { normalizeUsername } from './username'

export async function fetchProfile(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchProfileByUsername(username) {
  if (!isSupabaseConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', normalizeUsername(username))
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertProfile({ id, username, display_name, avatar_url }) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase erforderlich')
  const row = {
    id,
    username: normalizeUsername(username),
    display_name: display_name || null,
    avatar_url: avatar_url || null,
  }
  const { data, error } = await supabase.from('profiles').upsert(row).select().single()
  if (error) throw error
  return data
}

export async function updateProfileFields(userId, fields) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase erforderlich')
  const patch = { ...fields }
  if (patch.username) patch.username = normalizeUsername(patch.username)
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', userId).select().single()
  if (error) throw error
  return data
}

export async function searchProfilesByUsernamePrefix(prefix, limit = 8) {
  if (!isSupabaseConfigured || !supabase || !prefix) return []
  const q = normalizeUsername(prefix)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `${q}%`)
    .limit(limit)
  if (error) throw error
  return data || []
}
