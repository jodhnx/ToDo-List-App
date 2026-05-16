export const SHOPPING_CATEGORIES = [
  {
    id: 'produce',
    label: 'Gemüse / Obst',
    color: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
    products: ['Tomaten', 'Gurke', 'Kartoffeln', 'Äpfel', 'Bananen', 'Karotten', 'Salat', 'Zwiebeln'],
  },
  {
    id: 'dairy-bakery',
    label: 'Milch- & Backwaren',
    color: 'border-amber-300/40 bg-amber-500/10 text-amber-100',
    products: ['Milch', 'Brot', 'Brötchen', 'Butter', 'Joghurt', 'Käse', 'Eier', 'Sahne'],
  },
  {
    id: 'frozen',
    label: 'Tiefkühlprodukte',
    color: 'border-sky-300/40 bg-sky-500/10 text-sky-100',
    products: ['Pizza', 'Gemüse', 'Pommes', 'Fischstäbchen', 'Eis', 'Beeren'],
  },
  {
    id: 'meat',
    label: 'Fleisch / Aufschnitt',
    color: 'border-rose-300/40 bg-rose-500/10 text-rose-100',
    products: ['Hähnchen', 'Hackfleisch', 'Schinken', 'Salami', 'Würstchen', 'Speck'],
  },
  {
    id: 'basics',
    label: 'Basics',
    color: 'border-zinc-300/30 bg-white/[0.06] text-zinc-100',
    products: ['Nudeln', 'Reis', 'Mehl', 'Zucker', 'Salz', 'Öl', 'Konserven', 'Müsli'],
  },
  {
    id: 'drinks',
    label: 'Getränke',
    color: 'border-indigo-300/40 bg-indigo-500/10 text-indigo-100',
    products: ['Mineral', 'Säfte', 'Tee', 'Kaffee', 'Bier', 'Wein', 'Limonade', 'Kakao'],
  },
  {
    id: 'other',
    label: 'Sonstiges',
    color: 'border-violet-300/40 bg-violet-500/10 text-violet-100',
    products: ['Snacks', 'Schokolade', 'Gewürze', 'Kerzen', 'Batterien'],
  },
  {
    id: 'household',
    label: 'Haushaltswaren',
    color: 'border-cyan-300/40 bg-cyan-500/10 text-cyan-100',
    products: ['Küchenrolle', 'Toilettenpapier', 'Spülmittel', 'Waschmittel', 'Müllbeutel', 'Alufolie'],
  },
  {
    id: 'hygiene',
    label: 'Hygiene',
    color: 'border-pink-300/40 bg-pink-500/10 text-pink-100',
    products: ['Zahnpasta', 'Duschgel', 'Shampoo', 'Seife', 'Deo', 'Taschentücher'],
  },
]

export const DEFAULT_SHOPPING_CATEGORY = 'Sonstiges'

export const shoppingCategoryOptions = SHOPPING_CATEGORIES.map((category) => ({
  value: category.label,
  label: category.label,
}))

export function getShoppingCategory(label) {
  return SHOPPING_CATEGORIES.find((category) => category.label === label) || SHOPPING_CATEGORIES[6]
}

export function inferShoppingCategory(productName) {
  const normalized = String(productName || '').trim().toLowerCase()
  if (!normalized) return DEFAULT_SHOPPING_CATEGORY
  const match = SHOPPING_CATEGORIES.find((category) =>
    category.products.some((product) => product.toLowerCase() === normalized),
  )
  return match?.label || DEFAULT_SHOPPING_CATEGORY
}

export function normalizeShoppingName(name) {
  return String(name || '').trim().toLowerCase()
}

export function hasOpenShoppingDuplicate(items, name, category) {
  const normalized = normalizeShoppingName(name)
  if (!normalized) return false
  return (items || []).some(
    (item) =>
      !item.checked &&
      normalizeShoppingName(item.name) === normalized &&
      (item.category || DEFAULT_SHOPPING_CATEGORY) === (category || DEFAULT_SHOPPING_CATEGORY),
  )
}
