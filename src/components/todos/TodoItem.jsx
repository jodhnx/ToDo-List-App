import { motion } from 'framer-motion'
import { Bell, Calendar, Pencil, Trash2, Pin, Copy, Check } from 'lucide-react'
import Badge from '../ui/Badge'
import { getCategory, getPriority } from '../../lib/constants'
import { isOverdue } from '../../lib/todoUtils'
import { formatDueLabel } from '../../lib/dateTime'

/** Einzelne Aufgabe mit Premium-Design und weicher Erledigt-Animation */
export default function TodoItem({ todo, onToggle, onEdit, onDelete, onPin, onDuplicate }) {
  const category = getCategory(todo.category)
  const priority = getPriority(todo.priority)
  const overdue = isOverdue(todo)
  const reminderLabel = todo.reminder_at
    ? new Date(todo.reminder_at).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  const priorityVariant =
    todo.priority === 'hoch' ? 'danger' : todo.priority === 'niedrig' ? 'default' : 'warning'

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
      className={`group glass-card flex gap-3 p-4 sm:p-5 ${
        todo.pinned ? 'ring-1 ring-[var(--theme-accent)]/40' : ''
      } ${todo.completed ? 'opacity-65' : ''} ${overdue && !todo.completed ? 'ring-1 ring-rose-500/25' : ''}`}
    >
      <motion.button
        type="button"
        onClick={() => onToggle(todo)}
        whileTap={{ scale: 0.9 }}
        className={`touch-target mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
          todo.completed
            ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)] shadow-md shadow-[var(--theme-accent)]/30'
            : 'border-[var(--theme-border)] bg-[var(--theme-input)] hover:border-[var(--theme-accent)]'
        }`}
        aria-label={todo.completed ? 'Als offen markieren' : 'Als erledigt markieren'}
      >
        {todo.completed && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
      </motion.button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className={`flex-1 text-base font-medium text-primary ${todo.completed ? 'line-through text-muted' : ''}`}>
            {todo.title}
          </p>
          {todo.pinned && <Pin className="h-4 w-4 shrink-0 fill-[var(--theme-accent)] text-[var(--theme-accent)]" />}
        </div>
        {todo.description && (
          <p className="mt-1 text-sm leading-relaxed text-muted line-clamp-2">{todo.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge className={category.color}>{category.label}</Badge>
          <Badge variant={priorityVariant}>{priority.label}</Badge>
          {overdue && !todo.completed && <Badge variant="danger">Überfällig</Badge>}
          {todo.due_date && (
            <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-rose-400' : 'text-muted'}`}>
              <Calendar className="h-3.5 w-3.5" />
              {formatDueLabel(todo)}
            </span>
          )}
          {reminderLabel && (
            <Badge variant="accent">
              <Bell className="h-3 w-3" />
              {reminderLabel}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
        <ActionBtn active={todo.pinned} onClick={() => onPin(todo)} label={todo.pinned ? 'Lösen' : 'Anpinnen'}>
          <Pin className="h-4 w-4" />
        </ActionBtn>
        <ActionBtn onClick={() => onDuplicate(todo)} label="Duplizieren">
          <Copy className="h-4 w-4" />
        </ActionBtn>
        <ActionBtn onClick={() => onEdit(todo)} label="Bearbeiten">
          <Pencil className="h-4 w-4" />
        </ActionBtn>
        <ActionBtn danger onClick={() => onDelete(todo.id)} label="Löschen">
          <Trash2 className="h-4 w-4" />
        </ActionBtn>
      </div>
    </motion.li>
  )
}

function ActionBtn({ children, onClick, label, active, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`touch-target rounded-xl p-2 transition ${
        danger
          ? 'text-muted hover:bg-rose-500/15 hover:text-rose-400'
          : active
            ? 'text-[var(--theme-accent)]'
            : 'text-muted hover:bg-[var(--theme-accentSoft)] hover:text-primary'
      }`}
      aria-label={label}
    >
      {children}
    </button>
  )
}
