import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Hike, type Segment } from '../../db/db'
import { addSegment, deleteSegment, duplicateSegment, reorderSegment, updateHike } from '../../db/repo'
import {
  buildFoodLines,
  holdUntilDate,
  segmentArrivalDates,
  summarizeSegment,
  type FoodLine,
} from '../../lib/calc'
import { exportHikeCSV } from '../../lib/exportImport'
import { fmtCal, fmtDate, fmtMoney, fmtWeight } from '../../lib/format'
import Modal from '../../components/Modal'
import { Field, NumberInput, Select, TextArea, TextInput } from '../../components/fields'
import { EmptyState, SectionTitle, StatBox, StatusBadge } from '../../components/ui'

export default function HikeDetailPage() {
  const { hikeId } = useParams()
  const id = Number(hikeId)
  const hike = useLiveQuery(() => db.hikes.get(id), [id])
  const segments = useLiveQuery(() => db.segments.where('hikeId').equals(id).sortBy('order'), [id])
  const foods = useLiveQuery(() => db.foods.toArray(), [])
  const segmentFoods = useLiveQuery(() => db.segmentFoods.toArray(), [])
  const [showAdd, setShowAdd] = useState(false)

  const foodsById = useMemo(() => new Map((foods ?? []).map((f) => [f.id!, f])), [foods])
  const linesBySegment = useMemo(() => {
    const m = new Map<number, FoodLine[]>()
    for (const seg of segments ?? []) {
      const sfs = (segmentFoods ?? []).filter((sf) => sf.segmentId === seg.id)
      m.set(seg.id!, buildFoodLines(sfs, foodsById))
    }
    return m
  }, [segments, segmentFoods, foodsById])

  const arrivals = useMemo(
    () => (hike && segments ? segmentArrivalDates(hike.startDate, segments) : new Map<number, Date>()),
    [hike, segments],
  )

  if (hike === undefined) return <p className="text-trail-500">Loading…</p>
  if (hike === null)
    return (
      <EmptyState title="Hike not found">
        <Link className="text-trail-700 underline" to="/">
          Back to your hikes
        </Link>
      </EmptyState>
    )

  const totals = (segments ?? []).reduce(
    (acc, seg) => {
      const s = summarizeSegment(seg, hike, linesBySegment.get(seg.id!) ?? [])
      return {
        miles: acc.miles + seg.miles,
        days: acc.days + s.days,
        weightOz: acc.weightOz + s.weightOz,
        calories: acc.calories + s.caloriesPacked,
        cost: acc.cost + s.cost,
      }
    },
    { miles: 0, days: 0, weightOz: 0, calories: 0, cost: 0 },
  )

  return (
    <div className="space-y-6">
      <div className="no-print">
        <Link to="/" className="text-sm text-trail-600 hover:underline">
          ← All hikes
        </Link>
      </div>

      <HikeSettings hike={hike} />

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatBox label="Total miles" value={totals.miles.toFixed(0)} />
        <StatBox label="Days on trail" value={totals.days} hint="sum of segments" />
        <StatBox label="Food weight" value={fmtWeight(totals.weightOz)} />
        <StatBox label="Food cost" value={fmtMoney(totals.cost)} />
      </section>

      <section>
        <SectionTitle
          right={
            <div className="flex gap-2">
              <button className="btn-ghost text-trail-600" onClick={() => void exportHikeCSV(hike)}>
                Export CSV
              </button>
              <button className="btn-primary" onClick={() => setShowAdd(true)}>
                + Segment
              </button>
            </div>
          }
        >
          Resupply segments
        </SectionTitle>

        {segments && segments.length === 0 && (
          <EmptyState title="No segments yet">
            Add a resupply segment — the stretch between two towns. Trailmix works out how many days of food you need and
            flags anything undercalorie or too heavy.
          </EmptyState>
        )}

        <div className="space-y-3">
          {segments?.map((seg, i) => (
            <SegmentRow
              key={seg.id}
              hike={hike}
              seg={seg}
              lines={linesBySegment.get(seg.id!) ?? []}
              arrival={arrivals.get(seg.id!)}
              isFirst={i === 0}
              isLast={i === segments.length - 1}
            />
          ))}
        </div>
      </section>

      <AddSegmentModal hikeId={id} open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}

function HikeSettings({ hike }: { hike: Hike }) {
  const [form, setForm] = useState(hike)
  useEffect(() => setForm(hike), [hike.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function upd(patch: Partial<Hike>) {
    setForm((f) => ({ ...f, ...patch }))
    void updateHike(hike.id!, patch)
  }

  return (
    <div className="card p-4">
      <input
        value={form.name}
        onChange={(e) => upd({ name: e.target.value })}
        className="w-full border-none bg-transparent text-2xl font-extrabold text-trail-900 focus:outline-none"
        aria-label="Hike name"
      />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Trail">
          <TextInput value={form.trail} onChange={(e) => upd({ trail: e.target.value })} />
        </Field>
        <Field label="Start date">
          <TextInput type="date" value={form.startDate} onChange={(e) => upd({ startDate: e.target.value })} />
        </Field>
        <Field label="Cal / day">
          <NumberInput
            value={form.dailyCalTarget}
            onChange={(e) => upd({ dailyCalTarget: Number(e.target.value) })}
            step={100}
          />
        </Field>
        <Field label="Cal / oz goal">
          <NumberInput value={form.targetCalOz} onChange={(e) => upd({ targetCalOz: Number(e.target.value) })} step={5} />
        </Field>
      </div>
    </div>
  )
}

function SegmentRow({
  hike,
  seg,
  lines,
  arrival,
  isFirst,
  isLast,
}: {
  hike: Hike
  seg: Segment
  lines: FoodLine[]
  arrival: Date | undefined
  isFirst: boolean
  isLast: boolean
}) {
  const s = summarizeSegment(seg, hike, lines)
  const cpoTone = s.status === 'heavy' ? 'warn' : s.status === 'undercalorie' ? 'bad' : 'good'

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/hikes/${hike.id}/segments/${seg.id}`} className="font-bold text-trail-900 hover:underline">
              {seg.name}
            </Link>
            <StatusBadge status={s.status} />
          </div>
          <p className="text-xs text-trail-500">
            {seg.miles} mi @ {seg.miPerDay} mi/day · {s.days} days ·{' '}
            {seg.resupplyType === 'maildrop' ? '📦 mail drop' : '🛒 buy in town'}
          </p>
        </div>
        <div className="no-print flex items-center gap-1">
          <button
            className="btn-ghost px-2 py-1 text-trail-500 disabled:opacity-30"
            disabled={isFirst}
            onClick={() => void reorderSegment(hike.id!, seg.id!, -1)}
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            className="btn-ghost px-2 py-1 text-trail-500 disabled:opacity-30"
            disabled={isLast}
            onClick={() => void reorderSegment(hike.id!, seg.id!, 1)}
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            className="btn-ghost px-2 py-1 text-trail-500"
            onClick={() => void duplicateSegment(seg.id!)}
            aria-label="Duplicate"
          >
            ⧉
          </button>
          <button
            className="btn-ghost px-2 py-1 text-red-600 hover:bg-red-50"
            onClick={() => confirm(`Delete segment "${seg.name}"?`) && void deleteSegment(seg.id!)}
            aria-label="Delete"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <StatBox label="Cal/oz" value={s.calPerOz.toFixed(0)} hint={`goal ${hike.targetCalOz}`} tone={cpoTone} />
        <StatBox
          label="Calories"
          value={fmtCal(s.caloriesPacked)}
          hint={`need ${fmtCal(s.caloriesNeeded)}`}
          tone={s.status === 'undercalorie' ? 'bad' : 'default'}
        />
        <StatBox label="Cal / day" value={fmtCal(s.caloriesPerDay)} />
        <StatBox label="Weight" value={fmtWeight(s.weightOz)} />
        <StatBox label="Cost" value={fmtMoney(s.cost)} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-trail-600">
        <span>
          Est. arrival: <strong>{fmtDate(arrival)}</strong>
          {seg.resupplyType === 'maildrop' && (
            <>
              {' '}
              · mail so it&apos;s held until <strong>{fmtDate(holdUntilDate(arrival))}</strong>
            </>
          )}
        </span>
        {s.warnings.length > 0 && <span className="text-amber-700">⚠ {s.warnings.join(' · ')}</span>}
        <Link to={`/hikes/${hike.id}/segments/${seg.id}`} className="text-trail-700 underline">
          Build food →
        </Link>
      </div>
    </div>
  )
}

function AddSegmentModal({ hikeId, open, onClose }: { hikeId: number; open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [miles, setMiles] = useState(30)
  const [miPerDay, setMiPerDay] = useState(12)
  const [resupplyType, setType] = useState<'town' | 'maildrop'>('town')
  const [maildropAddress, setAddr] = useState('')
  const [notes, setNotes] = useState('')

  async function submit() {
    if (!name.trim()) return
    await addSegment(hikeId, {
      name: name.trim(),
      miles,
      miPerDay,
      resupplyType,
      maildropAddress: resupplyType === 'maildrop' ? maildropAddress : undefined,
      notes: notes.trim() || undefined,
    })
    setName('')
    setMiles(30)
    setNotes('')
    setAddr('')
    setType('town')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add resupply segment">
      <div className="space-y-3">
        <Field label="Segment name (town to town)">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Neels Gap → Hiawassee" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Trail miles">
            <NumberInput value={miles} onChange={(e) => setMiles(Number(e.target.value))} min={0} step={1} />
          </Field>
          <Field label="Planned miles / day">
            <NumberInput value={miPerDay} onChange={(e) => setMiPerDay(Number(e.target.value))} min={1} step={1} />
          </Field>
        </div>
        <Field label="Resupply type">
          <Select value={resupplyType} onChange={(e) => setType(e.target.value as 'town' | 'maildrop')}>
            <option value="town">Buy in town</option>
            <option value="maildrop">Mail drop</option>
          </Select>
        </Field>
        {resupplyType === 'maildrop' && (
          <Field label="Mail-drop address (hold for hiker)">
            <TextArea value={maildropAddress} onChange={(e) => setAddr(e.target.value)} rows={2} />
          </Field>
        )}
        <Field label="Notes (optional)">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => void submit()} disabled={!name.trim()}>
            Add segment
          </button>
        </div>
      </div>
    </Modal>
  )
}
