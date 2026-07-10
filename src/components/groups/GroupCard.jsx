import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Shield, Crown, Users } from 'lucide-react'
import { getGroupIcon } from '../../lib/groupConstants'

export default function GroupCard({ group, memberCount = 0 }) {
  const { Icon } = getGroupIcon(group.icon)
  const roleLabel =
    group.my_role === 'owner' ? 'Oberadmin' : group.my_role === 'admin' ? 'Admin' : 'Mitglied'

  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.995 }} transition={{ duration: 0.18 }}>
      <Link
        to={`/app/family/${group.id}`}
        className="glass-card glass-card-hover group flex items-center gap-4 p-4 sm:p-5"
      >
        {group.avatar_url ? (
          <img
            src={group.avatar_url}
            alt=""
            className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-md ring-2 ring-[var(--theme-border)]"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--theme-accentSoft)] text-[var(--theme-accent)] shadow-md">
            <Icon className="h-7 w-7" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-primary">{group.name}</h3>
            {group.my_role === 'owner' && (
              <span className="status-badge bg-violet-500/15 text-violet-300">
                <Crown className="h-3 w-3" />
                Oberadmin
              </span>
            )}
            {group.my_role === 'admin' && (
              <span className="status-badge bg-amber-500/15 text-amber-300">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <Users className="h-3.5 w-3.5" />
            {memberCount || '—'} Mitglieder · {roleLabel}
          </p>
          {group.owner?.username && group.my_role !== 'owner' && (
            <p className="mt-1 text-xs text-muted">Erstellt von @{group.owner.username}</p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-[var(--theme-accent)]" />
      </Link>
    </motion.div>
  )
}
