import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { mergeRecordsById } from '../lib/dataSafety'

const CACHE_PREFIX = 'focus_group_live_'

function readCache(groupId) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${groupId}`)
    return raw ? JSON.parse(raw) : { members: [], tasks: [], activity: [] }
  } catch {
    return { members: [], tasks: [], activity: [] }
  }
}

function writeCache(groupId, data) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${groupId}`, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

async function enrichTaskProfiles(tasks) {
  if (!supabase || !tasks?.length) return tasks || []
  const ids = [...new Set(tasks.flatMap((t) => [t.creator_id, t.assignee_id, t.completed_by].filter(Boolean)))]
  if (!ids.length) return tasks
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', ids)
  const map = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  return tasks.map((t) => ({
    ...t,
    creator: map[t.creator_id] || t.creator || null,
    assignee: t.assignee_id ? map[t.assignee_id] || t.assignee || null : null,
  }))
}

async function enrichMemberProfiles(members) {
  if (!supabase || !members?.length) return members || []
  const ids = members.map((m) => m.user_id).filter(Boolean)
  if (!ids.length) return members
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', ids)
  const map = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  return members.map((m) => ({ ...m, profile: map[m.user_id] || m.profile || null }))
}

export function useGroupLive(groupId, api) {
  const {
    fetchMembers,
    fetchTasks,
    fetchActivity,
    createTask,
    updateTask,
    deleteTask,
    removeMember,
    setMemberRole,
  } = api

  const initial = groupId ? readCache(groupId) : { members: [], tasks: [], activity: [] }
  const [members, setMembers] = useState(initial.members)
  const [tasks, setTasks] = useState(initial.tasks)
  const [activity, setActivity] = useState(initial.activity)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const pendingIds = useRef(new Set())
  const membersRef = useRef(members)
  const tasksRef = useRef(tasks)
  const activityRef = useRef(activity)
  const mounted = useRef(true)

  useEffect(() => {
    membersRef.current = members
  }, [members])
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])
  useEffect(() => {
    activityRef.current = activity
  }, [activity])

  const persistNow = useCallback(() => {
    if (!groupId) return
    writeCache(groupId, {
      members: membersRef.current,
      tasks: tasksRef.current,
      activity: activityRef.current,
    })
  }, [groupId])

  const reload = useCallback(async () => {
    if (!groupId) {
      setMembers([])
      setTasks([])
      setActivity([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    const local = readCache(groupId)
    if (local.members?.length) setMembers(local.members)
    if (local.tasks?.length) setTasks(local.tasks)
    if (local.activity?.length) setActivity(local.activity)

    try {
      const [mRes, tRes, aRes] = await Promise.allSettled([
        fetchMembers(groupId),
        fetchTasks(groupId),
        fetchActivity(groupId),
      ])

      const nextMembers = mRes.status === 'fulfilled' ? mRes.value : local.members || []
      const nextTasks =
        tRes.status === 'fulfilled' ? mergeRecordsById(tRes.value || [], local.tasks || []) : local.tasks || []
      const nextActivity = aRes.status === 'fulfilled' ? aRes.value : local.activity || []

      if (!mounted.current) return
      setMembers(nextMembers)
      setTasks(nextTasks)
      setActivity(nextActivity)
      writeCache(groupId, { members: nextMembers, tasks: nextTasks, activity: nextActivity })

      if (mRes.status === 'rejected' && tRes.status === 'rejected') {
        setError(mRes.reason?.message || 'Gruppe konnte nicht geladen werden. Cache wird angezeigt.')
      }
    } catch (err) {
      if (mounted.current) setError(err.message || 'Gruppe konnte nicht geladen werden')
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [groupId, fetchMembers, fetchTasks, fetchActivity])

  useEffect(() => {
    mounted.current = true
    reload()
    return () => {
      mounted.current = false
    }
  }, [reload])

  useEffect(() => {
    if (!groupId || !supabase) return

    const channel = supabase
      .channel(`group-live-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_tasks', filter: `group_id=eq.${groupId}` },
        async (payload) => {
          const id = payload.new?.id || payload.old?.id
          if (id && pendingIds.current.has(id)) return

          if (payload.eventType === 'INSERT' && payload.new) {
            const [enriched] = await enrichTaskProfiles([payload.new])
            setTasks((prev) => {
              if (prev.some((t) => t.id === enriched.id)) {
                return prev.map((t) => (t.id === enriched.id ? { ...t, ...enriched } : t))
              }
              const withoutOpt = prev.filter((t) => !t._optimistic || t.title !== enriched.title)
              return [enriched, ...withoutOpt]
            })
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const [enriched] = await enrichTaskProfiles([payload.new])
            setTasks((prev) => prev.map((t) => (t.id === enriched.id ? { ...t, ...enriched } : t)))
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id))
          }
          window.setTimeout(persistNow, 0)
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const [enriched] = await enrichMemberProfiles([payload.new])
            setMembers((prev) =>
              prev.some((m) => m.user_id === enriched.user_id) ? prev : [...prev, enriched],
            )
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const [enriched] = await enrichMemberProfiles([payload.new])
            setMembers((prev) =>
              prev.map((m) => (m.user_id === enriched.user_id ? { ...m, ...enriched } : m)),
            )
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setMembers((prev) => prev.filter((m) => m.user_id !== payload.old.user_id))
          }
          window.setTimeout(persistNow, 0)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, persistNow])

  const createTaskOptimistic = useCallback(
    async (payload) => {
      const tempId = `opt-task-${crypto.randomUUID()}`
      const optimistic = {
        id: tempId,
        ...payload,
        status: payload.status || 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _optimistic: true,
      }
      setTasks((prev) => [optimistic, ...prev])
      pendingIds.current.add(tempId)

      try {
        const data = await createTask(payload)
        const [enriched] = await enrichTaskProfiles([data])
        pendingIds.current.delete(tempId)
        pendingIds.current.add(data.id)
        setTasks((prev) => prev.map((t) => (t.id === tempId ? enriched : t)))
        window.setTimeout(() => pendingIds.current.delete(data.id), 1500)
        return enriched
      } catch (err) {
        pendingIds.current.delete(tempId)
        setTasks((prev) => prev.filter((t) => t.id !== tempId))
        throw err
      }
    },
    [createTask],
  )

  const updateTaskOptimistic = useCallback(
    async (task, updates, meta = {}) => {
      if (!task?.id) return null
      const snapshot = { ...task }
      pendingIds.current.add(task.id)
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t)),
      )

      try {
        const data = await updateTask(task.id, updates, meta)
        const [enriched] = await enrichTaskProfiles([{ ...task, ...data }])
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...enriched } : t)))
        return enriched
      } catch (err) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? snapshot : t)))
        throw err
      } finally {
        window.setTimeout(() => pendingIds.current.delete(task.id), 1200)
      }
    },
    [updateTask],
  )

  const deleteTaskOptimistic = useCallback(
    async (task) => {
      if (!task?.id) return
      const snapshot = tasksRef.current
      pendingIds.current.add(task.id)
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
      try {
        await deleteTask(task.id)
      } catch (err) {
        setTasks(snapshot)
        throw err
      } finally {
        window.setTimeout(() => pendingIds.current.delete(task.id), 1200)
      }
    },
    [deleteTask],
  )

  const removeMemberOptimistic = useCallback(
    async (member) => {
      const snapshot = membersRef.current
      setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id))
      try {
        await removeMember(groupId, member.user_id)
      } catch (err) {
        setMembers(snapshot)
        throw err
      }
    },
    [groupId, removeMember],
  )

  const setRoleOptimistic = useCallback(
    async (member, newRole) => {
      const snapshot = { ...member }
      setMembers((prev) =>
        prev.map((m) => (m.user_id === member.user_id ? { ...m, role: newRole } : m)),
      )
      try {
        await setMemberRole(groupId, member.user_id, newRole)
      } catch (err) {
        setMembers((prev) => prev.map((m) => (m.user_id === member.user_id ? snapshot : m)))
        throw err
      }
    },
    [groupId, setMemberRole],
  )

  const refreshActivity = useCallback(async () => {
    if (!groupId) return
    try {
      const data = await fetchActivity(groupId)
      setActivity(data)
      writeCache(groupId, {
        members: membersRef.current,
        tasks: tasksRef.current,
        activity: data,
      })
    } catch {
      /* keep cache */
    }
  }, [groupId, fetchActivity])

  return {
    members,
    tasks,
    activity,
    loading,
    error,
    reload,
    refreshActivity,
    createTaskOptimistic,
    updateTaskOptimistic,
    deleteTaskOptimistic,
    removeMemberOptimistic,
    setRoleOptimistic,
  }
}
