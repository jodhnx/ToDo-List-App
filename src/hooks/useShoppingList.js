import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  localCreateShoppingItem,
  localDeleteShoppingItem,
  localGetShoppingItems,
  localSaveShoppingItems,
  localUpdateShoppingItem,
} from '../lib/localStorage'
import { DEFAULT_SHOPPING_CATEGORY, hasOpenShoppingDuplicate } from '../lib/shoppingCatalog'

function buildRow(payload) {
  return {
    name: payload.name.trim(),
    quantity: payload.quantity?.trim() || '1',
    category: payload.category || DEFAULT_SHOPPING_CATEGORY,
    note: payload.note?.trim() || '',
    checked: !!payload.checked,
  }
}

export function useShoppingList() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)

  const userId = user?.id
  const isOnline = isSupabaseConfigured && !!supabase

  const fetchItems = useCallback(async () => {
    if (!userId) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      if (isOnline) {
        const { data, error: err } = await supabase
          .from('shopping_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (err) throw err
        setItems(data || [])
        localSaveShoppingItems(userId, data || [])
      } else {
        setItems(localGetShoppingItems(userId))
      }
    } catch (err) {
      console.warn('Shopping-Sync nicht verfügbar, lokaler Fallback:', err)
      setItems(localGetShoppingItems(userId))
      setError('Einkaufsliste lokal gespeichert.')
    } finally {
      setLoading(false)
    }
  }, [userId, isOnline])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    if (!userId || !isOnline) return

    const channel = supabase
      .channel(`shopping-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_items', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems((prev) => (prev.some((item) => item.id === payload.new.id) ? prev : [payload.new, ...prev]))
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) => prev.map((item) => (item.id === payload.new.id ? payload.new : item)))
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) => prev.filter((item) => item.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, isOnline])

  const createItem = async (payload) => {
    if (!userId) throw new Error('Nicht angemeldet')
    const row = buildRow(payload)
    if (!row.name) throw new Error('Bitte Produkt eingeben')
    const duplicate = hasOpenShoppingDuplicate(items, row.name, row.category)
    if (duplicate) {
      const existing = items.find(
        (item) =>
          !item.checked &&
          item.name.toLowerCase() === row.name.toLowerCase() &&
          (item.category || DEFAULT_SHOPPING_CATEGORY) === row.category,
      )
      return { duplicate: true, ...existing }
    }

    if (isOnline) {
      setSyncing(true)
      try {
        const { data, error: err } = await supabase
          .from('shopping_items')
          .insert({ ...row, user_id: userId })
          .select()
          .single()
        if (err?.code === '23505') return { duplicate: true }
        if (err) throw err
        setItems((prev) => [data, ...prev])
        return data
      } catch {
        const local = localCreateShoppingItem(userId, row)
        setItems((prev) => [local, ...prev])
        return local
      } finally {
        setSyncing(false)
      }
    }

    const local = localCreateShoppingItem(userId, row)
    setItems((prev) => [local, ...prev])
    return local
  }

  const updateItem = async (id, updates) => {
    if (!userId) return null

    if (isOnline) {
      const { data, error: err } = await supabase
        .from('shopping_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
      if (!err) {
        setItems((prev) => prev.map((item) => (item.id === id ? data : item)))
        return data
      }
    }

    const local = localUpdateShoppingItem(userId, id, updates)
    if (local) setItems((prev) => prev.map((item) => (item.id === id ? local : item)))
    return local
  }

  const deleteItem = async (id) => {
    if (!userId) return
    if (isOnline) {
      const { error: err } = await supabase.from('shopping_items').delete().eq('id', id).eq('user_id', userId)
      if (err) localDeleteShoppingItem(userId, id)
    } else {
      localDeleteShoppingItem(userId, id)
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const toggleItem = (item) => updateItem(item.id, { checked: !item.checked })

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
