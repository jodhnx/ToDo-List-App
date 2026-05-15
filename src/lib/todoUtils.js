import { getPriority } from './constants'

const priorityOrder = { hoch: 0, mittel: 1, niedrig: 2 }

/** Überfällig (nur offene Aufgaben mit Datum in der Vergangenheit) */
export function isOverdue(todo) {
  if (!todo.due_date || todo.completed) return false
  const due = new Date(todo.due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return due < today
}

/** Fällig heute */
export function isDueToday(todo) {
  if (!todo.due_date || todo.completed) return false
  const due = new Date(todo.due_date).toDateString()
  return due === new Date().toDateString()
}

/** Fällig diese Woche (Mo–So) */
export function isDueThisWeek(todo) {
  if (!todo.due_date || todo.completed) return false
  const due = new Date(todo.due_date)
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return due >= start && due <= end
}

/** Schnellfilter anwenden */
export function applyQuickFilter(todos, quickFilter) {
  switch (quickFilter) {
    case 'today':
      return todos.filter(isDueToday)
    case 'week':
      return todos.filter(isDueThisWeek)
    case 'overdue':
      return todos.filter(isOverdue)
  case 'pinned':
      return todos.filter((t) => t.pinned)
    default:
      return todos
  }
}

/** Sortierung */
export function sortTodos(todos, sortBy) {
  const list = [...todos]
  const byPinned = (a, b) => Number(b.pinned) - Number(a.pinned)

  switch (sortBy) {
    case 'due_date':
      return list.sort((a, b) => {
        const pin = byPinned(a, b)
        if (pin !== 0) return pin
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date) - new Date(b.due_date)
      })
    case 'priority':
      return list.sort((a, b) => {
        const pin = byPinned(a, b)
        if (pin !== 0) return pin
        return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
      })
    case 'title':
      return list.sort((a, b) => {
        const pin = byPinned(a, b)
        if (pin !== 0) return pin
        return a.title.localeCompare(b.title, 'de')
      })
    case 'created_at':
    default:
      return list.sort((a, b) => {
        const pin = byPinned(a, b)
        if (pin !== 0) return pin
        return new Date(b.created_at) - new Date(a.created_at)
      })
  }
}

/** Statistik pro Kategorie */
export function getCategoryStats(todos) {
  const stats = { schule: 0, gym: 0, arbeit: 0, privat: 0 }
  todos.filter((t) => !t.completed).forEach((t) => {
    if (stats[t.category] !== undefined) stats[t.category]++
  })
  return stats
}

/** Prioritäts-Statistik */
export function getPriorityStats(todos) {
  const open = todos.filter((t) => !t.completed)
  return {
    hoch: open.filter((t) => t.priority === 'hoch').length,
    mittel: open.filter((t) => t.priority === 'mittel').length,
    niedrig: open.filter((t) => t.priority === 'niedrig').length,
  }
}
