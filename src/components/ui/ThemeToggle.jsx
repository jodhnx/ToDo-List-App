import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { motion } from 'framer-motion'

/** Dunkel-/Hellmodus umschalten */
export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] p-2.5 text-muted transition hover:bg-[var(--theme-accentSoft)] hover:text-primary"
      aria-label={isDark ? 'Hellmodus' : 'Dunkelmodus'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </motion.button>
  )
}
