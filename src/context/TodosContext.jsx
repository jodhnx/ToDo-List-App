import { createContext, useContext } from 'react'
import { useTodos } from '../hooks/useTodos'

const TodosContext = createContext(null)

/** Ein gemeinsamer Todo-State für Dashboard, Aufgaben und Sidebar */
export function TodosProvider({ children }) {
  const value = useTodos()
  return <TodosContext.Provider value={value}>{children}</TodosContext.Provider>
}

export function useTodosContext() {
  const ctx = useContext(TodosContext)
  if (!ctx) throw new Error('useTodosContext nur innerhalb von TodosProvider')
  return ctx
}
