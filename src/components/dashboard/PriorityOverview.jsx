import { AlertTriangle, Minus, ArrowDown } from 'lucide-react'
import Card from '../ui/Card'

const items = [
  { key: 'hoch', label: 'Hoch', icon: AlertTriangle, color: 'text-rose-400 bg-rose-500/10' },
  { key: 'mittel', label: 'Mittel', icon: Minus, color: 'text-amber-400 bg-amber-500/10' },
  { key: 'niedrig', label: 'Niedrig', icon: ArrowDown, color: 'text-zinc-400 bg-zinc-500/10' },
]

export default function PriorityOverview({ stats }) {
  return (
    <Card delay={0.15}>
      <h3 className="mb-4 text-sm font-medium text-muted">Prioritäten (offen)</h3>
      <div className="grid grid-cols-3 gap-3">
        {items.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className={`rounded-xl p-3 text-center ${color.split(' ')[1]}`}>
            <Icon className={`mx-auto mb-1 h-5 w-5 ${color.split(' ')[0]}`} />
            <p className="text-2xl font-bold text-primary">{stats[key] ?? 0}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
