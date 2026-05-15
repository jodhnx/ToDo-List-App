/** Einheitlicher Abschnitts-Header für Einstellungen & Formulare */
export default function Section({ icon: Icon, title, description, children, className = '' }) {
  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <h2 className="font-semibold text-primary">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}
