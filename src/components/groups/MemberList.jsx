import { Crown, Shield, UserMinus, ChevronDown } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { getRoleMeta, canRemoveMember, canSetRoles, resolveDisplayRole } from '../../lib/groupRoles'

function RoleBadge({ role }) {
  const meta = getRoleMeta(role)
  if (role === 'owner') {
    return (
      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.color}`}>
        <Crown className="h-3 w-3" />
        Oberadmin
      </span>
    )
  }
  if (role === 'admin') {
    return (
      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.color}`}>
        <Shield className="h-3 w-3" />
        Admin
      </span>
    )
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.color}`}>
      Mitglied
    </span>
  )
}

export default function MemberList({
  members,
  groupCreatedBy,
  currentUserId,
  myRole,
  onRemove,
  onRoleChange,
}) {
  const sorted = [...members].sort((a, b) => {
    const order = { owner: 0, admin: 1, member: 2 }
    const ra = resolveDisplayRole(a, groupCreatedBy)
    const rb = resolveDisplayRole(b, groupCreatedBy)
    return (order[ra] ?? 9) - (order[rb] ?? 9)
  })

  return (
    <ul className="space-y-2">
      {sorted.map((m) => {
        const role = resolveDisplayRole(m, groupCreatedBy)
        const isSelf = m.user_id === currentUserId
        const showRemove = !isSelf && onRemove && canRemoveMember(myRole, role)
        const showRoleSelect = !isSelf && role !== 'owner' && onRoleChange && canSetRoles(myRole)

        return (
          <li
            key={m.id}
            className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name={m.profile?.display_name} username={m.profile?.username} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-primary">
                  {m.profile?.display_name || m.profile?.username}
                  {isSelf && <span className="text-muted"> (du)</span>}
                </p>
                <p className="text-xs text-muted">@{m.profile?.username}</p>
              </div>
              <RoleBadge role={role} />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {showRoleSelect && (
                <div className="relative">
                  <select
                    value={role === 'admin' ? 'admin' : 'member'}
                    onChange={(e) => onRoleChange(m, e.target.value)}
                    className="appearance-none rounded-lg border border-white/10 bg-white/5 py-1.5 pl-2 pr-7 text-xs text-primary"
                  >
                    <option value="member">Mitglied</option>
                    <option value="admin">Admin</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                </div>
              )}
              {showRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(m)}
                  className="gap-1 text-rose-400 hover:bg-rose-500/10"
                >
                  <UserMinus className="h-3.5 w-3.5" />
                  Entfernen
                </Button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
