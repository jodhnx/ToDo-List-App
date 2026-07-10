import { motion } from 'framer-motion'
import { ArrowLeft, Settings, UserPlus, ShoppingBasket, ListTodo, CheckCircle2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import { resolveDisplayRole } from '../../lib/groupRoles'

export default function GroupFamilyDashboard({
  group,
  groupIcon: Icon,
  members,
  tasks,
  shoppingItems,
  activityCount,
  myRole,
  canManageGroup,
  onInvite,
  onManage,
}) {
  const openTasks = tasks.filter((t) => t.status !== 'completed').length
  const doneTasks = tasks.filter((t) => t.status === 'completed').length
  const openShopping = shoppingItems.filter((i) => !i.checked).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-panel overflow-hidden"
    >
      <div className="flex items-center gap-2 border-b border-[var(--theme-border)] bg-[var(--theme-accentSoft)] px-3 py-2">
        <Link
          to="/app/family"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-[var(--theme-card)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {group.avatar_url ? (
          <img
            src={group.avatar_url}
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-[var(--theme-border)]"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-card)] text-[var(--theme-accent)]">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight text-primary">{group.name}</h1>
          <p className="text-[11px] text-muted">
            {members.length} Mitglieder ·{' '}
            {myRole === 'owner' ? 'Oberadmin' : myRole === 'admin' ? 'Admin' : 'Mitglied'}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          {canManageGroup && (
            <Button size="sm" variant="secondary" onClick={onManage} className="h-8 px-2.5" aria-label="Verwalten">
              <Settings className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={onInvite} className="h-8 gap-1 px-2.5">
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden text-xs sm:inline">Einladen</span>
          </Button>
        </div>
      </div>

      {group.description && (
        <p className="line-clamp-2 border-b border-[var(--theme-border)] px-3 py-1.5 text-xs leading-snug text-muted">
          {group.description}
        </p>
      )}

      <div className="grid grid-cols-4 gap-1.5 px-3 py-2">
        <StatCard icon={ListTodo} label="Offen" value={openTasks} />
        <StatCard icon={CheckCircle2} label="Erledigt" value={doneTasks} />
        <StatCard icon={ShoppingBasket} label="Einkauf" value={openShopping} />
        <StatCard icon={Users} label="Aktiv." value={activityCount} />
      </div>

      <div className="border-t border-[var(--theme-border)] px-3 pb-2 pt-1.5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Mitglieder</p>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 scrollbar-thin">
          {members.map((member) => {
            const role = resolveDisplayRole(member, group.owner_id || group.created_by)
            const roleLabel = role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : null
            return (
              <div
                key={member.user_id}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-2 py-1"
              >
                <Avatar
                  name={member.profile?.display_name}
                  username={member.profile?.username}
                  size="sm"
                  className="!h-6 !w-6 !text-[10px] !shadow-none !ring-1"
                />
                <div className="min-w-0">
                  <p className="max-w-[72px] truncate text-[11px] font-medium text-primary">
                    @{member.profile?.username}
                  </p>
                  {roleLabel && (
                    <p className="text-[9px] font-medium text-[var(--theme-accent)]">{roleLabel}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-1.5 py-1.5 text-center">
      <Icon className="mx-auto mb-0.5 h-3 w-3 text-[var(--theme-accent)]" />
      <p className="text-base font-bold leading-none text-primary">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted">{label}</p>
    </div>
  )
}
