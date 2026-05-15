import { Link, NavLink } from 'react-router-dom'
import { CheckCircle2, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../ui/ThemeToggle'
import Button from '../ui/Button'
import { motion } from 'framer-motion'

export default function Navbar({ showAuth = false }) {
  const { user, signOut, displayName, isOnline } = useAuth()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 border-b border-white/5 bg-surface/80 backdrop-blur-xl"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to={user ? '/app' : '/'} className="flex items-center gap-2 font-semibold text-primary">
          <CheckCircle2 className="h-6 w-6 text-indigo-400" />
          <span>Focus</span>
          {isOnline && user && (
            <span className="hidden rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400 sm:inline">
              LIVE
            </span>
          )}
        </Link>

        {user && (
          <div className="hidden items-center gap-1 md:flex">
            <NavLink
              to="/app"
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
                  isActive ? 'bg-indigo-500/20 text-indigo-300' : 'text-muted hover:text-primary'
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              Übersicht
            </NavLink>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden max-w-[140px] truncate text-sm text-muted lg:inline">
                {displayName}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Abmelden</span>
              </Button>
            </>
          ) : showAuth ? (
            <Link to="/auth">
              <Button size="sm">Anmelden</Button>
            </Link>
          ) : null}
        </div>
      </nav>
    </motion.header>
  )
}
