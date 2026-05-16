import { Plus } from 'lucide-react'

/** Floating Action Button — großes + mit Abstand zur mobilen Menüleiste */
export default function Fab({ onClick, label = 'Neue Aufgabe', showOnDesktop = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 transition hover:scale-105 hover:bg-indigo-400 active:scale-95 lg:bottom-8 ${
        showOnDesktop ? '' : 'lg:hidden'
      }`}
      aria-label={label}
    >
      <Plus className="h-7 w-7" />
    </button>
  )
}
