import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Card from '../ui/Card'

/** Login, Registrierung und Passwort-Reset */
export default function AuthForm() {
  const [isRegister, setIsRegister] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, resetPassword, isSupabaseConfigured, isOnline } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

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
        setInfo('Prüfe dein Postfach für den Reset-Link.')
        toast('E-Mail gesendet', 'success')
      }
      return
    }

    const result = isRegister
      ? await signUp(email, password, displayName)
      : await signIn(email, password)

    setLoading(false)

    if (result.error) {
      setError(result.error.message || 'Ein Fehler ist aufgetreten.')
      return
    }

    if (result.needsConfirmation) {
      setInfo('Bestätige deine E-Mail, dann kannst du dich anmelden.')
      return
    }

    navigate('/app')
  }

  return (
    <Card className="w-full max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-primary">
          {showReset ? 'Passwort vergessen' : isRegister ? 'Konto erstellen' : 'Willkommen zurück'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {showReset
            ? 'Wir senden dir einen Link zum Zurücksetzen.'
            : isRegister
              ? 'Registriere dich — deine Daten sind nur für dich sichtbar.'
              : 'Melde dich an und synchronisiere von überall.'}
        </p>
        {isOnline && (
          <p className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            Cloud-Modus aktiv — mehrere Benutzer können die App online nutzen.
          </p>
        )}
        {!isSupabaseConfigured && (
          <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            Lokaler Modus. Für Online-Zugriff: Supabase in .env eintragen und deployen.
          </p>
        )}
        {searchParams.get('reset') === '1' && (
          <p className="mt-2 text-xs text-indigo-300">Du kannst jetzt ein neues Passwort setzen (Supabase-Link).</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && !showReset && (
          <Input
            label="Anzeigename"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Max"
          />
        )}
        <Input
          label="E-Mail"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@beispiel.de"
          required
          autoComplete="email"
        />
        {!showReset && (
          <Input
            label="Passwort"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
        )}

        {error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{error}</p>
        )}
        {info && (
          <p className="rounded-lg bg-indigo-500/10 px-3 py-2 text-sm text-indigo-300">{info}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Lädt…' : showReset ? 'Link senden' : isRegister ? 'Registrieren' : 'Anmelden'}
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-muted">
        {!showReset && isSupabaseConfigured && (
          <button
            type="button"
            onClick={() => {
              setShowReset(true)
              setError('')
            }}
            className="block w-full font-medium text-indigo-400 hover:text-indigo-300"
          >
            Passwort vergessen?
          </button>
        )}
        {showReset ? (
          <button
            type="button"
            onClick={() => setShowReset(false)}
            className="font-medium text-indigo-400 hover:text-indigo-300"
          >
            Zurück zum Login
          </button>
        ) : (
          <p>
            {isRegister ? 'Bereits ein Konto?' : 'Noch kein Konto?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister)
                setError('')
              }}
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              {isRegister ? 'Anmelden' : 'Registrieren'}
            </button>
          </p>
        )}
      </div>
    </Card>
  )
}
