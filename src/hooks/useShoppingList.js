import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  localClearShoppingSyncQueue,
  localCreateShoppingItem,
  localDeleteShoppingItem,
  localGetShoppingItems,
  localGetShoppingSyncQueue,
  localQueueShoppingSync,
  localSaveShoppingItems,
  localSaveShoppingSyncQueue,
  localUpdateShoppingItem,
} from '../lib/localStorage'
import { DEFAULT_SHOPPING_CATEGORY, hasOpenShoppingDuplicate } from '../lib/shoppingCatalog'
import { mergeRecordsById } from '../lib/dataSafety'

function buildRow(payload) {
  return {
    name: payload.name.trim(),
    quantity: payload.quantity?.trim() || '1',
    category: payload.category || DEFAULT_SHOPPING_CATEGORY,
    note: payload.note?.trim() || '',
    checked: !!payload.checked,
  }
}

function browserIsOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

function isNetworkError(err) {
  const msg = String(err?.message || err || '').toLowerCase()
  return browserIsOffline() || msg.includes('failed to fetch') || msg.includes('network') || msg.includes('timeout')
}

function formatShoppingError(err) {
  const msg = err?.message || String(err)
  const code = err?.code || ''
  if (code === '42P01' || /relation.*shopping_items.*does not exist/i.test(msg)) {
    return 'Einkaufsliste ist in Supabase noch nicht eingerichtet. Bitte die neueste Shopping-Migration ausführen.'
  }
  if (/column.*does not exist|schema cache/i.test(msg)) {
    return 'Einkaufsliste ist in Supabase nicht aktuell. Bitte die neuesten Migrationen ausführen.'
  }
  if (code === '42501' || /row-level security/i.test(msg)) {
    return 'Keine Berechtigung zum Speichern der Einkaufsliste. Bitte RLS-Migration prüfen und neu anmelden.'
  }
  if (/jwt|session|auth/i.test(msg)) {
    return 'Sitzung abgelaufen - bitte neu anmelden.'
  }
  return msg
}

function withoutLocalOnlyFields(row) {
  const { _pendingSync, _syncState, duplicate, ...rest } = row
  return rest
}

export function useShoppingList() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [networkOnline, setNetworkOnline] = useState(() => !browserIsOffline())

  const userId = user?.id
  const hasCloud = isSupabaseConfigured && !!supabase
  const canReachCloud = hasCloud && networkOnline

  const setItemsAndCache = useCallback((updater) => {
    setItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (userId) localSaveShoppingItems(userId, next)
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
      .from('shopping_items')
      .insert({ ...clean, user_id: userId })
      .select()
      .single()
    if (err?.code === '23505') return { duplicate: true }
    if (err) throw err
    return data
  }, [userId])

  const syncQueuedItems = useCallback(async () => {
    if (!userId || !canReachCloud) return
    const queue = localGetShoppingSyncQueue(userId)
    if (!queue.length) return

    const remaining = []
    for (const op of queue) {
      try {
        if (op.type === 'create') {
          await insertRemote(op.item)
        } else if (op.type === 'update') {
          const { error: err } = await supabase
            .from('shopping_items')
            .update({ ...op.updates, updated_at: new Date().toISOString() })
            .eq('id', op.id)
            .eq('user_id', userId)
          if (err) throw err
        } else if (op.type === 'delete') {
          const { error: err } = await supabase.from('shopping_items').delete().eq('id', op.id).eq('user_id', userId)
          if (err) throw err
        }
      } catch {
        remaining.push(op)
      }
    }

    if (remaining.length) localSaveShoppingSyncQueue(userId, remaining)
    else localClearShoppingSyncQueue(userId)
  }, [canReachCloud, insertRemote, userId])

  const fetchItems = useCallback(async () => {
    if (!userId) {
      setItemsAndCache([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const cached = localGetShoppingItems(userId)
    setItems(cached)
    try {
      if (canReachCloud) {
        await syncQueuedItems()
        const { data, error: err } = await supabase
          .from('shopping_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (err) throw new Error(formatShoppingError(err))
        const merged = mergeRecordsById(data || [], cached)
        setItemsAndCache(merged)
      } else {
        setItems(localGetShoppingItems(userId))
        if (hasCloud) setError('Offline: Einkaufsliste wird später mit deinem Konto synchronisiert.')
      }
    } catch (err) {
      console.warn('Shopping-Sync nicht verfügbar, lokaler Fallback:', err)
      setItems(localGetShoppingItems(userId))
      setError(formatShoppingError(err))
    } finally {
      setLoading(false)
    }
  }, [userId, hasCloud, canReachCloud, syncQueuedItems, setItemsAndCache])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    if (!userId || !canReachCloud) return

    const channel = supabase
      .channel(`shopping-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_items', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItemsAndCache((prev) => {
              if (prev.some((item) => item.id === payload.new.id)) return prev
              const withoutOptimistic = prev.filter(
                (item) =>
                  !item._optimistic ||
                  item.name?.toLowerCase() !== payload.new.name?.toLowerCase() ||
                  item.category !== payload.new.category,
              )
              return [payload.new, ...withoutOptimistic]
            })
          } else if (payload.eventType === 'UPDATE') {
            setItemsAndCache((prev) => prev.map((item) => (item.id === payload.new.id ? payload.new : item)))
          } else if (payload.eventType === 'DELETE') {
            setItemsAndCache((prev) => prev.filter((item) => item.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, canReachCloud, setItemsAndCache])

  useEffect(() => {
    if (!userId || !hasCloud) return
    const onOnline = () => fetchItems()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [fetchItems, hasCloud, userId])

  const createItem = async (payload) => {
    if (!userId) throw new Error('Nicht angemeldet')
    const row = buildRow(payload)
    if (!row.name) throw new Error('Bitte Produkt eingeben')
    if (hasOpenShoppingDuplicate(items, row.name, row.category)) {
      const existing = items.find(
        (item) =>
          !item.checked &&
          item.name.toLowerCase() === row.name.toLowerCase() &&
          (item.category || DEFAULT_SHOPPING_CATEGORY) === row.category,
      )
      return { duplicate: true, ...existing }
    }

    const tempId = `opt-${crypto.randomUUID()}`
    const optimistic = {
      id: tempId,
      user_id: userId,
      ...row,
      checked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _pendingSync: true,
      _optimistic: true,
    }
    setItemsAndCache((prev) => [optimistic, ...prev])

    if (canReachCloud) {
      try {
        const data = await insertRemote(row)
        if (data?.duplicate) {
          setItemsAndCache((prev) => prev.filter((item) => item.id !== tempId))
          return data
        }
        setItemsAndCache((prev) => prev.map((item) => (item.id === tempId ? data : item)))
        return data
      } catch (err) {
        if (!isNetworkError(err)) {
          setItemsAndCache((prev) => prev.filter((item) => item.id !== tempId))
          throw new Error(formatShoppingError(err))
        }
        const local = localCreateShoppingItem(userId, { ...row, _pendingSync: true, _syncState: 'create' })
        localQueueShoppingSync(userId, { type: 'create', item: local })
        setItemsAndCache((prev) => prev.map((item) => (item.id === tempId ? local : item)))
        return local
      }
    }

    const local = localCreateShoppingItem(userId, { ...row, _pendingSync: true, _syncState: 'create' })
    localQueueShoppingSync(userId, { type: 'create', item: local })
    setItemsAndCache((prev) => prev.map((item) => (item.id === tempId ? local : item)))
    return local
  }

  const updateItem = async (id, updates, { optimistic = true } = {}) => {
    if (!userId) return null

    const snapshot = items.find((item) => item.id === id)
    if (optimistic && snapshot) {
      setItemsAndCache((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item,
        ),
      )
    }

    if (canReachCloud) {
      const { data, error: err } = await supabase
        .from('shopping_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
      if (!err) {
        setItemsAndCache((prev) => prev.map((item) => (item.id === id ? data : item)))
        return data
      }
      if (!isNetworkError(err)) {
        if (optimistic && snapshot) {
          setItemsAndCache((prev) => prev.map((item) => (item.id === id ? snapshot : item)))
        }
        throw new Error(formatShoppingError(err))
      }
    }

    const local = localUpdateShoppingItem(userId, id, { ...updates, _pendingSync: true, _syncState: 'update' })
    localQueueShoppingSync(userId, { type: 'update', id, updates })
    if (local) setItemsAndCache((prev) => prev.map((item) => (item.id === id ? local : item)))
    return local
  }

  const deleteItem = async (id) => {
    if (!userId) return
    const snapshot = items
    setItemsAndCache((prev) => prev.filter((item) => item.id !== id))

    if (canReachCloud) {
      const { error: err } = await supabase.from('shopping_items').delete().eq('id', id).eq('user_id', userId)
      if (err) {
        if (!isNetworkError(err)) {
          setItemsAndCache(snapshot)
          throw new Error(formatShoppingError(err))
        }
        localQueueShoppingSync(userId, { type: 'delete', id })
        localDeleteShoppingItem(userId, id)
      }
    } else {
      localQueueShoppingSync(userId, { type: 'delete', id })
      localDeleteShoppingItem(userId, id)
    }
  }

  const toggleItem = (item) => {
    void updateItem(item.id, { checked: !item.checked })
  }

  const deleteChecked = async () => {
    const checked = items.filter((item) => item.checked)
    for (const item of checked) await deleteItem(item.id)
    return checked.length
  }

  return {
    items,
    loading,
    syncing,
    error,
    createItem,
    updateItem,
    deleteItem,
    toggleItem,
    deleteChecked,
    refetch: fetchItems,
  }
}
