import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  localGetSession,
  localLogin,
  localLogout,
  localRegister,
  localUpdateProfile,
} from '../lib/localStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState(isSupabaseConfigured ? 'supabase' : 'local')

  useEffect(() => {
    let unsubscribe

    async function init() {
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        setMode('supabase')

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null)
        })
        unsubscribe = () => subscription.unsubscribe()
        setLoading(false)
        return
      }

      const session = localGetSession()
      if (session) {
        setUser({
          id: session.id,
          email: session.email,
          user_metadata: { display_name: session.display_name },
        })
      }
      setMode('local')
      setLoading(false)
    }

    init()
    return () => unsubscribe?.()
  }, [])

  const signUp = async (email, password, displayName) => {
    if (mode === 'supabase' && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName || email.split('@')[0] } },
      })
      if (error) return { error }
      if (data.user && !data.session) {
        return { user: data.user, needsConfirmation: true }
      }
      setUser(data.user)
      return { user: data.user }
    }
    const result = localRegister(email, password, displayName)
    if (result.error) return result
    setUser({
      id: result.user.id,
      email: result.user.email,
      user_metadata: { display_name: result.user.display_name },
    })
    return result
  }

  const signIn = async (email, password) => {
    if (mode === 'supabase' && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error }
      setUser(data.user)
      return { user: data.user }
    }
    const result = localLogin(email, password)
    if (result.error) return result
    setUser({
      id: result.user.id,
      email: result.user.email,
      user_metadata: { display_name: result.user.display_name },
    })
    return result
  }

  const signOut = async () => {
    if (mode === 'supabase' && supabase) {
      await supabase.auth.signOut()
    } else {
      localLogout()
    }
    setUser(null)
  }

  const resetPassword = async (email) => {
    if (mode === 'supabase' && supabase) {
      const redirectTo = `${window.location.origin}/auth?reset=1`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) return { error }
      return { success: true }
    }
    return { error: { message: 'Passwort-Reset nur mit Supabase (Online-Modus) verfügbar.' } }
  }

  const updateProfile = async ({ displayName }) => {
    if (mode === 'supabase' && supabase && user) {
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      })
      if (error) return { error }
      setUser(data.user)
      return { user: data.user }
    }
    const result = localUpdateProfile(user?.id, { display_name: displayName })
    if (result.error) return result
    setUser((u) => ({
      ...u,
      user_metadata: { ...u.user_metadata, display_name: displayName },
    }))
    return { success: true }
  }

  const displayName =
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Benutzer'

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        displayName,
        mode,
        isSupabaseConfigured,
        isOnline: mode === 'supabase' && isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden')
  return ctx
}
