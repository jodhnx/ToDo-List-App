import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CheckCircle2, Search, ShoppingBasket, X } from 'lucide-react'
import Fab from '../ui/Fab'
import Modal from '../ui/Modal'
import ShoppingQuickPanel from '../shopping/ShoppingQuickPanel'
import ShoppingItemRow from '../shopping/ShoppingItemRow'
import ShoppingAddForm from '../shopping/ShoppingAddForm'
import ShoppingEditModal from '../shopping/ShoppingEditModal'
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

export default function GroupShoppingList({ items, onCreate, onToggle, onDelete, onUpdate }) {
  const { toast } = useToast()
  const { favorites, groupedFavorites, recordFavoriteUse } = useShoppingFavorites()
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [showChecked, setShowChecked] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)

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

  const handleEditSave = async (updates) => {
    if (!editItem || !onUpdate) return
    await onUpdate(editItem, updates)
    toast('Produkt aktualisiert', 'success')
  }

  const visibleCount = openItems.length + (showChecked ? doneItems.length : 0)

  return (
    <div className="space-y-2 pb-20 lg:pb-0">
      <div className="flex items-center justify-between px-0.5 text-xs text-muted">
        <span>
          <span className="font-semibold text-primary">{stats.open}</span> offen
          {stats.checked > 0 && (
            <>
              {' · '}
              <span className="font-semibold text-emerald-400">{stats.checked}</span> erledigt
            </>
          )}
        </span>
      </div>

      <ShoppingAddForm
        compact
        open
        form={form}
        onChange={changeForm}
        onSpeech={setSpeechField}
        onSubmit={handleCompactSubmit}
      />

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

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen…"
            className="input-field min-h-9 pl-8 text-sm"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted">
          <input type="checkbox" checked={showChecked} onChange={(e) => setShowChecked(e.target.checked)} className="rounded" />
          Erledigt
        </label>
      </div>

      {visibleCount === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--theme-border)] px-3 py-8 text-center">
          <ShoppingBasket className="mx-auto mb-1.5 h-7 w-7 text-[var(--theme-accent)] opacity-50" />
          <p className="text-xs text-muted">
            {items.length === 0 ? 'Liste leer — oben eintippen oder Kategorie öffnen.' : 'Keine Treffer.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedOpen).map(([category, groupItems]) => (
            <section key={category}>
              <h2 className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">{category}</h2>
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {groupItems.map((item) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      onEdit={onUpdate ? setEditItem : undefined}
                      showMeta
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}

          {showChecked && doneItems.length > 0 && (
            <section>
              <h2 className="mb-1 flex items-center gap-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                Erledigt
              </h2>
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {doneItems.map((item) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      onEdit={onUpdate ? setEditItem : undefined}
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

      <ShoppingEditModal
        open={!!editItem}
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={handleEditSave}
      />

      <Fab label="Produkt hinzufügen" showOnDesktop onClick={() => setModalOpen(true)} />
    </div>
  )
}
