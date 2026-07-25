import { motion } from 'framer-motion'
import { Check, Pencil, Star, Trash2 } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'

export default function ShoppingItemRow({
  item,
  onToggle,
  onDelete,
  onEdit,
  onFavorite,
  isFavorite,
  showMeta = false,
  disabled = false,
}) {
  return (
    <motion.div
      layout
      layoutId={item.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className={`shopping-item group flex items-center gap-2.5 !rounded-xl !p-2 ${item.checked ? 'shopping-item--done' : ''}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle?.(item)}
        className={`shopping-check flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
          item.checked
            ? 'border-emerald-400 bg-emerald-400 text-white'
            : 'border-[var(--theme-border)] bg-[var(--theme-input)] hover:border-[var(--theme-accent)]'
        }`}
        aria-label={item.checked ? 'Produkt wieder öffnen' : 'Produkt abhaken'}
      >
        <motion.span
          initial={false}
          animate={{ scale: item.checked ? 1 : 0, opacity: item.checked ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 28 }}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className={`text-sm font-medium leading-snug ${item.checked ? 'text-muted line-through' : 'text-primary'}`}>
            {item.name}
          </p>
          <span className="rounded-full bg-[var(--theme-accentSoft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--theme-accent)]">
            {item.quantity || '1'}
          </span>
        </div>
        {item.note && <p className="mt-0.5 text-[11px] text-muted">{item.note}</p>}
        {showMeta && (item.creator || item.checkedBy) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
            {item.creator && (
              <span className="inline-flex items-center gap-1">
                <Avatar
                  name={item.creator.display_name}
                  username={item.creator.username}
                  size="sm"
                  className="!h-4 !w-4 !text-[8px] !shadow-none !ring-0"
                />
                @{item.creator.username}
              </span>
            )}
            {item.checkedBy && <span className="text-emerald-400">✓ @{item.checkedBy.username}</span>}
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-0.5">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            className="h-8 w-8 p-0 text-muted hover:text-primary"
            aria-label="Produkt bearbeiten"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {onFavorite && (
          <button
            type="button"
            onClick={() => onFavorite(item)}
            aria-label={isFavorite ? 'Favorit entfernen' : 'Als Favorit speichern'}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
              isFavorite
                ? 'border-amber-400/40 bg-amber-500/15 text-amber-300'
                : 'border-transparent text-muted hover:text-amber-300'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-amber-300' : ''}`} />
          </button>
        )}
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(item)} className="h-8 w-8 p-0" aria-label="Produkt löschen">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}
