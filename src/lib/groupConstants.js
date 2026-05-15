import {
  ShoppingCart,
  Sparkles,
  Receipt,
  Heart,
  GraduationCap,
  MoreHorizontal,
  Home,
  Users,
  Star,
  Sun,
} from 'lucide-react'

export const GROUP_CATEGORIES = [
  { value: 'shopping', label: 'Einkauf', icon: ShoppingCart, color: 'text-emerald-400 bg-emerald-500/10' },
  { value: 'cleaning', label: 'Putzen', icon: Sparkles, color: 'text-sky-400 bg-sky-500/10' },
  { value: 'bills', label: 'Rechnungen', icon: Receipt, color: 'text-amber-400 bg-amber-500/10' },
  { value: 'family', label: 'Familie', icon: Heart, color: 'text-rose-400 bg-rose-500/10' },
  { value: 'school', label: 'Schule', icon: GraduationCap, color: 'text-indigo-400 bg-indigo-500/10' },
  { value: 'other', label: 'Sonstiges', icon: MoreHorizontal, color: 'text-zinc-400 bg-zinc-500/10' },
]

export const GROUP_ICONS = [
  { value: 'home', label: 'Zuhause', Icon: Home },
  { value: 'heart', label: 'Familie', Icon: Heart },
  { value: 'users', label: 'Gruppe', Icon: Users },
  { value: 'star', label: 'Favorit', Icon: Star },
  { value: 'sun', label: 'Aktiv', Icon: Sun },
]

export const GROUP_PRIORITIES = [
  { value: 'niedrig', label: 'Niedrig' },
  { value: 'mittel', label: 'Mittel' },
  { value: 'hoch', label: 'Hoch' },
]

export function getGroupCategory(value) {
  return GROUP_CATEGORIES.find((c) => c.value === value) || GROUP_CATEGORIES[5]
}

export function getGroupIcon(value) {
  return GROUP_ICONS.find((i) => i.value === value) || GROUP_ICONS[0]
}
