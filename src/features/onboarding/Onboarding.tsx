import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Modal from '../../components/Modal'
import { Logo } from '../../components/ui'
import { templates } from '../../data/templates'
import { createHikeFromTemplate } from '../../db/repo'
import { todayISO } from '../../lib/format'

const KEY = 'trailmix-onboarded'

const STEPS = [
  {
    icon: '🥾',
    title: 'Welcome to Trailmix',
    body: 'Plan the food — and water — for a long-distance hike. Everything works offline and stays on your device.',
  },
  {
    icon: '⚖️',
    title: 'Segments, cal/oz & water',
    body: 'Break your hike into resupply segments. Trailmix dials in calories-per-ounce, folds your worst water carry into total pack weight, and flags anything undercalorie or heavy.',
  },
  {
    icon: '🔗',
    title: 'Yours, and shareable',
    body: 'No account, no server. Export a backup any time, or share a link a friend can fork in one tap.',
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(() => localStorage.getItem(KEY) == null)
  const [step, setStep] = useState(0)

  function done() {
    localStorage.setItem(KEY, '1')
    setOpen(false)
  }

  async function forkSample() {
    const t = templates[0]
    localStorage.setItem(KEY, '1')
    setOpen(false)
    if (t) {
      const id = await createHikeFromTemplate(t, todayISO())
      navigate(`/hikes/${id}`)
    }
  }

  const s = STEPS[step]
  const last = step === STEPS.length - 1

  return (
    <Modal open={open} onClose={done} title="Getting started">
      <div className="min-h-[9rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="text-4xl">{s.icon}</div>
            <h3 className="text-lg font-bold text-trail-900">{s.title}</h3>
            <p className="max-w-sm text-sm text-trail-600">{s.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {STEPS.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-trail-600' : 'w-1.5 bg-trail-200'}`} />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        <button className="btn-ghost text-trail-500" onClick={done}>
          Skip
        </button>
        <div className="flex gap-2">
          {step > 0 && (
            <button className="btn-outline" onClick={() => setStep((v) => v - 1)}>
              Back
            </button>
          )}
          {!last ? (
            <button className="btn-primary" onClick={() => setStep((v) => v + 1)}>
              Next
            </button>
          ) : (
            <button className="btn-primary" onClick={() => void forkSample()}>
              <Logo className="h-4 w-4" /> Fork a sample plan
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
