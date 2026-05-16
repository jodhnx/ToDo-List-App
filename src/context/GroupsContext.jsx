import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import {
  groupsEnabled,
  createGroup,
  fetchMyGroups,
  fetchGroupMembers,
  inviteByUsername,
  fetchPendingInvites,
  respondToInvite,
  fetchSharedTasks,
  createSharedTask,
  updateSharedTask,
  deleteSharedTask,
  fetchTaskComments,
  addTaskComment,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchGroupActivity,
  removeGroupMember,
  setGroupMemberRole,
  updateGroup,
  deleteGroup,
  fetchGroupShoppingItems,
  createGroupShoppingItem,
  updateGroupShoppingItem,
  deleteGroupShoppingItem,
} from '../lib/groupApi'

const GroupsContext = createContext(null)

export function GroupsProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id
  const enabled = groupsEnabled()

  const [groups, setGroups] = useState([])
  const [invites, setInvites] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const refreshGroups = useCallback(async () => {
    if (!enabled || !userId) return setGroups([])
    const data = await fetchMyGroups(userId)
    setGroups(data)
  }, [enabled, userId])

  const refreshInvites = useCallback(async () => {
    if (!enabled || !userId) return setInvites([])
    const data = await fetchPendingInvites(userId)
    setInvites(data)
  }, [enabled, userId])

  const refreshNotifications = useCallback(async () => {
    if (!enabled || !userId) return setNotifications([])
    const data = await fetchNotifications(userId)
    setNotifications(data)
  }, [enabled, userId])

  const refreshAll = useCallback(async () => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      await Promise.all([refreshGroups(), refreshInvites(), refreshNotifications()])
    } catch {
      setGroups([])
      setInvites([])
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [enabled, userId, refreshGroups, refreshInvites, refreshNotifications])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  useEffect(() => {
    if (!enabled || !userId || !supabase) return

    const channel = supabase
      .channel(`family-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_invites', filter: `invitee_id=eq.${userId}` }, () => refreshInvites())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${userId}` }, () => refreshGroups())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => refreshNotifications())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, userId, refreshInvites, refreshGroups, refreshNotifications])

  const value = {
    enabled,
    groups,
    invites,
    notifications,
    loading,
    unreadCount: notifications.filter((n) => !n.read).length,
    inviteCount: invites.length,
    refreshAll,
    refreshGroups,
    refreshInvites,
    refreshNotifications,
    createGroup: async (payload) => {
      if (!userId) throw new Error('Bitte zuerst anmelden')
      return createGroup({ ...payload, userId })
    },
    fetchMembers: fetchGroupMembers,
    inviteMember: (args) => inviteByUsername({ ...args, inviterId: userId }),
    respondInvite: (args) => respondToInvite({ ...args, userId }),
    fetchTasks: fetchSharedTasks,
    createTask: createSharedTask,
    updateTask: updateSharedTask,
    deleteTask: deleteSharedTask,
    fetchComments: fetchTaskComments,
    addComment: addTaskComment,
    markRead: markNotificationRead,
    markAllRead: () => markAllNotificationsRead(userId),
    fetchActivity: fetchGroupActivity,
    removeMember: removeGroupMember,
    setMemberRole: setGroupMemberRole,
    updateGroup,
    deleteGroup,
    fetchShoppingItems: fetchGroupShoppingItems,
    createShoppingItem: createGroupShoppingItem,
    updateShoppingItem: updateGroupShoppingItem,
    deleteShoppingItem: deleteGroupShoppingItem,
  }

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>
}

export function useGroups() {
  const ctx = useContext(GroupsContext)
  if (!ctx) throw new Error('useGroups nur innerhalb von GroupsProvider')
  return ctx
}
