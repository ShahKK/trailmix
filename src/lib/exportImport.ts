import { db, type Hike, type Segment, type FoodItem, type SegmentFood } from '../db/db'
import { buildFoodLines, summarizeSegment } from './calc'

interface Backup {
  app: 'trailmix'
  version: 1
  exportedAt: string
  hikes: Hike[]
  segments: Segment[]
  foods: FoodItem[]
  segmentFoods: SegmentFood[]
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Export the entire local database as a JSON backup file. */
export async function exportAllJSON(): Promise<void> {
  const [hikes, segments, foods, segmentFoods] = await Promise.all([
    db.hikes.toArray(),
    db.segments.toArray(),
    db.foods.toArray(),
    db.segmentFoods.toArray(),
  ])
  const backup: Backup = {
    app: 'trailmix',
    version: 1,
    exportedAt: new Date().toISOString(),
    hikes,
    segments,
    foods,
    segmentFoods,
  }
  download('trailmix-backup.json', JSON.stringify(backup, null, 2), 'application/json')
}

/** Replace all local data with the contents of a JSON backup. */
export async function importAllJSON(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text) as Partial<Backup>
  if (data.app !== 'trailmix' || !Array.isArray(data.hikes)) {
    throw new Error('Not a valid Trailmix backup file.')
  }
  await db.transaction('rw', db.hikes, db.segments, db.foods, db.segmentFoods, async () => {
    await Promise.all([db.hikes.clear(), db.segments.clear(), db.foods.clear(), db.segmentFoods.clear()])
    await db.hikes.bulkAdd(data.hikes ?? [])
    await db.segments.bulkAdd(data.segments ?? [])
    await db.foods.bulkAdd(data.foods ?? [])
    await db.segmentFoods.bulkAdd(data.segmentFoods ?? [])
  })
}

function csvEscape(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Export one hike's full resupply plan as a CSV shopping list. */
export async function exportHikeCSV(hike: Hike): Promise<void> {
  const segments = await db.segments.where('hikeId').equals(hike.id!).sortBy('order')
  const foods = await db.foods.toArray()
  const foodsById = new Map(foods.map((f) => [f.id!, f]))

  const rows: string[] = []
  rows.push(['Segment', 'Resupply', 'Item', 'Category', 'Qty', 'Unit oz', 'Unit cal', 'Unit cost'].join(','))

  for (const seg of segments) {
    const sfs = await db.segmentFoods.where('segmentId').equals(seg.id!).toArray()
    const lines = buildFoodLines(sfs, foodsById)
    for (const l of lines) {
      rows.push(
        [
          csvEscape(seg.name),
          seg.resupplyType,
          csvEscape(l.name),
          csvEscape(l.category),
          l.qty,
          l.weightOz,
          l.calories,
          l.cost.toFixed(2),
        ].join(','),
      )
    }
    const summary = summarizeSegment(seg, hike, lines)
    rows.push(
      [
        csvEscape(seg.name),
        seg.resupplyType,
        'SEGMENT TOTAL',
        `${summary.days} days`,
        '',
        summary.weightOz.toFixed(1),
        Math.round(summary.caloriesPacked),
        summary.cost.toFixed(2),
      ].join(','),
    )
  }

  const safeName = hike.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  download(`trailmix-${safeName}.csv`, rows.join('\n'), 'text/csv')
}
