import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getSettings, saveSettings } from '../../lib/settings'
import Input from '../ui/Input'
import PasswordInput from '../ui/PasswordInput'
import UsernameInput from '../ui/UsernameInput'
import Button from '../ui/Button'
import { checkUsernameAvailable } from '../../lib/username'

const tabs = [
  { id: 'login', label: 'Anmelden' },
  { id: 'register', label: 'Registrieren' },
]

export default function AuthForm() {
  const [tab, setTab] = useState('login')
  const [showReset, setShowReset] = useState(false)
  const [remember, setRemember] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState('')

  const { signIn, signUp, resetPassword, signInWithGoogle, signInWithApple, isSupabaseConfigured } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const isRegister = tab === 'register'

  useEffect(() => {
    const saved = getSettings().rememberEmail
    if (saved) setEmail(saved)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    if (showReset) {
      const result = await resetPassword(email)
      setLoading(false)
      if (result.error) setError(result.error.message)
      else {
        setInfo('Link wurde gesendet — prüfe dein Postfach.')
        toast('E-Mail gesendet', 'success')
      }
      return
    }

    if (remember) saveSettings({ rememberEmail: email })

    if (isRegister && isSupabaseConfigured) {
      const check = await checkUsernameAvailable(username)
      if (!check.available) {
        setLoading(false)
        setError(check.error || 'Benutzername nicht verfügbar')
        return
      }
    }

    const result = isRegister
      ? await signUp(email, password, displayName, username)
      : await signIn(email, password)

    setLoading(false)
    if (result.error) {
      setError(result.error.message || 'Ein Fehler ist aufgetreten.')
      return
    }
    if (result.needsConfirmation) {
      setTab('login')
      setInfo('Registrierung erfolgreich! Bestätige die E-Mail — danach kannst du dich jederzeit anmelden.')
      return
    }
    navigate('/app')
  }

  const handleOAuth = async (provider) => {
    setError('')
    setOauthLoading(provider)
    const result = provider === 'apple' ? await signInWithApple() : await signInWithGoogle()
    setOauthLoading('')
    if (result?.error) {
      setError(
        result.error.message ||
          `${provider === 'apple' ? 'Apple' : 'Google'}-Login konnte nicht gestartet werden.`,
      )
    }
  }

  return (
    <div className="auth-panel w-full max-w-md p-6 sm:p-8">
      <AnimatePresence mode="wait">
        {showReset ? (
          <MotionPanel key="reset">
            <AuthHeader title="Passwort zurücksetzen" subtitle="Wir senden dir einen sicheren Link." />
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="E-Mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              {error && <Msg type="error" text={error} />}
              {info && <Msg type="info" text={info} />}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Senden…' : 'Link senden'}
              </Button>
            </form>
            <button type="button" onClick={() => setShowReset(false)} className="w-full text-sm text-indigo-400 hover:text-indigo-300">
              ← Zurück
            </button>
          </MotionPanel>
        ) : (
          <MotionPanel key="auth">
            <AuthHeader
              title={isRegister ? 'Konto erstellen' : 'Willkommen zurück'}
              subtitle={
                isRegister
                  ? 'Deine Aufgaben — privat und synchronisiert.'
                  : 'Melde dich an, um weiterzumachen.'
              }
            />

            <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTab(t.id)
                    setError('')
                  }}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                    tab === t.id ? 'bg-indigo-500/25 text-indigo-300' : 'text-muted hover:text-primary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {isSupabaseConfigured && (
              <div className="grid gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={() => handleOAuth('google')}
                  disabled={!!oauthLoading || loading}
                >
                  <GoogleIcon />
                  {oauthLoading === 'google' ? 'Google wird geöffnet…' : 'Mit Google fortfahren'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={() => handleOAuth('apple')}
                  disabled={!!oauthLoading || loading}
                >
                  <AppleIcon />
                  {oauthLoading === 'apple' ? 'Apple wird geöffnet…' : 'Mit Apple fortfahren'}
                </Button>
              </div>
            )}

            {isSupabaseConfigured && <Divider label="oder mit E-Mail" />}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <Input
                    label="Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dein Name"
                  />
                  {isSupabaseConfigured && (
                    <UsernameInput value={username} onChange={setUsername} />
                  )}
                </>
              )}
              <Input
                label="E-Mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <PasswordInput
                label="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                showStrength={isRegister}
                required
                minLength={6}
              />

              {!isRegister && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer items-center gap-2 text-muted">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="rounded text-indigo-500"
                    />
                    Angemeldet bleiben
                  </label>
                  {isSupabaseConfigured && (
                    <button
                      type="button"
                      onClick={() => setShowReset(true)}
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      Passwort vergessen?
                    </button>
                  )}
                </div>
              )}

              {error && <Msg type="error" text={error} />}
              {info && <Msg type="info" text={info} />}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? 'Lädt…' : isRegister ? 'Registrieren' : 'Anmelden'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          </MotionPanel>
        )}
      </AnimatePresence>
    </div>
  )
}

function MotionPanel({ children, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className="space-y-5"
      {...props}
    >
      {children}
    </motion.div>
  )
}

function AuthHeader({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-primary">{title}</h1>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
    </div>
  )
}

function Divider({ label }) {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/10" />
      </div>
      <p className="relative text-center text-xs text-muted">
        <span className="bg-[#141416] px-3">{label}</span>
      </p>
    </div>
  )
}

function Msg({ type, text }) {
  return (
    <p
      className={`rounded-xl px-3 py-2 text-sm ${
        type === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-300'
      }`}
    >
      {text}
    </p>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M16.37 1.43c0 1.05-.39 2.05-1.1 2.81-.78.84-1.88 1.48-2.94 1.4-.13-1.01.41-2.1 1.12-2.84.78-.82 2.1-1.44 2.92-1.37Zm3.4 16.95c-.62 1.43-.91 2.07-1.72 3.34-1.12 1.73-2.7 3.89-4.66 3.91-1.74.02-2.19-1.13-4.55-1.12-2.36.01-2.85 1.15-4.6 1.13-1.95-.02-3.44-1.96-4.56-3.69-3.13-4.86-3.46-10.56-1.53-13.59 1.37-2.15 3.54-3.42 5.58-3.42 2.08 0 3.39 1.14 5.11 1.14 1.67 0 2.69-1.15 5.1-1.15 1.82 0 3.75.99 5.11 2.7-4.49 2.46-3.76 8.87.72 10.75Z"
        transform="scale(.86) translate(2 0)"
      />
    </svg>
  )
}
