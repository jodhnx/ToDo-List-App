import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, AlertCircle, CalendarDays } from 'lucide-react'
import { useTodosContext } from '../context/TodosContext'
import { getCategoryStats, getPriorityStats, isDueToday, isOverdue } from '../lib/todoUtils'
import DashboardStats from '../components/dashboard/DashboardStats'
import CategoryChart from '../components/dashboard/CategoryChart'
import PriorityOverview from '../components/dashboard/PriorityOverview'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function DashboardPage() {
  const { todos, isOnline, error } = useTodosContext()
  const categoryStats = getCategoryStats(todos)
  const priorityStats = getPriorityStats(todos)
  const overdue = todos.filter(isOverdue)
  const today = todos.filter(isDueToday)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <p className="text-sm text-muted">Überblick über deine Produktivität</p>
        </div>
        <Link to="/app/tasks?new=1">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Neue Aufgabe
          </Button>
        </Link>
      </div>

      {error && (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
          {error}
        </p>
      )}

      {!isOnline && (
        <Card className="border-amber-500/20 !bg-amber-500/5">
          <p className="text-sm text-amber-200">
            <strong>Online-Modus:</strong> Trage Supabase-Credentials in <code className="rounded bg-black/20 px-1">.env</code> ein
            und deploye die App — dann können sich mehrere Benutzer registrieren und von überall zugreifen.
          </p>
        </Card>
      )}

      <DashboardStats todos={todos} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryChart stats={categoryStats} />
        <PriorityOverview stats={priorityStats} />
      </div>

      {(overdue.length > 0 || today.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {overdue.length > 0 && (
            <Card>
              <div className="mb-3 flex items-center gap-2 text-rose-400">
                <AlertCircle className="h-4 w-4" />
                <h3 className="font-medium">Überfällig ({overdue.length})</h3>
              </div>
              <ul className="space-y-2">
                {overdue.slice(0, 5).map((t) => (
                  <li key={t.id} className="truncate text-sm text-primary">
                    {t.title}
                  </li>
                ))}
              </ul>
              {overdue.length > 5 && (
                <Link to="/app/tasks?quick=overdue" className="mt-2 text-xs text-indigo-400 hover:underline">
                  Alle anzeigen →
                </Link>
              )}
            </Card>
          )}
          {today.length > 0 && (
            <Card>
              <div className="mb-3 flex items-center gap-2 text-indigo-400">
                <CalendarDays className="h-4 w-4" />
                <h3 className="font-medium">Heute fällig ({today.length})</h3>
              </div>
              <ul className="space-y-2">
                {today.slice(0, 5).map((t) => (
                  <li key={t.id} className="truncate text-sm text-primary">
                    {t.title}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
