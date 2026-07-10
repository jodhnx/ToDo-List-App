/** Einheitlicher Abschnitts-Header für Einstellungen & Formulare */
export default function Section({ icon: Icon, title, description, children, className = '' }) {
  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--theme-accentSoft)] text-[var(--theme-accent)] shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-primary">{title}</h2>
          {description && <p className="mt-0.5 text-sm leading-relaxed text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}
