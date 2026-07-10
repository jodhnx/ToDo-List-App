import { useState, useEffect } from 'react'
import { User, Bell, Sparkles, KeyRound, Shield, Wifi, WifiOff, Code2, Download, Palette, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useTodosContext } from '../context/TodosContext'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useProfile } from '../hooks/useProfile'
import { useTheme } from '../context/ThemeContext'
import { getSettings, saveSettings, getAiApiKey, setAiApiKey } from '../lib/settings'
import { APP_THEMES } from '../lib/themes'
import { APP_BASE_VERSION, APP_CHANGELOG, APP_VERSION } from '../lib/appVersion'
import {
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
} from '../lib/notifications'
import { isBrowserOnline, clearOfflineCache, registerOfflineSupport } from '../lib/offline'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Section from '../components/ui/Section'

const settingTabs = [
  { id: 'profile', label: 'Profil' },
  { id: 'design', label: 'Design' },
  { id: 'notifications', label: 'Benachrichtigungen' },
  { id: 'ai', label: 'KI' },
  { id: 'security', label: 'Sicherheit' },
  { id: 'creator', label: 'Über diese App' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('profile')
  const { user, displayName, updateProfile, resetPassword, updatePassword, isSupabaseConfigured, mode } =
    useAuth()
  const { todos, refetch } = useTodosContext()
  const { toast } = useToast()
  const { canInstall, installed, install } = useInstallPrompt()
  const { profile } = useProfile()
  const { themeId, setTheme, saving: themeSaving } = useTheme()

  const [name, setName] = useState(displayName)
  const [prefs, setPrefs] = useState(getSettings())
  const [aiKey, setAiKey] = useState(getAiApiKey())
  const [newPassword, setNewPassword] = useState('')
  const [perm, setPerm] = useState(() => getNotificationPermission())
  const [online, setOnline] = useState(isBrowserOnline())
  const [swReady, setSwReady] = useState(false)

  useEffect(() => setName(displayName), [displayName])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    registerOfflineSupport().then(setSwReady)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const updatePrefs = (partial) => {
    setPrefs(saveSettings(partial))
  }

  const enableNotifications = async () => {
    const result = await requestNotificationPermission()
    setPerm(result)
    if (result === 'granted') toast('Benachrichtigungen aktiviert', 'success')
    else if (result === 'denied') toast('In Browser-Einstellungen erlauben', 'error')
  }

  const syncCache = async () => {
    await refetch()
    toast(`${todos.length} Aufgaben im lokalen Cache`, 'success')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="page-header">
        <h1>Einstellungen</h1>
        <p>Profil, Design, Erinnerungen und Sicherheit</p>
      </div>

      <Tabs tabs={settingTabs} active={tab} onChange={setTab} />

      {tab === 'profile' && (
        <Card className="space-y-6">
          <Section icon={User} title="Profil" description="Dein Anzeigename und Benutzername">
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
              <Input
                label="Benutzername"
                value={profile?.username ? `@${profile.username}` : 'Noch nicht gesetzt'}
                disabled
                className="opacity-50"
              />
              <Input label="E-Mail" value={user?.email || ''} disabled className="opacity-50" />
              <Button type="submit">Speichern</Button>
            </form>
          </Section>
          <Section icon={User} title="Einfacher Modus" description="Größere Schriften, größere Buttons und klarere Abstände">
            <div className="space-y-3">
              <Toggle
                label="Einfachen Modus verwenden"
                checked={!!prefs.simpleMode}
                onChange={(v) => updatePrefs({ simpleMode: v })}
              />
              <p className="text-sm text-muted">
                Ideal für Familienmitglieder, die eine ruhigere Ansicht mit großen Bedienflächen möchten.
              </p>
            </div>
          </Section>
        </Card>
      )}

      {tab === 'design' && (
        <Card className="space-y-6">
          <Section icon={Palette} title="Design & Farben" description="App Design, Theme und Darstellung auswählen">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-accentSoft)] p-4">
                <p className="text-sm font-medium text-primary">Theme auswählen</p>
                <p className="mt-1 text-sm text-muted">
                  Das Design wird lokal gespeichert und bei deinem Konto synchronisiert. Auf einem anderen Gerät wird
                  es nach der Anmeldung automatisch geladen.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {APP_THEMES.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    active={theme.id === themeId}
                    disabled={themeSaving}
                    onSelect={async () => {
                      const result = await setTheme(theme.id)
                      if (result?.error) {
                        toast(
                          'Design lokal gespeichert. Für Konto-Sync bitte die neue Theme-Migration in Supabase ausführen.',
                          'info',
                        )
                      } else {
                        toast(`Design "${theme.name}" gespeichert`, 'success')
                      }
                    }}
                  />
                ))}
              </div>

              <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-input)] p-4">
                <p className="text-sm font-medium text-primary">Seniorenfreundlich & High Contrast</p>
                <p className="mt-1 text-sm text-muted">
                  Diese Designs vergrößern zusätzlich Schrift, Bedienflächen und Rahmen für eine besonders klare
                  Bedienung.
                </p>
              </div>
            </div>
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
              <p className="text-xs text-muted">Ohne Key: lokaler Tagesplan & Vorschläge. Mit Key: OpenAI.</p>
              <Button onClick={() => { setAiApiKey(aiKey); toast('Gespeichert', 'success') }}>Speichern</Button>
            </div>
          </Section>
        </Card>
      )}

      {tab === 'security' && (
        <Card className="space-y-6">
          <Section icon={Download} title="App installieren" description="Focus wie eine native App öffnen">
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div>
                <p className="font-medium text-primary">
                  {installed ? 'Focus ist als App installiert' : 'Focus zum Home-Bildschirm hinzufügen'}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Auf iPhone: In Safari teilen → „Zum Home-Bildschirm“. Danach startet Focus fullscreen ohne URL-Bar
                  und ohne Safari-Bottom-Bar.
                </p>
              </div>
              {canInstall && (
                <Button
                  onClick={async () => {
                    const accepted = await install()
                    toast(accepted ? 'Installation gestartet' : 'Installation abgebrochen', accepted ? 'success' : 'info')
                  }}
                >
                  App installieren
                </Button>
              )}
            </div>
          </Section>

          <Section icon={Shield} title="Offline & Datenschutz" description="Aufgaben bleiben auf diesem Gerät gespeichert">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  {online ? <Wifi className="h-5 w-5 text-emerald-400" /> : <WifiOff className="h-5 w-5 text-amber-400" />}
                  <div>
                    <p className="font-medium text-primary">{online ? 'Online' : 'Offline'}</p>
                    <p className="text-xs text-muted">
                      {mode === 'local'
                        ? 'Nur lokaler Modus — alles bleibt auf dem Gerät'
                        : online
                          ? 'Cloud-Sync aktiv · Cache als Backup'
                          : 'Kein Netz — du arbeitest mit dem lokalen Cache'}
                    </p>
                  </div>
                </div>
              </div>

              <Toggle
                label="Offline-Cache nutzen"
                checked={prefs.offlineCache !== false}
                onChange={(v) => updatePrefs({ offlineCache: v })}
              />

              <p className="text-xs text-muted">
                {swReady
                  ? 'App-Oberfläche ist für Offline-Nutzung zwischengespeichert. Aufgaben werden automatisch lokal gesichert.'
                  : 'Offline-Modus: Aufgaben werden in localStorage gespeichert (funktioniert auch ohne Service Worker).'}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={syncCache}>
                  Cache aktualisieren
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await clearOfflineCache()
                    await registerOfflineSupport()
                    toast('App-Cache geleert', 'info')
                  }}
                >
                  App-Cache leeren
                </Button>
              </div>

              <p className="text-xs text-muted">
                Hinweis: KI mit OpenAI und Cloud-Login benötigen Internet. Tagesplan und Aufgaben ohne API-Key funktionieren offline.
              </p>
            </div>
          </Section>

          {isSupabaseConfigured && (
            <Section icon={KeyRound} title="Konto & Passwort">
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const r = await resetPassword(user?.email)
                  if (r.error) toast(r.error.message, 'error')
                  else toast('Link gesendet', 'success')
                }}
                className="mb-6 space-y-3"
              >
                <p className="text-sm text-muted">Passwort zurücksetzen per E-Mail</p>
                <Button type="submit" variant="secondary">
                  Reset-Link senden
                </Button>
              </form>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const r = await updatePassword(newPassword)
                  if (r.error) toast(r.error.message, 'error')
                  else {
                    toast('Passwort aktualisiert', 'success')
                    setNewPassword('')
                  }
                }}
                className="space-y-3"
              >
                <Input
                  label="Neues Passwort"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                />
                <Button type="submit">Passwort ändern</Button>
              </form>
            </Section>
          )}
        </Card>
      )}

      {tab === 'creator' && (
        <Card>
          <Section icon={Code2} title="Creator" description="Über diese App">
            <div className="space-y-4">
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5">
                <p className="text-sm text-muted">Diese App wurde erstellt von</p>
                <h2 className="mt-1 text-2xl font-bold text-primary">Benjamin Streitriegl</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Focus wurde entwickelt, um Aufgaben, Familienorganisation und Einkaufslisten einfach, modern und
                  übersichtlich an einem Ort zu verwalten.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-primary">App-Version</p>
                <p className="mt-1 text-2xl font-bold text-indigo-300">v{APP_VERSION}</p>
                <p className="mt-1 text-xs text-muted">Startwert: v{APP_BASE_VERSION}</p>
                <p className="mt-4 text-sm font-medium text-primary">Zuletzt geändert</p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted">
                  {APP_CHANGELOG.map((entry) => (
                    <li key={entry}>- {entry}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>
        </Card>
      )}
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-4 py-3 transition hover:bg-[var(--theme-accentSoft)]">
      <span className="text-sm font-medium text-primary">{label}</span>
      <span className="relative inline-flex h-7 w-12 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-[var(--theme-border)] transition peer-checked:bg-[var(--theme-accent)]" />
        <span className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

function ThemeCard({ theme, active, disabled, onSelect }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`group rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? 'border-[var(--theme-accent)] bg-[var(--theme-accentSoft)] shadow-lg'
          : 'border-[var(--theme-border)] bg-[var(--theme-input)] hover:border-[var(--theme-accent)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-primary">{theme.name}</p>
          <p className="mt-1 text-sm text-muted">{theme.description}</p>
        </div>
        {active && <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--theme-accent)]" />}
      </div>

      <div className="mt-4 flex gap-2">
        {theme.preview.map((color) => (
          <span
            key={color}
            className="h-8 flex-1 rounded-xl border border-white/20 shadow-sm"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="rounded-full bg-[var(--theme-card)] px-3 py-1 text-xs font-medium text-muted">
          {theme.mode === 'dark' ? 'Dark' : 'Light'}
        </span>
        {theme.senior && (
          <span className="rounded-full bg-[var(--theme-accentSoft)] px-3 py-1 text-xs font-medium text-primary">
            Extra groß
          </span>
        )}
      </div>
    </button>
  )
}
