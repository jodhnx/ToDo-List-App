import { useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import Button from '../ui/Button'
import Select from '../ui/Select'
import SpeechInputButton from '../ui/SpeechInputButton'
import {
  getShoppingCategory,
  shoppingCategoryOptions,
} from '../../lib/shoppingCatalog'

export default function ShoppingAddForm({
  open,
  form,
  onChange,
  onSpeech,
  onSubmit,
  onClose,
  compact = false,
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open && !compact) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => window.clearTimeout(timer)
  }, [open, compact])

  const activeCategory = getShoppingCategory(form.category)

  if (compact) {
    return (
      <form
        onSubmit={onSubmit}
        className="shopping-add-bar flex gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-2 shadow-sm"
      >
        <input
          ref={inputRef}
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Produkt hinzufügen…"
          className="input-field min-h-12 flex-1 text-base"
          autoComplete="off"
          enterKeyHint="done"
        />
        <Button type="submit" disabled={!form.name.trim()} className="min-h-12 min-w-[52px] px-4">
          <Plus className="h-5 w-5" />
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="shopping-add-name" className="block text-sm font-medium text-muted">
          Produktname
        </label>
        <input
          ref={inputRef}
          id="shopping-add-name"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="z. B. Milch, Bananen, Waschmittel"
          className="input-field min-h-12 text-base"
          required
          autoComplete="off"
        />
      </div>
      <SpeechInputButton label="Produkt diktieren" onTranscript={(text) => onSpeech('name', text)} />
      <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-1.5">
          <label htmlFor="shopping-add-qty" className="block text-sm font-medium text-muted">
            Menge
          </label>
          <input
            id="shopping-add-qty"
            value={form.quantity}
            onChange={(e) => onChange('quantity', e.target.value)}
            placeholder="1"
            className="input-field min-h-11"
          />
        </div>
        <Select
          label="Kategorie"
          value={form.category}
          onChange={(e) => onChange('category', e.target.value)}
          options={shoppingCategoryOptions}
        />
      </div>
      <div className={`rounded-2xl border p-3 ${activeCategory.color}`}>
        <p className="text-sm font-semibold">Vorschläge: {activeCategory.label}</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {activeCategory.products.slice(0, 6).map((product) => (
            <button
              key={product}
              type="button"
              onClick={() => onChange('name', product)}
              className="rounded-lg border border-white/15 bg-black/10 px-2 py-2 text-left text-xs font-medium hover:bg-white/15"
            >
              {product}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={!form.name.trim()} className="min-h-12 flex-1 text-base">
          <Plus className="h-5 w-5" />
          Hinzufügen
        </Button>
        {onClose && (
          <Button type="button" variant="secondary" onClick={onClose} className="min-h-12">
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  )
}
