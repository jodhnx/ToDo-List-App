import { useMemo } from 'react'
import { Star, Clock, TrendingUp } from 'lucide-react'
import {
  CATEGORY_ICONS,
  SHOPPING_CATEGORIES,
  getShoppingCategory,
  getFrequentProducts,
  getRecentProducts,
} from '../../lib/shoppingCatalog'

export default function ShoppingQuickPanel({
  items = [],
  favorites = [],
  groupedFavorites = {},
  quantity = '1',
  category,
  onCategoryChange,
  onQuickAdd,
  onFavoriteAdd,
  submitting = false,
}) {
  const recent = useMemo(() => getRecentProducts(items), [items])
  const frequent = useMemo(() => getFrequentProducts(items, favorites), [items, favorites])
  const activeCategory = getShoppingCategory(category)

  return (
    <div className="space-y-4">
      <section>
        <p className="mb-2 text-sm font-semibold text-primary">Kategorien</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {SHOPPING_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] || CATEGORY_ICONS.other
            const active = cat.label === category
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.label)}
                className={`flex min-h-14 items-center gap-2 rounded-2xl border px-3 py-2 text-left transition ${
                  active ? cat.color + ' ring-2 ring-[var(--theme-accent)]' : 'border-[var(--theme-border)] bg-[var(--theme-input)] text-primary hover:bg-[var(--theme-accentSoft)]'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium leading-tight">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {(recent.length > 0 || frequent.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {recent.length > 0 && (
            <QuickList
              title="Zuletzt gekauft"
              icon={Clock}
              items={recent}
              quantity={quantity}
              onPick={onQuickAdd}
              submitting={submitting}
            />
          )}
          {frequent.length > 0 && (
            <QuickList
              title="Häufig verwendet"
              icon={TrendingUp}
              items={frequent}
              quantity={quantity}
              onPick={onQuickAdd}
              submitting={submitting}
            />
          )}
        </div>
      )}

      {Object.keys(groupedFavorites).length > 0 && (
        <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-100">
            <Star className="h-4 w-4" />
            Favoriten
          </p>
          <div className="space-y-2">
            {Object.entries(groupedFavorites).map(([cat, favItems]) => (
              <div key={cat}>
                <p className="mb-1 text-xs font-medium text-amber-100/80">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {favItems.map((fav) => (
                    <button
                      key={fav.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => onFavoriteAdd?.(fav)}
                      className="rounded-xl border border-amber-300/20 bg-black/10 px-3 py-2 text-sm font-medium text-primary hover:bg-white/10 disabled:opacity-50"
                    >
                      {fav.name} x{fav.default_quantity || quantity}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={`rounded-2xl border p-4 ${activeCategory.color}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-base font-semibold">{activeCategory.label}</p>
          <span className="rounded-full bg-black/15 px-3 py-1 text-sm font-semibold">Menge: {quantity}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {activeCategory.products.map((product) => (
            <button
              key={product}
              type="button"
              disabled={submitting}
              onClick={() => onQuickAdd({ name: product, category: activeCategory.label, quantity })}
              className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-white/15 bg-black/10 px-3 py-2 text-left text-sm font-semibold hover:bg-white/15 disabled:opacity-50"
            >
              <span>{product}</span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">x{quantity}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function QuickList({ title, icon: Icon, items, quantity, onPick, submitting }) {
  return (
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-3">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
        <Icon className="h-4 w-4 text-[var(--theme-accent)]" />
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={`${item.name}-${item.category}`}
            type="button"
            disabled={submitting}
            onClick={() => onPick({ ...item, quantity: item.quantity || quantity })}
            className="rounded-xl bg-[var(--theme-input)] px-3 py-2 text-sm text-primary hover:bg-[var(--theme-accentSoft)] disabled:opacity-50"
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  )
}
