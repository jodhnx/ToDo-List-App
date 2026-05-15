import { motion } from 'framer-motion'

/** Glassmorphism-Karte mit optionaler Animation */
export default function Card({ children, className = '', delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glass-card p-5 sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
