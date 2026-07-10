import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Reply, SendHorizontal } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'

const QUICK_EMOJIS = ['👍', '❤️', '😊', '🎉', '✅', '🙏']

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TaskComments({
  taskId,
  taskTitle,
  creatorId,
  assigneeId,
  currentUserId,
  fetchComments,
  addComment,
  expanded = false,
}) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const mountedRef = useRef(false)
  const listRef = useRef(null)

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
    return () => supabase.removeChannel(channel)
  }, [loadComments, taskId])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [comments])

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    setError('')
    try {
      let body = text.trim()
      if (replyTo) {
        const profile = replyTo.profile || replyTo.profiles
        body = `@${profile?.username || 'Mitglied'} ${body}`
      }
      const notify =
        assigneeId && assigneeId !== currentUserId
          ? assigneeId
          : creatorId !== currentUserId
            ? creatorId
            : null
      const c = await addComment({
        taskId,
        userId: currentUserId,
        body,
        notifyUserId: notify,
        taskTitle,
      })
      setComments((prev) => (prev.some((item) => item.id === c.id) ? prev : [...prev, c]))
      setText('')
      setReplyTo(null)
    } catch (err) {
      setError(err.message || 'Kommentar konnte nicht gesendet werden')
    } finally {
      if (mountedRef.current) setSending(false)
    }
  }

  return (
    <div className={`rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-input)] ${expanded ? 'p-4 sm:p-5' : 'mt-4 p-3 sm:p-4'}`}>
      {!expanded && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-primary">Kommentare</p>
          <span className="rounded-full bg-[var(--theme-accentSoft)] px-2.5 py-1 text-xs font-medium text-muted">
            {comments.length}
          </span>
        </div>
      )}

      <div
        ref={listRef}
        className={`mb-3 space-y-3 overflow-y-auto pr-1 ${expanded ? 'max-h-96' : 'max-h-56'}`}
      >
        {loading ? (
          <div className="flex items-center gap-2 rounded-xl bg-[var(--theme-card)] px-3 py-3 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Kommentare werden geladen...
          </div>
        ) : comments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--theme-border)] px-3 py-3 text-sm text-muted">
            Noch keine Nachrichten. Schreibe die erste.
          </p>
        ) : (
          comments.map((c) => {
            const mine = c.user_id === currentUserId
            const profile = c.profile || c.profiles
            return (
              <div key={c.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                <Avatar name={profile?.display_name} username={profile?.username} size="sm" />
                <div className={`max-w-[82%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      mine
                        ? 'bg-[var(--theme-accent)] text-white'
                        : 'border border-[var(--theme-border)] bg-[var(--theme-card)] text-primary'
                    }`}
                  >
                    <div className={`mb-1 flex items-center gap-2 text-[11px] font-semibold ${mine ? 'text-white/80' : 'text-muted'}`}>
                      <span>{mine ? 'Du' : `@${profile?.username || 'Mitglied'}`}</span>
                      <span>{formatTime(c.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{c.body}</p>
                  </div>
                  {!mine && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(c)
                        setText('')
                      }}
                      className="mt-1 flex items-center gap-1 text-xs text-muted hover:text-primary"
                    >
                      <Reply className="h-3 w-3" />
                      Antworten
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-[var(--theme-accentSoft)] px-3 py-2 text-xs text-primary">
          <span>Antwort an @{replyTo.profile?.username || replyTo.profiles?.username}</span>
          <button type="button" onClick={() => setReplyTo(null)} className="text-muted hover:text-primary">
            Abbrechen
          </button>
        </div>
      )}

      {error && (
        <p className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="mb-2 flex flex-wrap gap-1">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setText((v) => `${v}${emoji}`)}
            className="touch-target rounded-xl bg-[var(--theme-card)] px-2 py-1 text-lg hover:bg-[var(--theme-accentSoft)]"
          >
            {emoji}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nachricht schreiben..."
          className="input-field min-h-12 flex-1 text-base"
          disabled={sending}
        />
        <Button type="submit" size="sm" disabled={sending || !text.trim()} className="min-h-12 min-w-[52px]">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
        </Button>
      </form>
    </div>
  )
}
