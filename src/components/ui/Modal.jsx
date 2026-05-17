import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/** Fixes Vollbild-Dialog — kein Zoomen, kein Verschieben */
export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return

    const scrollY = window.scrollY
    const prevOverflow = document.body.style.overflow
    const prevPosition = document.body.style.position
    const prevWidth = document.body.style.width
    const prevTop = document.body.style.top
    const prevTouch = document.body.style.touchAction

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.top = `-${scrollY}px`
    document.body.style.touchAction = 'none'

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.position = prevPosition
      document.body.style.width = prevWidth
      document.body.style.top = prevTop
      document.body.style.touchAction = prevTouch
      window.scrollTo(0, scrollY)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[var(--theme-surface)] touch-none"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal-panel flex h-full min-h-0 w-full flex-col bg-[var(--theme-card)] text-primary sm:mx-auto sm:my-auto sm:h-auto sm:max-h-[90dvh] sm:max-w-lg sm:rounded-2xl sm:border sm:border-[var(--theme-border)] sm:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--theme-border)] px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <h2 id="modal-title" className="text-lg font-semibold text-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-[var(--theme-accentSoft)] hover:text-primary"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] touch-pan-y">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
