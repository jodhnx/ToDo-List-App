import { useState } from 'react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { GROUP_CATEGORIES, GROUP_PRIORITIES } from '../../lib/groupConstants'
import { resolveMemberByUsername } from '../../lib/groupApi'
import SpeechInputButton from '../ui/SpeechInputButton'

const empty = {
  title: '',
  description: '',
  category: 'other',
  priority: 'mittel',
  due_date: '',
  due_time: '',
  useTime: false,
  assignee_username: '',
}

export default function SharedTaskForm({ members, onSubmit, submitting }) {
  const [form, setForm] = useState(empty)
  const [assignError, setAssignError] = useState('')

  const change = (field) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: v }))
    if (field === 'assignee_username') setAssignError('')
  }

  const appendField = (field, text) => {
    const clean = String(text || '').trim()
    if (!clean) return
    setForm((f) => ({ ...f, [field]: f[field] ? `${f[field].trim()} ${clean}` : clean }))
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

    await onSubmit({
      title: form.title.trim(),
      description: form.description,
      category: form.category,
      priority: form.priority,
      due_date: form.due_date || null,
      due_time: form.due_date && form.useTime && form.due_time ? form.due_time : null,
      assignee_id,
      status: 'open',
    })
    setForm(empty)
    setAssignError('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
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

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Speichern…' : 'Aufgabe hinzufügen'}
      </Button>
    </form>
  )
}
