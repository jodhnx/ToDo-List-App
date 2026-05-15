import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Loader2, Trash2, CheckCheck, Download } from 'lucide-react'
import { useTodosContext } from '../context/TodosContext'
import { useToast } from '../context/ToastContext'
import { applyQuickFilter, sortTodos } from '../lib/todoUtils'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import TodoFilters from '../components/todos/TodoFilters'
import TodoItem from '../components/todos/TodoItem'
import TodoForm from '../components/todos/TodoForm'
import QuickFilterBar from '../components/todos/QuickFilterBar'
import Select from '../components/ui/Select'
import { SORT_OPTIONS } from '../lib/constants'

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
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [quickFilter, setQuickFilter] = useState(searchParams.get('quick') || 'all')
  const [sortBy, setSortBy] = useState('created_at')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null)
      setModalOpen(true)
      setSearchParams({}, { replace: true })
    }
    const q = searchParams.get('quick')
    if (q) setQuickFilter(q)
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
    list = applyQuickFilter(list, quickFilter)
    return sortTodos(list, sortBy)
  }, [todos, search, statusFilter, categoryFilter, priorityFilter, quickFilter, sortBy])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleSubmit = async (data) => {
    if (editing) {
      await updateTodo(editing.id, data)
      toast('Aufgabe aktualisiert', 'success')
    } else {
      await createTodo(data)
      toast('Aufgabe erstellt', 'success')
    }
    setModalOpen(false)
    setEditing(null)
  }

  const handleDelete = (id) => {
    setConfirm({
      title: 'Aufgabe löschen?',
      message: 'Diese Aktion kann nicht rückgängig gemacht werden.',
      onConfirm: async () => {
        await deleteTodo(id)
        toast('Aufgabe gelöscht', 'info')
        setConfirm(null)
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
        const n = await deleteCompleted()
        toast(`${n} Aufgaben gelöscht`, 'success')
        setConfirm(null)
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Aufgaben</h1>
          <p className="text-sm text-muted">{filtered.length} von {todos.length} angezeigt</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={handleExport} title="JSON exportieren">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Erledigte löschen</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={async () => {
            const n = await completeAllOpen()
            toast(n ? `${n} als erledigt markiert` : 'Keine offenen Aufgaben', 'success')
          }}>
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Alle erledigen</span>
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Neu
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-4 space-y-4">
          <QuickFilterBar value={quickFilter} onChange={setQuickFilter} />
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
            className="max-w-xs"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-muted">
            {todos.length === 0 ? 'Noch keine Aufgaben.' : 'Keine Treffer für die Filter.'}
          </p>
        ) : (
          <ul className="space-y-3">
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
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}
      >
        <TodoForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditing(null)
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
    </div>
  )
}
