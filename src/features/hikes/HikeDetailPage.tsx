import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { db, type Hike, type Segment } from '../../db/db'
import {
  addSegment,
  deleteSegment,
  duplicateSegment,
  persistSegmentOrder,
  restoreSegment,
  snapshotSegment,
  updateHike,
} from '../../db/repo'
import {
  buildFoodLines,
  holdUntilDate,
  litersToOz,
  packWeight,
  segmentArrivalDates,
  summarizeSegment,
  worstCarry,
  type FoodLine,
} from '../../lib/calc'
import { exportHikeCSV } from '../../lib/exportImport'
import { buildSharedHike, encodeSharedHike } from '../../lib/share'
import { fmtCal, fmtDate, fmtMoney, fmtWeight } from '../../lib/format'
import { notifyError, notifySuccess, notifyUndo } from '../../lib/toast'
import { Field, NumberInput, Select, TextArea, TextInput } from '../../components/fields'
import { EmptyState, SectionTitle, StatBox, StatusBadge } from '../../components/ui'
import AnimatedNumber from '../../components/AnimatedNumber'
import Modal from '../../components/Modal'
import { ListSkeleton } from '../../components/Skeleton'

export default function HikeDetailPage() {
  const { hikeId } = useParams()
  const id = Number(hikeId)
  const hike = useLiveQuery(() => db.hikes.get(id), [id])
  const segments = useLiveQuery(() => db.segments.where('hikeId').equals(id).sortBy('order'), [id])
  const foods = useLiveQuery(() => db.foods.toArray(), [])
  const segmentFoods = useLiveQuery(() => db.segmentFoods.toArray(), [])
  const water = useLiveQuery(() => db.waterCarries.toArray(), [])
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

  const worstBySegment = useMemo(() => {
    const m = new Map<number, number>()
    for (const seg of segments ?? []) {
      const carries = (water ?? []).filter((w) => w.segmentId === seg.id)
      m.set(seg.id!, worstCarry(carries))
    }
    return m
  }, [segments, water])

  const arrivals = useMemo(
    () => (hike && segments ? segmentArrivalDates(hike.startDate, segments) : new Map<number, Date>()),
    [hike, segments],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (hike === undefined) return <ListSkeleton rows={3} />
  if (hike === null)
    return (
      <EmptyState title="Hike not found">
        <Link className="text-trail-700 underline" to="/">
          Back to your hikes
        </Link>
      </EmptyState>
    )

  const baseOz = hike.baseWeightOz ?? 0
  const totals = (segments ?? []).reduce(
    (acc, seg) => {
      const s = summarizeSegment(seg, hike, linesBySegment.get(seg.id!) ?? [])
      const worst = worstBySegment.get(seg.id!) ?? 0
      const pack = packWeight(baseOz, s.weightOz, worst)
      return {
        miles: acc.miles + seg.miles,
        days: acc.days + s.days,
        weightOz: acc.weightOz + s.weightOz,
        calories: acc.calories + s.caloriesPacked,
        cost: acc.cost + s.cost,
        heaviest: Math.max(acc.heaviest, pack.totalOz),
      }
    },
    { miles: 0, days: 0, weightOz: 0, calories: 0, cost: 0, heaviest: 0 },
  )

  async function onShare() {
    const sh = await buildSharedHike(id)
    if (!sh) return
    const blob = encodeSharedHike(sh)
    const url = `${window.location.origin}${window.location.pathname}#/shared/${blob}`
    try {
      await navigator.clipboard.writeText(url)
      notifySuccess('Share link copied to clipboard')
    } catch {
      notifyError('Could not copy — link is very long')
    }
  }

  function onDelete(seg: Segment) {
    void (async () => {
      const snap = await snapshotSegment(seg.id!)
      await deleteSegment(seg.id!)
      notifyUndo(`Deleted “${seg.name}”`, () => snap && void restoreSegment(snap))
    })()
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id || !segments) return
    const ids = segments.map((s) => s.id!)
    const from = ids.indexOf(Number(active.id))
    const to = ids.indexOf(Number(over.id))
    void persistSegmentOrder(arrayMove(ids, from, to))
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <Link to="/" className="text-sm text-trail-600 hover:underline">
          ← All hikes
        </Link>
        <div className="flex gap-2">
          <Link to={`/hikes/${id}/trail`} className="btn-outline">
            ⛺ Trail mode
          </Link>
          <button className="btn-ghost text-trail-600" onClick={() => void onShare()}>
            🔗 Share
          </button>
        </div>
      </div>

      <HikeSettings hike={hike} />

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <StatBox label="Total miles" value={<AnimatedNumber value={totals.miles} format={(n) => n.toFixed(0)} />} />
        <StatBox label="Days on trail" value={<AnimatedNumber value={totals.days} format={(n) => n.toFixed(0)} />} />
        <StatBox label="Food weight" value={<AnimatedNumber value={totals.weightOz} format={fmtWeight} />} />
        <StatBox
          label="Heaviest load"
          value={<AnimatedNumber value={totals.heaviest} format={fmtWeight} />}
          hint={baseOz ? 'base + food + water' : 'set base weight'}
        />
        <StatBox label="Food cost" value={<AnimatedNumber value={totals.cost} format={fmtMoney} />} />
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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={(segments ?? []).map((s) => s.id!)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {segments?.map((seg) => (
                <SegmentRow
                  key={seg.id}
                  hike={hike}
                  seg={seg}
                  lines={linesBySegment.get(seg.id!) ?? []}
                  worstLiters={worstBySegment.get(seg.id!) ?? 0}
                  baseOz={baseOz}
                  arrival={arrivals.get(seg.id!)}
                  onDelete={() => onDelete(seg)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
        <Field label="Base weight (oz)">
          <NumberInput
            value={form.baseWeightOz ?? 0}
            onChange={(e) => upd({ baseWeightOz: Number(e.target.value) })}
            step={1}
          />
        </Field>
        <Field label="Protein goal (g/day)">
          <NumberInput
            value={form.proteinTargetG ?? 0}
            onChange={(e) => upd({ proteinTargetG: Number(e.target.value) || undefined })}
            step={10}
          />
        </Field>
      </div>
    </div>
  )
}

function SegmentRow({
  hike,
  seg,
  lines,
  worstLiters,
  baseOz,
  arrival,
  onDelete,
}: {
  hike: Hike
  seg: Segment
  lines: FoodLine[]
  worstLiters: number
  baseOz: number
  arrival: Date | undefined
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: seg.id! })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined }
  const s = summarizeSegment(seg, hike, lines)
  const pack = packWeight(baseOz, s.weightOz, worstLiters)
  const cpoTone = s.status === 'heavy' ? 'warn' : s.status === 'undercalorie' ? 'bad' : 'good'

  return (
    <div ref={setNodeRef} style={style} className={`card p-4 ${isDragging ? 'shadow-lg ring-2 ring-trail-300' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <button
            className="no-print mt-0.5 cursor-grab touch-none text-trail-400 hover:text-trail-600 active:cursor-grabbing"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            ⠿
          </button>
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
              {worstLiters > 0 && <> · 💧 {worstLiters} L carry</>}
            </p>
          </div>
        </div>
        <div className="no-print flex items-center gap-1">
          <button
            className="btn-ghost px-2 py-1 text-trail-500"
            onClick={() => void duplicateSegment(seg.id!)}
            aria-label="Duplicate"
          >
            ⧉
          </button>
          <button className="btn-ghost px-2 py-1 text-red-600 hover:bg-red-50" onClick={onDelete} aria-label="Delete">
            ✕
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <StatBox label="Cal/oz" value={<AnimatedNumber value={s.calPerOz} format={(n) => n.toFixed(0)} />} hint={`goal ${hike.targetCalOz}`} tone={cpoTone} />
        <StatBox
          label="Calories"
          value={<AnimatedNumber value={s.caloriesPacked} />}
          hint={`need ${fmtCal(s.caloriesNeeded)}`}
          tone={s.status === 'undercalorie' ? 'bad' : 'default'}
        />
        <StatBox label="Food" value={<AnimatedNumber value={s.weightOz} format={fmtWeight} />} />
        <StatBox
          label="Pack load"
          value={<AnimatedNumber value={pack.totalOz} format={fmtWeight} />}
          hint={baseOz ? 'base+food+water' : undefined}
        />
        <StatBox label="Cost" value={<AnimatedNumber value={s.cost} format={fmtMoney} />} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-trail-600">
        <span>
          Est. arrival: <strong>{fmtDate(arrival)}</strong>
          {seg.resupplyType === 'maildrop' && (
            <>
              {' '}
              · hold until <strong>{fmtDate(holdUntilDate(arrival))}</strong>
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
