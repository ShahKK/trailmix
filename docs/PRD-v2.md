# Product Requirements Document — Trailmix 2.0

> **From a tool to a trail companion.**
> v1 proved the resupply math works. v2 makes Trailmix *fast, felt, and complete* — the app hikers
> open every day, show their friends, and trust with the two things that actually hurt on trail:
> **going hungry and running dry.**

| | |
|---|---|
| **Working name** | Trailmix 2.0 |
| **Status** | ✅ Implemented in v2.0 (this repo) |
| **Owner** | ShahKK |
| **Builds on** | [PRD.md](PRD.md) (v1 MVP, shipped) |
| **Stack** | React 18 + TS + Vite PWA · Framer Motion · dnd-kit · IndexedDB/Dexie |
| **Target infra cost** | still ~$0 (URL-based sharing keeps it serverless) |

---

## Table of contents

1. [Why v2 / what v1 taught us](#1-why-v2--what-v1-taught-us)
2. [Gap analysis — what's really missing](#2-gap-analysis--whats-really-missing)
3. [Goals & success metrics](#3-goals--success-metrics)
4. [Three pillars](#4-three-pillars)
5. [Pillar A — Depth (water, macros, total pack weight)](#5-pillar-a--depth)
6. [Pillar B — Delight (motion, gestures, seamless UX)](#6-pillar-b--delight)
7. [Pillar C — Growth (share, fork, on-trail mode)](#7-pillar-c--growth)
8. [Design system & motion principles](#8-design-system--motion-principles)
9. [Feature requirements (prioritized)](#9-feature-requirements-prioritized)
10. [Technical additions (still free)](#10-technical-additions-still-free)
11. [Roadmap & milestones](#11-roadmap--milestones)
12. [Risks & mitigations](#12-risks--mitigations)
13. [Definition of done](#13-definition-of-done)

---

## 1. Why v2 / what v1 taught us

v1 answers *“how much food, how heavy, how much does it cost.”* It works, it's offline, it's free. But
it still **feels like a spreadsheet with nicer math**: instant state changes, `alert()`/`confirm()`
dialogs, up/down arrows for ordering, no transitions, and a "Loading…" flash. It's also **incomplete
for the desert** — it plans food but ignores **water**, which is the other half of pack weight and the
part that's genuinely dangerous to get wrong.

v2 has one sentence: **make Trailmix the thing hikers *want* to open — polished enough to screenshot,
complete enough to trust, and shareable enough to spread on its own.**

## 2. Gap analysis — what's really missing

| Gap | Why it hurts | v2 answer |
|---|---|---|
| **No water planning** | Water is ~2 lb/liter; desert carries dominate pack weight & safety | Water-carry planner per segment (§5) |
| **Calories only, no macros** | Hikers bonk on low protein; some track fat for satiety | Protein/fat/carb rollups + optional targets |
| **Food weight ≠ pack weight** | Total load = base + food + water; v1 shows only food | Base-weight field + LighterPack import → total pack weight |
| **No swap guidance** | "This is heavy" — okay, *fix it how?* | Swap-suggestion engine ("−6 oz, same calories") |
| **Sharing is manual** | v1 has JSON export, but no link to send a friend | URL-encoded share links + one-tap fork (serverless) |
| **No on-trail mode** | Planning ≠ using; on trail you want "days to next town" | Trail mode: today card, check-off, days remaining |
| **Feels static** | No motion, blocking dialogs, no feedback | Motion system, toasts, gestures, optimistic UI (§6) |
| **No dark mode** | Reading a bright screen in a tent at night | Themed dark mode with smooth transition |
| **Cold first run** | New users still see a mostly empty home | Animated onboarding + "plan in 60 seconds" wizard |

## 3. Goals & success metrics

| Goal | Metric | Target |
|---|---|---|
| It feels premium | % sessions with no layout jank (CLS < 0.1) | ≥95% |
| Depth drives trust | % hikes that add water carries | ≥40% |
| Sharing spreads it | Shared links opened → forked | ≥30% of opens |
| Daily use on trail | Trail-mode opens per active hiker / week (in season) | ≥4 |
| Still free to run | Monthly infra cost | < $5 |
| Perceived speed | Interaction-to-paint for add/remove food | < 100 ms |

## 4. Three pillars

**A. Depth** — finish the job: water, macros, total pack weight, swaps.
**B. Delight** — motion, gestures, and seamless flows so it *feels* effortless.
**C. Growth** — shareable/forkable plans and an on-trail mode that earns daily opens.

## 5. Pillar A — Depth

### A1. Water-carry planner (flagship)
Per segment, model water like food:
- Add **water sources** along a segment (name, mile, optional "reliable?" flag).
- For each carry (source → source), compute **liters needed** = `hours_between × drink_rate + camp/cook water`, and **carry weight** = `liters × 2.2 lb`.
- Show the **worst carry** (heaviest water weight) as the segment's water headline.
- Fold water into **total pack weight** for that stretch.

### A2. Macros
- Extend `FoodItem` with optional `proteinG`, `fatG`, `carbG` (backfill common items; user-editable).
- Segment + day rollups; optional protein target (e.g., ≥100 g/day) with a gentle flag.
- Keep calories primary; macros are a secondary, collapsible panel.

### A3. Total pack weight
- Hike-level **base weight** field (or **import from LighterPack** URL/JSON).
- `total = base + food + water`, shown per segment and as a trip max — the number ultralighters actually optimize.

### A4. Swap-suggestion engine
- For a heavy or undercalorie segment, suggest concrete swaps from the library:
  “Swap **Velveeta cup → olive oil + couscous**: −3.2 oz, +cal/oz 41.”
- Ranked by cal/oz gain (or calorie gain) with a one-tap **Apply swap** (animated row morph).

## 6. Pillar B — Delight

Concrete, shippable interactions (library in parentheses):

- **Page & shared-element transitions** (Framer Motion `AnimatePresence`, `layoutId`): segment card → segment detail expands from the card, not a hard cut.
- **Animated numbers**: cal/oz, weight, cost **count up/down** on change (spring), so edits feel alive.
- **Weight/calorie bars**: a segment shows an animated **stacked bar** (base · food · water) and a **cal/oz gauge** that fills; color morphs green↔amber↔red as status changes.
- **Drag-to-reorder segments** (dnd-kit) with spring settle — replaces the ↑/↓ arrows.
- **Swipe-to-delete** food rows on mobile; long-press to multi-select.
- **Toasts + optimistic UI** (replace all `alert`/`confirm`): actions apply instantly with an **Undo** toast (delete a segment → it slides out, toast offers undo for 5 s).
- **Bottom-sheet modals** on mobile (drag-to-dismiss) instead of centered dialogs.
- **Skeleton shimmer** instead of "Loading…"; content fades/staggers in.
- **Micro-moment**: when a segment first hits "on target," a small, tasteful confetti/checkmark pop (respect reduced-motion).
- **Haptic-style feedback** via the Vibration API on key mobile actions (best-effort).
- **Dark mode** with an animated theme cross-fade; remembers preference.

> **Accessibility guardrail:** every animation honors `prefers-reduced-motion` (fall back to instant/opacity). Motion is polish, never a gate on function.

## 7. Pillar C — Growth

### C1. Share & fork (serverless)
- **Share link**: serialize a hike → compress (LZ-string) → put in the URL hash (`/#/shared/<blob>`). No backend, no cost, works from the static host.
- Opening a share link renders a **read-only** plan with a prominent **"Fork to my hikes"** (writes into the visitor's IndexedDB).
- **Optional upgrade path** (later): short links via a free KV (Cloudflare KV) if URLs get long — but v2 ships URL-only.

### C2. On-trail mode
- A hike-level **Trail mode** toggle → a stripped, high-contrast, glanceable view:
  - **Today card**: which segment you're in, days of food left, next town + est. arrival.
  - **Check off** food as eaten; remaining weight/calories update.
  - Big text, dark, one-thumb — usable with cold hands and low battery.

### C3. Onboarding
- First run: a 3-step animated intro → drops you into a **"plan your first segment in 60 seconds"** wizard (fork a template or quick-add).

## 8. Design system & motion principles

**Tokens** (extend Tailwind theme): formalize the `trail` green scale, add semantic tokens
(`surface`, `surface-2`, `border`, `text`, `text-muted`, `success`, `warn`, `danger`) that flip for
dark mode. Radius/shadow/spacing scale documented.

**Typography**: one display weight for headline numbers (the cal/oz, the weight), calm body text.

**Motion principles**
1. **Motion explains change** — things move *from where they were* (layout animations), so state changes read as continuous, not teleported.
2. **Fast in, gentle out** — enter ~150 ms, settle with spring; nothing blocks input.
3. **One hero at a time** — a screen has at most one attention-grabbing motion; the rest is subtle.
4. **Reduced-motion is first-class** — every effect has an instant fallback.
5. **Feedback within 100 ms** — optimistic UI + toast, never a spinner for local writes.

## 9. Feature requirements (prioritized)

### P0 — v2 core
- Water-carry planner (A1) folded into total pack weight (A3 base weight).
- Motion foundation: Framer Motion transitions, animated numbers, toasts + Undo replacing `alert`/`confirm`.
- Drag-to-reorder segments (dnd-kit).
- Dark mode + design tokens.
- Share link (URL-encoded) + fork.

### P1 — depth & trail
- Macros (A2) with optional protein target.
- Swap-suggestion engine (A4).
- On-trail mode (C2).
- Swipe-to-delete, bottom-sheet modals, skeletons.

### P2 — polish & reach
- Onboarding wizard (C3).
- LighterPack import for base weight.
- Charts (stacked weight bar, cal/oz gauge) everywhere.
- Confetti micro-moment, haptics, install-prompt nudge.

## 10. Technical additions (still free)

| Need | Choice | Cost |
|---|---|---|
| Animation | `framer-motion` | $0 |
| Drag & drop | `@dnd-kit/core` + sortable | $0 |
| Toasts | `sonner` (or a tiny custom store) | $0 |
| Share encoding | `lz-string` → URL hash | $0 |
| Charts | hand-rolled SVG + Framer (no heavy lib) | $0 |
| Theme | Tailwind `darkMode: 'class'` + tokens | $0 |
| Data model | Dexie v2 migration: add `proteinG/fatG/carbG?` to foods, `waterSources`/`baseWeightOz` to hikes/segments | $0 |

Everything stays **local-first and static-hosted** — no servers introduced. Share links travel in the
URL, so the viral loop costs nothing to run.

## 11. Roadmap & milestones

| Phase | Scope | Est. effort (solo) |
|---|---|---|
| **v2.0** | P0: water + total weight, motion foundation, toasts/undo, DnD, dark mode, share/fork | ~4–5 wks |
| **v2.1** | P1: macros, swap engine, trail mode, swipe/sheets | ~3 wks |
| **v2.2** | P2: onboarding, LighterPack import, charts, micro-delight | ~2 wks |

### Milestone acceptance
- **M4 (feels premium):** no blocking dialogs remain; every destructive action is undoable via toast; segment reorder is drag-and-drop; numbers animate; dark mode ships; reduced-motion verified.
- **M5 (complete):** a desert segment shows worst-carry water weight folded into total pack weight; macros + swap suggestions work.
- **M6 (spreads):** a hiker shares a link, a friend opens it read-only and forks it into their own device in < 15 s — with no backend.

## 12. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Animations hurt perf on old phones | Budget: 60fps target, transform/opacity only, lazy-load motion, honor reduced-motion |
| Water model gets too complex | Ship the simple "worst carry" first; advanced source-by-source is optional |
| Share URLs get too long | LZ-compress; if still long, add optional free KV short-links in v2.2 |
| Dexie migration breaks v1 data | Versioned migration + a JSON backup prompt before upgrade |
| Scope creep (this is a lot) | Ship P0 as v2.0 and release; P1/P2 iterate |

## 13. Definition of done

v2.0 is done when a new user can: fork a template, watch the numbers animate, drag segments to
reorder, add a water carry that changes their total pack weight, flip to dark mode, delete something
and undo it from a toast, and **send a friend a link that forks in one tap** — all offline, all free,
and polished enough that they screenshot it for the forum.
