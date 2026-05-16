import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ListTodo, Users, UserCheck } from 'lucide-react'
import { computeGroupStats } from '../../lib/groupStats'
import ProgressBar from '../dashboard/ProgressBar'

export default function GroupStats({ tasks, members }) {
  const stats = useMemo(() => computeGroupStats(tasks, members), [tasks, members])

  const cards = [
    {
      label: 'Mitglieder',
      value: stats.memberTotal,
      sub: 'gesamt',
      icon: Users,
      color: 'text-sky-400',
    },
    {
      label: 'Aktiv',
      value: stats.activeCount,
      sub: stats.memberTotal > 0 ? `von ${stats.memberTotal}` : 'online',
      icon: UserCheck,
      color: 'text-emerald-400',
    },
    {
      label: 'Aufgaben',
      value: stats.taskTotal,
      sub: stats.taskOpen > 0 ? `${stats.taskOpen} offen` : 'keine offen',
      icon: ListTodo,
      color: 'text-zinc-300',
    },
    {
      label: 'Erledigt',
      value: stats.taskDone,
      sub: `${stats.progress}%`,
      icon: CheckCircle2,
      color: 'text-indigo-400',
    },
  ]

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        {cards.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="min-w-0 rounded-xl bg-white/[0.04] px-2 py-2"
          >
            <item.icon className={`mb-1 h-3.5 w-3.5 ${item.color}`} />
            <p className="text-lg font-bold leading-none text-primary">{item.value}</p>
            <p className="mt-1 truncate text-[10px] font-medium text-zinc-300">{item.label}</p>
            <p className="truncate text-[9px] leading-tight text-muted">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-primary">Fortschritt</span>
          <span className="text-indigo-300">{stats.taskDone}/{stats.taskTotal} erledigt · {stats.progress}%</span>
        </div>
        <ProgressBar value={stats.progress} />
        {stats.activeMembers.length > 0 && (
          <p className="mt-1.5 truncate text-[10px] text-muted">
            Aktiv: {stats.activeMembers.map((m) => `@${m.profile?.username}`).join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}
