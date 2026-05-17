import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, UserPlus, Filter, Settings, Trash2, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useGroups } from '../context/GroupsContext'
import { useToast } from '../context/ToastContext'
import { getGroupIcon, GROUP_ICONS } from '../lib/groupConstants'
import { resolveDisplayRole } from '../lib/groupRoles'
import GroupStats from '../components/groups/GroupStats'
import MemberList from '../components/groups/MemberList'
import ActivityFeed from '../components/groups/ActivityFeed'
import SharedTaskItem from '../components/groups/SharedTaskItem'
import SharedTaskForm from '../components/groups/SharedTaskForm'
import GroupShoppingList from '../components/groups/GroupShoppingList'
import InviteModal from '../components/groups/InviteModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { checkSharedTaskReminders } from '../lib/notifications'

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
    deleteTask,
    fetchComments,
    addComment,
    inviteMember,
    removeMember,
    setMemberRole,
    fetchActivity,
    fetchShoppingItems,
    createShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    updateGroup,
    deleteGroup,
    refreshGroups,
  } = useGroups()
  const { toast } = useToast()
  const navigate = useNavigate()

  const group = groups.find((g) => g.id === groupId)
  const { Icon } = getGroupIcon(group?.icon)

  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [shoppingItems, setShoppingItems] = useState([])
  const [activity, setActivity] = useState([])
  const [filter, setFilter] = useState('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [tab, setTab] = useState('tasks')
  const [submitting, setSubmitting] = useState(false)
  const [shoppingSubmitting, setShoppingSubmitting] = useState(false)
  const [shoppingUnavailable, setShoppingUnavailable] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [deleteTaskTarget, setDeleteTaskTarget] = useState(null)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupIcon, setGroupIcon] = useState('home')
  const [groupDescription, setGroupDescription] = useState('')
  const [groupAvatarUrl, setGroupAvatarUrl] = useState('')
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false)
  const [savingGroup, setSavingGroup] = useState(false)
  const [busyAction, setBusyAction] = useState('')

  const myMembership = useMemo(
    () => members.find((m) => m.user_id === user?.id),
    [members, user?.id],
  )
  const myRole = myMembership
    ? resolveDisplayRole(myMembership, group?.owner_id || group?.created_by)
    : resolveDisplayRole({ role: group?.my_role, user_id: user?.id }, group?.owner_id || group?.created_by)
  const canManageGroup = myRole === 'owner'

  useEffect(() => {
    setGroupName(group?.name || '')
    setGroupIcon(group?.icon || 'home')
    setGroupDescription(group?.description || '')
    setGroupAvatarUrl(group?.avatar_url || '')
  }, [group?.name, group?.icon, group?.description, group?.avatar_url])

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

    try {
      const shopping = await fetchShoppingItems(groupId)
      setShoppingItems(shopping)
      setShoppingUnavailable(false)
    } catch (err) {
      console.warn('Gemeinsame Einkaufsliste nicht verfügbar:', err)
      setShoppingItems([])
      setShoppingUnavailable(true)
    }
  }, [groupId, fetchMembers, fetchTasks, fetchActivity, fetchShoppingItems])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const run = () => checkSharedTaskReminders(tasks, user?.id)
    run()
    const id = window.setInterval(run, 60_000)
    return () => window.clearInterval(id)
  }, [tasks, user?.id])

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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_shopping_items', filter: `group_id=eq.${groupId}` },
        () => load(),
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
      setTaskFormOpen(false)
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
      {
        status: next,
        completed_by: next === 'completed' ? user.id : null,
        completed_at: next === 'completed' ? new Date().toISOString() : null,
      },
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

  const handleDeleteTask = async () => {
    if (!deleteTaskTarget || busyAction) return
    setBusyAction('delete-task')
    try {
      await deleteTask(deleteTaskTarget.id)
      toast('Aufgabe gelöscht', 'info')
      setDeleteTaskTarget(null)
      await load()
    } catch (e) {
      toast(e.message || 'Aufgabe konnte nicht gelöscht werden', 'error')
    } finally {
      setBusyAction('')
    }
  }

  const handleInvite = async (username) => {
    await inviteMember({ groupId, username, groupName: group.name })
    toast(`Einladung an @${username.replace(/^@/, '')} gesendet`, 'success')
  }

  const handleCreateShoppingItem = async (payload) => {
    setShoppingSubmitting(true)
    try {
      await createShoppingItem({
        ...payload,
        group_id: groupId,
        created_by: user.id,
      })
      toast('Produkt zur Familienliste hinzugefügt', 'success')
      await load()
      return true
    } catch (e) {
      toast(e.message || 'Produkt konnte nicht hinzugefügt werden', 'error')
      return false
    } finally {
      setShoppingSubmitting(false)
    }
  }

  const handleToggleShoppingItem = async (item) => {
    const nextChecked = !item.checked
    try {
      await updateShoppingItem(item.id, {
        checked: nextChecked,
        checked_by: nextChecked ? user.id : null,
      })
      await load()
    } catch (e) {
      toast(e.message || 'Produkt konnte nicht aktualisiert werden', 'error')
    }
  }

  const handleDeleteShoppingItem = async (item) => {
    try {
      await deleteShoppingItem(item.id)
      toast('Produkt entfernt', 'info')
      await load()
    } catch (e) {
      toast(e.message || 'Produkt konnte nicht gelöscht werden', 'error')
    }
  }

  const handleRemove = async () => {
    if (!removeTarget || busyAction) return
    setBusyAction('remove-member')
    try {
      await removeMember(groupId, removeTarget.user_id)
      toast(`@${removeTarget.profile?.username} entfernt`, 'info')
      setRemoveTarget(null)
      await load()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusyAction('')
    }
  }

  const handleRoleChange = async (member, newRole) => {
    if (busyAction) return
    setBusyAction(`role-${member.user_id}`)
    try {
      await setMemberRole(groupId, member.user_id, newRole)
      toast(
        `@${member.profile?.username} ist jetzt ${newRole === 'admin' ? 'Admin' : 'Mitglied'}`,
        'success',
      )
      await load()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusyAction('')
    }
  }

  const handleRenameGroup = async (e) => {
    e.preventDefault()
    if (!canManageGroup || savingGroup) return
    setSavingGroup(true)
    try {
      await updateGroup(groupId, {
        name: groupName,
        icon: groupIcon,
        description: groupDescription,
        avatar_url: groupAvatarUrl,
      })
      await refreshGroups()
      toast('Gruppe gespeichert', 'success')
      setManageOpen(false)
    } catch (e) {
      toast(e.message || 'Gruppe konnte nicht gespeichert werden', 'error')
    } finally {
      setSavingGroup(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!canManageGroup || busyAction) return
    setBusyAction('delete-group')
    try {
      await deleteGroup(groupId)
      await refreshGroups()
      toast('Gruppe gelöscht', 'info')
      navigate('/app/family', { replace: true })
    } catch (e) {
      toast(e.message || 'Gruppe konnte nicht gelöscht werden', 'error')
    } finally {
      setBusyAction('')
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
    <div className="space-y-5 pb-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <Link to="/app/family" className="rounded-xl p-2 text-muted hover:bg-[var(--theme-accentSoft)]">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {group.avatar_url ? (
              <img src={group.avatar_url} alt="" className="h-14 w-14 rounded-2xl object-cover shadow-sm" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--theme-accentSoft)] text-[var(--theme-accent)]">
                <Icon className="h-7 w-7" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold text-primary sm:text-3xl">{group.name}</h1>
              <p className="mt-1 text-sm text-muted">
                {members.length} Mitglieder · Dein Rang:{' '}
                {myRole === 'owner' ? 'Oberadmin' : myRole === 'admin' ? 'Admin' : 'Mitglied'}
              </p>
              {group.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{group.description}</p>}
            </div>
          </div>
          <div className="flex shrink-0 gap-2 sm:ml-auto">
            {canManageGroup && (
              <Button size="sm" variant="secondary" onClick={() => setManageOpen(true)} className="flex-1 gap-1 sm:flex-none">
                <Settings className="h-4 w-4" />
                <span>Verwalten</span>
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setInviteOpen(true)} className="flex-1 gap-1 sm:flex-none">
              <UserPlus className="h-4 w-4" />
              Einladen
            </Button>
          </div>
        </div>
      </Card>

      <GroupStats tasks={tasks} members={members} />

      <Tabs
        tabs={[
          { id: 'tasks', label: 'Aufgaben' },
          { id: 'shopping', label: 'Einkauf' },
          { id: 'members', label: 'Mitglieder' },
          { id: 'activity', label: 'Aktivität' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'tasks' && (
        <>
          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="h-4 w-4 shrink-0 text-muted" />
              {filterTabs.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`min-h-10 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    filter === f.id ? 'bg-[var(--theme-accentSoft)] text-[var(--theme-accent)]' : 'bg-[var(--theme-input)] text-muted'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Button type="button" size="sm" onClick={() => setTaskFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Aufgabe
            </Button>
            </div>
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
                  onDelete={setDeleteTaskTarget}
                  fetchComments={fetchComments}
                  addComment={addComment}
                />
              ))}
            </AnimatePresence>
          </ul>
          {filtered.length === 0 && (
            <Card className="text-center">
              <p className="font-medium text-primary">Hier ist gerade nichts zu tun.</p>
              <p className="mt-1 text-sm text-muted">
                Wähle einen anderen Filter oder füge unten eine neue Aufgabe für die Familie hinzu.
              </p>
            </Card>
          )}
        </>
      )}

      {tab === 'members' && (
        <MemberList
          members={members}
          groupCreatedBy={group.created_by}
          groupOwnerId={group.owner_id || group.created_by}
          currentUserId={user.id}
          myRole={myRole}
          onRemove={(m) => setRemoveTarget(m)}
          onRoleChange={handleRoleChange}
          actionDisabled={!!busyAction}
        />
      )}

      {tab === 'shopping' && (
        shoppingUnavailable ? (
          <Card>
            <p className="font-medium text-primary">Gemeinsame Einkaufsliste noch nicht aktiviert</p>
            <p className="mt-2 text-sm text-muted">
              Führe `supabase/migration_v7_group_shopping_items.sql` im Supabase SQL Editor aus, dann können alle
              Gruppenmitglieder gemeinsam Produkte hinzufügen.
            </p>
          </Card>
        ) : (
          <GroupShoppingList
            items={shoppingItems}
            submitting={shoppingSubmitting}
            onCreate={handleCreateShoppingItem}
            onToggle={handleToggleShoppingItem}
            onDelete={handleDeleteShoppingItem}
          />
        )
      )}

      {tab === 'activity' && (
        <Card>
          <ActivityFeed items={activity} />
        </Card>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={handleInvite} />

      <Modal open={taskFormOpen} onClose={() => !submitting && setTaskFormOpen(false)} title="Aufgabe hinzufügen">
        <SharedTaskForm members={members} onSubmit={handleCreate} submitting={submitting} />
      </Modal>

      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="Gruppe verwalten">
        <form onSubmit={handleRenameGroup} className="space-y-4">
          <Input
            label="Gruppenname"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Name der Gruppe"
            required
          />
          <Select
            label="Gruppenicon"
            value={groupIcon}
            onChange={(e) => setGroupIcon(e.target.value)}
            options={GROUP_ICONS.map((icon) => ({ value: icon.value, label: icon.label }))}
          />
          <Input
            label="Familienbeschreibung"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            placeholder="z. B. Aufgaben und Einkauf für Zuhause"
          />
          <Input
            label="Profilbild-URL"
            value={groupAvatarUrl}
            onChange={(e) => setGroupAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
          <Button type="submit" disabled={savingGroup || !groupName.trim()} className="w-full">
            {savingGroup ? 'Speichern…' : 'Gruppe speichern'}
          </Button>
        </form>

        <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
          <p className="font-medium text-rose-300">Gefahrenzone</p>
          <p className="mt-1 text-sm text-muted">
            Gruppe löschen entfernt sie für alle Mitglieder inklusive Aufgaben und gemeinsamer Einkaufsliste.
          </p>
          <Button
            variant="danger"
            className="mt-3"
            onClick={() => {
              setManageOpen(false)
              setDeleteGroupOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
            Gruppe löschen
          </Button>
        </div>
      </Modal>

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
        loading={busyAction === 'remove-member'}
      />

      <ConfirmDialog
        open={!!deleteTaskTarget}
        title="Gruppenaufgabe löschen?"
        message={
          deleteTaskTarget
            ? `„${deleteTaskTarget.title}“ wird für alle Gruppenmitglieder gelöscht.`
            : ''
        }
        confirmLabel="Löschen"
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteTaskTarget(null)}
        loading={busyAction === 'delete-task'}
      />

      <ConfirmDialog
        open={deleteGroupOpen}
        title="Gruppe wirklich löschen?"
        message={`„${group.name}“ wird für alle Mitglieder dauerhaft gelöscht.`}
        confirmLabel="Gruppe löschen"
        onConfirm={handleDeleteGroup}
        onCancel={() => setDeleteGroupOpen(false)}
        loading={busyAction === 'delete-group'}
      />
    </div>
  )
}
