import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { db, type Hike } from '../../db/db'
import { createHike, createHikeFromTemplate, deleteHike, restoreHike, snapshotHike } from '../../db/repo'
import { templates } from '../../data/templates'
import { buildSharedHike, encodeSharedHike } from '../../lib/share'
import { exportAllJSON, importAllJSON } from '../../lib/exportImport'
import { todayISO } from '../../lib/format'
import { notifyError, notifySuccess, notifyUndo, notify } from '../../lib/toast'
import Modal from '../../components/Modal'
import { Field, NumberInput, Select, TextInput } from '../../components/fields'
import { EmptyState, Logo, SectionTitle } from '../../components/ui'
import { ListSkeleton } from '../../components/Skeleton'
import Onboarding from '../onboarding/Onboarding'

export default function HikesPage() {
  const hikes = useLiveQuery(() => db.hikes.orderBy('createdAt').reverse().toArray(), [])
  const [showNew, setShowNew] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onImport(file: File) {
    if (!confirm('Importing a backup REPLACES all current plans and foods on this device. Continue?')) return
    try {
      await importAllJSON(file)
      notifySuccess('Backup imported')
    } catch (e) {
      notifyError(`Import failed: ${(e as Error).message}`)
    }
  }

  function onDelete(h: Hike) {
    void (async () => {
      const snap = await snapshotHike(h.id!)
      await deleteHike(h.id!)
      notifyUndo(`Deleted “${h.name}”`, () => snap && void restoreHike(snap))
    })()
  }

  return (
    <div className="space-y-6">
      <Onboarding />
      <section className="overflow-hidden rounded-2xl bg-trail-950 px-6 py-8 text-white">
        <div className="flex items-center gap-3">
          <Logo className="h-9 w-9 text-trail-400" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Plan your resupply</h1>
            <p className="text-sm text-trail-200">
              Split your hike into resupplies, see how heavy each stretch really is, and stop carrying food you never
              end up eating.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn bg-white text-trail-800 hover:bg-trail-50" onClick={() => setShowNew(true)}>
            + New hike
          </button>
          <button className="btn bg-trail-700 text-white hover:bg-trail-600" onClick={() => setShowTemplate(true)}>
            Start from a template
          </button>
        </div>
      </section>

      <section>
        <SectionTitle
          right={
            <div className="flex gap-2">
              <button className="btn-ghost text-trail-600" onClick={() => void exportAllJSON()}>
                Export backup
              </button>
              <button className="btn-ghost text-trail-600" onClick={() => fileRef.current?.click()}>
                Import
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void onImport(f)
                  e.target.value = ''
                }}
              />
            </div>
          }
        >
          Your hikes
        </SectionTitle>

        {hikes === undefined && <ListSkeleton rows={2} />}

        {hikes && hikes.length === 0 && (
          <EmptyState title="No hikes yet">
            Start one from scratch, or grab a template like <em>AT Springer to Fontana</em> and you&apos;ll have a full
            resupply plan to play with right away.
          </EmptyState>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {hikes?.map((h, i) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.25 }}
            >
              <HikeCard hike={h} onDelete={() => onDelete(h)} />
            </motion.div>
          ))}
        </div>
      </section>

      <NewHikeModal open={showNew} onClose={() => setShowNew(false)} />
      <TemplateModal open={showTemplate} onClose={() => setShowTemplate(false)} />
    </div>
  )
}

function HikeCard({ hike, onDelete }: { hike: Hike; onDelete: () => void }) {
  const segs = useLiveQuery(() => db.segments.where('hikeId').equals(hike.id!).toArray(), [hike.id])
  const miles = (segs ?? []).reduce((a, s) => a + s.miles, 0)

  async function share() {
    const sh = await buildSharedHike(hike.id!)
    if (!sh) return
    const url = `${window.location.origin}${window.location.pathname}#/shared/${encodeSharedHike(sh)}`
    try {
      await navigator.clipboard.writeText(url)
      notifySuccess('Share link copied')
    } catch {
      notify('Could not copy that, the link is really long')
    }
  }

  return (
    <div className="card flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <Link to={`/hikes/${hike.id}`} className="min-w-0">
          <h3 className="truncate font-bold text-trail-900 hover:underline">{hike.name}</h3>
          <p className="text-xs text-trail-500">{hike.trail}</p>
        </Link>
        <div className="flex shrink-0 gap-1">
          <button className="btn-ghost px-2 py-1 text-trail-500" onClick={() => void share()} aria-label="Share hike">
            🔗
          </button>
          <button
            className="btn-ghost px-2 py-1 text-red-600 hover:bg-red-50"
            onClick={onDelete}
            aria-label="Delete hike"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-trail-600">
        <span className="chip bg-trail-100 text-trail-700">{segs?.length ?? 0} segments</span>
        <span className="chip bg-trail-100 text-trail-700">{miles.toFixed(0)} mi</span>
        <span className="chip bg-trail-100 text-trail-700">{hike.dailyCalTarget.toLocaleString()} cal/day</span>
      </div>
      <Link to={`/hikes/${hike.id}`} className="btn-outline mt-4 self-start">
        Open plan →
      </Link>
    </div>
  )
}

function NewHikeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [trail, setTrail] = useState('')
  const [startDate, setStartDate] = useState(todayISO())
  const [dailyCalTarget, setDaily] = useState(3000)
  const [targetCalOz, setCalOz] = useState(110)

  async function submit() {
    if (!name.trim()) return
    const id = await createHike({
      name: name.trim(),
      trail: trail.trim() || 'Custom',
      startDate,
      dailyCalTarget,
      targetCalOz,
    })
    onClose()
    setName('')
    setTrail('')
    navigate(`/hikes/${id}`)
  }

  return (
    <Modal open={open} onClose={onClose} title="New hike">
      <div className="space-y-3">
        <Field label="Hike name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="My 2027 AT thru-hike" autoFocus />
        </Field>
        <Field label="Trail">
          <TextInput value={trail} onChange={(e) => setTrail(e.target.value)} placeholder="Appalachian Trail" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Daily calorie target">
            <NumberInput value={dailyCalTarget} onChange={(e) => setDaily(Number(e.target.value))} min={0} step={100} />
          </Field>
        </div>
        <Field label="Cal/oz goal (ultralight ≈ 125)">
          <NumberInput value={targetCalOz} onChange={(e) => setCalOz(Number(e.target.value))} min={0} step={5} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => void submit()} disabled={!name.trim()}>
            Create hike
          </button>
        </div>
      </div>
    </Modal>
  )
}

function TemplateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [startDate, setStartDate] = useState(todayISO())
  const [key, setKey] = useState(templates[0]?.key ?? '')

  async function fork() {
    const t = templates.find((x) => x.key === key)
    if (!t) return
    const id = await createHikeFromTemplate(t, startDate)
    onClose()
    navigate(`/hikes/${id}`)
  }

  const selected = templates.find((x) => x.key === key)

  return (
    <Modal open={open} onClose={onClose} title="Start from a template">
      <div className="space-y-3">
        <Field label="Template">
          <Select value={key} onChange={(e) => setKey(e.target.value)}>
            {templates.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        {selected && (
          <p className="rounded-lg bg-trail-50 p-3 text-sm text-trail-600">
            {selected.description}
            <span className="mt-1 block text-xs text-trail-500">
              {selected.segments.length} segments · {selected.dailyCalTarget.toLocaleString()} cal/day ·{' '}
              {selected.targetCalOz} cal/oz goal
            </span>
          </p>
        )}
        <Field label="Start date">
          <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => void fork()}>
            Fork this plan
          </button>
        </div>
      </div>
    </Modal>
  )
}
