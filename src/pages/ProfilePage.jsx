import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useToast } from '../context/ToastContext'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import UsernameInput from '../components/ui/UsernameInput'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Section from '../components/ui/Section'

export default function ProfilePage() {
  const { user, displayName, updateProfile, isSupabaseConfigured } = useAuth()
  const { profile, loading, saveProfile, enabled, needsUsername } = useProfile()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [name, setName] = useState(displayName)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.username) setUsername(profile.username)
    if (profile?.display_name) setName(profile.display_name)
  }, [profile])

  if (!isSupabaseConfigured || !enabled) {
    return (
      <Card>
        <p className="text-muted">
          Profil & Benutzername erfordern Supabase. Persönliche Aufgaben funktionieren weiterhin lokal.
        </p>
      </Card>
    )
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await saveProfile({ username, display_name: name })
      await updateProfile({ displayName: name })
      toast('Profil gespeichert', 'success')
      if (needsUsername) navigate('/app/family')
    } catch (err) {
      toast(err.message || 'Speichern fehlgeschlagen', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Profil</h1>
        <p className="text-sm text-muted">Benutzername & Anzeigename</p>
      </div>

      <Card>
        <Section icon={User} title="Dein Account">
          {loading ? (
            <p className="text-muted">Lädt…</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar name={name} username={username || profile?.username} size="lg" />
                <div>
                  <p className="font-medium text-primary">{name}</p>
                  <p className="text-sm text-muted">{user?.email}</p>
                  {profile?.username && <p className="text-sm text-indigo-300">@{profile.username}</p>}
                </div>
              </div>
              <UsernameInput value={username || profile?.username || ''} onChange={setUsername} />
              <Input label="Anzeigename" value={name} onChange={(e) => setName(e.target.value)} />
              <Button type="submit" disabled={saving}>
                {saving ? 'Speichern…' : 'Profil speichern'}
              </Button>
            </form>
          )}
        </Section>
      </Card>
    </div>
  )
}
