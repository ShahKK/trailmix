import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { db, type Segment, type WaterCarry } from '../../db/db'
import {
  addFoodToSegment,
  addWaterCarry,
  applySwap,
  deleteWaterCarry,
  removeSegmentFood,
  setSegmentFoodQty,
  updateSegment,
} from '../../db/repo'
import {
  buildFoodLines,
  calPerOz,
  groupByCategory,
  holdUntilDate,
  litersToOz,
  macroTotals,
  packWeight,
  segmentArrivalDates,
  suggestSwaps,
  summarizeSegment,
  worstCarry,
  type SegStatus,
} from '../../lib/calc'
import { fmtCal, fmtDate, fmtMoney, fmtWeight } from '../../lib/format'
import { notifyUndo } from '../../lib/toast'
import { haptic } from '../../lib/haptics'
import { Field, NumberInput, Select, TextInput } from '../../components/fields'
import { EmptyState, SectionTitle, StatBox, StatusBadge } from '../../components/ui'
import AnimatedNumber from '../../components/AnimatedNumber'
import { Meter, StackedBar } from '../../components/viz'
import Confetti from '../../components/Confetti'
import { ListSkeleton } from '../../components/Skeleton'

export default function SegmentDetailPage() {
  const { hikeId, segmentId } = useParams()
  const hId = Number(hikeId)
  const sId = Number(segmentId)

  const hike = useLiveQuery(() => db.hikes.get(hId), [hId])
  const segment = useLiveQuery(() => db.segments.get(sId), [sId])
  const allSegments = useLiveQuery(() => db.segments.where('hikeId').equals(hId).sortBy('order'), [hId])
  const foods = useLiveQuery(() => db.foods.orderBy('name').toArray(), [])
  const segmentFoods = useLiveQuery(() => db.segmentFoods.where('segmentId').equals(sId).toArray(), [sId])
  const water = useLiveQuery(() => db.waterCarries.where('segmentId').equals(sId).sortBy('order'), [sId])

  const foodsById = useMemo(() => new Map((foods ?? []).map((f) => [f.id!, f])), [foods])
  const lines = useMemo(() => buildFoodLines(segmentFoods ?? [], foodsById), [segmentFoods, foodsById])

  const arrival = useMemo(() => {
    if (!hike || !allSegments) return undefined
    return segmentArrivalDates(hike.startDate, allSegments).get(sId)
  }, [hike, allSegments, sId])

  if (hike === undefined || segment === undefined || foods === undefined) return <ListSkeleton rows={4} />
  if (!hike || !segment)
    return (
      <EmptyState title="Segment not found">
        <Link className="text-trail-700 underline" to="/">
          Back to your hikes
        </Link>
      </EmptyState>
    )

  const summary = summarizeSegment(segment, hike, lines)
  const macros = macroTotals(lines)
  const worstL = worstCarry(water ?? [])
  const pack = packWeight(hike.baseWeightOz ?? 0, summary.weightOz, worstL)
  const swaps = summary.status === 'heavy' || summary.status === 'undercalorie' ? suggestSwaps(lines, foods) : []
  const cpoTone = summary.status === 'heavy' ? 'warn' : summary.status === 'undercalorie' ? 'bad' : 'good'

  return (
    <div className="space-y-6">
      <div className="no-print">
        <Link to={`/hikes/${hId}`} className="text-sm text-trail-600 hover:underline">
          ← {hike.name}
        </Link>
      </div>

      <Celebration status={summary.status} />

      <SegmentSettings segment={segment} />

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatBox label="Days of food" value={summary.days} />
        <StatBox
          label="Cal/oz"
          value={<AnimatedNumber value={summary.calPerOz} format={(n) => n.toFixed(0)} />}
          hint={`goal ${hike.targetCalOz}`}
          tone={cpoTone}
        />
        <StatBox
          label="Calories"
          value={<AnimatedNumber value={summary.caloriesPacked} />}
          hint={`need ${fmtCal(summary.caloriesNeeded)}`}
          tone={summary.status === 'undercalorie' ? 'bad' : 'default'}
        />
        <StatBox label="Cal / day" value={<AnimatedNumber value={summary.caloriesPerDay} />} />
        <StatBox label="Food weight" value={<AnimatedNumber value={summary.weightOz} format={(n) => fmtWeight(n)} />} />
        <StatBox label="Cost" value={<AnimatedNumber value={summary.cost} format={(n) => fmtMoney(n)} />} />
      </section>

      <section className="card space-y-3 p-4">
        <Meter value={summary.calPerOz} goal={hike.targetCalOz} label="Calories per ounce" unit="" />
        <Meter value={summary.caloriesPacked} goal={summary.caloriesNeeded} label="Calories packed vs needed" />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={summary.status} />
        {summary.warnings.map((w) => (
          <span key={w} className="chip bg-amber-100 text-amber-800">
            ⚠ {w}
          </span>
        ))}
        {summary.status === 'ok' && lines.length > 0 && (
          <span className="chip bg-trail-100 text-trail-700">✓ Enough calories, within cal/oz goal</span>
        )}
      </div>

      {swaps.length > 0 && (
        <section className="card p-4">
          <SectionTitle>Lighten this segment</SectionTitle>
          <p className="mb-3 text-xs text-trail-500">Same calories, less weight — tap to apply.</p>
          <ul className="space-y-2">
            {swaps.map((s) => (
              <li
                key={s.removeSegmentFoodId}
                className="flex items-center justify-between gap-3 rounded-lg bg-trail-50 px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-medium text-trail-900">{s.removeName}</span>
                  <span className="text-trail-400"> → </span>
                  <span className="font-medium text-trail-900">
                    {s.addQty}× {s.addName}
                  </span>
                  <span className="ml-2 text-xs text-trail-500">
                    {s.fromCalPerOz.toFixed(0)}→{s.toCalPerOz.toFixed(0)} cal/oz
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="chip bg-trail-100 text-trail-700">{s.deltaOz.toFixed(1)} oz</span>
                  <button
                    className="btn-primary px-2 py-1 text-xs"
                    onClick={() => {
                      void applySwap(sId, s)
                      haptic(12)
                    }}
                  >
                    Apply
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <PackWeightCard base={pack.baseOz} food={pack.foodOz} water={pack.waterOz} total={pack.totalOz} hasBase={hike.baseWeightOz != null} />
        <MacrosCard macros={macros} proteinTarget={hike.proteinTargetG} days={summary.days} />
      </div>

      <WaterPlanner segmentId={sId} carries={water ?? []} worstLiters={worstL} />

      <div className="grid gap-6 lg:grid-cols-2">
        <FoodBuilder segmentId={sId} lines={lines} />
        <PackList segment={segment} lines={lines} arrival={arrival} />
      </div>
    </div>
  )
}

/** Fire confetti when a segment transitions into "on target". */
function Celebration({ status }: { status: SegStatus }) {
  const [fireKey, setFireKey] = useState(0)
  const prev = useRef<SegStatus | null>(null)
  useEffect(() => {
    if (prev.current && prev.current !== 'ok' && prev.current !== 'empty' && status === 'ok') {
      setFireKey((k) => k + 1)
      haptic([10, 40, 10])
    }
    prev.current = status
  }, [status])
  return <Confetti fireKey={fireKey} />
}

function SegmentSettings({ segment }: { segment: Segment }) {
  const [form, setForm] = useState(segment)
  useEffect(() => setForm(segment), [segment.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function upd(patch: Partial<Segment>) {
    setForm((f) => ({ ...f, ...patch }))
    void updateSegment(segment.id!, patch)
  }

  return (
    <div className="card p-4">
      <input
        value={form.name}
        onChange={(e) => upd({ name: e.target.value })}
        className="w-full border-none bg-transparent text-xl font-extrabold text-trail-900 focus:outline-none"
        aria-label="Segment name"
      />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Trail miles">
          <NumberInput value={form.miles} onChange={(e) => upd({ miles: Number(e.target.value) })} step={1} />
        </Field>
        <Field label="Miles / day">
          <NumberInput value={form.miPerDay} onChange={(e) => upd({ miPerDay: Number(e.target.value) })} step={1} />
        </Field>
        <Field label="Resupply">
          <Select
            value={form.resupplyType}
            onChange={(e) => upd({ resupplyType: e.target.value as 'town' | 'maildrop' })}
          >
            <option value="town">Buy in town</option>
            <option value="maildrop">Mail drop</option>
          </Select>
        </Field>
        {form.resupplyType === 'maildrop' ? (
          <Field label="Mail-drop address">
            <TextInput
              value={form.maildropAddress ?? ''}
              onChange={(e) => upd({ maildropAddress: e.target.value })}
              placeholder="Hostel / PO, hold for hiker"
            />
          </Field>
        ) : (
          <Field label="Notes">
            <TextInput value={form.notes ?? ''} onChange={(e) => upd({ notes: e.target.value })} />
          </Field>
        )}
      </div>
    </div>
  )
}

function PackWeightCard({
  base,
  food,
  water,
  total,
  hasBase,
}: {
  base: number
  food: number
  water: number
  total: number
  hasBase: boolean
}) {
  return (
    <section className="card p-4">
      <SectionTitle>Total pack weight (worst carry)</SectionTitle>
      <div className="mb-3 text-2xl font-extrabold text-trail-900">
        <AnimatedNumber value={total} format={(n) => fmtWeight(n)} />
      </div>
      <StackedBar
        parts={[
          { label: 'Base', value: base, className: 'bg-trail-700' },
          { label: 'Food', value: food, className: 'bg-trail-400' },
          { label: 'Water', value: water, className: 'bg-sky-400' },
        ]}
      />
      {!hasBase && (
        <p className="mt-3 text-xs text-trail-500">
          Set a <strong>base weight</strong> on the hike to see your true load.
        </p>
      )}
    </section>
  )
}

function MacrosCard({
  macros,
  proteinTarget,
  days,
}: {
  macros: ReturnType<typeof macroTotals>
  proteinTarget?: number
  days: number
}) {
  const proteinPerDay = days > 0 ? macros.proteinG / days : 0
  const partial = macros.itemsWithMacros < macros.itemsTotal
  return (
    <section className="card p-4">
      <SectionTitle>Macros</SectionTitle>
      {macros.itemsWithMacros === 0 ? (
        <p className="text-sm text-trail-500">
          No macros yet — add protein/fat/carbs to foods in the Food Library to track them here.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Protein" value={<AnimatedNumber value={macros.proteinG} format={(n) => `${n.toFixed(0)} g`} />} />
            <StatBox label="Fat" value={<AnimatedNumber value={macros.fatG} format={(n) => `${n.toFixed(0)} g`} />} />
            <StatBox label="Carbs" value={<AnimatedNumber value={macros.carbG} format={(n) => `${n.toFixed(0)} g`} />} />
          </div>
          {proteinTarget ? (
            <div className="mt-3">
              <Meter value={proteinPerDay} goal={proteinTarget} label="Protein / day" unit=" g" />
            </div>
          ) : null}
          {partial && (
            <p className="mt-3 text-xs text-trail-500">
              Macros counted for {macros.itemsWithMacros} of {macros.itemsTotal} items.
            </p>
          )}
        </>
      )}
    </section>
  )
}

function WaterPlanner({
  segmentId,
  carries,
  worstLiters,
}: {
  segmentId: number
  carries: WaterCarry[]
  worstLiters: number
}) {
  const [label, setLabel] = useState('')
  const [liters, setLiters] = useState(2)

  async function add() {
    if (!label.trim()) return
    await addWaterCarry(segmentId, { label: label.trim(), liters })
    setLabel('')
    setLiters(2)
    haptic(8)
  }

  return (
    <section className="card p-4">
      <SectionTitle
        right={
          worstLiters > 0 ? (
            <span className="chip bg-sky-100 text-sky-700">
              worst carry {worstLiters} L · {fmtWeight(litersToOz(worstLiters))}
            </span>
          ) : undefined
        }
      >
        Water carries
      </SectionTitle>
      <p className="mb-3 text-xs text-trail-500">Water is ~2.2 lb per liter. Your heaviest carry drives pack weight.</p>

      {carries.length > 0 && (
        <ul className="mb-3 divide-y divide-trail-100">
          {carries.map((c) => {
            const isWorst = c.liters === worstLiters && worstLiters > 0
            return (
              <li key={c.id} className="flex items-center gap-2 py-2 text-sm">
                <span className="flex-1">
                  <span className="font-medium text-trail-900">{c.label}</span>
                  {isWorst && <span className="ml-2 chip bg-sky-100 text-sky-700">heaviest</span>}
                </span>
                <span className="text-xs text-trail-500">
                  {c.liters} L · {fmtWeight(litersToOz(c.liters))}
                </span>
                <button
                  className="btn-ghost h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                  onClick={() => void deleteWaterCarry(c.id!)}
                  aria-label="Remove carry"
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[10rem] flex-1">
          <Field label="Carry (source → source)">
            <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Scissors Xing → Barrel Spring" />
          </Field>
        </div>
        <div className="w-24">
          <Field label="Liters">
            <NumberInput value={liters} onChange={(e) => setLiters(Number(e.target.value))} min={0} step={0.5} />
          </Field>
        </div>
        <button className="btn-primary" onClick={() => void add()} disabled={!label.trim()}>
          Add
        </button>
      </div>
    </section>
  )
}

function FoodBuilder({ segmentId, lines }: { segmentId: number; lines: ReturnType<typeof buildFoodLines> }) {
  const [q, setQ] = useState('')
  const foods = useLiveQuery(() => db.foods.orderBy('name').toArray(), [])
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (foods ?? []).filter((f) => !needle || f.name.toLowerCase().includes(needle)).slice(0, 40)
  }, [foods, q])

  return (
    <section className="card p-4">
      <SectionTitle>Build the food bag</SectionTitle>
      <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the food library…" className="mb-2" />
      <div className="mb-4 max-h-56 overflow-y-auto rounded-lg border border-trail-100">
        {results.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              void addFoodToSegment(segmentId, f.id!)
              haptic(6)
            }}
            className="flex w-full items-center justify-between gap-2 border-b border-trail-50 px-3 py-2 text-left text-sm hover:bg-trail-50"
          >
            <span className="min-w-0 truncate">
              <span className="font-medium text-trail-900">{f.name}</span>
              <span className="ml-2 text-xs text-trail-400">{f.category}</span>
            </span>
            <span className="shrink-0 text-xs text-trail-500">
              {f.calories} cal · {calPerOz(f.calories, f.weightOz).toFixed(0)} cal/oz
            </span>
          </button>
        ))}
        {results.length === 0 && <p className="px-3 py-4 text-sm text-trail-400">No matches. Add it in Food Library.</p>}
      </div>

      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-trail-600">In this segment ({lines.length})</h4>
      {lines.length === 0 ? (
        <p className="text-sm text-trail-400">Nothing yet — search above and tap to add. Swipe a row left to remove.</p>
      ) : (
        <ul className="space-y-1">
          <AnimatePresence initial={false}>
            {lines.map((l) => (
              <SwipeRow key={l.segmentFoodId} onDelete={() => void removeSegmentFood(l.segmentFoodId)}>
                <div className="flex items-center gap-2 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-trail-900">{l.name}</div>
                    <div className="text-xs text-trail-500">
                      {(l.calories * l.qty).toLocaleString()} cal · {fmtWeight(l.weightOz * l.qty)} · {fmtMoney(l.cost * l.qty)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="btn-ghost h-7 w-7 p-0 text-trail-600"
                      onClick={() => void setSegmentFoodQty(l.segmentFoodId, l.qty - 1)}
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-semibold">{l.qty}</span>
                    <button
                      className="btn-ghost h-7 w-7 p-0 text-trail-600"
                      onClick={() => void setSegmentFoodQty(l.segmentFoodId, l.qty + 1)}
                      aria-label="Increase"
                    >
                      +
                    </button>
                    <button
                      className="btn-ghost h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                      onClick={() => void removeSegmentFood(l.segmentFoodId)}
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </SwipeRow>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  )
}

/** A row that reveals a delete action and removes itself when swiped far left. */
function SwipeRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="relative overflow-hidden border-b border-trail-50"
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-red-500">
        Remove
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.6, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -90) {
            haptic(14)
            onDelete()
          }
        }}
        className="bg-white dark:bg-trail-900"
      >
        {children}
      </motion.div>
    </motion.li>
  )
}

function PackList({
  segment,
  lines,
  arrival,
}: {
  segment: Segment
  lines: ReturnType<typeof buildFoodLines>
  arrival: Date | undefined
}) {
  const grouped = useMemo(() => groupByCategory(lines), [lines])
  const isMaildrop = segment.resupplyType === 'maildrop'

  return (
    <section className="card print-area p-4">
      <SectionTitle
        right={
          <button className="btn-ghost text-trail-600 no-print" onClick={() => window.print()}>
            🖨 Print
          </button>
        }
      >
        {isMaildrop ? 'Mail-drop box' : 'Shopping list'}
      </SectionTitle>

      {isMaildrop && (
        <div className="mb-4 rounded-lg bg-trail-50 p-3 text-sm">
          <div className="font-semibold text-trail-800">Mail to (hold for hiker):</div>
          <div className="whitespace-pre-wrap text-trail-700">{segment.maildropAddress || '— add an address —'}</div>
          <div className="mt-2 text-xs text-trail-600">
            Est. arrival <strong>{fmtDate(arrival)}</strong> · ask them to hold until{' '}
            <strong>{fmtDate(holdUntilDate(arrival))}</strong>
          </div>
        </div>
      )}

      {lines.length === 0 ? (
        <p className="text-sm text-trail-400">Add food to generate the {isMaildrop ? 'box contents' : 'shopping'} list.</p>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([cat, items]) => (
            <div key={cat}>
              <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-trail-500">{cat}</h4>
              <ul className="space-y-1">
                {items.map((l) => (
                  <li key={l.segmentFoodId} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 rounded border-trail-300 text-trail-600" />
                    <span className="flex-1">
                      <span className="font-semibold">{l.qty}×</span> {l.name}
                    </span>
                    <span className="text-xs text-trail-400">{fmtMoney(l.cost * l.qty)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
