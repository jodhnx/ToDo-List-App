import { Circle, CheckCircle2, CalendarDays, AlertTriangle } from 'lucide-react'

const items = [
  { key: 'open', label: 'Offen', icon: Circle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { key: 'done', label: 'Erledigt', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'today', label: 'Heute', icon: CalendarDays, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { key: 'overdue', label: 'Überfällig', icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
]

export default function StatsBar({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {items.map(({ key, label, icon: Icon, color, bg }) => (
        <div
          key={key}
          className={`flex items-center gap-3 rounded-xl border border-white/5 px-3 py-3 ${bg}`}
        >
          <Icon className={`h-5 w-5 shrink-0 ${color}`} />
          <div>
            <p className="text-xl font-bold text-zinc-50">{stats[key] ?? 0}</p>
            <p className="text-[11px] text-zinc-400">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
