import { useEffect, useState } from 'react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { CATEGORIES, PRIORITIES } from '../../lib/constants'
import AITaskTools from '../ai/AITaskTools'

const emptyForm = {
  title: '',
  description: '',
  category: 'privat',
  priority: 'mittel',
  due_date: '',
  pinned: false,
}

/** Formular zum Erstellen oder Bearbeiten einer Aufgabe */
export default function TodoForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || '',
        description: initial.description || '',
        category: initial.category || 'privat',
        priority: initial.priority || 'mittel',
        due_date: initial.due_date ? initial.due_date.slice(0, 10) : '',
        pinned: !!initial.pinned,
      })
    } else {
      setForm(emptyForm)
    }
  }, [initial])

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit({
      ...form,
      due_date: form.due_date || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Titel"
        name="title"
        value={form.title}
        onChange={handleChange('title')}
        placeholder="Was steht an?"
        required
      />
      <AITaskTools
        title={form.title}
        description={form.description}
        onApply={(patch) => setForm((f) => ({ ...f, ...patch }))}
      />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-400">Beschreibung</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange('description')}
          rows={3}
          placeholder="Optional…"
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Kategorie"
          name="category"
          value={form.category}
          onChange={handleChange('category')}
          options={CATEGORIES}
        />
        <Select
          label="Priorität"
          name="priority"
          value={form.priority}
          onChange={handleChange('priority')}
          options={PRIORITIES}
        />
      </div>
      <Input
        label="Fällig am"
        type="date"
        name="due_date"
        value={form.due_date}
        onChange={handleChange('due_date')}
      />
      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={form.pinned}
          onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
          className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/30"
        />
        Aufgabe anpinnen
      </label>
      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1">
          {initial ? 'Speichern' : 'Aufgabe erstellen'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  )
}
