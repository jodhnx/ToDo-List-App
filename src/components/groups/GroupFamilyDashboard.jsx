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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-panel overflow-hidden"
    >
      <div className="relative bg-[var(--theme-accentSoft)] p-5 sm:p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--theme-accent)] opacity-15 blur-3xl" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Link to="/app/family" className="touch-target rounded-xl p-2 text-muted hover:bg-[var(--theme-card)]">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {group.avatar_url ? (
              <img src={group.avatar_url} alt="" className="h-20 w-20 rounded-3xl object-cover shadow-lg ring-2 ring-[var(--theme-border)]" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--theme-card)] text-[var(--theme-accent)] shadow-lg">
                <Icon className="h-10 w-10" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold text-primary sm:text-3xl">{group.name}</h1>
              <p className="mt-1 text-sm text-muted">
                {members.length} Mitglieder ·{' '}
                {myRole === 'owner' ? 'Oberadmin' : myRole === 'admin' ? 'Admin' : 'Mitglied'}
              </p>
              {group.description && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{group.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canManageGroup && (
              <Button size="sm" variant="secondary" onClick={onManage} className="gap-2">
                <Settings className="h-4 w-4" />
                Verwalten
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={onInvite} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Einladen
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
        <StatCard icon={ListTodo} label="Offen" value={openTasks} />
        <StatCard icon={CheckCircle2} label="Erledigt" value={doneTasks} />
        <StatCard icon={ShoppingBasket} label="Einkauf" value={openShopping} />
        <StatCard icon={Users} label="Aktivität" value={activityCount} sub="7 Tage" />
      </div>

      <div className="border-t border-[var(--theme-border)] px-4 pb-4 sm:px-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Mitglieder</p>
        <div className="flex flex-wrap gap-2">
          {members.slice(0, 8).map((member) => {
            const role = resolveDisplayRole(member, group.owner_id || group.created_by)
            return (
              <div
                key={member.user_id}
                className="flex items-center gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2"
              >
                <Avatar name={member.profile?.display_name} username={member.profile?.username} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-primary">@{member.profile?.username}</p>
                  <p className="text-[11px] text-muted">
                    {role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Mitglied'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
      <Icon className="mb-1 h-4 w-4 text-[var(--theme-accent)]" />
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted">{label}{sub ? ` · ${sub}` : ''}</p>
    </div>
  )
}
