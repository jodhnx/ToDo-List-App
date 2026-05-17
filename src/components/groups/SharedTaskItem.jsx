import { motion } from 'framer-motion'
import { Bell, Calendar, MessageCircle, Trash2, User } from 'lucide-react'
import { getGroupCategory } from '../../lib/groupConstants'
import { formatDueLabel } from '../../lib/dateTime'
import Avatar from '../ui/Avatar'
import TaskComments from './TaskComments'

export default function SharedTaskItem({
  task,
  currentUserId,
  canAssign,
  onToggle,
  onAssign,
  onDelete,
  members,
  fetchComments,
  addComment,
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
      className={`rounded-2xl border p-4 shadow-sm transition sm:p-5 ${
        isMine ? 'border-[var(--theme-accent)] bg-[var(--theme-accentSoft)]' : 'border-[var(--theme-border)] bg-[var(--theme-card)]'
      } ${task.status === 'completed' ? 'opacity-60' : ''}`}
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onToggle(task)}
          className={`mt-1 h-7 w-7 shrink-0 rounded-full border-2 transition ${
            task.status === 'completed' ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]' : 'border-[var(--theme-border)] bg-[var(--theme-input)]'
          }`}
          aria-label="Erledigen"
        />
        <div className="min-w-0 flex-1">
          <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted' : 'text-primary'}`}>
            {task.title}
          </p>
          {task.description && <p className="mt-1 text-sm text-muted line-clamp-2">{task.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${cat.color}`}>
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
              <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-indigo-300">
                <Bell className="h-3 w-3" />
                {reminderLabel}
                {task.reminder_early ? ' · 10 Min vorher' : ''}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              von @{task.creator?.username}
            </span>
            {task.assignee && (
              <span className={`flex items-center gap-1 ${isMine ? 'text-indigo-300 font-medium' : ''}`}>
                <Avatar name={task.assignee.display_name} username={task.assignee.username} size="sm" />
                @{task.assignee.username}
              </span>
            )}
          </div>
          {canAssign && task.status === 'open' && (
            <select
              className="mt-3 w-full max-w-xs rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2 text-sm text-primary"
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
        <div className="flex shrink-0 flex-col gap-1">
          <div className="rounded-lg p-2 text-muted" aria-label="Kommentare">
            <MessageCircle className="h-4 w-4" />
          </div>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="rounded-lg p-2 text-muted hover:bg-rose-500/10 hover:text-rose-300"
              aria-label="Aufgabe löschen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <TaskComments
        taskId={task.id}
        taskTitle={task.title}
        creatorId={task.creator_id}
        assigneeId={task.assignee_id}
        currentUserId={currentUserId}
        fetchComments={fetchComments}
        addComment={addComment}
      />
    </motion.li>
  )
}
