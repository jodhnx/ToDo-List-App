/** Horizontale Tabs für Einstellungen */
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
            active === tab.id
              ? 'bg-indigo-500/25 text-indigo-300 shadow-sm'
              : 'text-muted hover:text-primary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
