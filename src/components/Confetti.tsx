import { motion } from 'framer-motion'
import { prefersReducedMotion } from '../lib/theme'

const COLORS = ['#22c55e', '#16a34a', '#4ade80', '#facc15', '#f0fdf4']

/** A short celebratory burst. Bump `fireKey` to trigger a new burst. */
export default function Confetti({ fireKey }: { fireKey: number }) {
  if (fireKey === 0 || prefersReducedMotion()) return null
  const pieces = Array.from({ length: 18 })
  return (
    <div key={fireKey} className="pointer-events-none fixed inset-x-0 top-24 z-[60] flex justify-center">
      {pieces.map((_, i) => {
        const x = (Math.random() - 0.5) * 320
        const rot = (Math.random() - 0.5) * 540
        const delay = Math.random() * 0.1
        return (
          <motion.span
            key={i}
            className="absolute block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: COLORS[i % COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x, y: 220 + Math.random() * 120, opacity: 0, rotate: rot }}
            transition={{ duration: 1.1 + Math.random() * 0.4, delay, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}
