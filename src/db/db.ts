import Dexie, { type Table } from 'dexie'

export interface Hike {
  id?: number
  name: string
  trail: string
  startDate: string // ISO yyyy-mm-dd
  dailyCalTarget: number
  targetCalOz: number
  createdAt: number
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
}

export interface SegmentFood {
  id?: number
  segmentId: number
  foodId: number
  qty: number
}

export class TrailmixDB extends Dexie {
  hikes!: Table<Hike, number>
  segments!: Table<Segment, number>
  foods!: Table<FoodItem, number>
  segmentFoods!: Table<SegmentFood, number>

  constructor() {
    super('trailmix')
    this.version(1).stores({
      hikes: '++id, name, createdAt',
      segments: '++id, hikeId, order',
      foods: '++id, name, category, source',
      segmentFoods: '++id, segmentId, foodId, [segmentId+foodId]',
    })
  }
}

export const db = new TrailmixDB()
