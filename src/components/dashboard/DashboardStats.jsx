import { motion } from 'framer-motion'
import { CheckCircle2, Circle } from 'lucide-react'
import Card from '../ui/Card'
import ProgressBar from './ProgressBar'

/** Dashboard: offene/erledigte Aufgaben + Fortschritt */
export default function DashboardStats({ todos }) {
  const open = todos.filter((t) => !t.completed).length
  const done = todos.filter((t) => t.completed).length
  const total = todos.length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  const stats = [
    { label: 'Offen', value: open, icon: Circle, color: 'text-amber-400' },
    { label: 'Erledigt', value: done, icon: CheckCircle2, color: 'text-emerald-400' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((s, i) => (
          <Card key={s.label} delay={i * 0.05}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{s.label}</p>
                <motion.p
                  key={s.value}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-1 text-3xl font-bold text-primary"
                >
                  {s.value}
                </motion.p>
              </div>
              <s.icon className={`h-10 w-10 ${s.color} opacity-80`} />
            </div>
          </Card>
        ))}
      </div>

      <Card delay={0.15}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-primary">Gesamtfortschritt</p>
          <span className="text-sm font-semibold text-indigo-400">{percent}%</span>
        </div>
        <ProgressBar value={percent} />
        <p className="mt-2 text-xs text-zinc-500">
          {done} von {total} Aufgaben erledigt
        </p>
      </Card>
    </div>
  )
}
