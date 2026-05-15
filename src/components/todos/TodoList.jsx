import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Loader2 } from 'lucide-react'
import { useTodos } from '../../hooks/useTodos'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Card from '../ui/Card'
import TodoFilters from './TodoFilters'
import TodoItem from './TodoItem'
import TodoForm from './TodoForm'
import DashboardStats from '../dashboard/DashboardStats'

/** Hauptbereich: Dashboard, Filter und Todo-Liste */
export default function TodoList() {
  const { todos, loading, error, createTodo, updateTodo, deleteTodo, toggleComplete } = useTodos()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => {
    return todos.filter((t) => {
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
  }, [todos, search, statusFilter, categoryFilter, priorityFilter])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (todo) => {
    setEditing(todo)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const handleSubmit = async (data) => {
    if (editing) {
      await updateTodo(editing.id, data)
    } else {
      await createTodo(data)
    }
    closeModal()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-400">Verwalte deine Aufgaben übersichtlich</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Neue Aufgabe
        </Button>
      </div>

      {error && (
        <p className="rounded-xl bg-amber-500/10 px-4 py-2 text-sm text-amber-300">{error}</p>
      )}

      <DashboardStats todos={todos} />

      <Card delay={0.2}>
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Aufgaben</h2>
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

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center text-zinc-500"
          >
            {todos.length === 0
              ? 'Noch keine Aufgaben. Erstelle deine erste!'
              : 'Keine Aufgaben passen zu den Filtern.'}
          </motion.p>
        ) : (
          <ul className="mt-6 space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleComplete}
                  onEdit={openEdit}
                  onDelete={deleteTodo}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}
      >
        <TodoForm initial={editing} onSubmit={handleSubmit} onCancel={closeModal} />
      </Modal>
    </div>
  )
}
