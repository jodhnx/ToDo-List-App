import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Plus, Search, ShoppingBasket, Trash2, X } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import Fab from '../ui/Fab'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import Select from '../ui/Select'
import SpeechInputButton from '../ui/SpeechInputButton'
import ShoppingQuickPanel from '../shopping/ShoppingQuickPanel'
import { useToast } from '../../context/ToastContext'
import { useShoppingFavorites } from '../../hooks/useShoppingFavorites'
import {
  DEFAULT_SHOPPING_CATEGORY,
  getShoppingCategory,
  hasOpenShoppingDuplicate,
  inferShoppingCategory,
  shoppingCategoryOptions,
} from '../../lib/shoppingCatalog'

function emptyForm() {
  return { name: '', quantity: '1', category: DEFAULT_SHOPPING_CATEGORY, note: '' }
}

function appendText(current, next) {
  const clean = String(next || '').trim()
  if (!clean) return current
  return current ? `${current.trim()} ${clean}` : clean
}

export default function GroupShoppingList({ items, onCreate, onToggle, onDelete, submitting }) {
  const { toast } = useToast()
  const { favorites, groupedFavorites, recordFavoriteUse } = useShoppingFavorites()
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [showChecked, setShowChecked] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const stats = useMemo(
    () => ({
      total: items.length,
      open: items.filter((item) => !item.checked).length,
      checked: items.filter((item) => item.checked).length,
    }),
    [items],
  )

  const activeCategory = getShoppingCategory(form.category)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items
      .filter((item) => showChecked || !item.checked)
      .filter(
        (item) =>
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.note || '').toLowerCase().includes(q),
      )
      .sort((a, b) => Number(a.checked) - Number(b.checked) || a.category.localeCompare(b.category))
  }, [items, search, showChecked])

  const grouped = useMemo(() => {
    return filtered.reduce((acc, item) => {
      const key = item.category || 'Sonstiges'
      acc[key] = acc[key] || []
      acc[key].push(item)
      return acc
    }, {})
  }, [filtered])

  const change = (field) => (e) => {
    const value = e.target.value
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

  const submit = async (payload) => {
    if (hasOpenShoppingDuplicate(items, payload.name, payload.category)) {
      toast('Dieses Produkt steht schon auf der Familienliste', 'info')
      return false
    }
    const ok = await onCreate(payload)
    if (ok !== false) resetAndClose()
    return ok
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    await submit(form)
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
    if (ok !== false) await recordFavoriteUse(favorite)
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-2">
        <div className="rounded-xl bg-[var(--theme-input)] px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] text-muted">
            <Plus className="h-3.5 w-3.5 text-amber-300" />
            Noch einkaufen
          </p>
          <p className="mt-0.5 text-xl font-bold text-primary">{stats.open}</p>
        </div>
        <div className="rounded-xl bg-[var(--theme-input)] px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] text-muted">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            Im Wagen
          </p>
          <p className="mt-0.5 text-xl font-bold text-primary">{stats.checked}</p>
        </div>
        <div className="rounded-xl bg-[var(--theme-input)] px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] text-muted">
            <ShoppingBasket className="h-3.5 w-3.5 text-indigo-300" />
            Gesamt
          </p>
          <p className="mt-0.5 text-xl font-bold text-primary">{stats.total}</p>
        </div>
      </div>

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
          submitting={submitting}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Eigenes Produkt
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="In gemeinsamer Einkaufsliste suchen…"
            className="input-field pl-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-[var(--theme-border)] px-3 py-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showChecked}
            onChange={(e) => setShowChecked(e.target.checked)}
            className="rounded text-indigo-500"
          />
          Abgehakte anzeigen
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--theme-border)] px-4 py-16 text-center">
          <ShoppingBasket className="mx-auto mb-3 h-10 w-10 text-indigo-300/70" />
          <p className="text-muted">
            {items.length === 0 ? 'Noch keine Produkte auf der gemeinsamen Liste.' : 'Keine Treffer gefunden.'}
          </p>
          <p className="mt-2 text-xs text-muted">
            {items.length === 0
              ? 'Wähle oben eine Kategorie und tippe auf ein Produkt.'
              : 'Ändere die Suche oder zeige abgehakte Produkte wieder an.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([group, groupItems]) => (
            <section key={group} className="space-y-2">
              <h2 className="flex items-center justify-between text-sm font-semibold text-muted">
                <span>{group}</span>
                <span className="rounded-full bg-[var(--theme-input)] px-2 py-0.5 text-xs font-normal">
                  {groupItems.length}
                </span>
              </h2>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {groupItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      className={`flex items-start gap-3 rounded-2xl border p-3 transition ${
                        item.checked
                          ? 'border-[var(--theme-border)] bg-[var(--theme-input)] opacity-70'
                          : 'border-[var(--theme-border)] bg-[var(--theme-card)] shadow-sm'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onToggle(item)}
                        className={`touch-target mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          item.checked
                            ? 'border-emerald-400 bg-emerald-400 text-zinc-950'
                            : 'border-[var(--theme-border)] text-transparent'
                        }`}
                        aria-label={item.checked ? 'Produkt wieder öffnen' : 'Produkt abhaken'}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`font-medium ${item.checked ? 'text-muted line-through' : 'text-primary'}`}>
                            {item.name}
                          </p>
                          <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300">
                            {item.quantity}
                          </span>
                        </div>
                        {item.note && <p className="mt-1 text-xs text-muted">{item.note}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                          {item.creator && (
                            <span className="inline-flex items-center gap-1">
                              <Avatar name={item.creator.display_name} username={item.creator.username} size="sm" />
                              hinzugefügt von @{item.creator.username}
                            </span>
                          )}
                          {item.checkedBy && (
                            <span className="text-emerald-300">abgehakt von @{item.checkedBy.username}</span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(item)} aria-label="Produkt löschen">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={resetAndClose} title="Eigenes Produkt hinzufügen">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Produkt suchen oder eingeben"
            value={form.name}
            onChange={change('name')}
            placeholder="z. B. Milch, Bananen, Waschmittel"
            autoFocus
            required
          />
          <SpeechInputButton label="Produkt diktieren" onTranscript={(text) => setSpeechField('name', text)} />
          <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
            <Input label="Menge" value={form.quantity} onChange={change('quantity')} placeholder="1" />
            <Select
              label="Kategorie auswählen"
              value={form.category}
              onChange={change('category')}
              options={shoppingCategoryOptions}
            />
          </div>
          <div className={`rounded-2xl border p-3 ${activeCategory.color}`}>
            <p className="text-sm font-semibold">Typische Produkte: {activeCategory.label}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {activeCategory.products.slice(0, 9).map((product) => (
                <button
                  key={product}
                  type="button"
                  disabled={submitting}
                  onClick={() => setForm((current) => ({ ...current, name: product }))}
                  className="rounded-xl border border-white/15 bg-black/10 px-3 py-2 text-left text-sm font-medium hover:bg-white/15 disabled:opacity-50"
                >
                  {product}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              <Plus className="h-4 w-4" />
              {submitting ? 'Speichern…' : 'Hinzufügen'}
            </Button>
            <Button type="button" variant="secondary" onClick={resetAndClose}>
              Abbrechen
            </Button>
          </div>
        </form>
      </Modal>

      <Fab label="Eigenes Produkt" showOnDesktop onClick={() => setModalOpen(true)} />
    </div>
  )
}
