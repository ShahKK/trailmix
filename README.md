# Trailmix 🥾

Food planning for long-distance hikes. If you've used LighterPack to dial in your gear, this is the
same idea for food and water.

![Trailmix](public/pwa-192x192.png)

## What it is

Planning food for a thru-hike is a pain. You're stuck in a spreadsheet trying to figure out how many
days of food you need to the next town, whether you're carrying enough calories without hauling dead
weight, and which boxes you have to mail ahead. Trailmix does that math for you and works offline, so
you can plan in town on wifi and still open it out on the trail with no signal.

You split a hike into resupplies, build each one from a food list, and watch the calories, calories
per ounce, weight and cost add up as you go. It warns you when a stretch is short on food or heavier
than it should be, plans your water carries into your pack weight, and turns the whole thing into a
shopping list or a mail drop with the dates to hold each box.

## What it does

- **Segment planner.** Break a hike into town to town legs. It works out how many days of food you need from your miles and pace.
- **Live weight math.** Weight, calories, calories per day, calories per ounce and cost update while you build.
- **Warnings.** It flags a segment when it's short on calories or too heavy for your cal/oz goal.
- **Food library.** Around 195 common hiker foods across 10 categories, and you can add or edit your own.
- **Shopping lists and mail drops.** Grouped, checkable, printable, with hold until dates worked out from your pace.
- **Templates.** Start from a ready made plan (AT Springer to Fontana, PCT Campo to Warner Springs).
- **Water carries.** Model your dry stretches. The heaviest carry (about 2.2 lb a liter) gets added to your pack weight.
- **Total pack weight.** Set a base weight and see your real heaviest load, which is base plus food plus water.
- **Macros.** Track protein, fat and carbs if you care about them, with a daily protein goal.
- **Swap ideas.** One tap suggestions that cut weight without losing calories.
- **Share and fork.** Send a friend a link. The whole plan travels in the URL, so they can copy it into their own app in one tap. No server involved.
- **Trail mode.** A stripped down view for the trail. Tick off food as you eat it and see what's left.
- **Yours and offline.** No account, no server, no tracking. Installable, and you can back up or move your data as JSON any time.

## Stack

React 18, TypeScript and Vite. Data lives in IndexedDB through Dexie. Styling is Tailwind, and it's an
installable PWA (vite-plugin-pwa with Workbox). Motion and interaction come from Framer Motion, dnd-kit,
sonner for toasts, and lz-string for the share links. There's no backend, so it deploys as static files
for about nothing.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # production build to dist/
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit
npm run gen:icons  # regenerate the PWA icons and favicon
```

## Deploy

The build in `dist/` is plain static files. It uses a relative base and a hash router, so it runs at a
domain root or a subpath without any config.

- **Netlify or Cloudflare Pages:** build command `npm run build`, publish directory `dist`.
- **GitHub Pages:** `npm run build`, then publish `dist/`.

## How it works

```
days of food    = ceil(segment miles / miles per day)
calories needed = days of food × daily calorie target
cal per oz      = total calories / total weight in oz
water weight    = heaviest carry in liters × 2.2 lb
pack weight     = base + food + water
status          = OK unless short on calories or under the cal/oz goal
```

The full write ups are in [docs/PRD.md](docs/PRD.md) (the first version) and
[docs/PRD-v2.md](docs/PRD-v2.md) (water, macros, sharing, trail mode and the motion work).

## Project structure

```
src/
  db/          Dexie schema, seeding, and all the writes
  data/        the seed food list and trail templates
  lib/         segment math, formatting, share links, export/import
  components/  layout and shared UI
  features/    hikes, segments, foods, trail mode, sharing, onboarding, about
scripts/       a zero dependency PWA icon generator
```

## License

MIT, see [LICENSE](LICENSE). Trailmix is a planning tool, not medical or nutrition advice.
