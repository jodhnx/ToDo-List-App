import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Filter, Trash2, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useGroups } from '../context/GroupsContext'
import { useToast } from '../context/ToastContext'
import { getGroupIcon, GROUP_ICONS } from '../lib/groupConstants'
import { resolveDisplayRole } from '../lib/groupRoles'
import GroupFamilyDashboard from '../components/groups/GroupFamilyDashboard'
import GroupCommentsTab from '../components/groups/GroupCommentsTab'
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
import { useGroupShopping } from '../hooks/useGroupShopping'
import { useGroupLive } from '../hooks/useGroupLive'

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
    loading: groupsLoading,
    fetchMembers,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    fetchComments,
    addComment,
    fetchGroupComments,
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

  const shoppingApi = useMemo(
    () => ({ fetchShoppingItems, createShoppingItem, updateShoppingItem, deleteShoppingItem }),
    [fetchShoppingItems, createShoppingItem, updateShoppingItem, deleteShoppingItem],
  )

  const {
    items: shoppingItems,
    unavailable: shoppingUnavailable,
    createItem: createGroupShoppingOptimistic,
    updateItem: updateGroupShoppingOptimistic,
    toggleItem: toggleGroupShoppingOptimistic,
    removeItem: removeGroupShoppingOptimistic,
  } = useGroupShopping(groupId, user?.id, shoppingApi)

  const liveApi = useMemo(
    () => ({
      fetchMembers,
      fetchTasks,
      fetchActivity,
      createTask,
      updateTask,
      deleteTask,
      removeMember,
      setMemberRole,
    }),
    [fetchMembers, fetchTasks, fetchActivity, createTask, updateTask, deleteTask, removeMember, setMemberRole],
  )

  const {
    members,
    tasks,
    activity,
    loading: liveLoading,
    error: liveError,
    refreshActivity,
    createTaskOptimistic,
    updateTaskOptimistic,
    deleteTaskOptimistic,
    removeMemberOptimistic,
    setRoleOptimistic,
  } = useGroupLive(groupId, liveApi)

  const group = groups.find((g) => g.id === groupId)
  const { Icon } = getGroupIcon(group?.icon)

  const [filter, setFilter] = useState('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [tab, setTab] = useState('tasks')
  const [commentsTaskId, setCommentsTaskId] = useState('')
  const [submitting, setSubmitting] = useState(false)
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

  useEffect(() => {
    const run = () => checkSharedTaskReminders(tasks, user?.id)
    run()
    const id = window.setInterval(run, 60_000)
    return () => window.clearInterval(id)
  }, [tasks, user?.id])

  useEffect(() => {
    if (tab === 'activity') void refreshActivity()
  }, [tab, refreshActivity])

  const filtered = useMemo(() => {
    let list = tasks
    if (filter === 'mine') list = list.filter((t) => t.assignee_id === user?.id)
    if (filter === 'open') list = list.filter((t) => t.status === 'open')
    if (filter === 'done') list = list.filter((t) => t.status === 'completed')
    return list
  }, [tasks, filter, user?.id])

  const loadGroupComments = useCallback(() => fetchGroupComments(groupId), [fetchGroupComments, groupId])

  const handleCreate = async (payload) => {
    setSubmitting(true)
    try {
      await createTaskOptimistic({
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
      setTaskFormOpen(false)
    } catch (e) {
      toast(e.message || 'Aufgabe konnte nicht gespeichert werden', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = (task) => {
    const next = task.status === 'completed' ? 'open' : 'completed'
    void updateTaskOptimistic(
      task,
      {
        status: next,
        completed_by: next === 'completed' ? user.id : null,
        completed_at: next === 'completed' ? new Date().toISOString() : null,
      },
      {
        notifyUserId: next === 'completed' && task.creator_id !== user.id ? task.creator_id : null,
        actorId: user.id,
      },
    ).catch((e) => toast(e.message || 'Aufgabe konnte nicht aktualisiert werden', 'error'))
  }

  const handleAssign = async (task, assigneeId) => {
    try {
      await updateTaskOptimistic(task, { assignee_id: assigneeId }, { actorId: user.id })
      const who = members.find((m) => m.user_id === assigneeId)
      toast(assigneeId ? `Zugewiesen an @${who?.profile?.username}` : 'Zuweisung entfernt', 'success')
    } catch (e) {
      toast(e.message || 'Zuweisung fehlgeschlagen', 'error')
    }
  }

  const handleDeleteTask = async () => {
    if (!deleteTaskTarget || busyAction) return
    setBusyAction('delete-task')
    try {
      await deleteTaskOptimistic(deleteTaskTarget)
      toast('Aufgabe gelöscht', 'info')
      setDeleteTaskTarget(null)
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
    try {
      const result = await createGroupShoppingOptimistic(payload)
      if (result?.duplicate) {
        toast('Dieses Produkt steht schon auf der Einkaufsliste', 'info')
        return false
      }
      return true
    } catch (e) {
      toast(e.message || 'Produkt konnte nicht hinzugefügt werden. Bitte erneut versuchen.', 'error')
      return false
    }
  }

  const handleToggleShoppingItem = (item) => {
    toggleGroupShoppingOptimistic(item)
  }

  const handleDeleteShoppingItem = (item) => {
    removeGroupShoppingOptimistic(item)
    toast('Produkt entfernt', 'info')
  }

  const handleUpdateShoppingItem = async (item, updates) => {
    try {
      await updateGroupShoppingOptimistic(item, updates)
    } catch (e) {
      toast(e.message || 'Produkt konnte nicht gespeichert werden', 'error')
      throw e
    }
  }

  const handleRemove = async () => {
    if (!removeTarget || busyAction) return
    setBusyAction('remove-member')
    try {
      await removeMemberOptimistic(removeTarget)
      toast(`@${removeTarget.profile?.username} entfernt`, 'info')
      setRemoveTarget(null)
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
      await setRoleOptimistic(member, newRole)
      toast(
        `@${member.profile?.username} ist jetzt ${newRole === 'admin' ? 'Admin' : 'Mitglied'}`,
        'success',
      )
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
      toast('Gespeichert', 'success')
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

  const handleOpenComments = (task) => {
    setCommentsTaskId(task.id)
    setTab('comments')
  }

  if (!group) {
    if (groupsLoading || liveLoading) {
      return (
        <Card className="py-8 text-center">
          <p className="text-sm text-muted">Familie wird geladen…</p>
        </Card>
      )
    }
    return (
      <Card>
        <p className="font-medium text-primary">Familie nicht gefunden</p>
        <p className="mt-1 text-sm text-muted">
          Du hast möglicherweise keinen Zugriff mehr, oder die Familie wurde gelöscht.
        </p>
        <Link to="/app/family" className="mt-3 inline-block text-sm text-[var(--theme-accent)]">
          ← Zurück zur Übersicht
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-3 pb-4">
      <GroupFamilyDashboard
        group={group}
        groupIcon={Icon}
        members={members}
        myRole={myRole}
        canManageGroup={canManageGroup}
        onInvite={() => setInviteOpen(true)}
        onManage={() => setManageOpen(true)}
      />

      {liveError && (
        <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {liveError} — vorhandene Daten werden angezeigt und im Hintergrund aktualisiert.
        </p>
      )}

      <Tabs
        tabs={[
          { id: 'tasks', label: 'Aufgaben' },
          { id: 'shopping', label: 'Einkauf' },
          { id: 'members', label: 'Mitglieder' },
          { id: 'comments', label: 'Kommentare' },
          { id: 'activity', label: 'Aktivitäten' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'tasks' && (
        <>
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-2">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-1 overflow-x-auto">
                <Filter className="h-3.5 w-3.5 shrink-0 text-muted" />
                {filterTabs.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={`min-h-8 shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                      filter === f.id
                        ? 'bg-[var(--theme-accentSoft)] text-[var(--theme-accent)]'
                        : 'bg-[var(--theme-input)] text-muted'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <Button type="button" size="sm" onClick={() => setTaskFormOpen(true)} className="h-8 gap-1 px-2.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Neue Aufgabe
              </Button>
            </div>
          </div>
          <ul className="space-y-2">
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
                  onOpenComments={handleOpenComments}
                />
              ))}
            </AnimatePresence>
          </ul>
          {filtered.length === 0 && (
            <Card className="py-6 text-center">
              <p className="text-sm font-medium text-primary">Keine Aufgaben</p>
              <p className="mt-0.5 text-xs text-muted">Tippe auf „Neue Aufgabe“, um zu starten.</p>
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

      {tab === 'shopping' &&
        (shoppingUnavailable ? (
          <Card>
            <p className="font-medium text-primary">Einkaufsliste noch nicht eingerichtet</p>
            <p className="mt-2 text-sm text-muted">
              Bitte die Supabase-Migration für die gemeinsame Einkaufsliste ausführen.
            </p>
          </Card>
        ) : (
          <GroupShoppingList
            items={shoppingItems}
            onCreate={handleCreateShoppingItem}
            onToggle={handleToggleShoppingItem}
            onDelete={handleDeleteShoppingItem}
            onUpdate={handleUpdateShoppingItem}
          />
        ))}

      {tab === 'comments' && (
        <GroupCommentsTab
          tasks={tasks}
          currentUserId={user.id}
          fetchComments={fetchComments}
          addComment={addComment}
          fetchGroupComments={loadGroupComments}
          initialTaskId={commentsTaskId}
          groupId={groupId}
        />
      )}

      {tab === 'activity' && (
        <Card>
          <ActivityFeed items={activity} />
        </Card>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={handleInvite} />

      <Modal open={taskFormOpen} onClose={() => !submitting && setTaskFormOpen(false)} title="Neue Aufgabe">
        <SharedTaskForm members={members} onSubmit={handleCreate} submitting={submitting} />
      </Modal>

      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="Familie bearbeiten">
        <form onSubmit={handleRenameGroup} className="space-y-4">
          <Input
            label="Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Name der Familie"
            required
          />
          <Select
            label="Symbol"
            value={groupIcon}
            onChange={(e) => setGroupIcon(e.target.value)}
            options={GROUP_ICONS.map((icon) => ({ value: icon.value, label: icon.label }))}
          />
          <Input
            label="Kurzbeschreibung"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            placeholder="z. B. Aufgaben und Einkauf für Zuhause"
          />
          <Input
            label="Bild-Link (optional)"
            value={groupAvatarUrl}
            onChange={(e) => setGroupAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
          <Button type="submit" disabled={savingGroup || !groupName.trim()} className="w-full min-h-12">
            {savingGroup ? 'Speichern…' : 'Speichern'}
          </Button>
        </form>

        <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
          <p className="font-medium text-rose-300">Familie löschen</p>
          <p className="mt-1 text-sm text-muted">
            Löscht die Familie für alle Mitglieder inklusive Aufgaben und Einkaufsliste.
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
            Familie löschen
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removeTarget}
        title="Mitglied entfernen?"
        message={
          removeTarget
            ? `@${removeTarget.profile?.username} verliert den Zugriff auf diese Familie.`
            : ''
        }
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
        loading={busyAction === 'remove-member'}
      />

      <ConfirmDialog
        open={!!deleteTaskTarget}
        title="Aufgabe löschen?"
        message={
          deleteTaskTarget
            ? `„${deleteTaskTarget.title}“ wird für alle gelöscht.`
            : ''
        }
        confirmLabel="Löschen"
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteTaskTarget(null)}
        loading={busyAction === 'delete-task'}
      />

      <ConfirmDialog
        open={deleteGroupOpen}
        title="Familie wirklich löschen?"
        message={`„${group.name}“ wird für alle Mitglieder dauerhaft gelöscht.`}
        confirmLabel="Löschen"
        onConfirm={handleDeleteGroup}
        onCancel={() => setDeleteGroupOpen(false)}
        loading={busyAction === 'delete-group'}
      />
    </div>
  )
}
