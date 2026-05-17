import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, ChevronDown, ListPlus, Settings, Users, User } from 'lucide-react'
import Avatar from '../ui/Avatar'

export default function QuickAccessMenu({ displayName, groups = [] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const go = (to) => {
    setOpen(false)
    navigate(to)
  }

  const firstGroup = groups[0]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 items-center gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-2.5 py-2 text-sm text-primary shadow-sm transition hover:bg-[var(--theme-accentSoft)] sm:px-3"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={displayName} size="sm" />
        <span className="hidden max-w-[110px] truncate font-medium sm:block">{displayName}</span>
        <ChevronDown className={`h-4 w-4 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-2 shadow-2xl backdrop-blur-xl"
        >
          <div className="border-b border-[var(--theme-border)] px-3 py-3">
            <p className="text-sm font-semibold text-primary">Schnellzugriff</p>
            <p className="text-xs text-muted">Wichtige Bereiche direkt öffnen</p>
          </div>

          <div className="grid gap-1 py-2">
            <MenuButton icon={User} label="Profil öffnen" onClick={() => go('/app/profile')} />
            <MenuButton icon={Settings} label="Einstellungen" onClick={() => go('/app/settings')} />
            <MenuButton icon={Bell} label="Benachrichtigungen" onClick={() => go('/app/notifications')} />
            <MenuButton icon={CalendarDays} label="Zu heute springen" onClick={() => go('/app/tasks?view=today')} />
            <MenuButton icon={ListPlus} label="Schnell neue Aufgabe" onClick={() => go('/app/tasks?new=1')} />
            <MenuButton
              icon={Users}
              label="Familiengruppe wechseln"
              helper={firstGroup ? firstGroup.name : 'Familienübersicht öffnen'}
              onClick={() => go(firstGroup ? `/app/family/${firstGroup.id}` : '/app/family')}
            />
          </div>

          {groups.length > 1 && (
            <div className="border-t border-[var(--theme-border)] px-2 py-2">
              <p className="px-2 pb-1 text-xs font-medium text-muted">Deine Familien</p>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {groups.slice(0, 6).map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => go(`/app/family/${group.id}`)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-primary hover:bg-[var(--theme-accentSoft)]"
                  >
                    <span className="truncate">{group.name}</span>
                    <span className="ml-2 text-xs text-muted">{group.member_count || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MenuButton({ icon: Icon, label, helper, onClick }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-[var(--theme-accentSoft)]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--theme-accentSoft)] text-[var(--theme-accent)]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-primary">{label}</span>
        {helper && <span className="block truncate text-xs text-muted">{helper}</span>}
      </span>
    </button>
  )
}
