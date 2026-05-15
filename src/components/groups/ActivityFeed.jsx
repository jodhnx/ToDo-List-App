import { formatRelative } from '../../lib/formatRelative'
import { MessageCircle, CheckCircle2, Plus } from 'lucide-react'

const icons = {
  task_created: Plus,
  task_completed: CheckCircle2,
  comment: MessageCircle,
}

export default function ActivityFeed({ items }) {
  if (!items?.length) {
    return <p className="py-6 text-center text-sm text-muted">Noch keine Aktivität</p>
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const Icon = icons[item.type] || Plus
        return (
          <li
            key={item.id}
            className="flex gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
            <div className="min-w-0 flex-1">
              <p className="text-primary">
                <span className="font-medium">{item.user || 'Jemand'}</span>
                {item.type === 'task_completed' && ' hat erledigt: '}
                {item.type === 'task_created' && ' hat erstellt: '}
                {item.type === 'comment' && ' kommentierte: '}
                <span className="text-muted">{item.text}</span>
              </p>
              <p className="text-xs text-muted">{formatRelative(item.at)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
