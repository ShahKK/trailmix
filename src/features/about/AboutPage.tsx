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
          Trailmix helps you sort out food for a long hike. If you&apos;ve used LighterPack for gear, this is the same
          thing for food. You split the hike into resupplies, build each one from your food list, and watch the
          calories, calories per ounce, weight, and cost add up as you go. When a stretch is short on food or heavier
          than it should be, it says so. Then it turns your plan into a town shopping list or mail-drop notes with the
          dates to hold each box.
        </p>
        <p>
          It handles water too. Tell it your dry carries and it adds the heaviest one to your pack weight, since water
          is about 2.2 pounds a liter and that number matters. You can track protein and other macros if you care
          about them, take swap ideas that shave weight without losing calories, and flip to trail mode to tick off
          food as you eat it. Want to compare notes with a friend? Send them a link and they can pull the whole plan
          into their own app. No sign-up anywhere.
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
            The food numbers are rough estimates and you can change any of them in the{' '}
            <Link to="/foods" className="text-trail-700 underline">
              Food Library
            </Link>
            . This is a planning tool, not medical or nutrition advice. Hike your own hike.
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
