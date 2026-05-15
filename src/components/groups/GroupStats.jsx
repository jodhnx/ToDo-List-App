import { motion } from 'framer-motion'
import { CheckCircle2, ListTodo, Users, TrendingUp } from 'lucide-react'

export default function GroupStats({ tasks, members }) {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'completed').length
  const progress = total ? Math.round((done / total) * 100) : 0
  const activeMembers = new Set(
    tasks.filter((t) => t.status === 'open').map((t) => t.assignee_id || t.creator_id),
  ).size

  const items = [
    { label: 'Fortschritt', value: `${progress}%`, icon: TrendingUp, color: 'text-indigo-400' },
    { label: 'Gesamt', value: total, icon: ListTodo, color: 'text-zinc-300' },
    { label: 'Erledigt', value: done, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Aktiv', value: activeMembers || members.length, icon: Users, color: 'text-sky-400' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
        >
          <item.icon className={`mb-1 h-4 w-4 ${item.color}`} />
          <p className="text-xl font-bold text-primary">{item.value}</p>
          <p className="text-[11px] text-muted">{item.label}</p>
        </motion.div>
      ))}
    </div>
  )
}
