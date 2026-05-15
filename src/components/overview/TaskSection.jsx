import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import TodoItem from '../todos/TodoItem'

/** Gruppierte Aufgabenliste mit aufklappbaren Abschnitten */
export default function TaskSection({
  title,
  count,
  todos,
  accent = 'text-zinc-400',
  defaultOpen = true,
  emptyHint,
  ...itemHandlers
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (!count) return null

  return (
    <section className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left"
      >
        <span className={`text-sm font-semibold ${accent}`}>
          {title} <span className="font-normal text-zinc-500">({count})</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className="space-y-2">
          <AnimatePresence mode="popLayout">
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} {...itemHandlers} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {open && count === 0 && emptyHint && (
        <p className="py-2 text-center text-xs text-zinc-500">{emptyHint}</p>
      )}
    </section>
  )
}
