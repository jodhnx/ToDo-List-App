import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ListTodo, Settings, Cloud, CloudOff } from 'lucide-react'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import { useAuth } from '../../context/AuthContext'
import { TodosProvider, useTodosContext } from '../../context/TodosContext'

const navItems = [
  { to: '/app', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/tasks', icon: ListTodo, label: 'Aufgaben' },
  { to: '/app/settings', icon: Settings, label: 'Einstellungen' },
]

function AppShellInner() {
  const { displayName, isOnline } = useAuth()
  const { syncing } = useTodosContext()

  return (
    <div className="min-h-screen gradient-mesh">
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
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'text-muted hover:bg-white/5 hover:text-primary'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div
              className={`mt-6 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                isOnline ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
              }`}
            >
              {isOnline ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
              {isOnline ? (syncing ? 'Synchronisiert…' : 'Online · Cloud') : 'Nur lokal'}
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-surface/90 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-xs transition ${
                  isActive ? 'text-indigo-400' : 'text-muted'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
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
      <AppShellInner />
    </TodosProvider>
  )
}
