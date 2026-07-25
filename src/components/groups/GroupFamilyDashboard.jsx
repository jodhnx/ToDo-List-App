import { motion } from 'framer-motion'
import { ArrowLeft, Settings, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import { resolveDisplayRole } from '../../lib/groupRoles'

export default function GroupFamilyDashboard({
  group,
  groupIcon: Icon,
  members,
  myRole,
  canManageGroup,
  onInvite,
  onManage,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)]"
    >
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <Link
          to="/app/family"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-[var(--theme-accentSoft)]"
          aria-label="Zurück"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {group.avatar_url ? (
          <img
            src={group.avatar_url}
            alt=""
            className="h-8 w-8 shrink-0 rounded-lg object-cover ring-1 ring-[var(--theme-border)]"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-accentSoft)] text-[var(--theme-accent)]">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold leading-tight text-primary">{group.name}</h1>
          <p className="truncate text-[10px] text-muted">
            {members.length} Mitgl. · {myRole === 'owner' ? 'Owner' : myRole === 'admin' ? 'Admin' : 'Mitglied'}
            {group.description ? ` · ${group.description}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          {canManageGroup && (
            <Button size="sm" variant="ghost" onClick={onManage} className="h-7 w-7 p-0" aria-label="Verwalten">
              <Settings className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onInvite} className="h-7 w-7 p-0" aria-label="Einladen">
            <UserPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {members.length > 0 && (
        <div className="flex gap-1 overflow-x-auto border-t border-[var(--theme-border)] px-2.5 py-1.5">
          {members.map((member) => {
            const role = resolveDisplayRole(member, group.owner_id || group.created_by)
            const roleLabel = role === 'owner' ? 'O' : role === 'admin' ? 'A' : null
            return (
              <div
                key={member.user_id}
                title={`@${member.profile?.username}${roleLabel ? ` (${role === 'owner' ? 'Owner' : 'Admin'})` : ''}`}
                className="relative shrink-0"
              >
                <Avatar
                  name={member.profile?.display_name}
                  username={member.profile?.username}
                  size="sm"
                  className="!h-6 !w-6 !text-[9px] !shadow-none !ring-1 !ring-[var(--theme-border)]"
                />
                {roleLabel && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 min-w-3 items-center justify-center rounded-full bg-[var(--theme-accent)] px-0.5 text-[7px] font-bold text-white">
                    {roleLabel}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
