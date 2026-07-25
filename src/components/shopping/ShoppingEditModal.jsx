import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Select from '../ui/Select'
import { DEFAULT_SHOPPING_CATEGORY, shoppingCategoryOptions } from '../../lib/shoppingCatalog'

export default function ShoppingEditModal({ open, item, onClose, onSave }) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [category, setCategory] = useState(DEFAULT_SHOPPING_CATEGORY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !item) return
    setName(item.name || '')
    setQuantity(item.quantity || '1')
    setCategory(item.category || DEFAULT_SHOPPING_CATEGORY)
    setError('')
    setSaving(false)
  }, [open, item])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Bitte einen Produktnamen eingeben.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        name: trimmed,
        quantity: quantity.trim() || '1',
        category: category || DEFAULT_SHOPPING_CATEGORY,
      })
      onClose()
    } catch (err) {
      setError(err?.message || 'Änderungen konnten nicht gespeichert werden.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={() => !saving && onClose()} title="Produkt bearbeiten">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="shop-edit-name" className="block text-sm font-medium text-muted">
            Produktname
          </label>
          <input
            id="shop-edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field min-h-12 text-base"
            autoFocus
            required
            autoComplete="off"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-1.5">
            <label htmlFor="shop-edit-qty" className="block text-sm font-medium text-muted">
              Menge
            </label>
            <input
              id="shop-edit-qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input-field min-h-11"
              placeholder="1"
            />
          </div>
          <Select
            label="Kategorie"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={shoppingCategoryOptions}
          />
        </div>
        {error && (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={saving || !name.trim()} className="min-h-12 flex-1">
            <Save className="h-4 w-4" />
            {saving ? 'Speichern…' : 'Speichern'}
          </Button>
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose} className="min-h-12">
            Abbrechen
          </Button>
        </div>
      </form>
    </Modal>
  )
}
