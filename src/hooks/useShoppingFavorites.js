import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  localCreateShoppingFavorite,
  localClearShoppingFavoritesSyncQueue,
  localDeleteShoppingFavorite,
  localGetShoppingFavorites,
  localGetShoppingFavoritesSyncQueue,
  localQueueShoppingFavoriteSync,
  localSaveShoppingFavorites,
  localSaveShoppingFavoritesSyncQueue,
} from '../lib/localStorage'
import { DEFAULT_SHOPPING_CATEGORY, normalizeShoppingName } from '../lib/shoppingCatalog'

function formatFavoriteError(err) {
  const msg = err?.message || String(err)
  const code = err?.code || ''
  if (code === '42P01' || /relation.*shopping_favorites.*does not exist/i.test(msg)) {
    return 'Favoriten sind in Supabase noch nicht eingerichtet. Bitte die neueste Favoriten-Migration ausführen.'
  }
  if (code === '42501' || /row-level security/i.test(msg)) {
    return 'Keine Berechtigung für Favoriten. Bitte RLS-Migration prüfen und neu anmelden.'
  }
  if (/jwt|session|auth/i.test(msg)) return 'Sitzung abgelaufen - bitte neu anmelden.'
  return msg
}

function browserIsOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

function isNetworkError(err) {
  const msg = String(err?.message || err || '').toLowerCase()
  return browserIsOffline() || msg.includes('failed to fetch') || msg.includes('network') || msg.includes('timeout')
}

function buildFavorite(payload) {
  return {
    name: payload.name.trim(),
    category: payload.category || DEFAULT_SHOPPING_CATEGORY,
    default_quantity: payload.default_quantity?.trim() || payload.quantity?.trim() || '1',
  }
}

export function useShoppingFavorites() {
  const { user } = useAuth()
  const userId = user?.id
  const hasCloud = isSupabaseConfigured && !!supabase
  const [networkOnline, setNetworkOnline] = useState(() => !browserIsOffline())
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const canReachCloud = hasCloud && networkOnline

  useEffect(() => {
    const updateOnlineState = () => setNetworkOnline(!browserIsOffline())
    window.addEventListener('online', updateOnlineState)
    window.addEventListener('offline', updateOnlineState)
    return () => {
      window.removeEventListener('online', updateOnlineState)
      window.removeEventListener('offline', updateOnlineState)
    }
  }, [])

  const setFavoritesAndCache = useCallback((updater) => {
    setFavorites((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (userId) localSaveShoppingFavorites(userId, next)
      return next
    })
  }, [userId])

  const upsertRemoteFavorite = useCallback(async (row) => {
    const { data, error: err } = await supabase
      .from('shopping_favorites')
      .upsert({ ...row, user_id: userId }, { onConflict: 'user_id,name,category' })
      .select()
      .single()
    if (err) throw err
    return data
  }, [userId])

  const syncQueuedFavorites = useCallback(async () => {
    if (!userId || !canReachCloud) return
    const queue = localGetShoppingFavoritesSyncQueue(userId)
    if (!queue.length) return

    const remaining = []
    for (const op of queue) {
      try {
        if (op.type === 'create') {
          await upsertRemoteFavorite(op.favorite)
        } else if (op.type === 'delete') {
          const { error: err } = await supabase
            .from('shopping_favorites')
            .delete()
            .eq('name', op.name)
            .eq('category', op.category)
            .eq('user_id', userId)
          if (err) throw err
        }
      } catch {
        remaining.push(op)
      }
    }

    if (remaining.length) localSaveShoppingFavoritesSyncQueue(userId, remaining)
    else localClearShoppingFavoritesSyncQueue(userId)
  }, [canReachCloud, upsertRemoteFavorite, userId])

  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setFavorites(localGetShoppingFavorites(userId))

    if (!canReachCloud) {
      setLoading(false)
      return
    }

    try {
      await syncQueuedFavorites()
      const { data, error: err } = await supabase
        .from('shopping_favorites')
        .select('*')
        .eq('user_id', userId)
        .order('use_count', { ascending: false })
        .order('name', { ascending: true })
      if (err) throw err
      setFavoritesAndCache(data || [])
    } catch (err) {
      setError(formatFavoriteError(err))
    } finally {
      setLoading(false)
    }
  }, [canReachCloud, setFavoritesAndCache, syncQueuedFavorites, userId])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  useEffect(() => {
    if (!userId || !hasCloud) return
    const onOnline = () => fetchFavorites()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [fetchFavorites, hasCloud, userId])

  const isFavorite = useCallback((name, category) => {
    const normalized = normalizeShoppingName(name)
    return favorites.some(
      (favorite) =>
        normalizeShoppingName(favorite.name) === normalized &&
        (favorite.category || DEFAULT_SHOPPING_CATEGORY) === (category || DEFAULT_SHOPPING_CATEGORY),
    )
  }, [favorites])

  const addFavorite = async (payload) => {
    if (!userId) throw new Error('Nicht angemeldet')
    const row = buildFavorite(payload)
    if (!row.name) throw new Error('Bitte Produkt eingeben')

    if (canReachCloud) {
      try {
        const data = await upsertRemoteFavorite(row)
        setFavoritesAndCache((prev) => [data, ...prev.filter((favorite) => favorite.id !== data.id)])
        return data
      } catch (err) {
        if (!isNetworkError(err)) throw new Error(formatFavoriteError(err))
      }
    }

    const local = localCreateShoppingFavorite(userId, row)
    localQueueShoppingFavoriteSync(userId, { type: 'create', favorite: local })
    setFavoritesAndCache((prev) => [local, ...prev.filter((favorite) => favorite.id !== local.id)])
    return local
  }

  const removeFavorite = async (favoriteOrItem) => {
    if (!userId) return
    const favorite = favorites.find(
      (item) =>
        item.id === favoriteOrItem.id ||
        (normalizeShoppingName(item.name) === normalizeShoppingName(favoriteOrItem.name) &&
          (item.category || DEFAULT_SHOPPING_CATEGORY) === (favoriteOrItem.category || DEFAULT_SHOPPING_CATEGORY)),
    )
    if (!favorite) return

    if (canReachCloud) {
      const { error: err } = await supabase
        .from('shopping_favorites')
        .delete()
        .eq('id', favorite.id)
        .eq('user_id', userId)
      if (err && !isNetworkError(err)) throw new Error(formatFavoriteError(err))
      if (err && isNetworkError(err)) {
        localQueueShoppingFavoriteSync(userId, {
          type: 'delete',
          name: favorite.name,
          category: favorite.category || DEFAULT_SHOPPING_CATEGORY,
        })
      }
    } else {
      localQueueShoppingFavoriteSync(userId, {
        type: 'delete',
        name: favorite.name,
        category: favorite.category || DEFAULT_SHOPPING_CATEGORY,
      })
    }

    localDeleteShoppingFavorite(userId, favorite.id)
    setFavoritesAndCache((prev) => prev.filter((item) => item.id !== favorite.id))
  }

  const recordFavoriteUse = async (favorite) => {
    if (!favorite?.id || !canReachCloud) return
    await supabase
      .from('shopping_favorites')
      .update({
        use_count: Number(favorite.use_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', favorite.id)
      .eq('user_id', userId)
  }

  const groupedFavorites = useMemo(() => {
    return favorites.reduce((acc, favorite) => {
      const key = favorite.category || DEFAULT_SHOPPING_CATEGORY
      acc[key] = acc[key] || []
      acc[key].push(favorite)
      return acc
    }, {})
  }, [favorites])

  return {
    favorites,
    groupedFavorites,
    loading,
    error,
    isFavorite,
    addFavorite,
    removeFavorite,
    recordFavoriteUse,
    refetch: fetchFavorites,
  }
}
