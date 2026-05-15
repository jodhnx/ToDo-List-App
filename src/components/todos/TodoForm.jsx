import { useEffect, useState, useRef } from 'react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { CATEGORIES, PRIORITIES } from '../../lib/constants'
import AITaskTools from '../ai/AITaskTools'
import { suggestTaskMeta } from '../../lib/ai'

const emptyForm = {
  title: '',
  description: '',
  category: 'privat',
  priority: 'mittel',
  due_date: '',
  due_time: '',
  useTime: false,
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
  return {
    title: initial.title || '',
    description: initial.description || '',
    category: initial.category || 'privat',
    priority: initial.priority || 'mittel',
    due_date: initial.due_date ? String(initial.due_date).slice(0, 10) : '',
    due_time: dueTime,
    useTime: !!dueTime,
    pinned: !!initial.pinned,
  }
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

  const applyTemplate = (t) => {
    setForm((f) => ({
      ...f,
      title: t.title,
      category: t.category,
      priority: t.priority,
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
      pinned: form.pinned,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!initial && (
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
