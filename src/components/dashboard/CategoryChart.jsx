import { motion } from 'framer-motion'
import { CATEGORIES } from '../../lib/constants'
import Card from '../ui/Card'

const barColors = {
  schule: 'bg-blue-500',
  gym: 'bg-emerald-500',
  arbeit: 'bg-amber-500',
  privat: 'bg-violet-500',
}

/** Balkendiagramm: offene Aufgaben pro Kategorie */
export default function CategoryChart({ stats }) {
  const max = Math.max(...Object.values(stats), 1)

  return (
    <Card delay={0.1}>
      <h3 className="mb-4 text-sm font-medium text-muted">Offene Aufgaben nach Kategorie</h3>
      <div className="space-y-3">
        {CATEGORIES.map((cat, i) => {
          const count = stats[cat.value] || 0
          const width = (count / max) * 100
          return (
            <div key={cat.value}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-primary">{cat.label}</span>
                <span className="text-muted">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className={`h-full rounded-full ${barColors[cat.value]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
