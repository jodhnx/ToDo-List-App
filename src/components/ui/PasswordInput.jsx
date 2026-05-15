import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Input from './Input'

function getStrength(password) {
  if (!password) return { score: 0, label: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const labels = ['Sehr schwach', 'Schwach', 'Mittel', 'Gut', 'Stark']
  const colors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-400']
  const idx = Math.min(score, 4)
  return { score: idx + 1, label: labels[idx], color: colors[idx], percent: ((idx + 1) / 5) * 100 }
}

export default function PasswordInput({ label, showStrength, value, onChange, ...props }) {
  const [visible, setVisible] = useState(false)
  const strength = showStrength ? getStrength(value) : null

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          label={label}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="pr-11"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-[2.125rem] text-muted hover:text-primary"
          tabIndex={-1}
          aria-label={visible ? 'Verbergen' : 'Anzeigen'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && value && (
        <div>
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
              style={{ width: `${strength.percent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted">{strength.label}</p>
        </div>
      )}
    </div>
  )
}
