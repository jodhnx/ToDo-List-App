/** Textfeld mit einheitlichem Glass-Styling */
export default function Input({ label, error, className = '', id, ...props }) {
  const inputId = id || props.name
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-field ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
}
