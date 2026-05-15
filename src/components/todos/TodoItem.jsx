import { motion } from 'framer-motion'
import { Calendar, Pencil, Trash2, Pin, Copy } from 'lucide-react'
import Badge from '../ui/Badge'
import { getCategory, getPriority } from '../../lib/constants'
import { isOverdue } from '../../lib/todoUtils'
import { formatDueLabel } from '../../lib/dateTime'

/** Einzelne Aufgabe mit Pin, Duplizieren und Überfällig-Markierung */
export default function TodoItem({ todo, onToggle, onEdit, onDelete, onPin, onDuplicate }) {
  const category = getCategory(todo.category)
  const priority = getPriority(todo.priority)
  const overdue = isOverdue(todo)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`group flex gap-3 rounded-xl border p-4 transition ${
        todo.pinned
          ? 'border-indigo-500/30 bg-indigo-500/5'
          : 'border-white/5 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.06]'
      } ${todo.completed ? 'opacity-60' : ''} ${overdue ? 'border-rose-500/20' : ''}`}
    >
      <button
        type="button"
        onClick={() => onToggle(todo)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
          todo.completed
            ? 'border-indigo-400 bg-indigo-400'
            : 'border-zinc-500 hover:border-indigo-400'
        }`}
        aria-label={todo.completed ? 'Als offen markieren' : 'Als erledigt markieren'}
      >
        {todo.completed && (
          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className={`flex-1 font-medium text-primary ${todo.completed ? 'line-through text-muted' : ''}`}>
            {todo.title}
          </p>
          {todo.pinned && <Pin className="h-3.5 w-3.5 shrink-0 fill-indigo-400 text-indigo-400" />}
        </div>
        {todo.description && (
          <p className="mt-1 text-sm text-muted line-clamp-2">{todo.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge className={category.color}>{category.label}</Badge>
          <span className={`text-xs font-medium ${priority.color}`}>{priority.label}</span>
          {overdue && (
            <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-xs text-rose-400">Überfällig</span>
          )}
          {todo.due_date && (
            <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-rose-400' : 'text-muted'}`}>
              <Calendar className="h-3 w-3" />
              {formatDueLabel(todo)}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
        <button
          type="button"
          onClick={() => onPin(todo)}
          className={`rounded-lg p-2 transition ${
            todo.pinned ? 'text-indigo-400' : 'text-muted hover:bg-white/10 hover:text-primary'
          }`}
          aria-label={todo.pinned ? 'Lösen' : 'Anpinnen'}
        >
          <Pin className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(todo)}
          className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-primary"
          aria-label="Duplizieren"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(todo)}
          className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-primary"
          aria-label="Bearbeiten"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(todo.id)}
          className="rounded-lg p-2 text-muted hover:bg-rose-500/20 hover:text-rose-400"
          aria-label="Löschen"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.li>
  )
}
