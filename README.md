# Trailmix 🥾

A resupply & nutrition planner for thru-hikers — **"LighterPack, but for food and resupply."**

Plan a long-distance hike (AT / PCT / CDT) as a series of resupply **segments**, build each
segment's food from a nutrition library, optimize for **calories-per-ounce** and cost, and
generate shopping lists + mail-drop instructions. **Works fully offline** on trail.

![Trailmix](public/pwa-192x192.png)

## Features

- **Segment planner** — break a hike into town-to-town legs; auto days-of-food from miles ÷ pace.
- **Live cal/oz math** — weight, calories, calories/day, cal-per-ounce and cost update as you build.
- **Smart warnings** — flags any segment that's *undercalorie* or *heavy* (below your cal/oz goal).
- **Food library** — ~190 seeded hiker staples across 10 categories; add/edit your own. Stored locally.
- **Shopping lists & mail drops** — grouped, checkable, printable; mail-drop hold-until dates from your pace.
- **Templates** — fork a ready-made plan (AT Springer→Fontana, PCT Campo→Warner Springs).
- **Offline-first PWA** — installable; opens with no signal. Plan in town, reference on trail.
- **Private & portable** — no account, no server. JSON backup export/import + per-hike CSV.

## Stack

React 18 + TypeScript + Vite · IndexedDB via Dexie.js · Tailwind CSS · `vite-plugin-pwa` (Workbox).
No backend — deploys as static files for ~$0.

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
npm run gen:icons  # regenerate PWA icons/favicon
```

## Deploy (free)

The build in `dist/` is fully static. Any of these work out of the box (the app uses a relative
base + `HashRouter`, so it runs at a domain root or a subpath):

- **Netlify / Cloudflare Pages** — build command `npm run build`, publish directory `dist`.
- **GitHub Pages** — `npm run build`, then publish `dist/` (e.g. via the Pages "deploy from a
  branch" flow or an Actions workflow).

## How it works

```
days_of_food    = ceil(segment_miles / miles_per_day)
calories_needed = days_of_food × daily_calorie_target
cal_per_oz      = Σ(calories) / Σ(weight_oz)
status          = OK unless undercalorie or below cal/oz goal
hold_until      = arrival_date + buffer   (mail drops)
```

Full product spec, personas, roadmap and data model are in **[docs/PRD.md](docs/PRD.md)**.
The next-level plan (water planning, macros, motion/animations, share & fork, on-trail mode) is in
**[docs/PRD-v2.md](docs/PRD-v2.md)**.

## Project structure

```
src/
  db/          Dexie schema, seeding, repository (all writes)
  data/        seed food library + trail templates
  lib/         segment math, formatters, export/import
  components/  layout + shared UI
  features/    hikes / segments / foods / about pages
scripts/       zero-dep PWA icon generator
```

## License

MIT — see [LICENSE](LICENSE). Trailmix is a planning aid, not medical or nutritional advice.
