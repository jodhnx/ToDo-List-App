import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Plus, Search, ShoppingBasket, Trash2, X } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Fab from '../ui/Fab'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import Select from '../ui/Select'

const CATEGORIES = [
  'Obst & Gemüse',
  'Kühlregal',
  'Backwaren',
  'Getränke',
  'Drogerie',
  'Haushalt',
  'Sonstiges',
]

const PRODUCT_IDEAS = [
  ['Milch', 'Kühlregal'],
  ['Eier', 'Kühlregal'],
  ['Butter', 'Kühlregal'],
  ['Joghurt', 'Kühlregal'],
  ['Käse', 'Kühlregal'],
  ['Bananen', 'Obst & Gemüse'],
  ['Äpfel', 'Obst & Gemüse'],
  ['Tomaten', 'Obst & Gemüse'],
  ['Gurken', 'Obst & Gemüse'],
  ['Kartoffeln', 'Obst & Gemüse'],
  ['Brot', 'Backwaren'],
  ['Brötchen', 'Backwaren'],
  ['Wasser', 'Getränke'],
  ['Saft', 'Getränke'],
  ['Kaffee', 'Getränke'],
  ['Zahnpasta', 'Drogerie'],
  ['Duschgel', 'Drogerie'],
  ['Waschmittel', 'Haushalt'],
  ['Küchenrolle', 'Haushalt'],
  ['Nudeln', 'Sonstiges'],
]

const categoryOptions = CATEGORIES.map((category) => ({ value: category, label: category }))

function inferCategory(name) {
  const match = PRODUCT_IDEAS.find(([product]) => product.toLowerCase() === name.trim().toLowerCase())
  return match?.[1] || 'Sonstiges'
}

function emptyForm() {
  return { name: '', quantity: '1', category: 'Sonstiges', note: '' }
}

export default function GroupShoppingList({ items, onCreate, onToggle, onDelete, submitting }) {
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

  const suggestions = useMemo(() => {
    const q = form.name.trim().toLowerCase()
    if (!q) return PRODUCT_IDEAS.slice(0, 8)
    return PRODUCT_IDEAS.filter(([product]) => product.toLowerCase().includes(q)).slice(0, 8)
  }, [form.name])

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
      ...(field === 'name' && current.category === 'Sonstiges'
        ? { category: inferCategory(value) }
        : {}),
    }))
  }

  const resetAndClose = () => {
    setForm(emptyForm())
    setModalOpen(false)
  }

  const submit = async (payload) => {
    const ok = await onCreate(payload)
    if (ok !== false) resetAndClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    await submit(form)
  }

  const handleSuggestion = async ([name, category]) => {
    await submit({ name, category, quantity: '1', note: '' })
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <ShoppingBasket className="mb-2 h-5 w-5 text-indigo-300" />
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-xs text-muted">Produkte gesamt</p>
        </Card>
        <Card className="p-4">
          <Plus className="mb-2 h-5 w-5 text-amber-300" />
          <p className="text-2xl font-bold text-primary">{stats.open}</p>
          <p className="text-xs text-muted">Noch einkaufen</p>
        </Card>
        <Card className="p-4">
          <CheckCircle2 className="mb-2 h-5 w-5 text-emerald-300" />
          <p className="text-2xl font-bold text-primary">{stats.checked}</p>
          <p className="text-xs text-muted">Schon erledigt</p>
        </Card>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-surface/50 p-3 sm:flex-row sm:items-center">
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
        <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showChecked}
            onChange={(e) => setShowChecked(e.target.checked)}
            className="rounded text-indigo-500"
          />
          Abgehakte anzeigen
        </label>
        <Button onClick={() => setModalOpen(true)} className="hidden gap-2 sm:inline-flex">
          <Plus className="h-4 w-4" />
          Produkt hinzufügen
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-4 py-16 text-center">
          <ShoppingBasket className="mx-auto mb-3 h-10 w-10 text-indigo-300/70" />
          <p className="text-muted">
            {items.length === 0 ? 'Noch keine Produkte auf der gemeinsamen Liste.' : 'Keine Treffer gefunden.'}
          </p>
          <p className="mt-2 text-xs text-muted">
            {items.length === 0
              ? 'Tippe auf das große +, damit alle in der Familie Produkte hinzufügen können.'
              : 'Ändere die Suche oder zeige abgehakte Produkte wieder an.'}
          </p>
          {items.length === 0 && (
            <Button onClick={() => setModalOpen(true)} className="mt-4">
              <Plus className="h-4 w-4" />
              Erstes Produkt
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
                        onClick={() => onToggle(item)}
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

      <Modal open={modalOpen} onClose={resetAndClose} title="Gemeinsames Produkt hinzufügen">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Produkt suchen oder eingeben"
            value={form.name}
            onChange={change('name')}
            placeholder="z. B. Milch, Bananen, Waschmittel"
            autoFocus
            required
          />
          <div className="grid grid-cols-[1fr_1.4fr] gap-3">
            <Input label="Menge" value={form.quantity} onChange={change('quantity')} placeholder="1" />
            <Select label="Kategorie" value={form.category} onChange={change('category')} options={categoryOptions} />
          </div>
          <Input
            label="Notiz optional"
            value={form.note}
            onChange={change('note')}
            placeholder="Marke, Laden, Angebot…"
          />
          <div>
            <p className="mb-2 text-xs font-medium text-muted">Schnell hinzufügen</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((idea) => (
                <button
                  key={idea[0]}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSuggestion(idea)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 hover:border-indigo-400/50 hover:text-primary disabled:opacity-50"
                >
                  + {idea[0]}
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

      <Fab label="Produkt hinzufügen" showOnDesktop onClick={() => setModalOpen(true)} />
    </div>
  )
}
