import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { db, type FoodCategory } from '../db/db'

// A self-contained plan bundle. Food details are embedded (not ids) so it can
// be forked on any device without a shared database.
export interface SharedFood {
  n: string // name
  c: FoodCategory // category
  w: number // weightOz
  k: number // calories
  $: number // cost
  p?: number // proteinG
  f?: number // fatG
  cb?: number // carbG
  q: number // qty
}

export interface SharedWater {
  l: string // label
  L: number // liters
  nt?: string // notes
}

export interface SharedSegment {
  n: string
  mi: number
  mpd: number
  rt: 'town' | 'maildrop'
  addr?: string
  nt?: string
  foods: SharedFood[]
  water: SharedWater[]
}

export interface SharedHike {
  v: 2
  n: string
  tr: string
  sd: string
  dc: number
  co: number
  bw?: number
  pt?: number
  wr?: number
  segments: SharedSegment[]
}

export async function buildSharedHike(hikeId: number): Promise<SharedHike | null> {
  const hike = await db.hikes.get(hikeId)
  if (!hike) return null
  const segments = await db.segments.where('hikeId').equals(hikeId).sortBy('order')
  const foods = await db.foods.toArray()
  const foodsById = new Map(foods.map((f) => [f.id!, f]))

  const outSegments: SharedSegment[] = []
  for (const seg of segments) {
    const sfs = await db.segmentFoods.where('segmentId').equals(seg.id!).toArray()
    const water = await db.waterCarries.where('segmentId').equals(seg.id!).sortBy('order')
    const sharedFoods: SharedFood[] = []
    for (const sf of sfs) {
      const food = foodsById.get(sf.foodId)
      if (!food) continue
      sharedFoods.push({
        n: food.name,
        c: food.category,
        w: food.weightOz,
        k: food.calories,
        $: food.cost,
        p: food.proteinG,
        f: food.fatG,
        cb: food.carbG,
        q: sf.qty,
      })
    }
    outSegments.push({
      n: seg.name,
      mi: seg.miles,
      mpd: seg.miPerDay,
      rt: seg.resupplyType,
      addr: seg.maildropAddress,
      nt: seg.notes,
      foods: sharedFoods,
      water: water.map((w) => ({ l: w.label, L: w.liters, nt: w.notes })),
    })
  }

  return {
    v: 2,
    n: hike.name,
    tr: hike.trail,
    sd: hike.startDate,
    dc: hike.dailyCalTarget,
    co: hike.targetCalOz,
    bw: hike.baseWeightOz,
    pt: hike.proteinTargetG,
    wr: hike.waterRateLPerHr,
    segments: outSegments,
  }
}

export function encodeSharedHike(sh: SharedHike): string {
  return compressToEncodedURIComponent(JSON.stringify(sh))
}

export function decodeSharedHike(blob: string): SharedHike | null {
  try {
    const json = decompressFromEncodedURIComponent(blob)
    if (!json) return null
    const sh = JSON.parse(json) as SharedHike
    if (sh?.v !== 2 || !Array.isArray(sh.segments)) return null
    return sh
  } catch {
    return null
  }
}

/** Write a shared plan into this device's database and return the new hike id. */
export async function forkSharedHike(sh: SharedHike): Promise<number> {
  return db.transaction('rw', db.hikes, db.segments, db.foods, db.segmentFoods, db.waterCarries, async () => {
    const hikeId = await db.hikes.add({
      name: sh.n,
      trail: sh.tr,
      startDate: sh.sd,
      dailyCalTarget: sh.dc,
      targetCalOz: sh.co,
      baseWeightOz: sh.bw,
      proteinTargetG: sh.pt,
      waterRateLPerHr: sh.wr,
      createdAt: Date.now(),
    })
    // resolve/create foods by name
    const existing = await db.foods.toArray()
    const byName = new Map(existing.map((f) => [f.name, f.id!] as const))
    for (let i = 0; i < sh.segments.length; i++) {
      const s = sh.segments[i]
      const segId = await db.segments.add({
        hikeId,
        order: i,
        name: s.n,
        miles: s.mi,
        miPerDay: s.mpd,
        resupplyType: s.rt,
        maildropAddress: s.addr,
        notes: s.nt,
      })
      for (const f of s.foods) {
        let foodId = byName.get(f.n)
        if (foodId == null) {
          foodId = await db.foods.add({
            name: f.n,
            category: f.c,
            weightOz: f.w,
            calories: f.k,
            cost: f.$,
            proteinG: f.p,
            fatG: f.f,
            carbG: f.cb,
            source: 'custom',
          })
          byName.set(f.n, foodId)
        }
        await db.segmentFoods.add({ segmentId: segId, foodId, qty: f.q })
      }
      for (let w = 0; w < s.water.length; w++) {
        const wc = s.water[w]
        await db.waterCarries.add({ segmentId: segId, order: w, label: wc.l, liters: wc.L, notes: wc.nt })
      }
    }
    return hikeId
  })
}
