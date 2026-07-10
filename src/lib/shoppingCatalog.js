import {
  Apple,
  Milk,
  CircleDot,
  Beef,
  Ham,
  CupSoda,
  Snowflake,
  Home,
  Sparkles,
  PawPrint,
  Croissant,
  Cookie,
  Candy,
  Package,
} from 'lucide-react'

export const CATEGORY_ICONS = {
  produce: Apple,
  dairy: Milk,
  topfen: CircleDot,
  meat: Beef,
  sausage: Ham,
  drinks: CupSoda,
  frozen: Snowflake,
  household: Home,
  hygiene: Sparkles,
  pet: PawPrint,
  bakery: Croissant,
  snacks: Cookie,
  sweets: Candy,
  other: Package,
}

export const SHOPPING_CATEGORIES = [
  {
    id: 'produce',
    label: 'Obst & Gemüse',
    color: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
    products: [
      'Tomaten', 'Gurke', 'Erdäpfel', 'Kartoffeln', 'Äpfel', 'Bananen', 'Karotten', 'Salat',
      'Zwiebeln', 'Paprika', 'Orangen', 'Birnen', 'Zitronen', 'Marillen', 'Zwetschken',
      'Weintrauben', 'Brokkoli', 'Karfiol', 'Zucchini', 'Champignons', 'Knoblauch',
    ],
  },
  {
    id: 'dairy',
    label: 'Milchprodukte',
    color: 'border-amber-300/40 bg-amber-500/10 text-amber-100',
    products: [
      'Milch', 'Butter', 'Joghurt', 'Käse', 'Eier', 'Schlagobers', 'Sauerrahm',
      'Frischkäse', 'Mozzarella', 'Gouda', 'Emmentaler', 'Parmesan',
    ],
  },
  {
    id: 'topfen',
    label: 'Topfen',
    color: 'border-yellow-300/40 bg-yellow-500/10 text-yellow-100',
    products: ['Topfen', 'Magerquark', 'Schichtkäse', 'Topfenstrudel', 'Topfennudeln'],
  },
  {
    id: 'meat',
    label: 'Fleisch',
    color: 'border-rose-300/40 bg-rose-500/10 text-rose-100',
    products: [
      'Hendl', 'Faschiertes', 'Putenbrust', 'Leberkäse', 'Schnitzel', 'Fleischlaberl',
      'Rindfleisch', 'Schweinsbraten', 'Grillfleisch',
    ],
  },
  {
    id: 'sausage',
    label: 'Wurst',
    color: 'border-red-300/40 bg-red-500/10 text-red-100',
    products: [
      'Schinken', 'Salami', 'Frankfurter', 'Speck', 'Bratwurst', 'Extrawurst',
      'Bergsteiger', 'Aufschnitt', 'Leberwurst', 'Käsekrainer',
    ],
  },
  {
    id: 'drinks',
    label: 'Getränke',
    color: 'border-indigo-300/40 bg-indigo-500/10 text-indigo-100',
    products: [
      'Mineral', 'Säfte', 'Apfelsaft', 'Orangensaft', 'Tee', 'Kaffee', 'Bier', 'Wein',
      'Limonade', 'Sirup', 'Energy Drink', 'Eistee',
    ],
  },
  {
    id: 'frozen',
    label: 'Tiefkühl',
    color: 'border-sky-300/40 bg-sky-500/10 text-sky-100',
    products: [
      'Pizza', 'Tiefkühlgemüse', 'Pommes', 'Fischstäbchen', 'Eis', 'Beeren', 'Spinat',
      'Lasagne', 'Chicken Nuggets', 'Knödel', 'Palatschinken', 'Blätterteig',
    ],
  },
  {
    id: 'household',
    label: 'Haushalt',
    color: 'border-cyan-300/40 bg-cyan-500/10 text-cyan-100',
    products: [
      'Küchenrolle', 'Toilettenpapier', 'Spülmittel', 'Waschmittel', 'Müllbeutel',
      'Alufolie', 'Backpapier', 'Schwämme', 'Reiniger', 'Geschirrspültabs',
    ],
  },
  {
    id: 'hygiene',
    label: 'Hygiene',
    color: 'border-pink-300/40 bg-pink-500/10 text-pink-100',
    products: [
      'Zahnpasta', 'Duschgel', 'Shampoo', 'Seife', 'Deo', 'Taschentücher',
      'Wattestäbchen', 'Creme', 'Rasierer', 'Zahnbürsten',
    ],
  },
  {
    id: 'pet',
    label: 'Tierbedarf',
    color: 'border-lime-300/40 bg-lime-500/10 text-lime-100',
    products: ['Katzenfutter', 'Hundefutter', 'Katzenstreu', 'Leckerlis', 'Vogelfutter', 'Heu'],
  },
  {
    id: 'bakery',
    label: 'Backwaren',
    color: 'border-orange-300/40 bg-orange-500/10 text-orange-100',
    products: [
      'Brot', 'Semmeln', 'Kornspitz', 'Toast', 'Croissants', 'Germ', 'Pizzateig',
      'Baguette', 'Vollkornbrot', 'Brioche',
    ],
  },
  {
    id: 'snacks',
    label: 'Snacks',
    color: 'border-orange-300/40 bg-orange-500/10 text-orange-100',
    products: [
      'Chips', 'Nüsse', 'Soletti', 'Popcorn', 'Studentenfutter', 'Cracker', 'Salzstangen',
    ],
  },
  {
    id: 'sweets',
    label: 'Süßigkeiten',
    color: 'border-fuchsia-300/40 bg-fuchsia-500/10 text-fuchsia-100',
    products: [
      'Schokolade', 'Kekse', 'Manner Schnitten', 'Kaugummi', 'Gummibärli',
      'Bonbons', 'Eis am Stiel', 'Haribo',
    ],
  },
  {
    id: 'other',
    label: 'Sonstiges',
    color: 'border-violet-300/40 bg-violet-500/10 text-violet-100',
    products: [
      'Nudeln', 'Reis', 'Mehl', 'Zucker', 'Salz', 'Öl', 'Konserven', 'Gewürze',
      'Kerzen', 'Batterien', 'Glühbirnen',
    ],
  },
]

export const DEFAULT_SHOPPING_CATEGORY = 'Sonstiges'

export const shoppingCategoryOptions = SHOPPING_CATEGORIES.map((category) => ({
  value: category.label,
  label: category.label,
}))

export function getShoppingCategory(label) {
  return SHOPPING_CATEGORIES.find((category) => category.label === label) || SHOPPING_CATEGORIES.at(-1)
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

export function getRecentProducts(items, limit = 8) {
  return [...(items || [])]
    .filter((item) => item.checked)
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .reduce((acc, item) => {
      const key = `${item.name}::${item.category}`
      if (!acc.some((x) => `${x.name}::${x.category}` === key)) acc.push(item)
      return acc
    }, [])
    .slice(0, limit)
    .map((item) => ({ name: item.name, category: item.category, quantity: item.quantity || '1' }))
}

export function getFrequentProducts(items, favorites = [], limit = 8) {
  const counts = new Map()
  for (const item of items || []) {
    const key = `${item.name}::${item.category}`
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  for (const fav of favorites || []) {
    const key = `${fav.name || fav.product_name}::${fav.category}`
    counts.set(key, (counts.get(key) || 0) + Number(fav.use_count || 0) + 3)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => {
      const [name, category] = key.split('::')
      return { name, category, quantity: '1' }
    })
}
