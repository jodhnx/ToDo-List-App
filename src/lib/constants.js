/** Kategorien für Aufgaben */
export const CATEGORIES = [
  { value: 'schule', label: 'Schule', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { value: 'gym', label: 'Gym', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { value: 'arbeit', label: 'Arbeit', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'privat', label: 'Privat', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
]

/** Prioritäten */
export const PRIORITIES = [
  { value: 'niedrig', label: 'Niedrig', color: 'text-zinc-400' },
  { value: 'mittel', label: 'Mittel', color: 'text-amber-400' },
  { value: 'hoch', label: 'Hoch', color: 'text-rose-400' },
]

/** Filter-Optionen für Status */
export const STATUS_FILTERS = [
  { value: 'all', label: 'Alle' },
  { value: 'open', label: 'Offen' },
  { value: 'done', label: 'Erledigt' },
]

export const QUICK_FILTERS = [
  { value: 'all', label: 'Alle' },
  { value: 'today', label: 'Heute' },
  { value: 'week', label: 'Diese Woche' },
  { value: 'overdue', label: 'Überfällig' },
  { value: 'pinned', label: 'Angepinnt' },
]

export const SORT_OPTIONS = [
  { value: 'created_at', label: 'Neueste zuerst' },
  { value: 'due_date', label: 'Fälligkeit' },
  { value: 'priority', label: 'Priorität' },
  { value: 'title', label: 'Titel A–Z' },
]

export const getCategory = (value) => CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[3]
export const getPriority = (value) => PRIORITIES.find((p) => p.value === value) ?? PRIORITIES[1]
