import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { prefersReducedMotion } from '../lib/theme'

export default function AnimatedNumber({
  value,
  format,
  className,
  duration = 0.5,
}: {
  value: number
  format?: (n: number) => string
  className?: string
  duration?: number
}) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value)
      prev.current = value
      return
    }
    const controls = animate(prev.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, duration])

  return <span className={className}>{format ? format(display) : Math.round(display).toLocaleString()}</span>
}
