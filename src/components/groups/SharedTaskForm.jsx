import { useState } from 'react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { GROUP_CATEGORIES, GROUP_PRIORITIES } from '../../lib/groupConstants'

const empty = {
  title: '',
  description: '',
  category: 'other',
  priority: 'mittel',
  due_date: '',
  due_time: '',
  useTime: false,
  assignee_id: '',
}

export default function SharedTaskForm({ members, onSubmit, submitting }) {
  const [form, setForm] = useState(empty)

  const change = (field) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: v }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    await onSubmit({
      title: form.title.trim(),
      description: form.description,
      category: form.category,
      priority: form.priority,
      due_date: form.due_date || null,
      due_time: form.due_date && form.useTime && form.due_time ? form.due_time : null,
      assignee_id: form.assignee_id || null,
      status: 'open',
    })
    setForm(empty)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <Input label="Titel" value={form.title} onChange={change('title')} required />
      <textarea
        value={form.description}
        onChange={change('description')}
        rows={2}
        placeholder="Beschreibung (optional)"
        className="input-field resize-none"
      />
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
      <Select
        label="Zuweisen an"
        value={form.assignee_id}
        onChange={change('assignee_id')}
        options={[
          { value: '', label: 'Niemand' },
          ...members.map((m) => ({
            value: m.user_id,
            label: `@${m.profile?.username}`,
          })),
        ]}
      />
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Speichern…' : 'Aufgabe hinzufügen'}
      </Button>
    </form>
  )
}
