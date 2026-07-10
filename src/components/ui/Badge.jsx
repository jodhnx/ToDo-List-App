/** Kleines Label für Kategorie, Priorität oder Status */
export default function Badge({ children, className = '', variant = 'default' }) {
  const variants = {
    default: 'border-[var(--theme-border)] bg-[var(--theme-input)] text-primary',
    accent: 'border-[var(--theme-accent)]/30 bg-[var(--theme-accentSoft)] text-[var(--theme-accent)]',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    danger: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  }

  return (
    <span
      className={`status-badge border ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </span>
  )
}
