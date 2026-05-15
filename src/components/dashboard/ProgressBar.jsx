import { motion } from 'framer-motion'

/** Animierter Fortschrittsbalken */
export default function ProgressBar({ value }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}
