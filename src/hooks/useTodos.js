import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  localCreateTodo,
  localClearTodoSyncQueue,
  localDeleteTodo,
  localGetTodoSyncQueue,
  localGetTodos,
  localQueueTodoSync,
  localSaveTodos,
  localSaveTodoSyncQueue,
  localUpdateTodo,
} from '../lib/localStorage'
import { useAuth } from '../context/AuthContext'

async function fetchTodosFromSupabase(userId) {
  let query = supabase.from('todos').select('*').eq('user_id', userId)
  const { data, error } = await query.order('created_at', { ascending: false })

  if (error && /pinned|column/i.test(error.message)) {
    const fallback = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (fallback.error) throw fallback.error
    return fallback.data ?? []
  }
  if (error) throw error
  return (data ?? []).sort((a, b) => Number(b.pinned) - Number(a.pinned))
}

function buildRow(payload) {
  return {
    title: payload.title.trim(),
    description: payload.description?.trim() || '',
    category: payload.category,
    priority: payload.priority,
    due_date: payload.due_date || null,
    due_time: payload.due_time || null,
    reminder_at: payload.reminder_at || null,
    completed: false,
    pinned: !!payload.pinned,
  }
}

function stripUnknownColumns(row, err) {
  if (!err?.message) return row
  let next = { ...row }
  if (/due_time|column/i.test(err.message)) {
    const { due_time, ...rest } = next
    next = rest
  }
  if (/reminder_at|column/i.test(err.message)) {
    const { reminder_at, ...rest } = next
    next = rest
  }
  if (/pinned|column/i.test(err.message)) {
    const { pinned, ...rest } = next
    next = rest
  }
  return next
}

function withoutLocalOnlyFields(row) {
  const { _pendingSync, _syncState, ...rest } = row
  return rest
}

export function useTodos() {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const userId = user?.id
  const isOnline = isSupabaseConfigured && !!supabase

  const insertRemote = useCallback(async (row) => {
    const clean = withoutLocalOnlyFields(row)
    const { data, error: err } = await supabase
      .from('todos')
      .insert({ ...clean, user_id: userId })
      .select()
      .single()

    if (err && /pinned|due_time|reminder_at|column/i.test(err.message)) {
      const slim = stripUnknownColumns(clean, err)
      const retry = await supabase
        .from('todos')
        .insert({ ...slim, user_id: userId })
        .select()
        .single()
      if (retry.error) throw retry.error
      return retry.data
    }
    if (err) throw err
    return data
  }, [userId])

  const syncQueuedTodos = useCallback(async () => {
    if (!userId || !isOnline) return
    const queue = localGetTodoSyncQueue(userId)
    if (!queue.length) return

    const remaining = []
    for (const op of queue) {
      try {
        if (op.type === 'create') {
          await insertRemote(op.todo)
        } else if (op.type === 'update') {
          const { error: err } = await supabase
            .from('todos')
            .update(op.updates)
            .eq('id', op.id)
            .eq('user_id', userId)
          if (err) throw err
        } else if (op.type === 'delete') {
          const { error: err } = await supabase.from('todos').delete().eq('id', op.id).eq('user_id', userId)
          if (err) throw err
        }
      } catch {
        remaining.push(op)
      }
    }

    if (remaining.length) localSaveTodoSyncQueue(userId, remaining)
    else localClearTodoSyncQueue(userId)
  }, [insertRemote, isOnline, userId])

  const fetchTodos = useCallback(async () => {
    if (!userId) {
      setTodos([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (isOnline) {
        await syncQueuedTodos()
        const data = await fetchTodosFromSupabase(userId)
        setTodos(data)
        localSaveTodos(userId, data)
      } else {
        setTodos(localGetTodos(userId))
      }
    } catch (err) {
      console.warn('Supabase-Fehler, Fallback:', err)
      setTodos(localGetTodos(userId))
      setError('Offline-Cache aktiv.')
    } finally {
      setLoading(false)
    }
  }, [userId, isOnline, syncQueuedTodos])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  useEffect(() => {
    if (!userId || !isOnline) return

    const channel = supabase
      .channel(`todos-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTodos((prev) => {
              if (prev.some((t) => t.id === payload.new.id)) return prev
              return [payload.new, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            setTodos((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)))
          } else if (payload.eventType === 'DELETE') {
            setTodos((prev) => prev.filter((t) => t.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, isOnline])

  const createTodo = async (payload) => {
    if (!userId) throw new Error('Nicht angemeldet')

    const row = buildRow(payload)

    if (isOnline) {
      setSyncing(true)
      try {
        const data = await insertRemote(row)
        setTodos((prev) => [data, ...prev])
        return data
      } catch (err) {
        const local = localCreateTodo(userId, { ...row, _pendingSync: true, _syncState: 'create' })
        localQueueTodoSync(userId, { type: 'create', todo: local })
        setTodos((prev) => [local, ...prev])
        return local
      } finally {
        setSyncing(false)
      }
    }

    const local = localCreateTodo(userId, { ...row, _pendingSync: true, _syncState: 'create' })
    localQueueTodoSync(userId, { type: 'create', todo: local })
    setTodos((prev) => [local, ...prev])
    return local
  }

  const updateTodo = async (id, updates) => {
    if (!userId) return null

    if (isOnline) {
      const { data, error: err } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
      if (err) {
        const local = localUpdateTodo(userId, id, { ...updates, _pendingSync: true, _syncState: 'update' })
        localQueueTodoSync(userId, { type: 'update', id, updates })
        if (local) setTodos((prev) => prev.map((t) => (t.id === id ? local : t)))
        return local
      }
      setTodos((prev) => prev.map((t) => (t.id === id ? data : t)))
      return data
    }

    const local = localUpdateTodo(userId, id, { ...updates, _pendingSync: true, _syncState: 'update' })
    localQueueTodoSync(userId, { type: 'update', id, updates })
    if (local) setTodos((prev) => prev.map((t) => (t.id === id ? local : t)))
    return local
  }

  const deleteTodo = async (id) => {
    if (!userId) return

    if (isOnline) {
      const { error: err } = await supabase.from('todos').delete().eq('id', id).eq('user_id', userId)
      if (err) {
        localQueueTodoSync(userId, { type: 'delete', id })
        localDeleteTodo(userId, id)
      }
    } else {
      localQueueTodoSync(userId, { type: 'delete', id })
      localDeleteTodo(userId, id)
    }
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const toggleComplete = (todo) => updateTodo(todo.id, { completed: !todo.completed })
  const togglePin = (todo) => updateTodo(todo.id, { pinned: !todo.pinned })

  const duplicateTodo = async (todo) =>
    createTodo({
      title: `${todo.title} (Kopie)`,
      description: todo.description,
      category: todo.category,
      priority: todo.priority,
      due_date: todo.due_date,
      due_time: todo.due_time,
      reminder_at: todo.reminder_at,
      pinned: false,
    })

  const deleteCompleted = async () => {
    const completed = todos.filter((t) => t.completed)
    for (const t of completed) await deleteTodo(t.id)
    return completed.length
  }

  const completeAllOpen = async () => {
    const open = todos.filter((t) => !t.completed)
    for (const t of open) await updateTodo(t.id, { completed: true })
    return open.length
  }

  return {
    todos,
    loading,
    error,
    syncing,
    isOnline,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    togglePin,
    duplicateTodo,
    deleteCompleted,
    completeAllOpen,
    refetch: fetchTodos,
  }
}
