/** Initialen-Avatar */
export default function Avatar({ name, username, size = 'md', className = '' }) {
  const label = (name || username || '?').trim()
  const initials = label
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-16 w-16 text-xl',
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--theme-accent)] to-violet-500 font-bold tracking-wide text-white shadow-lg shadow-black/10 ring-2 ring-white/10 ${sizes[size]} ${className}`}
      title={username ? `@${username}` : label}
    >
      {initials}
    </div>
  )
}
