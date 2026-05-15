import { motion } from 'framer-motion'
import { QUICK_FILTERS } from '../../lib/constants'

/** Schnellfilter-Chips */
export default function QuickFilterBar({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_FILTERS.map((f) => (
        <motion.button
          key={f.value}
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange(f.value)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            value === f.value
              ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300'
              : 'border-white/10 bg-white/5 text-muted hover:border-white/20'
          }`}
        >
          {f.label}
        </motion.button>
      ))}
    </div>
  )
}
