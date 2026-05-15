import { useState } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { GROUP_ICONS } from '../../lib/groupConstants'

export default function CreateGroupModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('home')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || loading) return
    setError('')
    setLoading(true)
    try {
      await onCreate({ name: name.trim(), icon })
      setName('')
      setIcon('home')
      onClose()
    } catch (err) {
      setError(err.message || 'Familie konnte nicht erstellt werden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Neue Familie erstellen">
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Name deiner Familie"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Familie Müller"
          required
        />
        <p className="text-xs text-muted">Du wirst automatisch Admin und kannst danach Mitglieder per @username einladen.</p>
        <div>
          <p className="mb-2 text-sm font-medium text-muted">Icon</p>
          <div className="flex flex-wrap gap-2">
            {GROUP_ICONS.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setIcon(value)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs transition ${
                  icon === value
                    ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300'
                    : 'border-white/10 text-muted hover:border-white/20'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
          {loading ? 'Erstelle Familie…' : 'Familie erstellen'}
        </Button>
      </form>
    </Modal>
  )
}
