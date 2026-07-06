export function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

export function fmtOz(n: number): string {
  return `${n.toFixed(1)} oz`
}

export function fmtLb(oz: number): string {
  return `${(oz / 16).toFixed(2)} lb`
}

export function fmtWeight(oz: number): string {
  return oz >= 16 ? `${fmtLb(oz)} (${fmtOz(oz)})` : fmtOz(oz)
}

export function fmtCal(n: number): string {
  return `${Math.round(n).toLocaleString()} cal`
}

export function fmtCalPerOz(n: number): string {
  return `${n.toFixed(0)} cal/oz`
}

export function fmtDate(d: Date | undefined): string {
  if (!d) return 'TBD'
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function todayISO(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
