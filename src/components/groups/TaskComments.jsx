import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, SendHorizontal } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'

export default function TaskComments({
  taskId,
  taskTitle,
  creatorId,
  assigneeId,
  currentUserId,
  fetchComments,
  addComment,
}) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const mountedRef = useRef(false)

  const loadComments = useCallback(async ({ quiet = false } = {}) => {
    if (!taskId) return
    if (!quiet) setLoading(true)
    setError('')
    try {
      const data = await fetchComments(taskId)
      setComments(data)
    } catch (err) {
      setError(err.message || 'Kommentare konnten nicht geladen werden')
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [fetchComments, taskId])

  useEffect(() => {
    mountedRef.current = true
    loadComments()
    return () => {
      mountedRef.current = false
    }
  }, [loadComments])

  useEffect(() => {
    if (!taskId || !supabase) return
    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` },
        () => loadComments({ quiet: true }),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadComments, taskId])

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    setError('')
    try {
      const notify =
        assigneeId && assigneeId !== currentUserId
          ? assigneeId
          : creatorId !== currentUserId
            ? creatorId
            : null
      const c = await addComment({
        taskId,
        userId: currentUserId,
        body: text,
        notifyUserId: notify,
        taskTitle,
      })
      setComments((prev) => (prev.some((item) => item.id === c.id) ? prev : [...prev, c]))
      setText('')
    } catch (err) {
      setError(err.message || 'Kommentar konnte nicht gesendet werden')
    } finally {
      if (mountedRef.current) setSending(false)
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-primary">Kommentare</p>
        <span className="rounded-full bg-[var(--theme-accentSoft)] px-2.5 py-1 text-xs font-medium text-muted">
          {comments.length}
        </span>
      </div>

      <div className="mb-3 max-h-56 space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center gap-2 rounded-xl bg-[var(--theme-card)] px-3 py-3 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Kommentare werden geladen...
          </div>
        ) : comments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--theme-border)] px-3 py-3 text-sm text-muted">
            Noch keine Kommentare. Schreibe die erste Nachricht.
          </p>
        ) : (
          comments.map((c) => {
            const mine = c.user_id === currentUserId
            const profile = c.profile || c.profiles
            return (
              <div key={c.id} className={`flex gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && <Avatar name={profile?.display_name} username={profile?.username} size="sm" />}
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    mine
                      ? 'bg-[var(--theme-accent)] text-white'
                      : 'border border-[var(--theme-border)] bg-[var(--theme-card)] text-primary'
                  }`}
                >
                  <div className={`mb-0.5 text-[11px] font-semibold ${mine ? 'text-white/80' : 'text-muted'}`}>
                    {mine ? 'Du' : `@${profile?.username || 'Mitglied'}`}
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{c.body}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nachricht schreiben..."
          className="input-field flex-1 text-base"
          disabled={sending}
        />
        <Button type="submit" size="sm" disabled={sending || !text.trim()} className="min-w-[92px]">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          <span className="hidden sm:inline">Senden</span>
        </Button>
      </form>
    </div>
  )
}
