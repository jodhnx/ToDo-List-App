export const SHOPPING_CATEGORIES = [
  {
    id: 'produce',
    label: 'Gemüse / Obst',
    color: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
    products: [
      'Tomaten',
      'Gurke',
      'Erdäpfel',
      'Kartoffeln',
      'Äpfel',
      'Bananen',
      'Karotten',
      'Salat',
      'Zwiebeln',
      'Paprika',
      'Orangen',
      'Birnen',
      'Zitronen',
      'Marillen',
      'Zwetschken',
      'Weintrauben',
      'Brokkoli',
      'Karfiol',
      'Zucchini',
      'Champignons',
      'Knoblauch',
    ],
  },
  {
    id: 'dairy-bakery',
    label: 'Milch- & Backwaren',
    color: 'border-amber-300/40 bg-amber-500/10 text-amber-100',
    products: [
      'Milch',
      'Brot',
      'Semmeln',
      'Kornspitz',
      'Butter',
      'Joghurt',
      'Käse',
      'Eier',
      'Schlagobers',
      'Topfen',
      'Sauerrahm',
      'Frischkäse',
      'Toast',
      'Croissants',
      'Germ',
      'Pizzateig',
    ],
  },
  {
    id: 'frozen',
    label: 'Tiefkühlprodukte',
    color: 'border-sky-300/40 bg-sky-500/10 text-sky-100',
    products: [
      'Pizza',
      'Tiefkühlgemüse',
      'Pommes',
      'Fischstäbchen',
      'Eis',
      'Beeren',
      'Spinat',
      'Lasagne',
      'Chicken Nuggets',
      'Kräuter',
      'Knödel',
      'Palatschinken',
      'Blätterteig',
    ],
  },
  {
    id: 'meat',
    label: 'Fleisch / Aufschnitt',
    color: 'border-rose-300/40 bg-rose-500/10 text-rose-100',
    products: [
      'Hendl',
      'Faschiertes',
      'Schinken',
      'Salami',
      'Frankfurter',
      'Speck',
      'Putenbrust',
      'Leberkäse',
      'Bratwurst',
      'Schnitzel',
      'Fleischlaberl',
      'Extrawurst',
      'Bergsteiger',
      'Aufschnitt',
    ],
  },
  {
    id: 'basics',
    label: 'Basics',
    color: 'border-zinc-300/30 bg-white/[0.06] text-zinc-100',
    products: [
      'Nudeln',
      'Reis',
      'Mehl',
      'Zucker',
      'Salz',
      'Öl',
      'Konserven',
      'Müsli',
      'Haferflocken',
      'Paradeissoße',
      'Passierte Tomaten',
      'Pesto',
      'Essig',
      'Pfeffer',
      'Brühe',
      'Ketchup',
      'Senf',
      'Marmelade',
      'Honig',
      'Cornflakes',
      'Grieß',
      'Linsen',
      'Bohnen',
      'Suppennudeln',
      'Semmelbrösel',
      'Backpulver',
      'Vanillezucker',
      'Kakao',
      'Tee',
      'Kaffee',
    ],
  },
  {
    id: 'drinks',
    label: 'Getränke',
    color: 'border-indigo-300/40 bg-indigo-500/10 text-indigo-100',
    products: [
      'Mineral',
      'Säfte',
      'Apfelsaft',
      'Orangensaft',
      'Tee',
      'Kaffee',
      'Bier',
      'Wein',
      'Limonade',
      'Kakao',
      'Sirup',
      'Energy Drink',
      'Eistee',
    ],
  },
  {
    id: 'snacks',
    label: 'Snacks',
    color: 'border-orange-300/40 bg-orange-500/10 text-orange-100',
    products: [
      'Schokolade',
      'Chips',
      'Kekse',
      'Nüsse',
      'Soletti',
      'Manner Schnitten',
      'Kaugummi',
      'Gummibärli',
      'Popcorn',
      'Studentenfutter',
    ],
  },
  {
    id: 'household',
    label: 'Haushaltswaren',
    color: 'border-cyan-300/40 bg-cyan-500/10 text-cyan-100',
    products: [
      'Küchenrolle',
      'Toilettenpapier',
      'Spülmittel',
      'Waschmittel',
      'Müllbeutel',
      'Alufolie',
      'Backpapier',
      'Schwämme',
      'Reiniger',
      'Geschirrspültabs',
      'Glasreiniger',
      'Klopapier',
      'Servietten',
      'Frischhaltefolie',
      'Entkalker',
    ],
  },
  {
    id: 'hygiene',
    label: 'Hygiene',
    color: 'border-pink-300/40 bg-pink-500/10 text-pink-100',
    products: [
      'Zahnpasta',
      'Duschgel',
      'Shampoo',
      'Seife',
      'Deo',
      'Taschentücher',
      'Wattestäbchen',
      'Creme',
      'Rasierer',
      'Mundspülung',
      'Zahnbürsten',
      'Haarspülung',
      'Pflaster',
      'Toilettfeuchttücher',
    ],
  },
  {
    id: 'pet',
    label: 'Tierfutter',
    color: 'border-lime-300/40 bg-lime-500/10 text-lime-100',
    products: ['Katzenfutter', 'Hundefutter', 'Katzenstreu', 'Leckerlis', 'Vogelfutter', 'Heu', 'Fischfutter'],
  },
  {
    id: 'other',
    label: 'Sonstiges',
    color: 'border-violet-300/40 bg-violet-500/10 text-violet-100',
    products: ['Gewürze', 'Kerzen', 'Batterien', 'Glühbirnen', 'Kleber', 'Feuerzeug', 'Zeitschrift'],
  },
]

export const DEFAULT_SHOPPING_CATEGORY = 'Sonstiges'

export const shoppingCategoryOptions = SHOPPING_CATEGORIES.map((category) => ({
  value: category.label,
  label: category.label,
}))

export function getShoppingCategory(label) {
  return SHOPPING_CATEGORIES.find((category) => category.label === label) || SHOPPING_CATEGORIES[10]
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
