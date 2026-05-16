import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MessageCircle, Trash2, User } from 'lucide-react'
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
  const [commentsOpen, setCommentsOpen] = useState(false)
  const cat = getGroupCategory(task.category)
  const CatIcon = cat.icon
  const isMine = task.assignee_id === currentUserId
  const due = formatDueLabel(task)

  return (
    <motion.li
      layout
      className={`rounded-xl border p-4 transition ${
        isMine ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/10 bg-white/[0.03]'
      } ${task.status === 'completed' ? 'opacity-60' : ''}`}
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onToggle(task)}
          className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 ${
            task.status === 'completed' ? 'border-indigo-400 bg-indigo-400' : 'border-zinc-500'
          }`}
          aria-label="Erledigen"
        />
        <div className="min-w-0 flex-1">
          <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted' : 'text-primary'}`}>
            {task.title}
          </p>
          {task.description && <p className="mt-1 text-sm text-muted line-clamp-2">{task.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
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
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
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
              className="mt-2 w-full max-w-xs rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-primary"
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
          <button
            type="button"
            onClick={() => setCommentsOpen(!commentsOpen)}
            className="rounded-lg p-2 text-muted hover:bg-white/10"
            aria-label="Kommentare öffnen"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
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
      <AnimatePresence>
        {commentsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <TaskComments
              taskId={task.id}
              taskTitle={task.title}
              creatorId={task.creator_id}
              assigneeId={task.assignee_id}
              currentUserId={currentUserId}
              fetchComments={fetchComments}
              addComment={addComment}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}
