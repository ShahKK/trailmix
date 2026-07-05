import { db } from './db'
import { seedFoods } from '../data/seedFoods'

let seededOnce: Promise<void> | null = null

/** Load the starter food library into IndexedDB on first run (idempotent). */
export function ensureSeeded(): Promise<void> {
  if (!seededOnce) {
    seededOnce = (async () => {
      const count = await db.foods.count()
      if (count === 0) {
        await db.foods.bulkAdd(seedFoods.map((f) => ({ ...f, source: 'seed' as const })))
      }
    })()
  }
  return seededOnce
}
