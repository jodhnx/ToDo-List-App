import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, UserPlus, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useGroups } from '../context/GroupsContext'
import { useToast } from '../context/ToastContext'
import { getGroupIcon } from '../lib/groupConstants'
import { resolveDisplayRole } from '../lib/groupRoles'
import GroupStats from '../components/groups/GroupStats'
import MemberList from '../components/groups/MemberList'
import ActivityFeed from '../components/groups/ActivityFeed'
import SharedTaskItem from '../components/groups/SharedTaskItem'
import SharedTaskForm from '../components/groups/SharedTaskForm'
import InviteModal from '../components/groups/InviteModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'

const filterTabs = [
  { id: 'all', label: 'Alle' },
  { id: 'mine', label: 'Meine' },
  { id: 'open', label: 'Offen' },
  { id: 'done', label: 'Erledigt' },
]

export default function GroupDetailPage() {
  const { groupId } = useParams()
  const { user } = useAuth()
  const {
    groups,
    fetchMembers,
    fetchTasks,
    createTask,
    updateTask,
    fetchComments,
    addComment,
    inviteMember,
    removeMember,
    setMemberRole,
    fetchActivity,
  } = useGroups()
  const { toast } = useToast()

  const group = groups.find((g) => g.id === groupId)
  const { Icon } = getGroupIcon(group?.icon)

  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [activity, setActivity] = useState([])
  const [filter, setFilter] = useState('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [tab, setTab] = useState('tasks')
  const [submitting, setSubmitting] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)

  const myMembership = useMemo(
    () => members.find((m) => m.user_id === user?.id),
    [members, user?.id],
  )
  const myRole = myMembership
    ? resolveDisplayRole(myMembership, group?.created_by)
    : resolveDisplayRole({ role: group?.my_role, user_id: user?.id }, group?.created_by)

  const load = useCallback(async () => {
    if (!groupId) return
    const [m, t, a] = await Promise.all([
      fetchMembers(groupId),
      fetchTasks(groupId),
      fetchActivity(groupId),
    ])
    setMembers(m)
    setTasks(t)
    setActivity(a)
  }, [groupId, fetchMembers, fetchTasks, fetchActivity])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!groupId || !supabase) return
    const ch = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_tasks', filter: `group_id=eq.${groupId}` },
        () => load(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` }, () =>
        load(),
      )
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [groupId, load])

  const filtered = useMemo(() => {
    let list = tasks
    if (filter === 'mine') list = list.filter((t) => t.assignee_id === user?.id)
    if (filter === 'open') list = list.filter((t) => t.status === 'open')
    if (filter === 'done') list = list.filter((t) => t.status === 'completed')
    return list
  }, [tasks, filter, user?.id])

  const handleCreate = async (payload) => {
    setSubmitting(true)
    try {
      await createTask({
        ...payload,
        group_id: groupId,
        creator_id: user.id,
      })
      const who = members.find((m) => m.user_id === payload.assignee_id)
      toast(
        payload.assignee_id
          ? `Aufgabe an @${who?.profile?.username} vergeben`
          : 'Aufgabe erstellt',
        'success',
      )
      await load()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (task) => {
    const next = task.status === 'completed' ? 'open' : 'completed'
    await updateTask(
      task.id,
      { status: next },
      {
        notifyUserId: next === 'completed' && task.creator_id !== user.id ? task.creator_id : null,
        actorId: user.id,
      },
    )
    await load()
  }

  const handleAssign = async (task, assigneeId) => {
    await updateTask(task.id, { assignee_id: assigneeId }, { actorId: user.id })
    const who = members.find((m) => m.user_id === assigneeId)
    toast(assigneeId ? `Zugewiesen an @${who?.profile?.username}` : 'Zuweisung entfernt', 'success')
    await load()
  }

  const handleInvite = async (username) => {
    await inviteMember({ groupId, username, groupName: group.name })
    toast(`Einladung an @${username.replace(/^@/, '')} gesendet`, 'success')
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    try {
      await removeMember(groupId, removeTarget.user_id)
      toast(`@${removeTarget.profile?.username} entfernt`, 'info')
      setRemoveTarget(null)
      await load()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const handleRoleChange = async (member, newRole) => {
    try {
      await setMemberRole(groupId, member.user_id, newRole)
      toast(
        `@${member.profile?.username} ist jetzt ${newRole === 'admin' ? 'Admin' : 'Mitglied'}`,
        'success',
      )
      await load()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  if (!group) {
    return (
      <Card>
        <p className="text-muted">Gruppe nicht gefunden oder kein Zugriff.</p>
        <Link to="/app/family" className="mt-2 inline-block text-indigo-400">
          ← Zurück
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-start gap-3">
        <Link to="/app/family" className="rounded-lg p-2 text-muted hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">{group.name}</h1>
          <p className="text-sm text-muted">
            {members.length} Mitglieder · Dein Rang:{' '}
            {myRole === 'owner' ? 'Oberadmin' : myRole === 'admin' ? 'Admin' : 'Mitglied'}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setInviteOpen(true)} className="gap-1">
          <UserPlus className="h-4 w-4" />
          Einladen
        </Button>
      </div>

      <GroupStats tasks={tasks} members={members} />

      <Tabs
        tabs={[
          { id: 'tasks', label: 'Aufgaben' },
          { id: 'members', label: 'Mitglieder' },
          { id: 'activity', label: 'Aktivität' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'tasks' && (
        <>
          <SharedTaskForm members={members} onSubmit={handleCreate} submitting={submitting} />
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="h-4 w-4 shrink-0 text-muted" />
            {filterTabs.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                  filter === f.id ? 'bg-indigo-500/25 text-indigo-300' : 'bg-white/5 text-muted'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <ul className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((task) => (
                <SharedTaskItem
                  key={task.id}
                  task={task}
                  currentUserId={user.id}
                  canAssign
                  members={members}
                  onToggle={handleToggle}
                  onAssign={handleAssign}
                  fetchComments={fetchComments}
                  addComment={addComment}
                />
              ))}
            </AnimatePresence>
          </ul>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted">Keine Aufgaben in diesem Filter.</p>
          )}
        </>
      )}

      {tab === 'members' && (
        <MemberList
          members={members}
          groupCreatedBy={group.created_by}
          currentUserId={user.id}
          myRole={myRole}
          onRemove={(m) => setRemoveTarget(m)}
          onRoleChange={handleRoleChange}
        />
      )}

      {tab === 'activity' && (
        <Card>
          <ActivityFeed items={activity} />
        </Card>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={handleInvite} />

      <ConfirmDialog
        open={!!removeTarget}
        title="Mitglied entfernen?"
        message={
          removeTarget
            ? `@${removeTarget.profile?.username} verliert den Zugriff auf diese Gruppe.`
            : ''
        }
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}
