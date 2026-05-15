import Avatar from '../ui/Avatar'
import { Shield } from 'lucide-react'

export default function MemberList({ members }) {
  return (
    <ul className="space-y-2">
      {members.map((m) => (
        <li
          key={m.id}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
        >
          <Avatar name={m.profile?.display_name} username={m.profile?.username} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-primary">
              {m.profile?.display_name || m.profile?.username}
            </p>
            <p className="text-xs text-muted">@{m.profile?.username}</p>
          </div>
          {m.role === 'admin' && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">
              <Shield className="h-3 w-3" />
              Admin
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
