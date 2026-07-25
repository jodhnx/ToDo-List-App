/** Kompakte horizontale Tabs */
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-0.5 overflow-x-auto rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] p-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`min-h-8 shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
            active === tab.id
              ? 'bg-[var(--theme-card)] text-[var(--theme-accent)] shadow-sm'
              : 'text-muted hover:text-primary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
