/** Skeleton-Loader für sofort sichtbare Ladezustände */
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[var(--theme-input)] ${className}`}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="glass-card space-y-3 p-5">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function SkeletonGroupList({ count = 3 }) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="glass-card flex items-center gap-4 p-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function SkeletonTaskList({ count = 5 }) {
  return (
    <ul className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="glass-card flex gap-3 p-4">
          <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function PageLoader() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <SkeletonTaskList count={4} />
    </div>
  )
}
