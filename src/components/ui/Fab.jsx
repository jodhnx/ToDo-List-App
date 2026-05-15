import { Plus } from 'lucide-react'

/** Floating Action Button — schnell neue Aufgabe (Mobile) */
export default function Fab({ onClick, label = 'Neue Aufgabe' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 transition hover:scale-105 hover:bg-indigo-400 active:scale-95 lg:hidden"
      aria-label={label}
    >
      <Plus className="h-6 w-6" />
    </button>
  )
}
