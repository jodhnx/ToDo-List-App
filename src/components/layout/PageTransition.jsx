import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

/** Sanfter Seitenwechsel ohne weißen Flash */
export default function PageTransition({ children }) {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="min-w-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
