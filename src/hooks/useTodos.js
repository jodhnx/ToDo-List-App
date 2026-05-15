import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  localCreateTodo,
  localDeleteTodo,
  localGetTodos,
  localSaveTodos,
  localUpdateTodo,
} from '../lib/localStorage'
import { useAuth } from '../context/AuthContext'

/**
 * Zentrale Todo-Logik mit Supabase Realtime, Bulk-Aktionen und localStorage-Fallback.
 */
export function useTodos() {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const userId = user?.id
  const isOnline = isSupabaseConfigured && !!supabase

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
        const { data, error: err } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', userId)
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false })

        if (err) throw err
        setTodos(data ?? [])
        // Lokale Kopie als Offline-Cache
        localSaveTodos(userId, data ?? [])
      } else {
        setTodos(localGetTodos(userId))
        setError('Lokaler Modus — für Online-Zugriff Supabase in .env konfigurieren.')
      }
    } catch (err) {
      console.warn('Supabase-Fehler, Fallback:', err)
      setTodos(localGetTodos(userId))
      setError('Offline-Cache aktiv. Verbindung zu Supabase prüfen.')
    } finally {
      setLoading(false)
    }
  }, [userId, isOnline])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  // Realtime: Änderungen von anderen Tabs/Geräten sofort anzeigen
  useEffect(() => {
    if (!userId || !isOnline) return

    const channel = supabase
      .channel(`todos-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${userId}`,
        },
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
    if (!userId) return null

    const row = {
      title: payload.title.trim(),
      description: payload.description?.trim() || '',
      category: payload.category,
      priority: payload.priority,
      due_date: payload.due_date || null,
      completed: false,
      pinned: !!payload.pinned,
    }

    if (isOnline) {
      setSyncing(true)
      const { data, error: err } = await supabase
        .from('todos')
        .insert({ ...row, user_id: userId })
        .select()
        .single()
      setSyncing(false)
      if (err) {
        const local = localCreateTodo(userId, row)
        setTodos((prev) => [local, ...prev])
        return local
      }
      setTodos((prev) => [data, ...prev])
      return data
    }

    const local = localCreateTodo(userId, row)
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
        const local = localUpdateTodo(userId, id, updates)
        if (local) setTodos((prev) => prev.map((t) => (t.id === id ? local : t)))
        return local
      }
      setTodos((prev) => prev.map((t) => (t.id === id ? data : t)))
      return data
    }

    const local = localUpdateTodo(userId, id, updates)
    if (local) setTodos((prev) => prev.map((t) => (t.id === id ? local : t)))
    return local
  }

  const deleteTodo = async (id) => {
    if (!userId) return

    if (isOnline) {
      const { error: err } = await supabase.from('todos').delete().eq('id', id).eq('user_id', userId)
      if (err) localDeleteTodo(userId, id)
    } else {
      localDeleteTodo(userId, id)
    }
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const toggleComplete = (todo) => updateTodo(todo.id, { completed: !todo.completed })

  const togglePin = (todo) => updateTodo(todo.id, { pinned: !todo.pinned })

  const duplicateTodo = async (todo) => {
    return createTodo({
      title: `${todo.title} (Kopie)`,
      description: todo.description,
      category: todo.category,
      priority: todo.priority,
      due_date: todo.due_date,
      pinned: false,
    })
  }

  const deleteCompleted = async () => {
    const completed = todos.filter((t) => t.completed)
    for (const t of completed) {
      await deleteTodo(t.id)
    }
    return completed.length
  }

  const completeAllOpen = async () => {
    const open = todos.filter((t) => !t.completed)
    for (const t of open) {
      await updateTodo(t.id, { completed: true })
    }
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
