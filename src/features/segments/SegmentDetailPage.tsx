import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Segment } from '../../db/db'
import { addFoodToSegment, removeSegmentFood, setSegmentFoodQty, updateSegment } from '../../db/repo'
import {
  buildFoodLines,
  calPerOz,
  groupByCategory,
  holdUntilDate,
  segmentArrivalDates,
  summarizeSegment,
} from '../../lib/calc'
import { fmtCal, fmtDate, fmtMoney, fmtWeight } from '../../lib/format'
import { Field, NumberInput, Select, TextArea, TextInput } from '../../components/fields'
import { EmptyState, SectionTitle, StatBox, StatusBadge } from '../../components/ui'

export default function SegmentDetailPage() {
  const { hikeId, segmentId } = useParams()
  const hId = Number(hikeId)
  const sId = Number(segmentId)

  const hike = useLiveQuery(() => db.hikes.get(hId), [hId])
  const segment = useLiveQuery(() => db.segments.get(sId), [sId])
  const allSegments = useLiveQuery(() => db.segments.where('hikeId').equals(hId).sortBy('order'), [hId])
  const foods = useLiveQuery(() => db.foods.orderBy('name').toArray(), [])
  const segmentFoods = useLiveQuery(() => db.segmentFoods.where('segmentId').equals(sId).toArray(), [sId])

  const foodsById = useMemo(() => new Map((foods ?? []).map((f) => [f.id!, f])), [foods])
  const lines = useMemo(() => buildFoodLines(segmentFoods ?? [], foodsById), [segmentFoods, foodsById])

  const arrival = useMemo(() => {
    if (!hike || !allSegments) return undefined
    return segmentArrivalDates(hike.startDate, allSegments).get(sId)
  }, [hike, allSegments, sId])

  if (hike === undefined || segment === undefined) return <p className="text-trail-500">Loading…</p>
  if (!hike || !segment)
    return (
      <EmptyState title="Segment not found">
        <Link className="text-trail-700 underline" to="/">
          Back to your hikes
        </Link>
      </EmptyState>
    )

  const summary = summarizeSegment(segment, hike, lines)
  const cpoTone = summary.status === 'heavy' ? 'warn' : summary.status === 'undercalorie' ? 'bad' : 'good'

  return (
    <div className="space-y-6">
      <div className="no-print">
        <Link to={`/hikes/${hId}`} className="text-sm text-trail-600 hover:underline">
          ← {hike.name}
        </Link>
      </div>

      <SegmentSettings segment={segment} />

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatBox label="Days of food" value={summary.days} />
        <StatBox label="Cal/oz" value={summary.calPerOz.toFixed(0)} hint={`goal ${hike.targetCalOz}`} tone={cpoTone} />
        <StatBox
          label="Calories"
          value={fmtCal(summary.caloriesPacked)}
          hint={`need ${fmtCal(summary.caloriesNeeded)}`}
          tone={summary.status === 'undercalorie' ? 'bad' : 'default'}
        />
        <StatBox label="Cal / day" value={fmtCal(summary.caloriesPerDay)} />
        <StatBox label="Weight" value={fmtWeight(summary.weightOz)} />
        <StatBox label="Cost" value={fmtMoney(summary.cost)} />
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

      <div className="grid gap-6 lg:grid-cols-2">
        <FoodBuilder segmentId={sId} lines={lines} />
        <PackList segment={segment} lines={lines} arrival={arrival} />
      </div>
    </div>
  )
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

function FoodBuilder({ segmentId, lines }: { segmentId: number; lines: ReturnType<typeof buildFoodLines> }) {
  const [q, setQ] = useState('')
  const foods = useLiveQuery(() => db.foods.orderBy('name').toArray(), [])
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = (foods ?? []).filter((f) => !needle || f.name.toLowerCase().includes(needle))
    return list.slice(0, 40)
  }, [foods, q])

  return (
    <section className="card p-4">
      <SectionTitle>Build the food bag</SectionTitle>

      <TextInput
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search the food library…"
        className="mb-2"
      />
      <div className="mb-4 max-h-56 overflow-y-auto rounded-lg border border-trail-100">
        {results.map((f) => (
          <button
            key={f.id}
            onClick={() => void addFoodToSegment(segmentId, f.id!)}
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
        <p className="text-sm text-trail-400">Nothing yet — search above and tap to add.</p>
      ) : (
        <ul className="divide-y divide-trail-100">
          {lines.map((l) => (
            <li key={l.segmentFoodId} className="flex items-center gap-2 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-trail-900">{l.name}</div>
                <div className="text-xs text-trail-500">
                  {(l.calories * l.qty).toLocaleString()} cal · {fmtWeight(l.weightOz * l.qty)} ·{' '}
                  {fmtMoney(l.cost * l.qty)}
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
            </li>
          ))}
        </ul>
      )}
    </section>
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
