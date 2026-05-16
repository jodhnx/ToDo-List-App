import { Circle, CheckCircle2, CalendarDays, AlertTriangle } from 'lucide-react'

const items = [
  {
    key: 'open',
    label: 'Offen',
    hint: 'Noch zu erledigen',
    icon: Circle,
    color: 'text-amber-300',
    bg: 'bg-amber-500/12',
    active: 'border-amber-400/60',
  },
  {
    key: 'done',
    label: 'Erledigt',
    hint: 'Schon geschafft',
    icon: CheckCircle2,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/12',
    active: 'border-emerald-400/60',
  },
  {
    key: 'today',
    label: 'Heute',
    hint: 'Heute wichtig',
    icon: CalendarDays,
    color: 'text-indigo-300',
    bg: 'bg-indigo-500/12',
    active: 'border-indigo-400/60',
  },
  {
    key: 'overdue',
    label: 'Überfällig',
    hint: 'Bitte prüfen',
    icon: AlertTriangle,
    color: 'text-rose-300',
    bg: 'bg-rose-500/12',
    active: 'border-rose-400/60',
  },
]

export default function StatsBar({ stats, active = 'open', onSelect }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ key, label, hint, icon: Icon, color, bg, active: activeClass }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect?.(key)}
          className={`flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left transition hover:scale-[1.01] hover:bg-white/[0.07] ${
            active === key ? activeClass : 'border-white/10'
          } ${bg}`}
        >
          <Icon className={`h-8 w-8 shrink-0 ${color}`} />
          <div className="min-w-0">
            <p className="text-3xl font-bold leading-none text-primary">{stats[key] ?? 0}</p>
            <p className="mt-1 text-lg font-semibold text-primary">{label}</p>
            <p className="text-sm text-muted">{hint}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
