import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ListTodo, Users, UserCheck } from 'lucide-react'
import { computeGroupStats } from '../../lib/groupStats'
import ProgressBar from '../dashboard/ProgressBar'
import Avatar from '../ui/Avatar'

export default function GroupStats({ tasks, members }) {
  const stats = useMemo(() => computeGroupStats(tasks, members), [tasks, members])

  const cards = [
    {
      label: 'Mitglieder gesamt',
      value: stats.memberTotal,
      sub: 'in dieser Gruppe',
      icon: Users,
      color: 'text-sky-400',
    },
    {
      label: 'Aktiv',
      value: stats.activeCount,
      sub:
        stats.memberTotal > 0
          ? `von ${stats.memberTotal} mit offenen Aufgaben`
          : 'mit offenen Aufgaben',
      icon: UserCheck,
      color: 'text-emerald-400',
    },
    {
      label: 'Aufgaben gesamt',
      value: stats.taskTotal,
      sub: stats.taskOpen > 0 ? `${stats.taskOpen} offen` : 'keine offen',
      icon: ListTodo,
      color: 'text-zinc-300',
    },
    {
      label: 'Erledigt',
      value: stats.taskDone,
      sub: stats.taskTotal > 0 ? `${stats.progress}% Fortschritt` : '—',
      icon: CheckCircle2,
      color: 'text-indigo-400',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cards.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
          >
            <item.icon className={`mb-1 h-4 w-4 ${item.color}`} />
            <p className="text-2xl font-bold text-primary">{item.value}</p>
            <p className="text-[11px] font-medium text-zinc-300">{item.label}</p>
            <p className="mt-0.5 text-[10px] leading-tight text-muted">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <motion.div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-primary">Gruppen-Fortschritt</span>
          <span className="text-indigo-300">
            {stats.taskTotal > 0 ? `${stats.progress}%` : '0%'}
            {stats.taskTotal > 0 && (
              <span className="text-muted">
                {' '}
                · {stats.taskDone}/{stats.taskTotal} erledigt
              </span>
            )}
          </span>
        </motion.div>
        <ProgressBar value={stats.progress} />
        {stats.taskTotal === 0 && (
          <p className="mt-2 text-xs text-muted">Noch keine Aufgaben — Fortschritt startet mit der ersten Aufgabe.</p>
        )}
      </div>

      {stats.memberTotal > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="mb-2 text-xs font-medium text-muted">Wer ist aktiv?</p>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const isActive = stats.activeMembers.some((a) => a.user_id === m.user_id)
              return (
                <div
                  key={m.user_id}
                  className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${
                    isActive
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 bg-white/[0.02] text-muted'
                  }`}
                >
                  <Avatar name={m.profile?.display_name} username={m.profile?.username} size="sm" />
                  <span>@{m.profile?.username}</span>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
