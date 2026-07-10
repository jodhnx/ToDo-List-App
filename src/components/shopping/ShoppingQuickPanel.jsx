import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Star, Clock, TrendingUp, Tag } from 'lucide-react'
import {
  CATEGORY_ICONS,
  SHOPPING_CATEGORIES,
  getFrequentProducts,
  getRecentProducts,
} from '../../lib/shoppingCatalog'

function CollapsibleSection({ title, icon: Icon, count, open, onToggle, children, accent }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full min-h-10 items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-primary transition hover:bg-[var(--theme-accentSoft)]"
      >
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
        {Icon && <Icon className={`h-4 w-4 shrink-0 ${accent || 'text-[var(--theme-accent)]'}`} />}
        <span className="flex-1">{title}</span>
        {count != null && (
          <span className="rounded-full bg-[var(--theme-input)] px-2 py-0.5 text-[11px] font-normal text-muted">
            {count}
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--theme-border)] px-3 pb-2 pt-1.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ShoppingQuickPanel({
  items = [],
  favorites = [],
  groupedFavorites = {},
  quantity = '1',
  onCategoryChange,
  onQuickAdd,
  onFavoriteAdd,
  submitting = false,
}) {
  const recent = useMemo(() => getRecentProducts(items), [items])
  const frequent = useMemo(() => getFrequentProducts(items, favorites), [items, favorites])
  const favoriteCount = useMemo(
    () => Object.values(groupedFavorites).reduce((sum, list) => sum + list.length, 0),
    [groupedFavorites],
  )

  const [sections, setSections] = useState({
    categories: false,
    favorites: false,
    recent: false,
    frequent: false,
  })
  const [expandedCategory, setExpandedCategory] = useState(null)

  const toggleSection = (key) => setSections((current) => ({ ...current, [key]: !current[key] }))

  const toggleCategory = (label) => {
    setExpandedCategory((current) => {
      const next = current === label ? null : label
      if (next) onCategoryChange?.(next)
      return next
    })
  }

  return (
    <div className="space-y-2">
      <CollapsibleSection
        title="Kategorien"
        icon={Tag}
        count={SHOPPING_CATEGORIES.length}
        open={sections.categories}
        onToggle={() => toggleSection('categories')}
      >
        <div className="space-y-1">
          {SHOPPING_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] || CATEGORY_ICONS.other
            const isOpen = expandedCategory === cat.label
            return (
              <div key={cat.id} className="overflow-hidden rounded-lg border border-[var(--theme-border)]">
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.label)}
                  className={`flex w-full min-h-9 items-center gap-2 px-2.5 py-1.5 text-left text-sm transition ${
                    isOpen ? cat.color : 'bg-[var(--theme-input)] text-primary hover:bg-[var(--theme-accentSoft)]'
                  }`}
                >
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                  />
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 font-medium">{cat.label}</span>
                  <span className="text-[11px] opacity-70">{cat.products.length}</span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className={`grid grid-cols-2 gap-1.5 border-t border-white/10 p-2 sm:grid-cols-3 ${cat.color}`}>
                        {cat.products.map((product) => (
                          <button
                            key={product}
                            type="button"
                            disabled={submitting}
                            onClick={() => onQuickAdd({ name: product, category: cat.label, quantity })}
                            className="flex min-h-9 items-center justify-between gap-1 rounded-lg border border-white/15 bg-black/10 px-2 py-1.5 text-left text-xs font-medium hover:bg-white/15 disabled:opacity-50"
                          >
                            <span className="truncate">{product}</span>
                            <span className="shrink-0 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px]">
                              x{quantity}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </CollapsibleSection>

      {recent.length > 0 && (
        <CollapsibleSection
          title="Zuletzt gekauft"
          icon={Clock}
          count={recent.length}
          open={sections.recent}
          onToggle={() => toggleSection('recent')}
        >
          <ProductChipList items={recent} quantity={quantity} onPick={onQuickAdd} submitting={submitting} />
        </CollapsibleSection>
      )}

      {frequent.length > 0 && (
        <CollapsibleSection
          title="Häufig gekauft"
          icon={TrendingUp}
          count={frequent.length}
          open={sections.frequent}
          onToggle={() => toggleSection('frequent')}
        >
          <ProductChipList items={frequent} quantity={quantity} onPick={onQuickAdd} submitting={submitting} />
        </CollapsibleSection>
      )}

      {favoriteCount > 0 && (
        <CollapsibleSection
          title="Favoriten"
          icon={Star}
          count={favoriteCount}
          accent="text-amber-300"
          open={sections.favorites}
          onToggle={() => toggleSection('favorites')}
        >
          <div className="space-y-2">
            {Object.entries(groupedFavorites).map(([cat, favItems]) => (
              <div key={cat}>
                <p className="mb-1 text-[11px] font-medium text-muted">{cat}</p>
                <div className="flex flex-wrap gap-1.5">
                  {favItems.map((fav) => (
                    <button
                      key={fav.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => onFavoriteAdd?.(fav)}
                      className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      {fav.name} x{fav.default_quantity || quantity}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  )
}

function ProductChipList({ items, quantity, onPick, submitting }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={`${item.name}-${item.category}`}
          type="button"
          disabled={submitting}
          onClick={() => onPick({ ...item, quantity: item.quantity || quantity })}
          className="rounded-lg bg-[var(--theme-input)] px-2.5 py-1.5 text-xs text-primary hover:bg-[var(--theme-accentSoft)] disabled:opacity-50"
        >
          {item.name}
        </button>
      ))}
    </div>
  )
}
