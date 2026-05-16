import { Link } from 'react-router-dom'
import { ChevronRight, Shield, Crown } from 'lucide-react'
import { getGroupIcon } from '../../lib/groupConstants'

export default function GroupCard({ group, memberCount = 0 }) {
  const { Icon } = getGroupIcon(group.icon)

  return (
    <Link
      to={`/app/family/${group.id}`}
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-indigo-500/30 hover:bg-white/[0.06]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-primary">{group.name}</h3>
          {group.my_role === 'owner' && (
            <Crown className="h-3.5 w-3.5 shrink-0 text-violet-400" title="Oberadmin" />
          )}
          {group.my_role === 'admin' && (
            <Shield className="h-3.5 w-3.5 shrink-0 text-amber-400" title="Admin" />
          )}
        </div>
        <p className="text-xs text-muted">
          {memberCount || '—'} Mitglieder · {new Date(group.created_at).toLocaleDateString('de-DE')}
        </p>
        {group.owner?.username && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-violet-300">
            <Crown className="h-3 w-3" />
            Erstellt von @{group.owner.username}
          </p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
    </Link>
  )
}
