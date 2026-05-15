import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchProfile, upsertProfile, updateProfileFields } from '../lib/profiles'
import { groupsEnabled } from '../lib/groupApi'

export function useProfile() {
  const { user, mode } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsUsername, setNeedsUsername] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id || !groupsEnabled()) {
      setProfile(null)
      setNeedsUsername(false)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const p = await fetchProfile(user.id)
      setProfile(p)
      setNeedsUsername(!p?.username)
    } catch (err) {
      setProfile(null)
      const missing = err?.code === '42P01' || /does not exist/i.test(err?.message || '')
      setNeedsUsername(!missing)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  const saveProfile = async ({ username, display_name, avatar_url }) => {
    if (!user?.id) throw new Error('Nicht angemeldet')
    const data = profile
      ? await updateProfileFields(user.id, { username, display_name, avatar_url })
      : await upsertProfile({ id: user.id, username, display_name, avatar_url })
    setProfile(data)
    setNeedsUsername(false)
    return data
  }

  return {
    profile,
    loading,
    needsUsername,
    saveProfile,
    refetch: load,
    enabled: groupsEnabled() && mode === 'supabase',
  }
}
