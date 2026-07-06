import { motion } from 'framer-motion'

export interface BarPart {
  label: string
  value: number
  className: string // tailwind bg color
}

/** Animated stacked horizontal bar (e.g. base · food · water weight). */
export function StackedBar({ parts, unit = 'oz' }: { parts: BarPart[]; unit?: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-trail-100 dark:bg-trail-800">
        {parts.map((p, i) => (
          <motion.div
            key={p.label}
            className={p.className}
            initial={{ width: 0 }}
            animate={{ width: `${(p.value / total) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.05 }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-trail-500">
        {parts.map((p) => (
          <span key={p.label} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${p.className}`} />
            {p.label} {p.value.toFixed(1)} {unit}
          </span>
        ))}
      </div>
    </div>
  )
}

/** A linear meter that fills toward a goal; color reflects pass/fail. */
export function Meter({
  value,
  goal,
  label,
  unit = '',
}: {
  value: number
  goal: number
  label?: string
  unit?: string
}) {
  const max = Math.max(goal * 1.6, value * 1.1, 1)
  const pct = Math.min(100, (value / max) * 100)
  const goalPct = Math.min(100, (goal / max) * 100)
  const good = value >= goal
  const fill = good ? 'bg-trail-500' : value >= goal * 0.85 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-xs text-trail-500">
          <span>{label}</span>
          <span className={good ? 'text-trail-600' : 'text-amber-600'}>
            {value.toFixed(0)}
            {unit} / {goal.toFixed(0)}
            {unit}
          </span>
        </div>
      )}
      <div className="relative h-2.5 w-full overflow-visible rounded-full bg-trail-100 dark:bg-trail-800">
        <motion.div
          className={`h-full rounded-full ${fill}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <div
          className="absolute top-[-3px] h-[calc(100%+6px)] w-0.5 bg-trail-700 dark:bg-trail-200"
          style={{ left: `${goalPct}%` }}
          title={`goal ${goal}${unit}`}
        />
      </div>
    </div>
  )
}
