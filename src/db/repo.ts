import { db, type Hike, type Segment, type FoodItem, type SegmentFood, type WaterCarry } from './db'
import { ensureSeeded } from './seed'
import type { HikeTemplate } from '../data/templates'
import type { SwapSuggestion } from '../lib/calc'

// ---------------------------------------------------------------------------
// Hikes
// ---------------------------------------------------------------------------

export async function createHike(data: Omit<Hike, 'id' | 'createdAt'>): Promise<number> {
  return db.hikes.add({ ...data, createdAt: Date.now() })
}

export async function updateHike(id: number, patch: Partial<Hike>): Promise<void> {
  await db.hikes.update(id, patch)
}

export async function deleteHike(id: number): Promise<void> {
  await db.transaction('rw', db.hikes, db.segments, db.segmentFoods, async () => {
    const segs = await db.segments.where('hikeId').equals(id).toArray()
    const segIds = segs.map((s) => s.id!).filter(Boolean)
    if (segIds.length) await db.segmentFoods.where('segmentId').anyOf(segIds).delete()
    await db.segments.where('hikeId').equals(id).delete()
    await db.hikes.delete(id)
  })
}

// ---------------------------------------------------------------------------
// Segments
// ---------------------------------------------------------------------------

export async function addSegment(
  hikeId: number,
  data: Omit<Segment, 'id' | 'hikeId' | 'order'>,
): Promise<number> {
  const count = await db.segments.where('hikeId').equals(hikeId).count()
  return db.segments.add({ ...data, hikeId, order: count })
}

export async function updateSegment(id: number, patch: Partial<Segment>): Promise<void> {
  await db.segments.update(id, patch)
}

export async function deleteSegment(id: number): Promise<void> {
  await db.transaction('rw', db.segments, db.segmentFoods, async () => {
    await db.segmentFoods.where('segmentId').equals(id).delete()
    await db.segments.delete(id)
  })
}

export async function reorderSegment(hikeId: number, segmentId: number, dir: -1 | 1): Promise<void> {
  await db.transaction('rw', db.segments, async () => {
    const segs = await db.segments.where('hikeId').equals(hikeId).sortBy('order')
    const idx = segs.findIndex((s) => s.id === segmentId)
    const swap = idx + dir
    if (idx < 0 || swap < 0 || swap >= segs.length) return
    const a = segs[idx]
    const b = segs[swap]
    await db.segments.update(a.id!, { order: b.order })
    await db.segments.update(b.id!, { order: a.order })
  })
}

export async function persistSegmentOrder(orderedIds: number[]): Promise<void> {
  await db.transaction('rw', db.segments, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.segments.update(orderedIds[i], { order: i })
    }
  })
}

export async function duplicateSegment(segmentId: number): Promise<number | undefined> {
  return db.transaction('rw', db.segments, db.segmentFoods, async () => {
    const seg = await db.segments.get(segmentId)
    if (!seg) return undefined
    const count = await db.segments.where('hikeId').equals(seg.hikeId).count()
    const { id: _omit, ...rest } = seg
    const newId = await db.segments.add({ ...rest, name: `${seg.name} (copy)`, order: count })
    const foods = await db.segmentFoods.where('segmentId').equals(segmentId).toArray()
    for (const f of foods) {
      await db.segmentFoods.add({ segmentId: newId, foodId: f.foodId, qty: f.qty })
    }
    return newId
  })
}

// ---------------------------------------------------------------------------
// Foods
// ---------------------------------------------------------------------------

export async function addFood(data: Omit<FoodItem, 'id' | 'source'>): Promise<number> {
  return db.foods.add({ ...data, source: 'custom' })
}

export async function updateFood(id: number, patch: Partial<FoodItem>): Promise<void> {
  await db.foods.update(id, patch)
}

export async function deleteFood(id: number): Promise<void> {
  await db.transaction('rw', db.foods, db.segmentFoods, async () => {
    await db.segmentFoods.where('foodId').equals(id).delete()
    await db.foods.delete(id)
  })
}

// ---------------------------------------------------------------------------
// Segment ↔ Food lines
// ---------------------------------------------------------------------------

export async function addFoodToSegment(segmentId: number, foodId: number, qty = 1): Promise<void> {
  const existing = await db.segmentFoods.where({ segmentId, foodId }).first()
  if (existing?.id) {
    await db.segmentFoods.update(existing.id, { qty: existing.qty + qty })
  } else {
    await db.segmentFoods.add({ segmentId, foodId, qty })
  }
}

export async function setSegmentFoodQty(id: number, qty: number): Promise<void> {
  if (qty <= 0) {
    await db.segmentFoods.delete(id)
  } else {
    await db.segmentFoods.update(id, { qty })
  }
}

export async function removeSegmentFood(id: number): Promise<void> {
  await db.segmentFoods.delete(id)
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function createHikeFromTemplate(t: HikeTemplate, startDate: string): Promise<number> {
  await ensureSeeded()
  return db.transaction('rw', db.hikes, db.segments, db.foods, db.segmentFoods, async () => {
    const hikeId = await db.hikes.add({
      name: t.name,
      trail: t.trail,
      startDate,
      dailyCalTarget: t.dailyCalTarget,
      targetCalOz: t.targetCalOz,
      createdAt: Date.now(),
    })
    for (let i = 0; i < t.segments.length; i++) {
      const s = t.segments[i]
      const segId = await db.segments.add({
        hikeId,
        order: i,
        name: s.name,
        miles: s.miles,
        miPerDay: s.miPerDay,
        resupplyType: s.resupplyType,
        maildropAddress: s.maildropAddress,
        notes: s.notes,
      })
      for (const tf of s.foods) {
        const food = await db.foods.where('name').equals(tf.name).first()
        if (food?.id) {
          await db.segmentFoods.add({ segmentId: segId, foodId: food.id, qty: tf.qty })
        }
      }
    }
    return hikeId
  })
}

// ---------------------------------------------------------------------------
// Water carries (v2)
// ---------------------------------------------------------------------------

export async function addWaterCarry(
  segmentId: number,
  data: Omit<WaterCarry, 'id' | 'segmentId' | 'order'>,
): Promise<number> {
  const count = await db.waterCarries.where('segmentId').equals(segmentId).count()
  return db.waterCarries.add({ ...data, segmentId, order: count })
}

export async function updateWaterCarry(id: number, patch: Partial<WaterCarry>): Promise<void> {
  await db.waterCarries.update(id, patch)
}

export async function deleteWaterCarry(id: number): Promise<void> {
  await db.waterCarries.delete(id)
}

// ---------------------------------------------------------------------------
// On-trail check-off (v2)
// ---------------------------------------------------------------------------

export async function setSegmentFoodEaten(id: number, eaten: boolean): Promise<void> {
  await db.segmentFoods.update(id, { eaten })
}

export async function resetSegmentEaten(segmentId: number): Promise<void> {
  const sfs = await db.segmentFoods.where('segmentId').equals(segmentId).toArray()
  await db.transaction('rw', db.segmentFoods, async () => {
    for (const sf of sfs) await db.segmentFoods.update(sf.id!, { eaten: false })
  })
}

// ---------------------------------------------------------------------------
// Swap engine (v2)
// ---------------------------------------------------------------------------

export async function applySwap(segmentId: number, s: SwapSuggestion): Promise<void> {
  await db.transaction('rw', db.segmentFoods, async () => {
    await db.segmentFoods.delete(s.removeSegmentFoodId)
    const existing = await db.segmentFoods.where({ segmentId, foodId: s.addFoodId }).first()
    if (existing?.id) await db.segmentFoods.update(existing.id, { qty: existing.qty + s.addQty })
    else await db.segmentFoods.add({ segmentId, foodId: s.addFoodId, qty: s.addQty })
  })
}

// ---------------------------------------------------------------------------
// Undo snapshots (v2) — capture before delete, restore on undo
// ---------------------------------------------------------------------------

export interface SegmentSnapshot {
  segment: Segment
  foods: SegmentFood[]
  water: WaterCarry[]
}

export async function snapshotSegment(segmentId: number): Promise<SegmentSnapshot | null> {
  const segment = await db.segments.get(segmentId)
  if (!segment) return null
  const foods = await db.segmentFoods.where('segmentId').equals(segmentId).toArray()
  const water = await db.waterCarries.where('segmentId').equals(segmentId).toArray()
  return { segment, foods, water }
}

export async function restoreSegment(snap: SegmentSnapshot): Promise<void> {
  await db.transaction('rw', db.segments, db.segmentFoods, db.waterCarries, async () => {
    const { id: _o, ...seg } = snap.segment
    const newId = await db.segments.add(seg as Segment)
    for (const f of snap.foods) {
      const { id: _fi, ...rest } = f
      await db.segmentFoods.add({ ...rest, segmentId: newId })
    }
    for (const w of snap.water) {
      const { id: _wi, ...rest } = w
      await db.waterCarries.add({ ...rest, segmentId: newId })
    }
  })
}

export interface HikeSnapshot {
  hike: Hike
  segments: SegmentSnapshot[]
}

export async function snapshotHike(hikeId: number): Promise<HikeSnapshot | null> {
  const hike = await db.hikes.get(hikeId)
  if (!hike) return null
  const segs = await db.segments.where('hikeId').equals(hikeId).toArray()
  const segments: SegmentSnapshot[] = []
  for (const s of segs) {
    const snap = await snapshotSegment(s.id!)
    if (snap) segments.push(snap)
  }
  return { hike, segments }
}

export async function restoreHike(snap: HikeSnapshot): Promise<void> {
  await db.transaction('rw', db.hikes, db.segments, db.segmentFoods, db.waterCarries, async () => {
    const { id: _o, ...hike } = snap.hike
    const newHikeId = await db.hikes.add(hike as Hike)
    for (const segSnap of snap.segments) {
      const { id: _si, ...seg } = segSnap.segment
      const newSegId = await db.segments.add({ ...(seg as Segment), hikeId: newHikeId })
      for (const f of segSnap.foods) {
        const { id: _fi, ...rest } = f
        await db.segmentFoods.add({ ...rest, segmentId: newSegId })
      }
      for (const w of segSnap.water) {
        const { id: _wi, ...rest } = w
        await db.waterCarries.add({ ...rest, segmentId: newSegId })
      }
    }
  })
}
