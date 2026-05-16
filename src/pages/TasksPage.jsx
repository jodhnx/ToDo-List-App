import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Loader2, Trash2, CheckCheck, Download, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useTodosContext } from '../context/TodosContext'
import { useToast } from '../context/ToastContext'
import { applyQuickFilter, isDueToday, isOverdue, sortTodos } from '../lib/todoUtils'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import TodoFilters from '../components/todos/TodoFilters'
import TodoItem from '../components/todos/TodoItem'
import TodoForm from '../components/todos/TodoForm'
import QuickFilterBar from '../components/todos/QuickFilterBar'
import Select from '../components/ui/Select'
import { SORT_OPTIONS } from '../lib/constants'
import Fab from '../components/ui/Fab'

/** Vollständige Aufgabenliste — alle Aufgaben direkt sichtbar, + für neue mit allen Features */
export default function TasksPage() {
  const {
    todos,
    loading,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    togglePin,
    duplicateTodo,
    deleteCompleted,
    completeAllOpen,
  } = useTodosContext()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('view') === 'done' ? 'done' : searchParams.get('view') === 'open' ? 'open' : 'all',
  )
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [quickFilter, setQuickFilter] = useState(() => {
    const view = searchParams.get('view')
    if (view === 'today' || view === 'overdue') return view
    return searchParams.get('quick') || 'all'
  })
  const [sortBy, setSortBy] = useState('due_date')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmBusy, setConfirmBusy] = useState(false)

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null)
      setModalOpen(true)
      setSearchParams({}, { replace: true })
    }
    const q = searchParams.get('quick')
    if (q) setQuickFilter(q)
    const view = searchParams.get('view')
    if (view === 'open') {
      setStatusFilter('open')
      setQuickFilter('all')
    }
    if (view === 'done') {
      setStatusFilter('done')
      setQuickFilter('all')
    }
    if (view === 'today' || view === 'overdue') {
      setStatusFilter('all')
      setQuickFilter(view)
    }
  }, [searchParams, setSearchParams])

  const filtered = useMemo(() => {
    let list = todos.filter((t) => {
      const q = search.toLowerCase().trim()
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'open' && !t.completed) ||
        (statusFilter === 'done' && t.completed)
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter
      return matchesSearch && matchesStatus && matchesCategory && matchesPriority
    })
    if (quickFilter === 'today') list = list.filter(isDueToday)
    if (quickFilter === 'overdue') list = list.filter(isOverdue)
    list = quickFilter === 'today' || quickFilter === 'overdue' ? list : applyQuickFilter(list, quickFilter)
    return sortTodos(list, sortBy)
  }, [todos, search, statusFilter, categoryFilter, priorityFilter, quickFilter, sortBy])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
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

  const handleDelete = (id) => {
    setConfirm({
      title: 'Aufgabe löschen?',
      message: 'Diese Aktion kann nicht rückgängig gemacht werden.',
      onConfirm: async () => {
        if (confirmBusy) return
        setConfirmBusy(true)
        try {
          await deleteTodo(id)
          toast('Aufgabe gelöscht', 'info')
          setConfirm(null)
        } finally {
          setConfirmBusy(false)
        }
      },
    })
  }

  const handleBulkDelete = () => {
    const count = todos.filter((t) => t.completed).length
    if (count === 0) return toast('Keine erledigten Aufgaben', 'info')
    setConfirm({
      title: `${count} erledigte Aufgaben löschen?`,
      message: 'Alle abgehakten Aufgaben werden dauerhaft entfernt.',
      onConfirm: async () => {
        if (confirmBusy) return
        setConfirmBusy(true)
        try {
          const n = await deleteCompleted()
          toast(`${n} Aufgaben gelöscht`, 'success')
          setConfirm(null)
        } finally {
          setConfirmBusy(false)
        }
      },
    })
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(todos, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `focus-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('Export heruntergeladen', 'success')
  }

  return (
    <div className="space-y-4 pb-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">Aufgaben</h1>
        <p className="text-sm text-muted">
          {loading ? 'Lädt…' : `${filtered.length} von ${todos.length} Aufgaben`}
        </p>
      </header>

      <QuickFilterBar value={quickFilter} onChange={setQuickFilter} />

      {/* Liste zuerst — direkt alle Aufgaben sichtbar */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 py-16 text-center">
          <p className="text-muted">
            {todos.length === 0 ? 'Noch keine Aufgaben.' : 'Keine Treffer für die Filter.'}
          </p>
          <p className="mt-2 text-xs text-muted">Tippe unten auf + für eine neue Aufgabe.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {filtered.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleComplete}
                onEdit={(t) => {
                  setEditing(t)
                  setModalOpen(true)
                }}
                onDelete={handleDelete}
                onPin={togglePin}
                onDuplicate={async (t) => {
                  await duplicateTodo(t)
                  toast('Aufgabe dupliziert', 'success')
                }}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* Filter & Aktionen — optional aufklappbar */}
      <div className="rounded-2xl border border-white/10 bg-surface/40 p-3">
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex w-full items-center justify-between text-sm text-muted"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filter, Sortierung & Aktionen
          </span>
          <ChevronDown className={`h-4 w-4 transition ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>

        {filtersOpen && (
          <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
            <TodoFilters
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              priorityFilter={priorityFilter}
              onPriorityChange={setPriorityFilter}
            />
            <Select
              label="Sortierung"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={SORT_OPTIONS}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={handleExport} title="JSON exportieren">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="ghost" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4" />
                Erledigte löschen
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  const n = await completeAllOpen()
                  toast(n ? `${n} als erledigt markiert` : 'Keine offenen Aufgaben', 'success')
                }}
              >
                <CheckCheck className="h-4 w-4" />
                Alle erledigen
              </Button>
            </div>
          </div>
        )}
      </div>

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
        onCancel={() => !confirmBusy && setConfirm(null)}
        loading={confirmBusy}
      />

      <Fab onClick={openCreate} label="Neue Aufgabe" showOnDesktop />
    </div>
  )
}
