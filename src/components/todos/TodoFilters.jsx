import { Search } from 'lucide-react'
import Select from '../ui/Select'
import { CATEGORIES, PRIORITIES, STATUS_FILTERS } from '../../lib/constants'

/** Suche und Filter für die Todo-Liste */
export default function TodoFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  priorityFilter,
  onPriorityChange,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Aufgaben suchen…"
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <Select
        label="Status"
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        options={STATUS_FILTERS}
        className="sm:w-36"
      />
      <Select
        label="Kategorie"
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value)}
        options={[{ value: 'all', label: 'Alle' }, ...CATEGORIES]}
        className="sm:w-36"
      />
      <Select
        label="Priorität"
        value={priorityFilter}
        onChange={(e) => onPriorityChange(e.target.value)}
        options={[{ value: 'all', label: 'Alle' }, ...PRIORITIES]}
        className="sm:w-36"
      />
    </div>
  )
}
