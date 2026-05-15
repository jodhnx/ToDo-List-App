/** Datum + optionale Uhrzeit (HH:MM) für Fälligkeit */
export function parseDueDateTime(todo) {
  if (!todo?.due_date) return null
  const time = todo.due_time && /^\d{2}:\d{2}$/.test(todo.due_time) ? todo.due_time : '23:59'
  return new Date(`${todo.due_date}T${time}:00`)
}

export function formatDueLabel(todo) {
  if (!todo.due_date) return null
  const date = new Date(todo.due_date + 'T12:00:00').toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
  })
  if (todo.due_time) return `${date}, ${todo.due_time} Uhr`
  return date
}

export function isSameCalendarDay(d1, d2) {
  return d1.toDateString() === d2.toDateString()
}
