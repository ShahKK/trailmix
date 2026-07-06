import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { decodeSharedHike, forkSharedHike, type SharedSegment } from '../../lib/share'
import { calPerOz, daysOfFood } from '../../lib/calc'
import { fmtCal, fmtMoney, fmtWeight } from '../../lib/format'
import { notifySuccess } from '../../lib/toast'
import { EmptyState, Logo, StatBox } from '../../components/ui'

function segStats(s: SharedSegment, dailyCal: number) {
  const weightOz = s.foods.reduce((a, f) => a + f.w * f.q, 0)
  const calories = s.foods.reduce((a, f) => a + f.k * f.q, 0)
  const cost = s.foods.reduce((a, f) => a + f.$ * f.q, 0)
  const days = daysOfFood(s.mi, s.mpd)
  return { weightOz, calories, cost, days, cpo: calPerOz(calories, weightOz), need: days * dailyCal }
}

export default function SharedPlanPage() {
  const { blob } = useParams()
  const navigate = useNavigate()
  const [forking, setForking] = useState(false)
  const sh = useMemo(() => (blob ? decodeSharedHike(blob) : null), [blob])

  if (!sh)
    return (
      <EmptyState title="This share link is invalid or corrupted">
        <Link className="text-trail-700 underline" to="/">
          Go to Trailmix
        </Link>
      </EmptyState>
    )

  async function fork() {
    if (!sh) return
    setForking(true)
    const id = await forkSharedHike(sh)
    notifySuccess('Forked to your hikes')
    navigate(`/hikes/${id}`)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-trail-950 px-6 py-7 text-white">
        <div className="flex items-center gap-3">
          <Logo className="h-9 w-9 text-trail-400" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-trail-300">Shared plan · read only</div>
            <h1 className="text-2xl font-extrabold">{sh.n}</h1>
            <p className="text-sm text-trail-200">
              {sh.tr} · {sh.segments.length} segments · {sh.dc.toLocaleString()} cal/day · {sh.co} cal/oz goal
            </p>
          </div>
        </div>
        <button className="btn mt-5 bg-white text-trail-800 hover:bg-trail-50" onClick={() => void fork()} disabled={forking}>
          {forking ? 'Forking…' : '⑂ Fork to my hikes'}
        </button>
      </section>

      <div className="space-y-3">
        {sh.segments.map((s, i) => {
          const st = segStats(s, sh.dc)
          const under = st.calories < st.need
          return (
            <div key={i} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-trail-900">{s.n}</h3>
                <span className="text-xs text-trail-500">
                  {s.mi} mi · {st.days} days · {s.rt === 'maildrop' ? '📦 mail drop' : '🛒 town'}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatBox label="Cal/oz" value={st.cpo.toFixed(0)} tone={st.cpo >= sh.co ? 'good' : 'warn'} />
                <StatBox label="Calories" value={fmtCal(st.calories)} tone={under ? 'bad' : 'default'} />
                <StatBox label="Food weight" value={fmtWeight(st.weightOz)} />
                <StatBox label="Cost" value={fmtMoney(st.cost)} />
              </div>
              {s.water.length > 0 && (
                <p className="mt-2 text-xs text-sky-700">
                  💧 {s.water.length} water carr{s.water.length === 1 ? 'y' : 'ies'} · worst{' '}
                  {Math.max(...s.water.map((w) => w.L))} L
                </p>
              )}
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-trail-600">{s.foods.length} food items</summary>
                <ul className="mt-2 space-y-0.5 text-trail-600">
                  {s.foods.map((f, j) => (
                    <li key={j}>
                      <span className="font-semibold">{f.q}×</span> {f.n}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-trail-500">
        Forking copies this plan (and any custom foods) into your own device. Your edits stay private.
      </p>
    </div>
  )
}
