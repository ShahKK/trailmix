# Product Requirements Document — Trailmix

> **Trailmix** — a resupply & nutrition planner for thru-hikers.
> Positioning: **"LighterPack, but for food and resupply."**

| | |
|---|---|
| **Working name** | Trailmix |
| **Status** | Draft v1 |
| **Owner** | ShahKK |
| **Last updated** | 2026-07-04 |
| **Stack** | React + TypeScript + Vite, offline-first PWA |
| **Target infra cost** | ~$0 (domain only, ~$10/yr) |

---

## Table of contents

1. [Vision & problem statement](#1-vision--problem-statement)
2. [Why this niche / why now](#2-why-this-niche--why-now)
3. [Goals & success metrics](#3-goals--success-metrics)
4. [Target users / personas](#4-target-users--personas)
5. [Jobs-to-be-done / user stories](#5-jobs-to-be-done--user-stories)
6. [Feature requirements (prioritized)](#6-feature-requirements-prioritized)
7. [Core flow specs & formulas](#7-core-flow-specs--formulas)
8. [Data model](#8-data-model)
9. [Technical architecture (React, ~free)](#9-technical-architecture-react-free)
10. [Non-functional requirements](#10-non-functional-requirements)
11. [Monetization](#11-monetization)
12. [Go-to-market](#12-go-to-market)
13. [Roadmap & milestones](#13-roadmap--milestones)
14. [Risks & mitigations](#14-risks--mitigations)
15. [Open questions](#15-open-questions)
16. [Appendix: glossary](#16-appendix-glossary)

---

## 1. Vision & problem statement

Long-distance backpackers (Appalachian Trail, Pacific Crest Trail, Continental Divide Trail, and hundreds of shorter thru-hikes) face one genuinely miserable, recurring problem: **resupply planning.** Before and during a 2,000-mile hike they must repeatedly answer:

- How many days of food until the next town?
- How many calories/day, and can I hit that without carrying dead weight? (Ultralight hikers obsess over **calories-per-ounce**.)
- Do I buy in town, or mail myself a box to a post office / hostel with a "hold until" date?
- What's the shopping list, the box contents, and what does the whole trip cost?

Today this is done in **sprawling personal spreadsheets** and tribal knowledge traded on Reddit. Getting it wrong means going hungry 30 miles from a road, or hauling 3 lbs of extra food up a mountain.

**Trailmix** turns a hike into a series of resupply **segments**, lets hikers build each segment's food from a nutrition database, optimizes for **calories-per-ounce** and cost, generates **shopping lists** and **mail-drop instructions**, and works **fully offline** on trail. Plans are **shareable and forkable**, so the community seeds each other's plans for free.

## 2. Why this niche / why now

- **Desperate, specific pain** — a concrete, high-stakes, repeated workflow currently living in spreadsheets.
- **Cool + very in demand** — thru-hiking has exploded; r/Ultralight (~1M), r/AppalachianTrail, r/PacificCrestTrail are large and passionate.
- **Proven adoption pattern** — [LighterPack](https://lighterpack.com) is a free, beloved gear-planning tool hikers share in every forum thread. **Nobody has built the LighterPack of food & resupply.** That is the wedge, and the pitch is one sentence the community instantly understands.
- **Cheapest architecture is also the correct one** — hikers plan in town on wifi but reference the plan **on-trail with zero signal**, so a local-first offline PWA is both ~free to run and the right product.

**Non-goals (v1):** turn-by-turn navigation, live GPS, gear tracking (defer to LighterPack — integrate, don't compete), social feed, in-app food purchasing.

## 3. Goals & success metrics

| Goal | Metric | 12-month target |
|---|---|---|
| Prove demand cheaply | Signups (organic) | 5,000 |
| Real usage | Plans with ≥3 segments built | 1,500 |
| Viral loop works | % of plans shared via public link | ≥25% |
| Retention through a hike | Weekly-active during Mar–Sep (NOBO season) | 800 |
| Cost stays ~$0 | Monthly infra cost | < $5 |

## 4. Target users / personas

- **NOBO Nora (primary)** — first AT thru-hike, planning all winter, anxious about resupply, buys mostly in town, mails 3–4 boxes to tricky spots. Needs confidence and a shopping list.
- **Ultralight Uli** — veteran, min-maxes cal/oz, imports custom foods, wants CSV export and a shareable list to share in forums.
- **Section-hiker Sam** — does 4–7 day sections; the "days of food for this segment" calculator alone is worth it.

## 5. Jobs-to-be-done / user stories

- *When I map my hike,* I want to break it into resupply segments with distance and pace **so I know how many days of food each leg needs.**
- *When I build a segment,* I want to add foods with weight/calories/cost **so I see total weight, calories, cal/oz, and cost update live.**
- *When a segment is too heavy or under-calorie,* I want the app to **flag it and suggest swaps** (higher cal/oz items).
- *When I resupply by mail,* I want a **box contents list, the mailing address, and a "hold until" date** derived from my pace.
- *When I'm in town,* I want a **printable/exportable shopping list** grouped for easy shopping.
- *When I'm on trail with no signal,* I want to **open my plan offline.**
- *When I'm nervous,* I want to **copy a proven hiker's public plan** as my starting point.

## 6. Feature requirements (prioritized)

### P0 — MVP (the thing worth shipping)
- Create a hike → add ordered **resupply segments** (name, trail miles, planned mi/day → auto days-of-food).
- **Food library:** searchable nutrition DB + user-added custom foods (name, serving weight g/oz, calories, cost, category).
- **Segment builder:** add foods × quantity; live totals for **weight, calories, calories/day, cal/oz, cost.**
- **Targets & warnings:** per-hiker daily-calorie target and cal/oz goal; red/green flags per segment.
- **Local-first storage + offline PWA** (installable, works with no signal).
- **Shopping list** per buy-in-town segment (grouped, exportable/printable).
- **Mail-drop mode** per segment: address field, computed hold-until date, box contents checklist.

### P1 — Growth & retention
- **Public share links** (read-only) + **"Fork this plan."**
- **CSV / print export**; **"days remaining" on-trail view.**
- Duplicate segment / duplicate whole hike; reorder via drag.
- Optional account + cross-device **sync**.

### P2 — Delight / moat
- Community **template plans** for popular trails (crowdsourced, user-editable).
- **Swap suggestions** engine ("replace X to gain 40 cal/oz").
- **LighterPack import** (pull pack base weight so total = base + food weight).
- Affiliate deep-links to common trail foods.

## 7. Core flow specs & formulas

Segment math is the core value:

```
days_of_food     = ceil(segment_miles / planned_miles_per_day)
calories_needed  = days_of_food × daily_calorie_target
calories_packed  = Σ(food.calories × qty)
food_weight_oz   = Σ(food.weight_oz × qty)
cal_per_oz       = calories_packed / food_weight_oz
status:
  OK   if calories_packed ≥ calories_needed AND cal_per_oz ≥ target_cal_oz
  WARN if calories_packed < calories_needed            (undercalorie)
  HEAVY if cal_per_oz < target_cal_oz                  (below cal/oz goal)
hold_until_date  = start_date + cumulative_days_to_this_town + buffer_days
```

**Cold-start solution:** ship 8–10 seed "template plans" for the AT/PCT/CDT and a ~500-item hiker-food starter library (ramen, Knorr sides, tortillas, peanut butter, bars, dehydrated meals). New users **fork a template** instead of facing a blank page.

## 8. Data model

Local-first; each entity persisted in IndexedDB and serializable to JSON for sync/export.

```ts
Hike        { id, name, trail, startDate, dailyCalTarget, targetCalOz }
Segment     { id, hikeId, order, name, miles, miPerDay,
              resupplyType: 'town' | 'maildrop', maildropAddress?, notes }
FoodItem    { id, name, category, weightOz, calories, cost,
              source: 'seed' | 'custom', ownerId? }
SegmentFood { id, segmentId, foodId, qty }
SharePlan   { publicId, hikeSnapshotJson, forkable: boolean }
```

## 9. Technical architecture (React, ~free)

| Layer | Choice | Cost |
|---|---|---|
| Framework | **React 18 + TypeScript + Vite** | $0 |
| PWA / offline | **vite-plugin-pwa** (Workbox service worker), installable, offline shell | $0 |
| Local storage | **IndexedDB via Dexie.js** (offline-first; no server needed for MVP) | $0 |
| State | Zustand or React Query (local); keep it light | $0 |
| Styling | Tailwind CSS | $0 |
| Routing | React Router | $0 |
| Hosting | **Cloudflare Pages** or Netlify (static build) | $0 |
| Nutrition data | **USDA FoodData Central** free bulk download, pre-processed into bundled/queryable JSON — **no metered API** | $0 |
| Trail/town data | User-editable + crowdsourced seeds (avoid licensed datasets like FarOut) | $0 |
| Sharing/sync (P1) | Cloudflare **D1** or **Supabase** free tier for public plan JSON + optional auth | $0 within free tier |
| Analytics | Cloudflare Web Analytics or self-hosted Plausible | $0 |
| Domain | only real recurring cost | ~$10/yr |

**Why local-first wins twice:** (1) no per-user server cost as the app grows, and (2) it is the only design that works where users actually are — off-grid. Sync is *additive*, gated behind free tiers, and never on the MVP critical path.

**Suggested project structure**

```
trailmix/
├─ docs/PRD.md
├─ public/            # PWA icons, manifest
├─ src/
│  ├─ app/            # routes, layout
│  ├─ features/
│  │  ├─ hikes/
│  │  ├─ segments/
│  │  ├─ foods/
│  │  ├─ shopping/
│  │  └─ maildrop/
│  ├─ db/             # Dexie schema + queries
│  ├─ lib/            # segment math, formatters
│  ├─ data/           # seed food library + template plans (JSON)
│  └─ components/     # shared UI
├─ vite.config.ts
└─ package.json
```

## 10. Non-functional requirements

- **Offline-first:** full read/edit with zero connectivity; sync opportunistically when online.
- **Fast:** food search < 100ms on a mid-range phone (local index).
- **Private by default:** plans stay local until the user explicitly shares.
- **Portable:** one-click JSON/CSV export so users never feel locked in (builds trust in a spreadsheet-native community).
- **Responsive/mobile-first:** primary device on trail is a phone.

## 11. Monetization (lean, adds no infra cost)

1. **Free core, forever** — mirrors LighterPack's goodwill → adoption.
2. **Affiliate links** to trail food/gear (Amazon, REI, dehydrated-meal brands) — zero infrastructure.
3. **Optional "Trailmix Pro"** (one-time or ~$3/mo): custom-DB import, unlimited plans, print-optimized mail-drop labels, priority sync. Never gate the viral loop behind it.
4. **"Buy me a coffee"** donations — this community reliably tips beloved free tools.

## 12. Go-to-market (free channels only)

- **Seasonality is the ally:** NOBO hikers plan Dec–Mar for a spring start. Launch **late fall** into that window.
- Build-in-public updates + finished tool in **r/Ultralight, r/AppalachianTrail, r/PacificCrestTrail, r/CampingandHiking**, and thru-hike Facebook groups.
- **Ride LighterPack's coattails:** "the food companion to LighterPack." Add LighterPack import to earn a community mention.
- **Shareable public plans = built-in growth** — every forum "here's my resupply plan" link is an ad.
- **Creator seeding:** thru-hiking YouTubers love free planning tools; send early access.

## 13. Roadmap & milestones

| Phase | Scope | Est. effort (solo) |
|---|---|---|
| **0. Spike** | USDA data → bundled searchable JSON; segment-math prototype | ~1 wk |
| **1. MVP (P0)** | Offline PWA, hikes/segments/foods, live totals, shopping + mail-drop, seed templates | ~4–6 wks |
| **2. Growth (P1)** | Share/fork links, export, sync + optional auth | ~3 wks |
| **3. Moat (P2)** | Community templates, swap engine, LighterPack import, affiliates | ongoing |

### Milestone acceptance criteria

- **M1 (MVP done):** a user can create a hike, add 3 segments, build food for each from the library, see live cal/oz + warnings, generate a shopping list and a mail-drop box list, and open it all offline after reload.
- **M2 (Growth):** a user can share a read-only link and another user can fork it; plans export to CSV.
- **M3 (Moat):** a new user can fork an AT template and be productive in < 2 minutes.

## 14. Risks & mitigations

| Risk | Mitigation |
|---|---|
| "It's just a spreadsheet" | Win on **offline reference + cal/oz warnings + shareable/forkable plans** — things a spreadsheet can't do on trail. |
| Cold-start blank page | Seed template plans + starter food library; fork-to-start. |
| Data licensing (trail/town info) | Use only free/public + user-generated data; keep everything user-editable. |
| Free tier blown by success | Local-first means server load barely grows; sharing/sync are the only server paths and start on generous free tiers. |
| Nutrition accuracy/liability | Data is a planning aid; show source, allow edits, add a "not medical advice" note. |

## 15. Open questions

1. Which trails to seed first? (Recommend **AT + PCT** — largest, most anxious first-timers.)
2. Sync in v1 or defer? (Recommend **defer**; ship offline-only, add sync in P1.)
3. Pro tier at launch or after traction? (Recommend after traction.)

## 16. Appendix: glossary

- **NOBO / SOBO** — northbound / southbound thru-hike direction.
- **Resupply** — restocking food, usually in a trail town.
- **Mail drop** — a box of food mailed ahead to a post office/hostel with a hold date.
- **cal/oz (calories per ounce)** — the key efficiency metric ultralight hikers optimize.
- **Base weight** — pack weight excluding consumables (food/water/fuel); tracked in LighterPack.
