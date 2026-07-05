import type { ReactNode } from 'react'
import type { SegStatus } from '../lib/calc'

export function Logo({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M12 3l5.5 10h-3.2L12 8.6 9.7 13H6.5L12 3z" />
      <path fill="currentColor" opacity="0.6" d="M3 21l4.2-7.5L11 21H3zm9.5 0l3-5.4L21 21h-8.5z" />
    </svg>
  )
}

const statusStyles: Record<SegStatus, { label: string; cls: string }> = {
  ok: { label: 'On target', cls: 'bg-trail-100 text-trail-800' },
  undercalorie: { label: 'Undercalorie', cls: 'bg-red-100 text-red-700' },
  heavy: { label: 'Heavy (low cal/oz)', cls: 'bg-amber-100 text-amber-800' },
  empty: { label: 'No food yet', cls: 'bg-trail-100 text-trail-500' },
}

export function StatusBadge({ status }: { status: SegStatus }) {
  const s = statusStyles[status]
  return <span className={`chip ${s.cls}`}>{s.label}</span>
}

export function StatBox({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'good' | 'warn' | 'bad'
}) {
  const toneCls =
    tone === 'good'
      ? 'text-trail-700'
      : tone === 'warn'
        ? 'text-amber-700'
        : tone === 'bad'
          ? 'text-red-700'
          : 'text-trail-950'
  return (
    <div className="rounded-lg bg-trail-50 px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-trail-500">{label}</div>
      <div className={`text-lg font-bold leading-tight ${toneCls}`}>{value}</div>
      {hint && <div className="text-xs text-trail-500">{hint}</div>}
    </div>
  )
}

export function EmptyState({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <Logo className="h-10 w-10 text-trail-300" />
      <h3 className="text-lg font-semibold text-trail-800">{title}</h3>
      <div className="max-w-md text-sm text-trail-500">{children}</div>
    </div>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-trail-600">{children}</h2>
      {right}
    </div>
  )
}
