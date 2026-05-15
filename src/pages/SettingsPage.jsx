import { useState, useEffect } from 'react'
import { User, Bell, Sparkles, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getSettings, saveSettings, getAiApiKey, setAiApiKey } from '../lib/settings'
import {
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
} from '../lib/notifications'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Section from '../components/ui/Section'

const settingTabs = [
  { id: 'profile', label: 'Profil' },
  { id: 'notifications', label: 'Benachrichtigungen' },
  { id: 'ai', label: 'KI' },
  { id: 'security', label: 'Sicherheit' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('profile')
  const { user, displayName, updateProfile, resetPassword, updatePassword, isSupabaseConfigured } =
    useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(displayName)
  const [prefs, setPrefs] = useState(getSettings())
  const [aiKey, setAiKey] = useState(getAiApiKey())
  const [newPassword, setNewPassword] = useState('')
  const [perm, setPerm] = useState(getNotificationPermission())

  useEffect(() => setName(displayName), [displayName])

  const updatePrefs = (partial) => {
    setPrefs(saveSettings(partial))
  }

  const enableNotifications = async () => {
    const result = await requestNotificationPermission()
    setPerm(result)
    if (result === 'granted') toast('Benachrichtigungen aktiviert', 'success')
    else if (result === 'denied') toast('In Browser-Einstellungen erlauben', 'error')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Einstellungen</h1>
        <p className="text-sm text-muted">Profil, Erinnerungen und KI</p>
      </div>

      <Tabs tabs={settingTabs} active={tab} onChange={setTab} />

      {tab === 'profile' && (
        <Card>
          <Section icon={User} title="Profil" description="Dein Anzeigename">
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const r = await updateProfile({ displayName: name })
                if (r.error) toast(r.error.message, 'error')
                else toast('Gespeichert', 'success')
              }}
              className="space-y-4"
            >
              <Input label="Anzeigename" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="E-Mail" value={user?.email || ''} disabled className="opacity-50" />
              <Button type="submit">Speichern</Button>
            </form>
          </Section>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card>
          <Section icon={Bell} title="Push-Benachrichtigungen" description="Erinnerungen für Aufgaben">
            <div className="space-y-4">
              {!isNotificationSupported() ? (
                <p className="text-sm text-muted">Nicht unterstützt in diesem Browser.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div>
                      <p className="font-medium text-primary">Status</p>
                      <p className="text-xs capitalize text-muted">{perm}</p>
                    </div>
                    {perm !== 'granted' && <Button size="sm" onClick={enableNotifications}>Aktivieren</Button>}
                  </div>
                  <Toggle label="Aktiv" checked={prefs.notifications} onChange={(v) => updatePrefs({ notifications: v })} />
                  <Toggle label="Heute fällig" checked={prefs.notifyToday} onChange={(v) => updatePrefs({ notifyToday: v })} />
                  <Toggle label="Überfällig" checked={prefs.notifyOverdue} onChange={(v) => updatePrefs({ notifyOverdue: v })} />
                  <Toggle label="Morgen-Briefing" checked={prefs.notifyMorning} onChange={(v) => updatePrefs({ notifyMorning: v })} />
                  <Input label="Briefing-Uhrzeit" type="number" min={6} max={11} value={prefs.morningHour} onChange={(e) => updatePrefs({ morningHour: Number(e.target.value) })} />
                </>
              )}
            </div>
          </Section>
        </Card>
      )}

      {tab === 'ai' && (
        <Card>
          <Section icon={Sparkles} title="KI" description="OpenAI API-Key optional">
            <div className="space-y-4">
              <Input label="API-Key" type="password" value={aiKey} onChange={(e) => setAiKey(e.target.value)} placeholder="sk-…" />
              <p className="text-xs text-muted">Lokal ohne Key · mit Key bessere KI-Ergebnisse</p>
              <Button onClick={() => { setAiApiKey(aiKey); toast('Gespeichert', 'success') }}>Speichern</Button>
            </div>
          </Section>
        </Card>
      )}

      {tab === 'security' && isSupabaseConfigured && (
        <Card>
          <Section icon={KeyRound} title="Sicherheit">
            <form onSubmit={async (e) => { e.preventDefault(); const r = await resetPassword(user?.email); if (r.error) toast(r.error.message, 'error'); else toast('Link gesendet', 'success') }} className="mb-6 space-y-3">
              <p className="text-sm text-muted">Passwort zurücksetzen per E-Mail</p>
              <Button type="submit" variant="secondary">Reset-Link</Button>
            </form>
            <form onSubmit={async (e) => { e.preventDefault(); const r = await updatePassword(newPassword); if (r.error) toast(r.error.message, 'error'); else { toast('Aktualisiert', 'success'); setNewPassword('') } }} className="space-y-3">
              <Input label="Neues Passwort" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} />
              <Button type="submit">Ändern</Button>
            </form>
          </Section>
        </Card>
      )}
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="text-sm text-primary">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded text-indigo-500" />
    </label>
  )
}
