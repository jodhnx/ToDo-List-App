import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CheckCircle2, Search, ShoppingBasket, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { SkeletonTaskList } from '../components/ui/Skeleton'
import { useShoppingList } from '../hooks/useShoppingList'
import { useShoppingFavorites } from '../hooks/useShoppingFavorites'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Modal from '../components/ui/Modal'
import Fab from '../components/ui/Fab'
import ShoppingQuickPanel from '../components/shopping/ShoppingQuickPanel'
import ShoppingItemRow from '../components/shopping/ShoppingItemRow'
import ShoppingAddForm from '../components/shopping/ShoppingAddForm'
import {
  DEFAULT_SHOPPING_CATEGORY,
  hasOpenShoppingDuplicate,
  inferShoppingCategory,
} from '../lib/shoppingCatalog'

function emptyForm() {
  return { name: '', quantity: '1', category: DEFAULT_SHOPPING_CATEGORY }
}

function appendText(current, next) {
  const clean = String(next || '').trim()
  if (!clean) return current
  return current ? `${current.trim()} ${clean}` : clean
}

export default function ShoppingPage() {
  const { items, loading, error, createItem, deleteItem, toggleItem, deleteChecked } = useShoppingList()
  const {
    favorites,
    groupedFavorites,
    error: favoritesError,
    isFavorite,
    addFavorite,
    removeFavorite,
    recordFavoriteUse,
  } = useShoppingFavorites()
  const { toast } = useToast()
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [showChecked, setShowChecked] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const stats = useMemo(
    () => ({
      open: items.filter((item) => !item.checked).length,
      checked: items.filter((item) => item.checked).length,
    }),
    [items],
  )

  const filterItems = (list) => {
    const q = search.trim().toLowerCase()
    return list
      .filter(
        (item) =>
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.note || '').toLowerCase().includes(q),
      )
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  }

  const openItems = useMemo(() => filterItems(items.filter((item) => !item.checked)), [items, search])
  const doneItems = useMemo(() => filterItems(items.filter((item) => item.checked)), [items, search])

  const groupedOpen = useMemo(() => {
    return openItems.reduce((acc, item) => {
      const key = item.category || 'Sonstiges'
      acc[key] = acc[key] || []
      acc[key].push(item)
      return acc
    }, {})
  }, [openItems])

  const changeForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'name' && current.category === DEFAULT_SHOPPING_CATEGORY
        ? { category: inferShoppingCategory(value) }
        : {}),
    }))
  }

  const setSpeechField = (field, text) => {
    changeForm(field, appendText(form[field], text))
  }

  const resetAndClose = () => {
    setForm(emptyForm())
    setModalOpen(false)
  }

  const addItem = async (payload, { keepOpen = false } = {}) => {
    try {
      if (hasOpenShoppingDuplicate(items, payload.name, payload.category)) {
        toast('Dieses Produkt steht schon auf der Liste', 'info')
        return
      }
      const result = await createItem({ ...payload, note: '' })
      if (result?.duplicate) {
        toast('Dieses Produkt steht schon auf der Liste', 'info')
        return
      }
      if (keepOpen) {
        setForm((current) => ({ ...emptyForm(), quantity: current.quantity, category: current.category }))
      } else {
        resetAndClose()
      }
    } catch (err) {
      toast(err.message || 'Produkt konnte nicht gespeichert werden. Bitte erneut versuchen.', 'error')
    }
  }

  const handleCompactSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    void addItem(form, { keepOpen: true })
  }

  const handleModalSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    void addItem(form)
  }

  const handleQuickAdd = async ({ name, category, quantity }) => {
    await addItem({
      name,
      category: category || form.category,
      quantity: quantity || form.quantity || '1',
    })
  }

  const handleFavoriteQuickAdd = async (favorite) => {
    await addItem({
      name: favorite.name,
      quantity: favorite.default_quantity || '1',
      category: favorite.category,
    })
    void recordFavoriteUse(favorite)
  }

  const toggleFavorite = async (item) => {
    try {
      if (isFavorite(item.name, item.category)) {
        await removeFavorite(item)
        toast('Favorit entfernt', 'info')
      } else {
        await addFavorite({
          name: item.name,
          category: item.category,
          default_quantity: item.quantity || '1',
        })
        toast('Als Favorit gespeichert', 'success')
      }
    } catch (err) {
      toast(err.message || 'Favorit konnte nicht gespeichert werden', 'error')
    }
  }

  const handleClearChecked = async () => {
    const count = await deleteChecked()
    setConfirmClear(false)
    toast(`${count} erledigte Produkte entfernt`, 'success')
  }

  const visibleCount = openItems.length + (showChecked ? doneItems.length : 0)

  return (
    <div className="space-y-3 pb-24 lg:pb-4">
      <header className="page-header flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1>Einkaufsliste</h1>
          <p className="text-sm text-muted">
            {loading ? 'Lädt…' : `${stats.open} offen · ${stats.checked} erledigt`}
          </p>
          {error && <p className="mt-1 text-xs text-amber-300">{error}</p>}
        </div>
        <Button
          variant="secondary"
          disabled={!stats.checked}
          onClick={() => setConfirmClear(true)}
          className="gap-2 self-start sm:self-auto"
        >
          <Trash2 className="h-4 w-4" />
          Erledigte löschen
        </Button>
      </header>

      <ShoppingAddForm
        compact
        open
        form={form}
        onChange={changeForm}
        onSpeech={setSpeechField}
        onSubmit={handleCompactSubmit}
      />

      <div className="glass-card p-3">
        <ShoppingQuickPanel
          items={items}
          favorites={favorites}
          groupedFavorites={groupedFavorites}
          quantity={form.quantity}
          category={form.category}
          onCategoryChange={(label) => setForm((current) => ({ ...current, category: label }))}
          onQuickAdd={handleQuickAdd}
          onFavoriteAdd={handleFavoriteQuickAdd}
        />
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 text-xs text-[var(--theme-accent)]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Produkt mit Details hinzufügen
          </button>
        </div>
      </div>

      <div className="glass-card flex flex-col gap-2 p-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen…"
            className="input-field min-h-10 pl-9 text-sm"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <label className="flex min-h-10 items-center gap-2 px-2 text-xs text-muted">
          <input type="checkbox" checked={showChecked} onChange={(e) => setShowChecked(e.target.checked)} className="rounded" />
          Erledigt
        </label>
      </div>

      {favoritesError && <p className="text-xs text-amber-300">{favoritesError}</p>}

      {loading ? (
        <SkeletonTaskList count={4} />
      ) : visibleCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--theme-border)] px-4 py-12 text-center">
          <ShoppingBasket className="mx-auto mb-2 h-9 w-9 text-[var(--theme-accent)] opacity-60" />
          <p className="text-sm text-muted">
            {items.length === 0 ? 'Noch nichts auf der Liste — oben eintippen oder Kategorie wählen.' : 'Keine Treffer.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedOpen).map(([category, groupItems]) => (
            <section key={category}>
              <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{category}</h2>
              <div className="space-y-1.5">
                <AnimatePresence mode="popLayout">
                  {groupItems.map((item) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      onToggle={toggleItem}
                      onDelete={() => deleteItem(item.id)}
                      onFavorite={toggleFavorite}
                      isFavorite={isFavorite(item.name, item.category)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}

          {showChecked && doneItems.length > 0 && (
            <section>
              <h2 className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Erledigt
              </h2>
              <div className="space-y-1.5">
                <AnimatePresence mode="popLayout">
                  {doneItems.map((item) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      onToggle={toggleItem}
                      onDelete={() => deleteItem(item.id)}
                      onFavorite={toggleFavorite}
                      isFavorite={isFavorite(item.name, item.category)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Erledigte Produkte löschen?"
        message="Alle abgehakten Produkte werden aus deiner Einkaufsliste entfernt."
        confirmLabel="Löschen"
        onConfirm={handleClearChecked}
        onCancel={() => setConfirmClear(false)}
      />

      <Modal open={modalOpen} onClose={resetAndClose} title="Produkt mit Details">
        <ShoppingAddForm
          open={modalOpen}
          form={form}
          onChange={changeForm}
          onSpeech={setSpeechField}
          onSubmit={handleModalSubmit}
          onClose={resetAndClose}
        />
      </Modal>

      <Fab label="Produkt hinzufügen" showOnDesktop onClick={() => setModalOpen(true)} />
    </div>
  )
}
