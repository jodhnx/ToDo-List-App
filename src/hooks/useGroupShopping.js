import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { localGetGroupShoppingItems, localSaveGroupShoppingItems } from '../lib/localStorage'
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

export function useGroupShopping(groupId, userId, { fetchShoppingItems, createShoppingItem, updateShoppingItem, deleteShoppingItem }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const pendingToggleRef = useRef(new Set())

  const setItemsAndCache = useCallback(
    (updater) => {
      setItems((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        if (groupId) localSaveGroupShoppingItems(groupId, next)
        return next
      })
    },
    [groupId],
  )

  const fetchItems = useCallback(async () => {
    if (!groupId) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    const cached = localGetGroupShoppingItems(groupId)
    if (cached.length) setItems(cached)

    try {
      const data = await fetchShoppingItems(groupId)
      const merged = mergeRecordsById(data || [], cached)
      setItemsAndCache(merged)
      setUnavailable(false)
    } catch (err) {
      console.warn('Gemeinsame Einkaufsliste nicht verfügbar:', err)
      setItems(cached)
      setUnavailable(true)
    } finally {
      setLoading(false)
    }
  }, [groupId, fetchShoppingItems, setItemsAndCache])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    if (!groupId || !supabase) return

    const channel = supabase
      .channel(`group-shopping-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_shopping_items', filter: `group_id=eq.${groupId}` },
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
            if (pendingToggleRef.current.has(payload.new.id)) return
            setItemsAndCache((prev) => prev.map((item) => (item.id === payload.new.id ? { ...item, ...payload.new } : item)))
          } else if (payload.eventType === 'DELETE') {
            setItemsAndCache((prev) => prev.filter((item) => item.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, setItemsAndCache])

  const createItem = useCallback(
    async (payload) => {
      if (!groupId || !userId) throw new Error('Nicht angemeldet')
      const row = buildRow(payload)
      if (!row.name) throw new Error('Bitte Produkt eingeben')
      if (hasOpenShoppingDuplicate(items, row.name, row.category)) {
        return { duplicate: true }
      }

      const tempId = `opt-${crypto.randomUUID()}`
      const optimistic = {
        id: tempId,
        group_id: groupId,
        created_by: userId,
        ...row,
        checked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _optimistic: true,
      }

      setItemsAndCache((prev) => [optimistic, ...prev])

      try {
        const data = await createShoppingItem({
          ...payload,
          group_id: groupId,
          created_by: userId,
        })
        setItemsAndCache((prev) => prev.map((item) => (item.id === tempId ? data : item)))
        return data
      } catch (err) {
        setItemsAndCache((prev) => prev.filter((item) => item.id !== tempId))
        throw err
      }
    },
    [groupId, userId, items, createShoppingItem, setItemsAndCache],
  )

  const toggleItem = useCallback(
    (item) => {
      if (!item?.id) return
      const nextChecked = !item.checked
      const snapshot = { ...item }
      pendingToggleRef.current.add(item.id)

      setItemsAndCache((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                checked: nextChecked,
                checked_by: nextChecked ? userId : null,
                checkedBy: nextChecked ? entry.checkedBy : null,
                updated_at: new Date().toISOString(),
              }
            : entry,
        ),
      )

      void updateShoppingItem(item.id, {
        checked: nextChecked,
        checked_by: nextChecked ? userId : null,
      })
        .catch(() => {
          setItemsAndCache((prev) => prev.map((entry) => (entry.id === item.id ? snapshot : entry)))
        })
        .finally(() => {
          pendingToggleRef.current.delete(item.id)
        })
    },
    [userId, updateShoppingItem, setItemsAndCache],
  )

  const removeItem = useCallback(
    (item) => {
      if (!item?.id) return
      const snapshot = items
      setItemsAndCache((prev) => prev.filter((entry) => entry.id !== item.id))

      void deleteShoppingItem(item.id).catch(() => {
        setItemsAndCache(snapshot)
      })
    },
    [items, deleteShoppingItem, setItemsAndCache],
  )

  return {
    items,
    loading,
    unavailable,
    createItem,
    toggleItem,
    removeItem,
    refetch: fetchItems,
  }
}
