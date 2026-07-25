import { motion } from 'framer-motion'
import { Bell, Calendar, MessageCircle, Trash2, User } from 'lucide-react'
import { getGroupCategory } from '../../lib/groupConstants'
import { formatDueLabel } from '../../lib/dateTime'
import Avatar from '../ui/Avatar'

export default function SharedTaskItem({
  task,
  currentUserId,
  canAssign,
  onToggle,
  onAssign,
  onDelete,
  onOpenComments,
  members,
}) {
  const cat = getGroupCategory(task.category)
  const CatIcon = cat.icon
  const isMine = task.assignee_id === currentUserId
  const due = formatDueLabel(task)
  const reminderLabel = task.notify_enabled && task.reminder_at
    ? new Date(task.reminder_at).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <motion.li
      layout
      className={`rounded-xl border p-3 shadow-sm transition ${
        isMine ? 'border-[var(--theme-accent)] bg-[var(--theme-accentSoft)]' : 'border-[var(--theme-border)] bg-[var(--theme-card)]'
      } ${task.status === 'completed' ? 'opacity-60' : ''}`}
    >
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => onToggle(task)}
          className={`mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 transition ${
            task.status === 'completed' ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]' : 'border-[var(--theme-border)] bg-[var(--theme-input)]'
          }`}
          aria-label="Erledigen"
        />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted' : 'text-primary'}`}>
            {task.title}
          </p>
          {task.description && <p className="mt-0.5 text-xs text-muted line-clamp-2">{task.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ${cat.color}`}>
              <CatIcon className="h-3 w-3" />
              {cat.label}
            </span>
            <span className="text-muted capitalize">{task.priority}</span>
            {due && (
              <span className="flex items-center gap-1 text-muted">
                <Calendar className="h-3 w-3" />
                {due}
              </span>
            )}
            {reminderLabel && (
              <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-indigo-300">
                <Bell className="h-3 w-3" />
                {reminderLabel}
                {task.reminder_early ? ' · 10 Min' : ''}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              von @{task.creator?.username}
            </span>
            {task.assignee && (
              <span className={`flex items-center gap-1 ${isMine ? 'font-medium text-[var(--theme-accent)]' : ''}`}>
                <Avatar name={task.assignee.display_name} username={task.assignee.username} size="sm" className="!h-5 !w-5 !text-[9px] !shadow-none" />
                @{task.assignee.username}
              </span>
            )}
          </div>
          {canAssign && task.status === 'open' && (
            <select
              className="mt-2 w-full max-w-xs rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-2.5 py-1.5 text-xs text-primary"
              value={task.assignee_id || ''}
              onChange={(e) => onAssign(task, e.target.value || null)}
            >
              <option value="">Nicht zugewiesen</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  @{m.profile?.username}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-0.5">
          {onOpenComments && (
            <button
              type="button"
              onClick={() => onOpenComments(task)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-[var(--theme-accentSoft)] hover:text-[var(--theme-accent)]"
              aria-label="Kommentare öffnen"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-300"
              aria-label="Aufgabe löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.li>
  )
}
