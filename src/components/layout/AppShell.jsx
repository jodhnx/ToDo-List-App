import { NavLink, Outlet, Link } from 'react-router-dom'
import { LayoutDashboard, ListTodo, Settings, Cloud, CloudOff, Users, User, ShoppingBasket } from 'lucide-react'
import Navbar from './Navbar'
import { useAuth } from '../../context/AuthContext'
import { TodosProvider, useTodosContext } from '../../context/TodosContext'
import { GroupsProvider, useGroups } from '../../context/GroupsContext'
import { useNotifications } from '../../hooks/useNotifications'
import UsernameGate from './UsernameGate'
import { getSettings } from '../../lib/settings'
import { useEffect, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'

const navItems = [
  { to: '/app', end: true, icon: LayoutDashboard, label: 'Übersicht' },
  { to: '/app/tasks', icon: ListTodo, label: 'Aufgaben' },
  { to: '/app/shopping', icon: ShoppingBasket, label: 'Einkauf' },
  { to: '/app/family', icon: Users, label: 'Familie' },
  { to: '/app/settings', icon: Settings, label: 'Einstellungen', mobileLabel: 'Einst.' },
]

function FamilyNavBadge() {
  const { inviteCount, unreadCount } = useGroups()
  const n = inviteCount + unreadCount
  if (!n) return null
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] text-white">
      {n > 9 ? '9+' : n}
    </span>
  )
}

function AppShellInner() {
  const { displayName, isOnline } = useAuth()
  const { todos, syncing } = useTodosContext()
  const { theme } = useTheme()
  const [simpleMode, setSimpleMode] = useState(() => getSettings().simpleMode)
  useNotifications(todos)

  useEffect(() => {
    const onSettings = (event) => setSimpleMode(Boolean(event.detail?.simpleMode))
    window.addEventListener('focus-settings-change', onSettings)
    return () => window.removeEventListener('focus-settings-change', onSettings)
  }, [])

  const largeMode = simpleMode || theme.senior

  return (
    <div className={`min-h-screen gradient-mesh transition-colors duration-300 ${largeMode ? 'simple-mode' : ''}`}>
      <Navbar />

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar Desktop */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="glass-card sticky top-24 p-4">
            <p className="mb-1 text-xs text-muted">Angemeldet als</p>
            <p className="mb-4 truncate font-medium text-primary">{displayName}</p>

            <nav className="space-y-1">
              {navItems.map(({ to, end, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'nav-active'
                        : 'text-muted hover:bg-[var(--theme-accentSoft)] hover:text-primary'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <Link
              to="/app/profile"
              className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-[var(--theme-accentSoft)] hover:text-primary"
            >
              <User className="h-4 w-4" />
              Profil
            </Link>

            <div
              className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                isOnline ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
              }`}
            >
              {isOnline ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
              {isOnline ? (syncing ? 'Synchronisiert…' : 'Online · Cloud') : 'Nur lokal'}
            </div>
          </div>
        </aside>

        <main className={`min-w-0 flex-1 pb-28 lg:pb-0 ${largeMode ? 'space-y-6' : ''}`}>
          <UsernameGate>
            <Outlet />
          </UsernameGate>
        </main>
      </div>

      {/* Bottom Navigation Mobile */}
      <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
          {navItems.map(({ to, end, icon: Icon, label, mobileLabel }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `min-w-0 rounded-xl px-1.5 py-2 text-[10px] font-medium transition ${
                  isActive ? 'text-[var(--theme-accent)]' : 'text-muted'
                }`
              }
            >
              <span className="relative mx-auto flex w-fit justify-center">
                <Icon className="h-5 w-5 shrink-0" />
                {to === '/app/family' && <FamilyNavBadge />}
              </span>
              <span className="mt-0.5 block truncate text-center leading-tight">{mobileLabel || label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default function AppShell() {
  return (
    <TodosProvider>
      <GroupsProvider>
        <AppShellInner />
      </GroupsProvider>
    </TodosProvider>
  )
}
