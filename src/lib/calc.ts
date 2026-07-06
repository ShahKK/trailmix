import type { Hike, Segment, FoodItem, WaterCarry } from '../db/db'
import { WATER_OZ_PER_L } from '../db/db'

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
  eaten?: boolean
  proteinG?: number
  fatG?: number
  carbG?: number
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

export interface MacroTotals {
  proteinG: number
  fatG: number
  carbG: number
  itemsWithMacros: number
  itemsTotal: number
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

export function macroTotals(lines: FoodLine[]): MacroTotals {
  let proteinG = 0
  let fatG = 0
  let carbG = 0
  let itemsWithMacros = 0
  for (const l of lines) {
    const has = l.proteinG != null || l.fatG != null || l.carbG != null
    if (has) itemsWithMacros++
    proteinG += (l.proteinG ?? 0) * l.qty
    fatG += (l.fatG ?? 0) * l.qty
    carbG += (l.carbG ?? 0) * l.qty
  }
  return { proteinG, fatG, carbG, itemsWithMacros, itemsTotal: lines.length }
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

// ---------------------------------------------------------------------------
// Water
// ---------------------------------------------------------------------------

export function litersToOz(liters: number): number {
  return liters * WATER_OZ_PER_L
}

/** The heaviest single water carry drives worst-case pack weight. */
export function worstCarry(carries: Pick<WaterCarry, 'liters'>[]): number {
  return carries.reduce((max, c) => Math.max(max, c.liters), 0)
}

export function estimateCarryLiters(hours: number, rateLPerHr: number, cookLiters = 0): number {
  return Math.max(0, hours * rateLPerHr + cookLiters)
}

// ---------------------------------------------------------------------------
// Total pack weight = base + food + worst water carry
// ---------------------------------------------------------------------------

export interface PackWeight {
  baseOz: number
  foodOz: number
  waterOz: number
  totalOz: number
}

export function packWeight(baseOz: number, foodOz: number, worstCarryLiters: number): PackWeight {
  const waterOz = litersToOz(worstCarryLiters)
  return { baseOz, foodOz, waterOz, totalOz: baseOz + foodOz + waterOz }
}

// ---------------------------------------------------------------------------
// Swap suggestions: replace an inefficient item with a lighter one at equal
// (or greater) calories, from the same category.
// ---------------------------------------------------------------------------

export interface SwapSuggestion {
  removeSegmentFoodId: number
  removeName: string
  addFoodId: number
  addName: string
  addQty: number
  deltaOz: number // negative = lighter
  deltaCal: number
  fromCalPerOz: number
  toCalPerOz: number
}

export function suggestSwaps(lines: FoodLine[], library: FoodItem[], limit = 4): SwapSuggestion[] {
  const suggestions: SwapSuggestion[] = []
  for (const line of lines) {
    const lineCpo = calPerOz(line.calories, line.weightOz)
    // best same-category candidate by cal/oz
    let best: FoodItem | null = null
    let bestCpo = lineCpo
    for (const f of library) {
      if (f.id === line.foodId || f.category !== line.category) continue
      const cpo = calPerOz(f.calories, f.weightOz)
      if (cpo > bestCpo * 1.15) {
        // require a meaningful gain
        if (!best || cpo > calPerOz(best.calories, best.weightOz)) {
          best = f
          bestCpo = cpo
        }
      }
    }
    if (!best || best.id == null) continue
    const currentCal = line.calories * line.qty
    const addQty = Math.max(1, Math.ceil(currentCal / best.calories))
    const deltaOz = best.weightOz * addQty - line.weightOz * line.qty
    const deltaCal = best.calories * addQty - currentCal
    if (deltaOz < -0.3) {
      suggestions.push({
        removeSegmentFoodId: line.segmentFoodId,
        removeName: line.name,
        addFoodId: best.id,
        addName: best.name,
        addQty,
        deltaOz,
        deltaCal,
        fromCalPerOz: lineCpo,
        toCalPerOz: calPerOz(best.calories, best.weightOz),
      })
    }
  }
  return suggestions.sort((a, b) => a.deltaOz - b.deltaOz).slice(0, limit)
}

// ---------------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------------

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

export function groupByCategory(lines: FoodLine[]): Map<string, FoodLine[]> {
  const map = new Map<string, FoodLine[]>()
  for (const l of lines) {
    const arr = map.get(l.category) ?? []
    arr.push(l)
    map.set(l.category, arr)
  }
  return map
}

export function buildFoodLines(
  segmentFoods: { id?: number; foodId: number; qty: number; eaten?: boolean }[],
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
      eaten: sf.eaten,
      proteinG: food.proteinG,
      fatG: food.fatG,
      carbG: food.carbG,
    })
  }
  return lines.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
}
