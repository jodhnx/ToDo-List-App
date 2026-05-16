import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { getSettings, saveSettings } from '../lib/settings'
import { applyThemeToDocument, DEFAULT_THEME_ID, getTheme } from '../lib/themes'

const ThemeContext = createContext(null)

function normalizeThemeId(themeId) {
  return getTheme(themeId).id || DEFAULT_THEME_ID
}

export function ThemeProvider({ children }) {
  const { user, mode } = useAuth()
  const [themeId, setThemeId] = useState(() => normalizeThemeId(getSettings().themeId))
  const [saving, setSaving] = useState(false)

  const theme = useMemo(() => getTheme(themeId), [themeId])

  useEffect(() => {
    applyThemeToDocument(theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false
    async function loadAccountTheme() {
      if (!user?.id || mode !== 'supabase' || !supabase) return
      const { data, error } = await supabase
        .from('profiles')
        .select('app_theme')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled || error || !data?.app_theme) return
      const accountThemeId = normalizeThemeId(data.app_theme)
      setThemeId(accountThemeId)
      saveSettings({ themeId: accountThemeId })
    }

    loadAccountTheme()
    return () => {
      cancelled = true
    }
  }, [mode, user?.id])

  const setTheme = useCallback(
    async (nextThemeId) => {
      const normalizedThemeId = normalizeThemeId(nextThemeId)
      setThemeId(normalizedThemeId)
      saveSettings({ themeId: normalizedThemeId })

      if (!user?.id || mode !== 'supabase' || !supabase) return { success: true }

      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({ app_theme: normalizedThemeId })
        .eq('id', user.id)
      setSaving(false)

      if (error) return { error }
      return { success: true }
    },
    [mode, user?.id],
  )

  const toggleTheme = useCallback(() => {
    const next = theme.mode === 'dark' ? 'modern-light' : 'modern-dark'
    return setTheme(next)
  }, [setTheme, theme.mode])

  const value = useMemo(
    () => ({ theme, themeId, setTheme, saving, isDark: theme.mode === 'dark', toggleTheme }),
    [setTheme, saving, theme, themeId, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme muss innerhalb von ThemeProvider verwendet werden')
  return ctx
}
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'focus_theme'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem(STORAGE_KEY) || 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme muss innerhalb von ThemeProvider verwendet werden')
  return ctx
}
