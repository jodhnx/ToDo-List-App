import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Loader2, Plus, Search, ShoppingBasket, Trash2, X } from 'lucide-react'
import { useShoppingList } from '../hooks/useShoppingList'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Modal from '../components/ui/Modal'
import Fab from '../components/ui/Fab'
import SpeechInputButton from '../components/ui/SpeechInputButton'
import {
  DEFAULT_SHOPPING_CATEGORY,
  SHOPPING_CATEGORIES,
  getShoppingCategory,
  hasOpenShoppingDuplicate,
  inferShoppingCategory,
} from '../lib/shoppingCatalog'

function appendText(current, next) {
  const clean = String(next || '').trim()
  if (!clean) return current
  return current ? `${current.trim()} ${clean}` : clean
}

export default function ShoppingPage() {
  const { items, loading, syncing, error, createItem, deleteItem, toggleItem, deleteChecked } = useShoppingList()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [category, setCategory] = useState(DEFAULT_SHOPPING_CATEGORY)
  const [search, setSearch] = useState('')
  const [showChecked, setShowChecked] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const stats = useMemo(
    () => ({
      total: items.length,
      open: items.filter((item) => !item.checked).length,
      checked: items.filter((item) => item.checked).length,
    }),
    [items],
  )

  const activeCategory = getShoppingCategory(category)
  const suggestions = activeCategory.products

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

  const handleNameChange = (value) => {
    setName(value)
    if (category === DEFAULT_SHOPPING_CATEGORY) setCategory(inferShoppingCategory(value))
  }

  const resetForm = () => {
    setName('')
    setQuantity('1')
    setCategory(DEFAULT_SHOPPING_CATEGORY)
  }

  const closeModal = () => {
    resetForm()
    setModalOpen(false)
  }

  const addItem = async (payload) => {
    try {
      if (hasOpenShoppingDuplicate(items, payload.name, payload.category)) {
        toast('Dieses Produkt steht schon auf der Liste', 'info')
        return
      }
      const result = await createItem(payload)
      if (result?.duplicate) {
        toast('Dieses Produkt steht schon auf der Liste', 'info')
        return
      }
      resetForm()
      setModalOpen(false)
      toast('Produkt hinzugefügt', 'success')
    } catch (err) {
      toast(err.message || 'Produkt konnte nicht hinzugefügt werden', 'error')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    addItem({ name, quantity, category, note: '' })
  }

  const handleSuggestion = (product) => {
    addItem({ name: product, quantity: '1', category, note: '' })
  }

  const handleClearChecked = async () => {
    const count = await deleteChecked()
    setConfirmClear(false)
    toast(`${count} erledigte Produkte entfernt`, 'success')
  }

  return (
    <div className="space-y-4 pb-24 lg:pb-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">Einkaufen ohne Zettelchaos</p>
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">Einkaufsliste</h1>
          <p className="mt-1 text-sm text-muted">
            {loading ? 'Lädt…' : `${stats.open} offen · ${stats.checked} erledigt`}
            {syncing && ' · synchronisiert…'}
          </p>
          {error && <p className="mt-1 text-xs text-amber-300">{error}</p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalOpen(true)} className="hidden gap-2 sm:inline-flex">
            <Plus className="h-4 w-4" />
            Produkt hinzufügen
          </Button>
          <Button
            variant="secondary"
            disabled={!stats.checked}
            onClick={() => setConfirmClear(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Erledigte löschen
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        <div className="rounded-xl bg-white/[0.04] px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] text-muted">
            <Plus className="h-3.5 w-3.5 text-amber-300" />
            Noch einkaufen
          </p>
          <p className="mt-0.5 text-xl font-bold text-primary">{stats.open}</p>
        </div>
        <div className="rounded-xl bg-white/[0.04] px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] text-muted">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            Im Wagen
          </p>
          <p className="mt-0.5 text-xl font-bold text-primary">{stats.checked}</p>
        </div>
        <div className="rounded-xl bg-white/[0.04] px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] text-muted">
            <ShoppingBasket className="h-3.5 w-3.5 text-indigo-300" />
            Gesamt
          </p>
          <p className="mt-0.5 text-xl font-bold text-primary">{stats.total}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-surface/50 p-3 shadow-lg shadow-black/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="In deiner Einkaufsliste suchen…"
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
          <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={showChecked}
              onChange={(e) => setShowChecked(e.target.checked)}
              className="rounded text-indigo-500"
            />
            Abgehakte anzeigen
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-4 py-16 text-center">
          <ShoppingBasket className="mx-auto mb-3 h-10 w-10 text-indigo-300/70" />
          <p className="text-muted">
            {items.length === 0 ? 'Noch keine Produkte auf der Liste.' : 'Keine Treffer gefunden.'}
          </p>
          <p className="mt-2 text-xs text-muted">
            {items.length === 0
              ? 'Tippe auf das große +, um dein erstes Produkt hinzuzufügen.'
              : 'Ändere deine Suche oder zeige abgehakte Produkte wieder an.'}
          </p>
          {items.length === 0 && (
            <Button onClick={() => setModalOpen(true)} className="mt-4">
              <Plus className="h-4 w-4" />
              Produkt hinzufügen
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([group, groupItems]) => (
            <section key={group} className="space-y-2">
              <h2 className="flex items-center justify-between text-sm font-semibold text-muted">
                <span>{group}</span>
                <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-xs font-normal">
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
                          ? 'border-white/5 bg-white/[0.02]'
                          : 'border-white/10 bg-white/[0.05] shadow-sm shadow-black/10'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(item)}
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          item.checked
                            ? 'border-emerald-400 bg-emerald-400 text-zinc-950'
                            : 'border-zinc-500 text-transparent'
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
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)} aria-label="Produkt löschen">
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

      <ConfirmDialog
        open={confirmClear}
        title="Erledigte Produkte löschen?"
        message="Alle abgehakten Produkte werden aus deiner Einkaufsliste entfernt."
        confirmLabel="Löschen"
        onConfirm={handleClearChecked}
        onCancel={() => setConfirmClear(false)}
      />

      <Modal open={modalOpen} onClose={closeModal} title="Produkt hinzufügen">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Produkt suchen oder eingeben"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="z. B. Milch, Bananen, Waschmittel"
            autoFocus
            required
          />
          <SpeechInputButton
            label="Produkt diktieren"
            onTranscript={(text) => handleNameChange(appendText(name, text))}
          />
          <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
            <Input label="Menge" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" />
            <div>
              <p className="mb-2 text-sm font-medium text-muted">Kategorie auswählen</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SHOPPING_CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.label)}
                    className={`min-h-12 rounded-xl border px-3 py-2 text-left text-sm font-semibold ${
                      category === item.label ? item.color : 'border-white/10 bg-white/[0.04] text-primary'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className={`rounded-2xl border p-3 ${activeCategory.color}`}>
            <p className="text-base font-semibold">Typische Produkte: {activeCategory.label}</p>
            <p className="mt-1 text-sm opacity-80">Einfach antippen, dann landet es direkt auf deiner Liste.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {suggestions.map((product) => (
                <button
                  key={product}
                  type="button"
                  onClick={() => handleSuggestion(product)}
                  className="min-h-12 rounded-xl border border-white/15 bg-black/10 px-3 py-2 text-base font-semibold text-primary hover:bg-white/15"
                >
                  + {product}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              <Plus className="h-4 w-4" />
              Hinzufügen
            </Button>
            <Button type="button" variant="secondary" onClick={closeModal}>
              Abbrechen
            </Button>
          </div>
        </form>
      </Modal>

      <Fab label="Produkt hinzufügen" showOnDesktop onClick={() => setModalOpen(true)} />
    </div>
  )
}
