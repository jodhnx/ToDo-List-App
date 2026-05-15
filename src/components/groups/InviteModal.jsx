import { useState } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function InviteModal({ open, onClose, onInvite }) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onInvite(username.trim().toLowerCase())
      setUsername('')
      onClose()
    } catch (err) {
      setError(err.message || 'Einladung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Mitglied einladen">
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Benutzername"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
          placeholder="benutzername"
          required
        />
        <p className="text-xs text-muted">Die Person erhält eine Einladung und kann annehmen oder ablehnen.</p>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading || !username.trim()}>
          {loading ? 'Senden…' : 'Einladung senden'}
        </Button>
      </form>
    </Modal>
  )
}
