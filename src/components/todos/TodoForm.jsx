import { useEffect, useState, useRef } from 'react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { CATEGORIES, PRIORITIES } from '../../lib/constants'
import AITaskTools from '../ai/AITaskTools'
import { suggestTaskMeta } from '../../lib/ai'
import { requestNotificationPermission } from '../../lib/notifications'
import { saveSettings } from '../../lib/settings'
import SpeechInputButton from '../ui/SpeechInputButton'
import { HOUSEHOLD_TASK_SUGGESTIONS } from '../../lib/householdTasks'

const emptyForm = {
  title: '',
  description: '',
  category: 'privat',
  priority: 'mittel',
  due_date: '',
  due_time: '',
  useTime: false,
  reminder_date: '',
  reminder_time: '',
  useReminder: false,
  pinned: false,
}

const TEMPLATES = [
  { label: 'Lernen', title: 'Lernen: ', category: 'schule', priority: 'mittel' },
  { label: 'Training', title: 'Training — ', category: 'gym', priority: 'mittel' },
  { label: 'Meeting', title: 'Meeting: ', category: 'arbeit', priority: 'hoch' },
  { label: 'Einkauf', title: 'Einkaufen: ', category: 'privat', priority: 'niedrig' },
]

function fromInitial(initial) {
  if (!initial) return emptyForm
  const dueTime = initial.due_time ? String(initial.due_time).slice(0, 5) : ''
  const reminder = initial.reminder_at ? new Date(initial.reminder_at) : null
  const hasReminder = reminder && !Number.isNaN(reminder.getTime())
  return {
    title: initial.title || '',
    description: initial.description || '',
    category: initial.category || 'privat',
    priority: initial.priority || 'mittel',
    due_date: initial.due_date ? String(initial.due_date).slice(0, 10) : '',
    due_time: dueTime,
    useTime: !!dueTime,
    reminder_date: hasReminder ? toDateInput(reminder) : '',
    reminder_time: hasReminder ? toTimeInput(reminder) : '',
    useReminder: !!hasReminder,
    pinned: !!initial.pinned,
  }
}

function toDateInput(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toTimeInput(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function buildReminderAt(form) {
  if (!form.useReminder || !form.reminder_date || !form.reminder_time) return null
  const date = new Date(`${form.reminder_date}T${form.reminder_time}`)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function appendText(current, next) {
  const clean = String(next || '').trim()
  if (!clean) return current
  return current ? `${current.trim()} ${clean}` : clean
}

export default function TodoForm({ initial, onSubmit, onCancel, submitting = false }) {
  const [form, setForm] = useState(emptyForm)
  const suggestTimer = useRef(null)
  useEffect(() => {
    setForm(fromInitial(initial))
  }, [initial])

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => {
      const next = { ...f, [field]: value }
      if (field === 'due_date' && !value) {
        next.due_time = ''
        next.useTime = false
      }
      if (field === 'reminder_date' && !value) {
        next.reminder_time = ''
      }
      return next
    })

    if (field === 'title' && typeof value === 'string' && value.length >= 3 && !initial) {
      clearTimeout(suggestTimer.current)
      suggestTimer.current = setTimeout(async () => {
        const meta = await suggestTaskMeta(value, form.description)
        setForm((f) => (f.title === value ? { ...f, ...meta } : f))
      }, 600)
    }
  }

  const enableReminder = async (checked) => {
    setForm((f) => {
      const defaultReminder = new Date(Date.now() + 60 * 60 * 1000)
      const next = { ...f, useReminder: checked }
      if (checked && !next.reminder_date) {
        next.reminder_date = next.due_date || toDateInput(defaultReminder)
      }
      if (checked && !next.reminder_time) {
        next.reminder_time = next.due_time || toTimeInput(defaultReminder)
      }
      if (!checked) {
        next.reminder_date = ''
        next.reminder_time = ''
      }
      return next
    })

    if (checked) {
      const permission = await requestNotificationPermission()
      if (permission === 'granted') saveSettings({ notifications: true })
    }
  }

  const applyTemplate = (t) => {
    setForm((f) => ({
      ...f,
      title: t.title,
      category: t.category,
      priority: t.priority,
    }))
  }

  const applyHouseholdTask = (task) => {
    setForm((f) => ({
      ...f,
      title: task.title,
      category: task.personalCategory,
      priority: task.priority,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || submitting) return
    await onSubmit({
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      due_date: form.due_date || null,
      due_time: form.due_date && form.useTime && form.due_time ? form.due_time : null,
      reminder_at: buildReminderAt(form),
      pinned: form.pinned,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!initial && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => applyTemplate(t)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted hover:border-indigo-500/30 hover:text-indigo-300"
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <p className="text-sm font-semibold text-emerald-100">Schnelle Haushalts-Aufgaben</p>
            <p className="mt-1 text-xs text-emerald-100/75">Antippen statt tippen.</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {HOUSEHOLD_TASK_SUGGESTIONS.map((task) => (
                <button
                  key={task.title}
                  type="button"
                  onClick={() => applyHouseholdTask(task)}
                  className="min-h-11 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-white/15"
                >
                  + {task.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Input
        label="Titel"
        name="title"
        value={form.title}
        onChange={handleChange('title')}
        placeholder="Was steht an?"
        required
        autoComplete="off"
        enterKeyHint="next"
      />
      <SpeechInputButton
        label="Titel diktieren"
        onTranscript={(text) => setForm((f) => ({ ...f, title: appendText(f.title, text) }))}
      />

      <AITaskTools
        title={form.title}
        description={form.description}
        onApply={(patch) => setForm((f) => ({ ...f, ...patch }))}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-muted">Beschreibung</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange('description')}
          rows={3}
          placeholder="Optional…"
          className="input-field resize-none"
        />
        <SpeechInputButton
          label="Beschreibung diktieren"
          onTranscript={(text) => setForm((f) => ({ ...f, description: appendText(f.description, text) }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Kategorie" name="category" value={form.category} onChange={handleChange('category')} options={CATEGORIES} />
        <Select label="Priorität" name="priority" value={form.priority} onChange={handleChange('priority')} options={PRIORITIES} />
      </div>

      <Input label="Fällig am" type="date" name="due_date" value={form.due_date} onChange={handleChange('due_date')} />

      {form.due_date && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.useTime}
              onChange={handleChange('useTime')}
              className="rounded text-indigo-500"
            />
            Genaue Uhrzeit (fertig um …)
          </label>
          {form.useTime && (
            <Input
              label="Uhrzeit"
              type="time"
              name="due_time"
              value={form.due_time}
              onChange={handleChange('due_time')}
            />
          )}
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={form.useReminder}
            onChange={(e) => enableReminder(e.target.checked)}
            className="rounded text-indigo-500"
          />
          Handy-Benachrichtigung erinnern
        </label>
        {form.useReminder && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Benachrichtigungsdatum"
              type="date"
              name="reminder_date"
              value={form.reminder_date}
              onChange={handleChange('reminder_date')}
              required
            />
            <Input
              label="Benachrichtigungszeit"
              type="time"
              name="reminder_time"
              value={form.reminder_time}
              onChange={handleChange('reminder_time')}
              required
            />
          </div>
        )}
        <p className="text-xs text-muted">
          Auf dem Handy funktioniert das zuverlässig, wenn Benachrichtigungen erlaubt sind und Focus als App installiert
          oder im Browser geöffnet ist.
        </p>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={form.pinned} onChange={handleChange('pinned')} className="rounded text-indigo-500" />
        Anpinnen
      </label>

      <div className="flex gap-3 border-t border-white/10 pt-4">
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? 'Speichern…' : initial ? 'Speichern' : 'Aufgabe erstellen'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  )
}
