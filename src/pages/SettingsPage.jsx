import { useState } from 'react'
import { ExternalLink, Cloud, User, KeyRound, Rocket } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function SettingsPage() {
  const { user, displayName, updateProfile, resetPassword, isOnline, isSupabaseConfigured } =
    useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(displayName)
  const [resetEmail, setResetEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    const result = await updateProfile({ displayName: name })
    setSaving(false)
    if (result.error) toast(result.error.message, 'error')
    else toast('Profil gespeichert', 'success')
  }

  const sendReset = async (e) => {
    e.preventDefault()
    const result = await resetPassword(resetEmail)
    if (result.error) toast(result.error.message, 'error')
    else toast('Reset-Link wurde an deine E-Mail gesendet', 'success')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Einstellungen</h1>
        <p className="text-sm text-muted">Profil und Cloud-Verbindung</p>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-indigo-400" />
          <h2 className="font-semibold text-primary">Profil</h2>
        </div>
        <form onSubmit={saveProfile} className="space-y-4">
          <Input label="Anzeigename" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="E-Mail" value={user?.email || ''} disabled className="opacity-60" />
          <Button type="submit" disabled={saving}>
            {saving ? 'Speichern…' : 'Speichern'}
          </Button>
        </form>
      </Card>

      {isSupabaseConfigured && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-400" />
            <h2 className="font-semibold text-primary">Passwort zurücksetzen</h2>
          </div>
          <form onSubmit={sendReset} className="space-y-4">
            <Input
              label="E-Mail"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="secondary">
              Reset-Link senden
            </Button>
          </form>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Cloud className="h-5 w-5 text-indigo-400" />
          <h2 className="font-semibold text-primary">Cloud-Status</h2>
        </div>
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            isOnline ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
          }`}
        >
          {isOnline
            ? '✓ Online-Modus aktiv — mehrere Benutzer können sich registrieren und von überall auf ihre Daten zugreifen.'
            : 'Lokaler Modus — Daten nur in diesem Browser. Für Online-Betrieb Supabase konfigurieren und deployen.'}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Rocket className="h-5 w-5 text-indigo-400" />
          <h2 className="font-semibold text-primary">App online stellen</h2>
        </div>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Supabase-Projekt + <code className="text-primary">schema.sql</code> ausführen</li>
          <li>
            Unter Authentication → URL Configuration: Site URL = deine Deploy-URL, Redirect URLs
            hinzufügen
          </li>
          <li>
            Bei Vercel/Netlify: <code className="text-primary">VITE_SUPABASE_URL</code> und{' '}
            <code className="text-primary">VITE_SUPABASE_ANON_KEY</code> als Umgebungsvariablen
          </li>
          <li>
            <code className="text-primary">npm run build</code> — fertig für alle Nutzer
          </li>
        </ol>
        <a
          href="https://vercel.com/new"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
        >
          Auf Vercel deployen <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Card>
    </div>
  )
}
