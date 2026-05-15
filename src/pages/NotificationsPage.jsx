import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useGroups } from '../context/GroupsContext'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { formatRelative } from '../lib/formatRelative'

export default function NotificationsPage() {
  const { notifications, markRead, markAllRead, refreshNotifications } = useGroups()
  const { toast } = useToast()

  const handleRead = async (n) => {
    if (!n.read) {
      await markRead(n.id)
      await refreshNotifications()
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Benachrichtigungen</h1>
          <p className="text-sm text-muted">Einladungen & Aufgaben</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await markAllRead()
            toast('Alle gelesen', 'success')
            await refreshNotifications()
          }}
        >
          Alle gelesen
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Card className="py-12 text-center">
          <Bell className="mx-auto mb-2 h-8 w-8 text-muted" />
          <p className="text-muted">Keine Benachrichtigungen</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => handleRead(n)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  n.read ? 'border-white/5 bg-white/[0.02]' : 'border-indigo-500/25 bg-indigo-500/10'
                }`}
              >
                <p className="font-medium text-primary">{n.title}</p>
                <p className="text-sm text-muted">{n.body}</p>
                <p className="mt-1 text-xs text-muted">{formatRelative(n.created_at)}</p>
                {n.payload?.group_id && (
                  <Link
                    to={`/app/family/${n.payload.group_id}`}
                    className="mt-2 inline-block text-xs text-indigo-400"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Zur Gruppe →
                  </Link>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
