import { Link } from 'react-router-dom'
import { Logo } from '../../components/ui'

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Logo className="h-9 w-9 text-trail-600" />
        <h1 className="text-2xl font-extrabold text-trail-900">About Trailmix</h1>
      </div>

      <div className="card space-y-4 p-5 text-sm leading-relaxed text-trail-700">
        <p>
          <strong>Trailmix</strong> is a resupply &amp; nutrition planner for thru-hikers — think{' '}
          <em>“LighterPack, but for food.”</em> Break a long hike into resupply segments, build each segment&apos;s food
          from the library, and instantly see calories, <strong>calories-per-ounce</strong>, weight, and cost. Trailmix
          flags any segment that&apos;s undercalorie or too heavy, and generates shopping lists and mail-drop
          instructions with hold-until dates.
        </p>
        <p>
          It also plans <strong>water carries</strong> (folded into your total pack weight of base + food + water),
          tracks optional <strong>macros</strong>, suggests <strong>weight-saving swaps</strong>, and has an{' '}
          <strong>on-trail mode</strong> to check off food as you eat it. Share a plan with a link and a friend can fork
          it in one tap — no account required.
        </p>

        <div>
          <h2 className="mb-1 font-bold text-trail-900">Works offline</h2>
          <p>
            Everything lives on your device (IndexedDB) and the app is an installable PWA, so your plan opens on the
            trail with no signal. Plan in town on wifi; reference it anywhere.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-bold text-trail-900">Private by default</h2>
          <p>
            No account, no server, no tracking. Your plans never leave your device unless you export them. Use{' '}
            <Link to="/" className="text-trail-700 underline">
              Export backup
            </Link>{' '}
            to save or move your data as JSON.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-bold text-trail-900">A note on numbers</h2>
          <p>
            Food values are planning estimates you can edit freely in the{' '}
            <Link to="/foods" className="text-trail-700 underline">
              Food Library
            </Link>
            . Trailmix is a planning aid, not medical or nutritional advice — hike your own hike.
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link to="/" className="btn-primary">
          Start planning →
        </Link>
      </div>
    </div>
  )
}
