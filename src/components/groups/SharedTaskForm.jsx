import { useState } from 'react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { GROUP_CATEGORIES, GROUP_PRIORITIES } from '../../lib/groupConstants'
import { resolveMemberByUsername } from '../../lib/groupApi'
import SpeechInputButton from '../ui/SpeechInputButton'
import { requestNotificationPermission } from '../../lib/notifications'
import { saveSettings } from '../../lib/settings'
import { HOUSEHOLD_TASK_SUGGESTIONS } from '../../lib/householdTasks'

const empty = {
  title: '',
  description: '',
  category: 'other',
  priority: 'mittel',
  due_date: '',
  due_time: '',
  useTime: false,
  assignee_username: '',
  notify_enabled: false,
  reminder_date: '',
  reminder_time: '',
  reminder_repeat: false,
  reminder_early: true,
  reminder_sound: 'standard',
}

const soundOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'soft', label: 'Sanft' },
  { value: 'clear', label: 'Deutlich' },
]

function toDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function toTimeInput(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function buildReminderAt(form) {
  if (!form.notify_enabled || !form.reminder_date || !form.reminder_time) return null
  const date = new Date(`${form.reminder_date}T${form.reminder_time}`)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export default function SharedTaskForm({ members, onSubmit, submitting }) {
  const [form, setForm] = useState(empty)
  const [assignError, setAssignError] = useState('')

  const change = (field) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => {
      const next = { ...f, [field]: v }
      if (field === 'notify_enabled' && v) {
        const fallback = new Date(Date.now() + 60 * 60 * 1000)
        next.reminder_date = next.reminder_date || next.due_date || toDateInput(fallback)
        next.reminder_time = next.reminder_time || next.due_time || toTimeInput(fallback)
      }
      if (field === 'notify_enabled' && !v) {
        next.reminder_date = ''
        next.reminder_time = ''
        next.reminder_repeat = false
        next.reminder_early = true
      }
      return next
    })
    if (field === 'assignee_username') setAssignError('')
  }

  const enableNotification = async (checked) => {
    change('notify_enabled')({ target: { type: 'checkbox', checked } })
    if (checked) {
      const permission = await requestNotificationPermission()
      if (permission === 'granted') saveSettings({ notifications: true })
    }
  }

  const appendField = (field, text) => {
    const clean = String(text || '').trim()
    if (!clean) return
    setForm((f) => ({ ...f, [field]: f[field] ? `${f[field].trim()} ${clean}` : clean }))
  }

  const submitTaskPayload = async (payload) => {
    await onSubmit(payload)
    setForm(empty)
    setAssignError('')
  }

  const applyHouseholdTask = async (task) => {
    if (submitting) return
    const payload = {
      title: task.title,
      description: '',
      category: task.groupCategory,
      priority: task.priority,
      due_date: null,
      due_time: null,
      notify_enabled: false,
      reminder_at: null,
      reminder_repeat: false,
      reminder_early: true,
      reminder_sound: 'standard',
      assignee_id: null,
      status: 'open',
    }
    setForm((f) => ({
      ...f,
      title: task.title,
      category: task.groupCategory,
      priority: task.priority,
    }))
    await submitTaskPayload(payload)
  }

  const handleHouseholdSelect = (e) => {
    const task = HOUSEHOLD_TASK_SUGGESTIONS.find((item) => item.title === e.target.value)
    if (task) applyHouseholdTask(task)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return

    let assignee_id = null
    const uname = form.assignee_username.trim()
    if (uname) {
      const member = resolveMemberByUsername(members, uname)
      if (!member) {
        setAssignError('Mitglied nicht in dieser Gruppe — nur @username aus der Gruppe')
        return
      }
      assignee_id = member.user_id
    }

    await submitTaskPayload({
      title: form.title.trim(),
      description: form.description,
      category: form.category,
      priority: form.priority,
      due_date: form.due_date || null,
      due_time: form.due_date && form.useTime && form.due_time ? form.due_time : null,
      notify_enabled: !!assignee_id && !!form.notify_enabled,
      reminder_at: assignee_id ? buildReminderAt(form) : null,
      reminder_repeat: !!assignee_id && !!form.reminder_repeat,
      reminder_early: !!assignee_id && !!form.reminder_early,
      reminder_sound: form.reminder_sound,
      assignee_id,
      status: 'open',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
        <p className="text-sm font-semibold text-emerald-100">Schnelle Familien-Aufgaben</p>
        <p className="mt-1 text-xs text-emerald-100/75">Aufgabe auswählen und bei Bedarf einem Mitglied zuweisen.</p>
        <select
          value=""
          onChange={handleHouseholdSelect}
          className="input-field mt-3 min-h-12 bg-black/10 text-base font-semibold"
        >
          <option value="">Schnell-Aufgabe auswählen...</option>
          {HOUSEHOLD_TASK_SUGGESTIONS.map((task) => (
            <option key={task.title} value={task.title}>
              {task.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Input label="Titel" value={form.title} onChange={change('title')} required />
        <SpeechInputButton label="Titel diktieren" onTranscript={(text) => appendField('title', text)} />
      </div>
      <div className="space-y-2">
        <textarea
          value={form.description}
          onChange={change('description')}
          rows={2}
          placeholder="Beschreibung (optional)"
          className="input-field resize-none"
        />
        <SpeechInputButton
          label="Beschreibung diktieren"
          onTranscript={(text) => appendField('description', text)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Kategorie"
          value={form.category}
          onChange={change('category')}
          options={GROUP_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
        />
        <Select
          label="Priorität"
          value={form.priority}
          onChange={change('priority')}
          options={GROUP_PRIORITIES}
        />
      </div>
      <Input label="Fällig am" type="date" value={form.due_date} onChange={change('due_date')} />
      {form.due_date && (
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={form.useTime} onChange={change('useTime')} className="rounded text-indigo-500" />
          Uhrzeit angeben
        </label>
      )}
      {form.due_date && form.useTime && (
        <Input label="Uhrzeit" type="time" value={form.due_time} onChange={change('due_time')} />
      )}

      <div>
        <Input
          label="Zuweisen an (@username)"
          value={form.assignee_username}
          onChange={change('assignee_username')}
          placeholder="z.B. max_mustermann"
        />
        <p className="mt-1 text-xs text-muted">
          Jeder in der Gruppe kann Aufgaben an ein bestimmtes Mitglied vergeben.
        </p>
        {assignError && <p className="mt-1 text-xs text-rose-400">{assignError}</p>}
        {members.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {members.map((m) => (
              <button
                key={m.user_id}
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, assignee_username: m.profile?.username || '' }))
                  setAssignError('')
                }}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-indigo-300 hover:border-indigo-500/40"
              >
                @{m.profile?.username}
              </button>
            ))}
          </div>
        )}
      </div>

      {form.assignee_username.trim() && (
        <div className="space-y-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
            <input
              type="checkbox"
              checked={form.notify_enabled}
              onChange={(e) => enableNotification(e.target.checked)}
              className="rounded text-indigo-500"
            />
            Benachrichtigung an diese Person senden
          </label>
          {form.notify_enabled && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Datum"
                  type="date"
                  value={form.reminder_date}
                  onChange={change('reminder_date')}
                  required
                />
                <Input
                  label="Uhrzeit"
                  type="time"
                  value={form.reminder_time}
                  onChange={change('reminder_time')}
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={form.reminder_repeat}
                    onChange={change('reminder_repeat')}
                    className="rounded text-indigo-500"
                  />
                  Erinnerung wiederholen
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={form.reminder_early}
                    onChange={change('reminder_early')}
                    className="rounded text-indigo-500"
                  />
                  10 Minuten vorher erinnern
                </label>
              </div>
              <Select
                label="Erinnerungston"
                value={form.reminder_sound}
                onChange={change('reminder_sound')}
                options={soundOptions}
              />
              <p className="text-xs text-muted">
                Beispiel: „Mama erinnert dich an: Müll rausbringen um 18:00“.
              </p>
            </>
          )}
        </div>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Speichern…' : 'Aufgabe hinzufügen'}
      </Button>
    </form>
  )
}
