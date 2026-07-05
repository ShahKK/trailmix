import type { Hike, Segment, FoodItem } from '../db/db'

/** A food entry within a segment, joined with its food details. */
export interface FoodLine {
  segmentFoodId: number
  foodId: number
  name: string
  category: string
  weightOz: number // per unit
  calories: number // per unit
  cost: number // per unit
  qty: number
}

export interface Totals {
  weightOz: number
  calories: number
  cost: number
}

export type SegStatus = 'ok' | 'undercalorie' | 'heavy' | 'empty'

export interface SegmentSummary {
  days: number
  caloriesNeeded: number
  caloriesPacked: number
  caloriesPerDay: number
  weightOz: number
  weightLb: number
  cost: number
  calPerOz: number
  status: SegStatus
  warnings: string[]
}

export function daysOfFood(miles: number, miPerDay: number): number {
  if (miPerDay <= 0) return 0
  return Math.ceil(miles / miPerDay)
}

export function lineTotals(lines: FoodLine[]): Totals {
  return lines.reduce<Totals>(
    (acc, l) => ({
      weightOz: acc.weightOz + l.weightOz * l.qty,
      calories: acc.calories + l.calories * l.qty,
      cost: acc.cost + l.cost * l.qty,
    }),
    { weightOz: 0, calories: 0, cost: 0 },
  )
}

export function calPerOz(calories: number, weightOz: number): number {
  return weightOz > 0 ? calories / weightOz : 0
}

export function summarizeSegment(
  seg: Pick<Segment, 'miles' | 'miPerDay'>,
  hike: Pick<Hike, 'dailyCalTarget' | 'targetCalOz'>,
  lines: FoodLine[],
): SegmentSummary {
  const days = daysOfFood(seg.miles, seg.miPerDay)
  const caloriesNeeded = days * hike.dailyCalTarget
  const totals = lineTotals(lines)
  const cpo = calPerOz(totals.calories, totals.weightOz)
  const caloriesPerDay = days > 0 ? totals.calories / days : 0

  const warnings: string[] = []
  let status: SegStatus = 'ok'

  if (lines.length === 0) {
    status = 'empty'
  } else {
    if (totals.calories < caloriesNeeded) {
      warnings.push(`Undercalorie by ${Math.round(caloriesNeeded - totals.calories).toLocaleString()} cal`)
      status = 'undercalorie'
    }
    if (cpo < hike.targetCalOz) {
      warnings.push(`Below cal/oz goal (${cpo.toFixed(0)} < ${hike.targetCalOz})`)
      if (status === 'ok') status = 'heavy'
    }
  }

  return {
    days,
    caloriesNeeded,
    caloriesPacked: totals.calories,
    caloriesPerDay,
    weightOz: totals.weightOz,
    weightLb: totals.weightOz / 16,
    cost: totals.cost,
    calPerOz: cpo,
    status,
    warnings,
  }
}

/**
 * Arrival date (calendar date you reach the town at the END of each segment),
 * accumulating days-of-food from the hike start date.
 */
export function segmentArrivalDates(
  startDateISO: string,
  segments: Pick<Segment, 'id' | 'miles' | 'miPerDay'>[],
): Map<number, Date> {
  const map = new Map<number, Date>()
  const start = parseISODate(startDateISO)
  if (!start) return map
  let cumDays = 0
  for (const s of segments) {
    cumDays += daysOfFood(s.miles, s.miPerDay)
    const d = new Date(start)
    d.setDate(d.getDate() + cumDays)
    if (s.id != null) map.set(s.id, d)
  }
  return map
}

/** Recommended "hold until" date for a mail drop: arrival + buffer days. */
export function holdUntilDate(arrival: Date | undefined, bufferDays = 14): Date | undefined {
  if (!arrival) return undefined
  const d = new Date(arrival)
  d.setDate(d.getDate() + bufferDays)
  return d
}

export function parseISODate(iso: string): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/** Group food lines by category, for a shopping / box list. */
export function groupByCategory(lines: FoodLine[]): Map<string, FoodLine[]> {
  const map = new Map<string, FoodLine[]>()
  for (const l of lines) {
    const arr = map.get(l.category) ?? []
    arr.push(l)
    map.set(l.category, arr)
  }
  return map
}

/** Build FoodLines by joining segmentFoods with the food table. */
export function buildFoodLines(
  segmentFoods: { id?: number; foodId: number; qty: number }[],
  foodsById: Map<number, FoodItem>,
): FoodLine[] {
  const lines: FoodLine[] = []
  for (const sf of segmentFoods) {
    const food = foodsById.get(sf.foodId)
    if (!food) continue
    lines.push({
      segmentFoodId: sf.id!,
      foodId: sf.foodId,
      name: food.name,
      category: food.category,
      weightOz: food.weightOz,
      calories: food.calories,
      cost: food.cost,
      qty: sf.qty,
    })
  }
  return lines.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
}
