import { useState } from 'react'
import { Crown, Shield, UserMinus, MoreVertical, ShieldPlus, ShieldMinus } from 'lucide-react'
import Avatar from '../ui/Avatar'
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
  groupOwnerId,
  currentUserId,
  myRole,
  onRemove,
  onRoleChange,
  actionDisabled = false,
}) {
  const [openMenuId, setOpenMenuId] = useState(null)
  const sorted = [...members].sort((a, b) => {
    const order = { owner: 0, admin: 1, member: 2 }
    const ownerId = groupOwnerId || groupCreatedBy
    const ra = resolveDisplayRole(a, ownerId)
    const rb = resolveDisplayRole(b, ownerId)
    return (order[ra] ?? 9) - (order[rb] ?? 9)
  })

  return (
    <ul className="space-y-2">
      {sorted.map((m) => {
        const role = resolveDisplayRole(m, groupOwnerId || groupCreatedBy)
        const isSelf = m.user_id === currentUserId
        const isGroupOwner = currentUserId === (groupOwnerId || groupCreatedBy)
        const showRemove = !isSelf && onRemove && canRemoveMember(isGroupOwner ? 'owner' : myRole, role)
        const showRoleActions = !isSelf && role !== 'owner' && onRoleChange && canSetRoles(isGroupOwner ? 'owner' : myRole)
        const actions = [
          showRoleActions && role === 'member'
            ? {
                key: 'make-admin',
                label: 'Zum Admin machen',
                icon: ShieldPlus,
                onClick: () => onRoleChange(m, 'admin'),
              }
            : null,
          showRoleActions && role === 'admin'
            ? {
                key: 'remove-admin',
                label: 'Admin entfernen',
                icon: ShieldMinus,
                onClick: () => onRoleChange(m, 'member'),
              }
            : null,
          showRemove
            ? {
                key: 'remove',
                label: 'Mitglied entfernen',
                icon: UserMinus,
                danger: true,
                onClick: () => onRemove(m),
              }
            : null,
        ].filter(Boolean)

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

            {!showRoleActions && role !== 'owner' && myRole === 'admin' && (
              <p className="text-xs text-muted">Nur der Oberadmin kann Rollen ändern.</p>
            )}

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {actions.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    disabled={actionDisabled}
                    onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-primary hover:bg-white/10 disabled:opacity-60"
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === m.id}
                  >
                    <MoreVertical className="h-4 w-4" />
                    Aktionen
                  </button>
                  {openMenuId === m.id && (
                    <div
                      role="menu"
                      className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#18181b] p-1 shadow-2xl"
                    >
                      {actions.map((action) => {
                        const ActionIcon = action.icon
                        return (
                          <button
                            key={action.key}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuId(null)
                              action.onClick()
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 ${
                              action.danger ? 'text-rose-300' : 'text-primary'
                            }`}
                          >
                            <ActionIcon className="h-4 w-4" />
                            {action.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
