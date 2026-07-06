import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { applyTheme, getStoredTheme, type Theme } from '../lib/theme'
import { haptic } from '../lib/haptics'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme())

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
    haptic(8)
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-trail-100 hover:bg-trail-800/40"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -45, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 45, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.2 }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
