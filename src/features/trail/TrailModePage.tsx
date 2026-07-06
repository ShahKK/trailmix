import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { db } from '../../db/db'
import { resetSegmentEaten, setSegmentFoodEaten } from '../../db/repo'
import { buildFoodLines, daysOfFood, lineTotals, segmentArrivalDates } from '../../lib/calc'
import { fmtCal, fmtDate, fmtWeight } from '../../lib/format'
import { haptic } from '../../lib/haptics'
import { EmptyState } from '../../components/ui'
import { ListSkeleton } from '../../components/Skeleton'

export default function TrailModePage() {
  const { hikeId } = useParams()
  const id = Number(hikeId)
  const hike = useLiveQuery(() => db.hikes.get(id), [id])
  const segments = useLiveQuery(() => db.segments.where('hikeId').equals(id).sortBy('order'), [id])
  const foods = useLiveQuery(() => db.foods.toArray(), [])
  const [idx, setIdx] = useState(0)

  const foodsById = useMemo(() => new Map((foods ?? []).map((f) => [f.id!, f])), [foods])
  const arrivals = useMemo(
    () => (hike && segments ? segmentArrivalDates(hike.startDate, segments) : new Map<number, Date>()),
    [hike, segments],
  )

  const seg = segments?.[Math.min(idx, (segments?.length ?? 1) - 1)]
  const segmentFoods = useLiveQuery(() => (seg ? db.segmentFoods.where('segmentId').equals(seg.id!).toArray() : []), [seg?.id])
  const lines = useMemo(() => buildFoodLines(segmentFoods ?? [], foodsById), [segmentFoods, foodsById])

  if (hike === undefined || segments === undefined) return <ListSkeleton rows={3} />
  if (!hike || !segments.length || !seg)
    return (
      <EmptyState title="Nothing to show on trail yet">
        <Link className="text-trail-700 underline" to={`/hikes/${id}`}>
          Back to plan
        </Link>
      </EmptyState>
    )

  const remaining = lines.filter((l) => !l.eaten)
  const remTotals = lineTotals(remaining)
  const allTotals = lineTotals(lines)
  const eatenPct = allTotals.calories > 0 ? (1 - remTotals.calories / allTotals.calories) * 100 : 0
  const days = daysOfFood(seg.miles, seg.miPerDay)

  return (
    <div className="space-y-5">
      <div className="no-print flex items-center justify-between">
        <Link to={`/hikes/${id}`} className="text-sm text-trail-600 hover:underline">
          ← Exit trail mode
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wide text-trail-500">⛺ On trail</span>
      </div>

      {/* segment selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {segments.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setIdx(i)
              haptic(6)
            }}
            className={`chip shrink-0 ${i === idx ? 'bg-trail-600 text-white' : 'bg-trail-100 text-trail-700'}`}
          >
            {i + 1}. {s.name}
          </button>
        ))}
      </div>

      <section className="rounded-2xl bg-trail-950 p-6 text-white">
        <div className="text-xs font-semibold uppercase tracking-wide text-trail-300">
          Segment {idx + 1} of {segments.length}
        </div>
        <h1 className="text-2xl font-extrabold">{seg.name}</h1>
        <p className="text-sm text-trail-200">
          {seg.miles} mi · {days} days of food · next town {fmtDate(arrivals.get(seg.id!))}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/10 p-3">
            <div className="text-[11px] uppercase tracking-wide text-trail-300">Calories left</div>
            <div className="text-2xl font-extrabold">{fmtCal(remTotals.calories)}</div>
            <div className="text-xs text-trail-300">≈ {(remTotals.calories / hike.dailyCalTarget).toFixed(1)} days</div>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <div className="text-[11px] uppercase tracking-wide text-trail-300">Food weight left</div>
            <div className="text-2xl font-extrabold">{fmtWeight(remTotals.weightOz)}</div>
            <div className="text-xs text-trail-300">
              {remaining.length} of {lines.length} items left
            </div>
          </div>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
          <motion.div
            className="h-full bg-trail-400"
            initial={{ width: 0 }}
            animate={{ width: `${eatenPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="mt-1 text-right text-xs text-trail-300">{eatenPct.toFixed(0)}% eaten</div>
      </section>

      <section className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-trail-600">Tap as you eat</h2>
          <button className="btn-ghost text-trail-600" onClick={() => void resetSegmentEaten(seg.id!)}>
            Reset
          </button>
        </div>
        {lines.length === 0 ? (
          <p className="text-sm text-trail-400">No food in this segment.</p>
        ) : (
          <ul className="divide-y divide-trail-100">
            {lines.map((l) => (
              <li key={l.segmentFoodId}>
                <button
                  onClick={() => {
                    void setSegmentFoodEaten(l.segmentFoodId, !l.eaten)
                    haptic(8)
                  }}
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs ${
                      l.eaten ? 'border-trail-500 bg-trail-500 text-white' : 'border-trail-300 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span className={`flex-1 text-lg ${l.eaten ? 'text-trail-400 line-through' : 'text-trail-900'}`}>
                    <span className="font-semibold">{l.qty}×</span> {l.name}
                  </span>
                  <span className="text-xs text-trail-500">{(l.calories * l.qty).toLocaleString()} cal</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
