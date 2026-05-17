/** Select mit Glass-Styling */
export default function Select({ label, options, className = '', id, ...props }) {
  const selectId = id || props.name
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-4 py-2.5 text-sm text-primary outline-none transition focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accentSoft)] ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--theme-surface)] text-primary">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
