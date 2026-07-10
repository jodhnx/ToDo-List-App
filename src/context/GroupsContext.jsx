import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { getCachedGroups, setCachedGroups } from '../lib/groupsCache'
import { mergeGroups } from '../lib/dataSafety'
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
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 800

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function GroupsProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id
  const enabled = groupsEnabled()

  const [groups, setGroups] = useState(() => (userId ? getCachedGroups(userId) : []))
  const [invites, setInvites] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')

  const refreshLock = useRef(false)
  const realtimeTimer = useRef(null)

  const loadGroupsWithRetry = useCallback(async () => {
    if (!enabled || !userId) return []
    let lastError = null
    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        const data = await fetchMyGroups(userId)
        const cached = getCachedGroups(userId)
        const merged = mergeGroups(data, cached)
        setGroups(merged)
        if (merged.length) setCachedGroups(userId, merged)
        return merged
      } catch (err) {
        lastError = err
        if (attempt < MAX_RETRIES - 1) await wait(RETRY_DELAY_MS * (attempt + 1))
      }
    }
    throw lastError
  }, [enabled, userId])

  const refreshGroups = useCallback(async () => {
    if (!enabled || !userId) {
      setGroups([])
      return []
    }
    try {
      return await loadGroupsWithRetry()
    } catch (err) {
      const cached = getCachedGroups(userId)
      if (cached.length) setGroups(cached)
      setError(err.message || 'Gruppen konnten nicht geladen werden')
      throw err
    }
  }, [enabled, userId, loadGroupsWithRetry])

  const refreshInvites = useCallback(async () => {
    if (!enabled || !userId) {
      setInvites([])
      return []
    }
    const data = await fetchPendingInvites(userId)
    setInvites(data)
    return data
  }, [enabled, userId])

  const refreshNotifications = useCallback(async () => {
    if (!enabled || !userId) {
      setNotifications([])
      return []
    }
    const data = await fetchNotifications(userId)
    setNotifications(data)
    return data
  }, [enabled, userId])

  const refreshAll = useCallback(
    async ({ silent = false } = {}) => {
      if (!enabled || !userId) {
        setLoading(false)
        return
      }
      if (refreshLock.current) return
      refreshLock.current = true
      if (!silent) setLoading(true)
      else setSyncing(true)

      const cached = getCachedGroups(userId)
      if (cached.length) setGroups((prev) => (prev.length ? prev : cached))

      try {
        const results = await Promise.allSettled([
          loadGroupsWithRetry(),
          refreshInvites(),
          refreshNotifications(),
        ])

        const failures = results.filter((r) => r.status === 'rejected')
        if (failures.length) {
          const groupFailed = results[0].status === 'rejected'
          if (groupFailed) {
            const fallback = getCachedGroups(userId)
            if (fallback.length) setGroups(fallback)
            setError(results[0].reason?.message || 'Gruppen konnten nicht synchronisiert werden')
          }
        } else {
          setError('')
        }
      } finally {
        refreshLock.current = false
        setLoading(false)
        setSyncing(false)
      }
    },
    [enabled, userId, loadGroupsWithRetry, refreshInvites, refreshNotifications],
  )

  const scheduleRealtimeRefresh = useCallback(() => {
    if (realtimeTimer.current) clearTimeout(realtimeTimer.current)
    realtimeTimer.current = setTimeout(() => {
      refreshAll({ silent: true })
    }, 350)
  }, [refreshAll])

  useEffect(() => {
    if (userId) {
      const cached = getCachedGroups(userId)
      if (cached.length) setGroups(cached)
    }
    refreshAll()
  }, [userId, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled || !userId || !supabase) return

    const channel = supabase
      .channel(`family-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_invites', filter: `invitee_id=eq.${userId}` },
        scheduleRealtimeRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${userId}` },
        scheduleRealtimeRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => refreshNotifications(),
      )
      .subscribe()

    return () => {
      if (realtimeTimer.current) clearTimeout(realtimeTimer.current)
      supabase.removeChannel(channel)
    }
  }, [enabled, userId, scheduleRealtimeRefresh, refreshNotifications])

  useEffect(() => {
    const onOnline = () => refreshAll({ silent: true })
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshAll({ silent: true })
    }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refreshAll])

  const value = useMemo(
    () => ({
      enabled,
      groups,
      invites,
      notifications,
      loading,
      syncing,
      error,
      unreadCount: notifications.filter((n) => !n.read).length,
      inviteCount: invites.length,
      refreshAll,
      refreshGroups,
      refreshInvites,
      refreshNotifications,
      createGroup: async (payload) => {
        if (!userId) throw new Error('Bitte zuerst anmelden')
        const group = await createGroup({ ...payload, userId })
        await refreshAll({ silent: true })
        return group
      },
      fetchMembers: fetchGroupMembers,
      inviteMember: (args) => inviteByUsername({ ...args, inviterId: userId }),
      respondInvite: async (args) => {
        const result = await respondToInvite({ ...args, userId })
        await refreshAll({ silent: true })
        return result
      },
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
    }),
    [
      enabled,
      groups,
      invites,
      notifications,
      loading,
      syncing,
      error,
      refreshAll,
      refreshGroups,
      refreshInvites,
      refreshNotifications,
      userId,
    ],
  )

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>
}

export function useGroups() {
  const ctx = useContext(GroupsContext)
  if (!ctx) throw new Error('useGroups nur innerhalb von GroupsProvider')
  return ctx
}
