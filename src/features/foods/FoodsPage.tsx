import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type FoodCategory, type FoodItem } from '../../db/db'
import { addFood, deleteFood, updateFood } from '../../db/repo'
import { calPerOz } from '../../lib/calc'
import { fmtMoney, fmtOz } from '../../lib/format'
import Modal from '../../components/Modal'
import { Field, NumberInput, Select, TextInput } from '../../components/fields'
import { EmptyState, SectionTitle } from '../../components/ui'

const CATEGORIES: FoodCategory[] = [
  'Breakfast',
  'Dinner',
  'Bars',
  'Snacks',
  'Candy',
  'Nuts & Fats',
  'Meat',
  'Wraps',
  'Drinks',
  'Other',
]

export default function FoodsPage() {
  const foods = useLiveQuery(() => db.foods.orderBy('name').toArray(), [])
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<'all' | FoodCategory>('all')
  const [editing, setEditing] = useState<FoodItem | 'new' | null>(null)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (foods ?? []).filter(
      (f) => (cat === 'all' || f.category === cat) && (!needle || f.name.toLowerCase().includes(needle)),
    )
  }, [foods, q, cat])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-trail-900">Food Library</h1>
          <p className="text-sm text-trail-500">Edit values or add your own foods. Everything is stored on this device.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing('new')}>
          + Add food
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search foods…"
          className="max-w-xs"
        />
        <Select value={cat} onChange={(e) => setCat(e.target.value as 'all' | FoodCategory)} className="max-w-[12rem]">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      <SectionTitle>{filtered.length} items</SectionTitle>

      {filtered.length === 0 ? (
        <EmptyState title="No foods match">Try a different search, or add a custom food.</EmptyState>
      ) : (
        <div className="card divide-y divide-trail-100">
          {filtered.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-trail-900">{f.name}</span>
                  {f.source === 'custom' && <span className="chip bg-trail-100 text-trail-600">custom</span>}
                </div>
                <div className="text-xs text-trail-500">{f.category}</div>
              </div>
              <div className="hidden shrink-0 gap-4 text-xs text-trail-600 sm:flex">
                <span>{f.calories} cal</span>
                <span>{fmtOz(f.weightOz)}</span>
                <span className="font-semibold text-trail-800">{calPerOz(f.calories, f.weightOz).toFixed(0)} cal/oz</span>
                <span>{fmtMoney(f.cost)}</span>
              </div>
              <div className="flex shrink-0 gap-1">
                <button className="btn-ghost px-2 py-1 text-trail-600" onClick={() => setEditing(f)} aria-label="Edit">
                  ✎
                </button>
                <button
                  className="btn-ghost px-2 py-1 text-red-500 hover:bg-red-50"
                  onClick={() => confirm(`Delete "${f.name}"? This removes it from any segments.`) && void deleteFood(f.id!)}
                  aria-label="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FoodModal food={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function FoodModal({ food, onClose }: { food: FoodItem | 'new' | null; onClose: () => void }) {
  const isNew = food === 'new'
  return (
    <Modal open={food !== null} onClose={onClose} title={isNew ? 'Add food' : 'Edit food'}>
      {food !== null && (
        <FoodForm key={isNew ? 'new' : food.id} existing={isNew ? null : food} onDone={onClose} />
      )}
    </Modal>
  )
}

function FoodForm({ existing, onDone }: { existing: FoodItem | null; onDone: () => void }) {
  const [name, setName] = useState(existing?.name ?? '')
  const [category, setCategory] = useState<FoodCategory>(existing?.category ?? 'Snacks')
  const [weightOz, setWeight] = useState(existing?.weightOz ?? 1)
  const [calories, setCalories] = useState(existing?.calories ?? 100)
  const [cost, setCost] = useState(existing?.cost ?? 1)

  async function submit() {
    if (!name.trim()) return
    const data = { name: name.trim(), category, weightOz, calories, cost }
    if (existing?.id) await updateFood(existing.id, data)
    else await addFood(data)
    onDone()
  }

  return (
    <div className="space-y-3">
      <Field label="Name">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="Category">
        <Select value={category} onChange={(e) => setCategory(e.target.value as FoodCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Weight (oz)">
          <NumberInput value={weightOz} onChange={(e) => setWeight(Number(e.target.value))} min={0} step={0.1} />
        </Field>
        <Field label="Calories">
          <NumberInput value={calories} onChange={(e) => setCalories(Number(e.target.value))} min={0} step={10} />
        </Field>
        <Field label="Cost ($)">
          <NumberInput value={cost} onChange={(e) => setCost(Number(e.target.value))} min={0} step={0.25} />
        </Field>
      </div>
      <p className="rounded bg-trail-50 px-3 py-2 text-xs text-trail-600">
        {calPerOz(calories, weightOz).toFixed(0)} cal/oz
      </p>
      <div className="flex justify-end gap-2 pt-2">
        <button className="btn-outline" onClick={onDone}>
          Cancel
        </button>
        <button className="btn-primary" onClick={() => void submit()} disabled={!name.trim()}>
          {existing ? 'Save' : 'Add'}
        </button>
      </div>
    </div>
  )
}
