import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2, Plus, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTodosContext } from '../context/TodosContext'
import { useToast } from '../context/ToastContext'
import {
  applyQuickFilter,
  groupTodosForOverview,
  isDueToday,
  isOverdue,
  sortTodos,
} from '../lib/todoUtils'
import AIAssistant from '../components/ai/AIAssistant'
import StatsBar from '../components/overview/StatsBar'
import TaskSection from '../components/overview/TaskSection'
import QuickFilterBar from '../components/todos/QuickFilterBar'
import TodoForm from '../components/todos/TodoForm'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Input from '../components/ui/Input'
import { ListTodo } from 'lucide-react'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

export default function HomePage() {
  const { displayName } = useAuth()
  const {
    todos,
    loading,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    togglePin,
    duplicateTodo,
  } = useTodosContext()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [quickFilter, setQuickFilter] = useState(searchParams.get('quick') || 'all')
  const [showDone, setShowDone] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null)
      setModalOpen(true)
      setSearchParams({}, { replace: true })
    }
    const q = searchParams.get('quick')
    if (q) setQuickFilter(q)
  }, [searchParams, setSearchParams])

  const stats = useMemo(
    () => ({
      open: todos.filter((t) => !t.completed).length,
      done: todos.filter((t) => t.completed).length,
      today: todos.filter(isDueToday).length,
      overdue: todos.filter(isOverdue).length,
    }),
    [todos],
  )

  const filtered = useMemo(() => {
    let list = todos.filter((t) => {
      const q = search.toLowerCase().trim()
      if (!q) return true
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      )
    })
    if (!showDone) list = list.filter((t) => !t.completed)
    list = applyQuickFilter(list, quickFilter)
    return sortTodos(list, 'due_date')
  }, [todos, search, quickFilter, showDone])

  const groups = useMemo(() => groupTodosForOverview(filtered), [filtered])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const itemHandlers = {
    onToggle: toggleComplete,
    onEdit: (t) => {
      setEditing(t)
      setModalOpen(true)
    },
    onDelete: (id) => {
      setConfirm({
        title: 'Aufgabe löschen?',
        message: 'Diese Aktion kann nicht rückgängig gemacht werden.',
        onConfirm: async () => {
          await deleteTodo(id)
          toast('Aufgabe gelöscht', 'info')
          setConfirm(null)
        },
      })
    },
    onPin: togglePin,
    onDuplicate: async (t) => {
      await duplicateTodo(t)
      toast('Aufgabe dupliziert', 'success')
    },
  }

  const handleSubmit = async (data) => {
    if (submitting) return
    setSubmitting(true)
    try {
      if (editing) {
        await updateTodo(editing.id, data)
        toast('Aufgabe aktualisiert', 'success')
      } else {
        await createTodo(data)
        toast('Aufgabe erstellt', 'success')
      }
      setModalOpen(false)
      setEditing(null)
    } catch (err) {
      toast(err.message || 'Speichern fehlgeschlagen', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const hasTasks =
    groups.pinned.length +
      groups.overdue.length +
      groups.today.length +
      groups.other.length +
      (showDone ? groups.done.length : 0) >
    0

  return (
    <div className="space-y-5 pb-4">
      <header>
        <p className="text-sm text-muted">{greeting()},</p>
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{displayName}</h1>
        <p className="mt-1 text-sm text-muted">Deine Aufgaben im Überblick</p>
      </header>

      <StatsBar stats={stats} />

      <AIAssistant todos={todos} />

      <div className="space-y-3 rounded-2xl border border-white/10 bg-surface/50 p-3 backdrop-blur-sm sm:p-4">
        <QuickFilterBar value={quickFilter} onChange={setQuickFilter} />

        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-sm text-muted hover:text-primary"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Suche & Filter
          </span>
          <ChevronDown className={`h-4 w-4 transition ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>

        {filtersOpen && (
          <div className="space-y-3 border-t border-white/10 pt-3">
            <Input
              label="Suchen"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Titel oder Beschreibung…"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={showDone}
                onChange={(e) => setShowDone(e.target.checked)}
                className="rounded text-indigo-500"
              />
              Erledigte anzeigen
            </label>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : !hasTasks ? (
        <div className="rounded-2xl border border-dashed border-white/15 py-16 text-center">
          <p className="text-muted">
            {todos.length === 0 ? 'Noch keine Aufgaben — leg los!' : 'Keine Treffer für die Filter.'}
          </p>
          <Link
            to="/app/tasks?new=1"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Erste Aufgabe
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <TaskSection
            title="Angepinnt"
            count={groups.pinned.length}
            todos={groups.pinned}
            accent="text-amber-300"
            {...itemHandlers}
          />
          <TaskSection
            title="Überfällig"
            count={groups.overdue.length}
            todos={groups.overdue}
            accent="text-rose-400"
            {...itemHandlers}
          />
          <TaskSection
            title="Heute fällig"
            count={groups.today.length}
            todos={groups.today}
            accent="text-indigo-300"
            {...itemHandlers}
          />
          <TaskSection
            title="Weitere Aufgaben"
            count={groups.other.length}
            todos={groups.other}
            defaultOpen={groups.pinned.length + groups.overdue.length + groups.today.length === 0}
            {...itemHandlers}
          />
          {showDone && (
            <TaskSection
              title="Erledigt"
              count={groups.done.length}
              todos={groups.done}
              accent="text-emerald-400"
              defaultOpen={false}
              {...itemHandlers}
            />
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          if (!submitting) {
            setModalOpen(false)
            setEditing(null)
          }
        }}
        title={editing ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}
      >
        <TodoForm
          initial={editing}
          onSubmit={handleSubmit}
          submitting={submitting}
          onCancel={() => {
            if (!submitting) {
              setModalOpen(false)
              setEditing(null)
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />

      <Link
        to="/app/tasks"
        className="flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-3 text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/20"
      >
        <ListTodo className="h-4 w-4" />
        Alle Aufgaben anzeigen
      </Link>
    </div>
  )
}
