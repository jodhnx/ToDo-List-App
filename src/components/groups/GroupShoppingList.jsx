import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CheckCircle2, Plus, Search, ShoppingBasket, SlidersHorizontal, X } from 'lucide-react'
import Button from '../ui/Button'
import Fab from '../ui/Fab'
import Modal from '../ui/Modal'
import ShoppingQuickPanel from '../shopping/ShoppingQuickPanel'
import ShoppingItemRow from '../shopping/ShoppingItemRow'
import ShoppingAddForm from '../shopping/ShoppingAddForm'
import { useToast } from '../../context/ToastContext'
import { useShoppingFavorites } from '../../hooks/useShoppingFavorites'
import {
  DEFAULT_SHOPPING_CATEGORY,
  hasOpenShoppingDuplicate,
  inferShoppingCategory,
} from '../../lib/shoppingCatalog'

function emptyForm() {
  return { name: '', quantity: '1', category: DEFAULT_SHOPPING_CATEGORY, note: '' }
}

function appendText(current, next) {
  const clean = String(next || '').trim()
  if (!clean) return current
  return current ? `${current.trim()} ${clean}` : clean
}

export default function GroupShoppingList({ items, onCreate, onToggle, onDelete }) {
  const { toast } = useToast()
  const { favorites, groupedFavorites, recordFavoriteUse } = useShoppingFavorites()
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [showChecked, setShowChecked] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

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
    const clean = String(text || '').trim()
    if (!clean) return
    setForm((current) => {
      const value = appendText(current[field], clean)
      return {
        ...current,
        [field]: value,
        ...(field === 'name' && current.category === DEFAULT_SHOPPING_CATEGORY
          ? { category: inferShoppingCategory(value) }
          : {}),
      }
    })
  }

  const resetAndClose = () => {
    setForm(emptyForm())
    setModalOpen(false)
  }

  const submit = async (payload, { keepOpen = false } = {}) => {
    if (hasOpenShoppingDuplicate(items, payload.name, payload.category)) {
      toast('Dieses Produkt steht schon auf der Familienliste', 'info')
      return false
    }
    const ok = await onCreate(payload)
    if (ok !== false) {
      if (keepOpen) {
        setForm((current) => ({ ...emptyForm(), quantity: current.quantity, category: current.category }))
      } else {
        resetAndClose()
      }
    }
    return ok
  }

  const handleCompactSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    void submit(form, { keepOpen: true })
  }

  const handleModalSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    void submit(form)
  }

  const handleQuickAdd = async ({ name, category, quantity }) => {
    await submit({
      name,
      category: category || form.category,
      quantity: quantity || form.quantity || '1',
      note: '',
    })
  }

  const handleFavoriteAdd = async (favorite) => {
    const ok = await submit({
      name: favorite.name,
      category: favorite.category,
      quantity: favorite.default_quantity || form.quantity || '1',
      note: '',
    })
    if (ok !== false) void recordFavoriteUse(favorite)
  }

  const visibleCount = openItems.length + (showChecked ? doneItems.length : 0)

  return (
    <div className="space-y-3 pb-20 lg:pb-0">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-2 text-sm">
        <span className="text-muted">
          <span className="font-semibold text-primary">{stats.open}</span> offen
          {stats.checked > 0 && (
            <>
              {' · '}
              <span className="font-semibold text-emerald-400">{stats.checked}</span> erledigt
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1 text-xs text-[var(--theme-accent)]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Details
        </button>
      </div>

      <ShoppingAddForm
        compact
        open
        form={form}
        onChange={changeForm}
        onSpeech={setSpeechField}
        onSubmit={handleCompactSubmit}
      />

      <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-3">
        <ShoppingQuickPanel
          items={items}
          favorites={favorites}
          groupedFavorites={groupedFavorites}
          quantity={form.quantity}
          category={form.category}
          onCategoryChange={(label) => setForm((current) => ({ ...current, category: label }))}
          onQuickAdd={handleQuickAdd}
          onFavoriteAdd={handleFavoriteAdd}
        />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-2 sm:flex-row sm:items-center">
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

      {visibleCount === 0 ? (
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
                      onToggle={onToggle}
                      onDelete={onDelete}
                      showMeta
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
                      onToggle={onToggle}
                      onDelete={onDelete}
                      showMeta
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}
        </div>
      )}

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
