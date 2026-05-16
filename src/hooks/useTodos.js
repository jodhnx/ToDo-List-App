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

function browserIsOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

function isNetworkError(err) {
  const msg = String(err?.message || err || '').toLowerCase()
  return browserIsOffline() || msg.includes('failed to fetch') || msg.includes('network') || msg.includes('timeout')
}

function formatTodoError(err) {
  const msg = err?.message || String(err)
  const code = err?.code || ''
  if (code === '42P01' || /relation.*todos.*does not exist/i.test(msg)) {
    return 'Aufgaben-Tabelle ist in Supabase nicht eingerichtet. Bitte die neueste Aufgaben-Migration ausführen.'
  }
  if (/column.*does not exist|schema cache/i.test(msg)) {
    return 'Aufgaben-Tabelle ist in Supabase nicht aktuell. Bitte die neuesten Migrationen ausführen.'
  }
  if (code === '23514' || /check constraint/i.test(msg)) {
    return 'Aufgabe enthält einen ungültigen Wert. Bitte Kategorie oder Priorität prüfen.'
  }
  if (code === '42501' || /row-level security/i.test(msg)) {
    return 'Keine Berechtigung zum Speichern der Aufgabe. Bitte RLS-Migration prüfen und neu anmelden.'
  }
  if (/jwt|session|auth/i.test(msg)) return 'Sitzung abgelaufen - bitte neu anmelden.'
  return msg
}

export function useTodos() {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [networkOnline, setNetworkOnline] = useState(() => !browserIsOffline())

  const userId = user?.id
  const hasCloud = isSupabaseConfigured && !!supabase
  const canReachCloud = hasCloud && networkOnline

  const setTodosAndCache = useCallback((updater) => {
    setTodos((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (userId) localSaveTodos(userId, next)
      return next
    })
  }, [userId])

  useEffect(() => {
    const updateOnlineState = () => setNetworkOnline(!browserIsOffline())
    window.addEventListener('online', updateOnlineState)
    window.addEventListener('offline', updateOnlineState)
    return () => {
      window.removeEventListener('online', updateOnlineState)
      window.removeEventListener('offline', updateOnlineState)
    }
  }, [])

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
      if (retry.error) throw new Error(formatTodoError(retry.error))
      return retry.data
    }
    if (err) throw new Error(formatTodoError(err))
    return data
  }, [userId])

  const syncQueuedTodos = useCallback(async () => {
    if (!userId || !canReachCloud) return
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
  }, [insertRemote, canReachCloud, userId])

  const fetchTodos = useCallback(async () => {
    if (!userId) {
      setTodosAndCache([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const cached = localGetTodos(userId)
    setTodos(cached)

    try {
      if (canReachCloud) {
        await syncQueuedTodos()
        const data = await fetchTodosFromSupabase(userId)
        setTodosAndCache(data)
        localSaveTodos(userId, data)
      } else {
        setTodos(localGetTodos(userId))
        if (hasCloud) setError('Offline: Änderungen werden später mit deinem Konto synchronisiert.')
      }
    } catch (err) {
      console.warn('Supabase-Fehler, Fallback:', err)
      setTodos(localGetTodos(userId))
      setError(formatTodoError(err))
    } finally {
      setLoading(false)
    }
  }, [userId, hasCloud, canReachCloud, syncQueuedTodos, setTodosAndCache])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  useEffect(() => {
    if (!userId || !canReachCloud) return

    const channel = supabase
      .channel(`todos-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTodosAndCache((prev) => {
              if (prev.some((t) => t.id === payload.new.id)) return prev
              return [payload.new, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            setTodosAndCache((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)))
          } else if (payload.eventType === 'DELETE') {
            setTodosAndCache((prev) => prev.filter((t) => t.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, canReachCloud, setTodosAndCache])

  useEffect(() => {
    if (!userId || !hasCloud) return
    const onOnline = () => fetchTodos()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [fetchTodos, hasCloud, userId])

  const createTodo = async (payload) => {
    if (!userId) throw new Error('Nicht angemeldet')

    const row = buildRow(payload)

    if (canReachCloud) {
      setSyncing(true)
      try {
        const data = await insertRemote(row)
        setTodosAndCache((prev) => [data, ...prev])
        return data
      } catch (err) {
        if (!isNetworkError(err)) {
          console.error('Aufgabe konnte nicht in Supabase gespeichert werden:', err)
          throw err
        }
        const local = localCreateTodo(userId, { ...row, _pendingSync: true, _syncState: 'create' })
        localQueueTodoSync(userId, { type: 'create', todo: local })
        setTodosAndCache((prev) => [local, ...prev])
        return local
      } finally {
        setSyncing(false)
      }
    }

    const local = localCreateTodo(userId, { ...row, _pendingSync: true, _syncState: 'create' })
    localQueueTodoSync(userId, { type: 'create', todo: local })
    setTodosAndCache((prev) => [local, ...prev])
    return local
  }

  const updateTodo = async (id, updates) => {
    if (!userId) return null

    if (canReachCloud) {
      const { data, error: err } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
      if (err) {
        if (!isNetworkError(err)) {
          console.error('Aufgabe konnte nicht in Supabase aktualisiert werden:', err)
          throw new Error(formatTodoError(err))
        }
        const local = localUpdateTodo(userId, id, { ...updates, _pendingSync: true, _syncState: 'update' })
        localQueueTodoSync(userId, { type: 'update', id, updates })
        if (local) setTodosAndCache((prev) => prev.map((t) => (t.id === id ? local : t)))
        return local
      }
      setTodosAndCache((prev) => prev.map((t) => (t.id === id ? data : t)))
      return data
    }

    const local = localUpdateTodo(userId, id, { ...updates, _pendingSync: true, _syncState: 'update' })
    localQueueTodoSync(userId, { type: 'update', id, updates })
    if (local) setTodosAndCache((prev) => prev.map((t) => (t.id === id ? local : t)))
    return local
  }

  const deleteTodo = async (id) => {
    if (!userId) return

    if (canReachCloud) {
      const { error: err } = await supabase.from('todos').delete().eq('id', id).eq('user_id', userId)
      if (err) {
        if (!isNetworkError(err)) {
          console.error('Aufgabe konnte nicht in Supabase gelöscht werden:', err)
          throw new Error(formatTodoError(err))
        }
        localQueueTodoSync(userId, { type: 'delete', id })
        localDeleteTodo(userId, id)
      }
    } else {
      localQueueTodoSync(userId, { type: 'delete', id })
      localDeleteTodo(userId, id)
    }
    setTodosAndCache((prev) => prev.filter((t) => t.id !== id))
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
    isOnline: hasCloud,
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
