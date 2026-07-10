import { useCallback, useEffect, useState } from 'react'
import { Loader2, MessageCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import TaskComments from './TaskComments'
import Select from '../ui/Select'
import Card from '../ui/Card'

export default function GroupCommentsTab({
  tasks,
  currentUserId,
  fetchComments,
  addComment,
  fetchGroupComments,
  initialTaskId,
}) {
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id || '')
  const [feed, setFeed] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(true)

  useEffect(() => {
    if (tasks.length && !tasks.find((t) => t.id === selectedTaskId)) {
      setSelectedTaskId(tasks[0].id)
    }
  }, [tasks, selectedTaskId])

  useEffect(() => {
    if (initialTaskId && tasks.some((t) => t.id === initialTaskId)) {
      setSelectedTaskId(initialTaskId)
    }
  }, [initialTaskId, tasks])

  const loadFeed = useCallback(async () => {
    if (!fetchGroupComments) return
    setLoadingFeed(true)
    try {
      const data = await fetchGroupComments()
      setFeed(data)
    } finally {
      setLoadingFeed(false)
    }
  }, [fetchGroupComments])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  useEffect(() => {
    if (!supabase) return
    const channel = supabase
      .channel('group-comments-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments' }, () => loadFeed())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadFeed])

  const selectedTask = tasks.find((t) => t.id === selectedTaskId)

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="mb-3 flex items-center gap-2 font-semibold text-primary">
          <MessageCircle className="h-5 w-5 text-[var(--theme-accent)]" />
          Familien-Kommentare
        </p>
        {loadingFeed ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Kommentare werden geladen...
          </div>
        ) : feed.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Kommentare in dieser Familie.</p>
        ) : (
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {feed.slice(0, 12).map((entry) => (
              <li key={entry.id} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2 text-sm">
                <p className="font-medium text-primary">
                  @{entry.profile?.username || 'Mitglied'} · {entry.taskTitle}
                </p>
                <p className="text-muted line-clamp-2">{entry.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {tasks.length === 0 ? (
        <Card className="text-center">
          <p className="text-muted">Erstelle zuerst eine Aufgabe, um Kommentare zu schreiben.</p>
        </Card>
      ) : (
        <>
          <Select
            label="Aufgabe für Kommentar"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            options={tasks.map((t) => ({ value: t.id, label: t.title }))}
          />
          {selectedTask && (
            <TaskComments
              taskId={selectedTask.id}
              taskTitle={selectedTask.title}
              creatorId={selectedTask.creator_id}
              assigneeId={selectedTask.assignee_id}
              currentUserId={currentUserId}
              fetchComments={fetchComments}
              addComment={async (payload) => {
                const result = await addComment(payload)
                await loadFeed()
                return result
              }}
              expanded
            />
          )}
        </>
      )}
    </div>
  )
}
