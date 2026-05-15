import { useEffect, useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { checkUsernameAvailable, normalizeUsername, validateUsernameFormat } from '../../lib/username'
import Input from './Input'

/** Benutzername mit Live-Validierung */
export default function UsernameInput({ value, onChange, disabled, currentUserId }) {
  const [status, setStatus] = useState('idle')
  const [hint, setHint] = useState('')

  useEffect(() => {
    const name = normalizeUsername(value)
    const formatErr = validateUsernameFormat(name)
    if (!name) {
      setStatus('idle')
      setHint('')
      return
    }
    if (formatErr) {
      setStatus('invalid')
      setHint(formatErr)
      return
    }

    setStatus('checking')
    const t = setTimeout(async () => {
      const result = await checkUsernameAvailable(name)
      if (result.error) {
        setStatus('invalid')
        setHint(result.error)
      } else if (result.available) {
        setStatus('available')
        setHint('Benutzername verfügbar')
      } else {
        setStatus('taken')
        setHint('Benutzername bereits vergeben')
      }
    }, 400)

    return () => clearTimeout(t)
  }, [value, currentUserId])

  return (
    <div className="space-y-1">
      <Input
        label="Benutzername"
        value={value}
        onChange={(e) => onChange(normalizeUsername(e.target.value))}
        placeholder="max_mustermann"
        disabled={disabled}
        autoComplete="username"
      />
      <div className="flex items-center gap-1.5 text-xs">
        {status === 'checking' && <Loader2 className="h-3 w-3 animate-spin text-muted" />}
        {status === 'available' && <Check className="h-3 w-3 text-emerald-400" />}
        {(status === 'taken' || status === 'invalid') && <X className="h-3 w-3 text-rose-400" />}
        <span
          className={
            status === 'available'
              ? 'text-emerald-400'
              : status === 'taken' || status === 'invalid'
                ? 'text-rose-400'
                : 'text-muted'
          }
        >
          {hint || 'Eindeutig · nur a–z, 0–9, _'}
        </span>
      </div>
    </div>
  )
}
