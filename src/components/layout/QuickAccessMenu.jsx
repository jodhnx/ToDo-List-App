import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, ChevronDown, ListPlus, Settings, Sparkles, Users, User } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
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
      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        whileTap={{ scale: 0.98 }}
        className="flex min-h-12 items-center gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-2.5 py-2 text-sm text-primary shadow-sm transition hover:bg-[var(--theme-accentSoft)] sm:px-3"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={displayName} size="sm" className="ring-[var(--theme-accentSoft)]" />
        <span className="hidden max-w-[110px] truncate font-medium sm:block">{displayName}</span>
        <ChevronDown className={`h-4 w-4 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              aria-hidden="true"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
            />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+4.75rem)] z-50 max-h-[calc(100dvh-6rem)] w-[min(92vw,24rem)] -translate-x-1/2 overflow-y-auto rounded-[1.75rem] border border-[var(--theme-border)] bg-[var(--theme-card)] p-2 shadow-2xl backdrop-blur-xl will-change-transform sm:top-[calc(env(safe-area-inset-top)+5rem)]"
            >
            <div className="relative overflow-hidden rounded-[1.4rem] border border-[var(--theme-border)] bg-[var(--theme-accentSoft)] p-4">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--theme-accent)] opacity-20 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <Avatar name={displayName} size="xl" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--theme-accent)]" />
                    Profil
                  </p>
                  <p className="mt-1 truncate text-xl font-bold text-primary">{displayName}</p>
                  <p className="text-sm text-muted">Schnell zu deinen wichtigsten Bereichen</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2 py-3 sm:grid-cols-2">
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
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-primary transition hover:bg-[var(--theme-accentSoft)]"
                    >
                      <span className="truncate">{group.name}</span>
                      <span className="ml-2 rounded-full bg-[var(--theme-input)] px-2 py-0.5 text-xs text-muted">
                        {group.member_count || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuButton({ icon: Icon, label, helper, onClick }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition duration-150 hover:-translate-y-0.5 hover:bg-[var(--theme-accentSoft)] hover:shadow-sm"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--theme-accentSoft)] text-[var(--theme-accent)] transition group-hover:scale-105">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-primary">{label}</span>
        {helper && <span className="block truncate text-xs text-muted">{helper}</span>}
      </span>
    </button>
  )
}
