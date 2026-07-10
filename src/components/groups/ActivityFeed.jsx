import { formatRelative } from '../../lib/formatRelative'
import {
  MessageCircle,
  CheckCircle2,
  Plus,
  ShoppingBasket,
  Settings,
  UserPlus,
} from 'lucide-react'
import Avatar from '../ui/Avatar'

const icons = {
  task_created: Plus,
  task_completed: CheckCircle2,
  comment: MessageCircle,
  shopping_added: ShoppingBasket,
  shopping_checked: CheckCircle2,
  group_updated: Settings,
  member_invited: UserPlus,
}

const labels = {
  task_created: 'hat erstellt',
  task_completed: 'hat erledigt',
  comment: 'hat kommentiert',
  shopping_added: 'hat hinzugefügt',
  shopping_checked: 'hat abgehakt',
  group_updated: 'hat die Gruppe geändert',
  member_invited: 'hat eingeladen',
}

export default function ActivityFeed({ items }) {
  if (!items?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--theme-border)] py-12 text-center">
        <p className="text-sm text-muted">Noch keine Aktivität in den letzten Tagen.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const Icon = icons[item.type] || Plus
        return (
          <li
            key={item.id}
            className="flex gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-3"
          >
            {item.avatar ? (
              <Avatar name={item.avatar.name} username={item.avatar.username} size="sm" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--theme-accentSoft)] text-[var(--theme-accent)]">
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-primary">
                <span className="font-semibold">{item.user || 'Jemand'}</span>{' '}
                {labels[item.type] || 'hat etwas gemacht'}:{' '}
                <span className="text-muted">{item.text}</span>
              </p>
              <p className="mt-1 text-xs text-muted">{formatRelative(item.at)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
