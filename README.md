# Trailmix 🥾

A resupply & nutrition planner for thru-hikers — **"LighterPack, but for food and resupply."**

Plan a long-distance hike (AT / PCT / CDT) as a series of resupply **segments**, build each
segment's food from a nutrition database, optimize for **calories-per-ounce** and cost, and
generate shopping lists + mail-drop instructions. Works **fully offline** on trail.

## Status

Early / pre-MVP. See the full spec in **[docs/PRD.md](docs/PRD.md)** — used for goal setting.

## Stack

- React 18 + TypeScript + Vite
- Offline-first PWA (vite-plugin-pwa / Workbox)
- IndexedDB via Dexie.js (local-first, no server needed for MVP)
- Tailwind CSS
- Deploys free on Cloudflare Pages / Netlify

## Why it can run for ~$0

Local-first + static hosting means near-zero infra cost, and offline is also the *correct*
design for users who plan on wifi but reference on-trail with no signal. See PRD §9.

## Getting started

> Project scaffold not created yet. Planned:

```bash
npm create vite@latest . -- --template react-ts
npm install
npm run dev
```

## Roadmap

- **P0 (MVP):** hikes → segments → food library → live cal/oz totals & warnings → shopping list + mail-drop → offline PWA
- **P1:** share/fork links, CSV export, optional sync
- **P2:** community templates, swap-suggestion engine, LighterPack import

Full details, personas, data model, and metrics in [docs/PRD.md](docs/PRD.md).
