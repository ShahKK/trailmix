import Dexie, { type Table } from 'dexie'

export interface Hike {
  id?: number
  name: string
  trail: string
  startDate: string // ISO yyyy-mm-dd
  dailyCalTarget: number
  targetCalOz: number
  createdAt: number
  // v2
  baseWeightOz?: number // pack base weight (gear, no consumables)
  proteinTargetG?: number // optional daily protein goal
  waterRateLPerHr?: number // drinking rate for water estimates
}

export interface Segment {
  id?: number
  hikeId: number
  order: number
  name: string
  miles: number
  miPerDay: number
  resupplyType: 'town' | 'maildrop'
  maildropAddress?: string
  notes?: string
}

export type FoodCategory =
  | 'Breakfast'
  | 'Dinner'
  | 'Bars'
  | 'Snacks'
  | 'Candy'
  | 'Nuts & Fats'
  | 'Meat'
  | 'Wraps'
  | 'Drinks'
  | 'Other'

export interface FoodItem {
  id?: number
  name: string
  category: FoodCategory
  weightOz: number
  calories: number
  cost: number
  source: 'seed' | 'custom'
  // v2, optional macros (grams per packed unit)
  proteinG?: number
  fatG?: number
  carbG?: number
}

export interface SegmentFood {
  id?: number
  segmentId: number
  foodId: number
  qty: number
  eaten?: boolean // v2, on-trail check-off
}

// v2, a water carry (a dry stretch you have to haul water across)
export interface WaterCarry {
  id?: number
  segmentId: number
  order: number
  label: string
  liters: number
  notes?: string
}

export class TrailmixDB extends Dexie {
  hikes!: Table<Hike, number>
  segments!: Table<Segment, number>
  foods!: Table<FoodItem, number>
  segmentFoods!: Table<SegmentFood, number>
  waterCarries!: Table<WaterCarry, number>

  constructor() {
    super('trailmix')
    this.version(1).stores({
      hikes: '++id, name, createdAt',
      segments: '++id, hikeId, order',
      foods: '++id, name, category, source',
      segmentFoods: '++id, segmentId, foodId, [segmentId+foodId]',
    })
    // v2 adds the waterCarries table. New optional columns on existing
    // tables need no schema change (Dexie stores them transparently).
    this.version(2).stores({
      hikes: '++id, name, createdAt',
      segments: '++id, hikeId, order',
      foods: '++id, name, category, source',
      segmentFoods: '++id, segmentId, foodId, [segmentId+foodId]',
      waterCarries: '++id, segmentId, order',
    })
  }
}

export const db = new TrailmixDB()

export const WATER_LB_PER_L = 2.20462
export const WATER_OZ_PER_L = 35.274
