import { useEffect, useState } from 'react'
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

  useEffect(() => {
    fetchComments(taskId).then(setComments)
  }, [taskId, fetchComments])

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim() || loading) return
    setLoading(true)
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
      setComments((prev) => [...prev, c])
      setText('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <ul className="mb-3 max-h-40 space-y-2 overflow-y-auto">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-2 text-sm">
            <Avatar name={c.profiles?.display_name} username={c.profiles?.username} size="sm" />
            <div>
              <span className="font-medium text-indigo-300">@{c.profiles?.username}</span>
              <p className="text-muted">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Kommentar…"
          className="input-field flex-1 text-base"
        />
        <Button type="submit" size="sm" disabled={loading}>
          Senden
        </Button>
      </form>
    </div>
  )
}
