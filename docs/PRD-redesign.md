# Trailmix Redesign PRD

> Tagline: know you have enough, and know what it weighs.
>
> This supersedes the incremental v2 ([PRD-v2.md](PRD-v2.md)). Same data, same free and offline
> foundation, but a different product. We are throwing out the dashboard and rebuilding around the way
> hikers actually think.

| | |
|---|---|
| Working name | Trailmix (redesign) |
| Status | Draft for discussion |
| Owner | ShahKK |
| Keep from v2 | Local first, offline PWA, the segment math, the food library, sharing, no backend |
| Change | The core model, the main screen, the visual identity, the interaction style |

---

## 1. An honest look at what we have

The current app works, and the numbers are right. It still feels like a spreadsheet wearing a nicer
shirt. Here is why, plainly.

- **It is a wall of stat boxes.** Almost every feature is a card with a title and a grid of little
  number tiles. Cal/oz, calories, weight, cost, days, repeated on every screen. That is the look of a
  thing that was generated, not designed. There is no hierarchy and no single thing your eye lands on.
- **The model is wrong.** It asks you to think in "segments" with "miles" and "miles per day," then add
  food one item at a time with plus and minus steppers. That is data entry. Nobody plans a hike that way
  in their head.
- **It is feature soup.** Water, macros, swaps, trail mode, sharing, each one is its own card bolted on
  the side. There is no core loop that ties them together.
- **It has no opinion.** A good trail tool has a strong view about weight and calories and helps you make
  trade-offs. Ours just reports totals and leaves you to it.

So the redesign is not about adding features. It is about picking the right model, building one strong
screen around it, and giving the thing a spine and a point of view.

## 2. How hikers actually think

This is the whole foundation, so it comes first. Watch how people really plan and you see the same
pattern every time.

- **They think in days of food, not items.** A day is a breakfast, some snacks, and a dinner, roughly a
  calorie target. Experienced hikers have a go-to day they reuse and tweak. Call it a **ration**.
- **They think in carries, not segments.** The unit is "I leave this town with N days of food to reach
  the next town." A **carry** is town to town.
- **Weight is felt, not read.** What they actually care about is how heavy the pack is leaving each town,
  especially before a long or dry stretch. A number in a box does not land. A weight you can see against
  a line you know is heavy does.
- **The core question is a gut-check.** Especially for a first big hike: do I have enough food, and is it
  too heavy? People want a confident yes or a clear fix, not a table to interpret.
- **They reason in trade-offs.** Weight against calories against cost against variety against morale. Real
  planning is choosing what to give up, not reading a total.

The design falls out of this. The primary objects are the **ration** (a day of food) and the **carry**
(town to town). The primary screen makes weight and "enough food" obvious at a glance. Everything else
is detail you open when you want it.

## 3. Design principles we hold ourselves to

1. **One model, learned once.** Rations and carries. If a feature does not serve those two, it does not
   belong on a top-level screen.
2. **Direct manipulation over forms.** You drag food into a ration and drop a ration onto a stretch of
   trail. Number fields are the fallback, not the main way you work.
3. **Show weight, do not just report it.** A physical bar against a reference line you understand, not a
   tile that says 9.9 lb.
4. **One verdict per carry.** Each town to town gets a single confident read at the top: enough food, how
   heavy, how many days. Color and a sentence, not six tiles.
5. **Have an opinion.** The app pushes calorie dense and light, calls out junk weight, and offers trades
   in plain language.
6. **Progressive disclosure.** Gut-check first. Macros, cost breakdown, per day detail, all one tap down.
7. **A real identity.** Field notebook and topo map. Warm paper and ink, one blaze accent, a monospace
   for numbers so data reads like a field instrument. Not another green dashboard.
8. **Motion that explains.** The weight bar fills, the trip strip scrolls, a day snaps into place. Nothing
   moves for decoration.

## 4. The core concept

Two objects and one canvas.

### 4.1 The ration (a day of food)

A ration is your typical day of eating, saved and reused. You build a few: a Big Day, a Chill Day, a Town
Day. Each is a small card that shows its calories, weight, and cal/oz live as you build it.

```
 RATION  "Big Day"                              3,900 cal · 22.4 oz · 174 cal/oz
 ┌ Breakfast ───────────┐ ┌ Snacks ──────────────┐ ┌ Dinner ─────────────────┐
 │ Pop-Tarts ×2         │ │ Snickers ×2          │ │ Knorr side              │
 │ Instant coffee       │ │ Trail mix            │ │ Olive oil               │
 └──────────────────────┘ │ Peanut butter ×2     │ │ Tortilla ×2             │
                          └──────────────────────┘ └─────────────────────────┘
      drag a food in, or search ⌄
```

This is the LighterPack insight done right. Your reusable kit is not a random list of items, it is a day
of food. Build it once, use it all trip.

### 4.2 The carry (town to town)

A carry is one resupply: leave town A with enough food to reach town B. You fill a carry by choosing a
ration and how many days, and the app lays out the days. Any single day can be overridden (a steak the
first night out of town, a lighter last day into town).

The top of every carry is the gut-check, the one thing your eye should hit first.

```
 NEELS GAP  →  HIAWASSEE                                   38.5 mi · about 11 mi/day
 ┌──────────────────────────────────────────────────────────────────────────┐
 │  4 days of food.  9.9 lb.  121 cal/oz.          ⚠  This carry is heavy.    │
 │  Most of the weight: summer sausage (5 oz) and 2 tuna (5.2 oz).            │
 │  [ Lighten this carry ]                                                    │
 └──────────────────────────────────────────────────────────────────────────┘
   base 12.0 ░░░░░░░  food 9.9 ▓▓▓▓▓▓  water 2.2 ▒▒            total 24.1 lb
   ├────────────────────────────────────────┊ heavy for you (22 lb) ┊────────►
   Day 1   Day 2   Day 3   Day 4        each is your "Big Day", tap a day to tweak
```

If you are short on food instead of heavy, the verdict is just as direct: "You are about 2,400 cal light
for 4 days. Add a dinner, or bump snacks." One sentence, one action.

### 4.3 The trip strip (the main canvas)

The home of a hike is not a list of cards, it is a strip. Towns are stops, carries are the stretches
between them, and underneath runs your **pack weight leaving each town** across the whole trip. This is
the signature view, and it is genuinely useful because it shows you something no total can: where your
pack spikes.

```
 SPRINGER        NEELS GAP        HIAWASSEE          N.O.C.         FONTANA
   ●───────────────●────────────────●─────────────────●──────────────●
    3 days           4 days           4 days            3 days (box)
    7.8 lb ✓         9.9 lb ⚠         9.1 lb ✓          6.9 lb ✓

 pack leaving town (lb)
  24┤            ██
  20┤     ██     ██     ██
  16┤     ██     ██     ██     ██
    └─────┴──────┴──────┴──────┴──────
```

You can see at a glance that leaving Neels Gap is your heavy day and go fix just that one. On a real
thru-hike this is where the story lives: the Sierra carry out of Kennedy Meadows with a bear can and 8
days of food is the moment that matters, and the strip makes it jump out.

## 5. Key flows, with wireframes

### 5.1 Start a hike (teach the model by doing)

No blank screen. Onboarding is three quick moves that leave you with a real plan.

1. Pick a trail or "my own." 2. Build or fork one ration (or grab a starter Big Day). 3. Drop it across
your carries. Done, you are looking at your strip.

### 5.2 Lighten a carry (the trade-off engine)

This is where the app earns trust, because it respects that the choice is yours. "Lighten this carry"
does not silently optimize. It lays out moves as human trades and lets you pick.

```
 LIGHTEN  Neels Gap → Hiawassee                          now 9.9 lb · goal under 8.5 lb
 ─────────────────────────────────────────────────────────────────────────────
  ▸ Olive oil instead of summer sausage for dinner fat   −4.2 oz   cheaper, less tasty
  ▸ Drop 1 tuna, add peanut butter                       −1.8 oz   same calories
  ▸ Swap 2 dinners to Knorr + potato flakes              −3.1 oz   more cal/oz, less variety
 ─────────────────────────────────────────────────────────────────────────────
  applying the top two gets you to 8.3 lb.   [ apply both ]   [ let me choose ]
```

### 5.3 Town day vs mail drop

Choosing how you resupply is a real decision, so make it one. Each carry asks "buy in town or mail a box,"
and that choice changes what you get out the other end: a grocery shopping list grouped for a real store,
or a box contents list with the address and the hold-until date worked out from your pace. These fall out
of the plan, they are not a separate screen you maintain.

### 5.4 On trail

Same strip, zoomed to today. Big, dark, high contrast, one thumb. It answers the only on-trail question:
how many days of food do I have left and will it get me to town. Tick food off as you eat it and the
strip updates.

```
  ⛺  DAY 2 OF 4   →  HIAWASSEE by Thu
  ┌───────────────────────────────────┐
  │  food left     6,050 cal           │
  │                2.9 days            │
  │  weight left   4.1 lb              │
  └───────────────────────────────────┘
   ✓ Pop-Tarts    ✓ coffee    ○ Snickers ×2 ...
```

## 6. Visual and interaction design

The identity has to carry weight, because a big part of "AI sloppy" is that the current look is generic.

- **Palette.** Warm paper (a soft off white, think field notebook), ink near black for text, and one
  blaze accent (a strong safety orange, the color of a trail blaze) used sparingly for the thing that
  matters on each screen. Dark mode is deep charcoal with the same blaze. This is ownable and it is not
  another green SaaS app.
- **Type.** Inter stays for the interface. Add a monospace for all numbers and data (weights, calories,
  the weight profile), so the figures read like instrument readouts and line up in columns. Consider a
  characterful face for town names on the strip to give it the feel of a map.
- **Texture, used with restraint.** Faint topographic contour lines in empty states and section
  backgrounds. Never behind text, never loud.
- **Density with intent.** Air around decisions (the gut-check, the strip). Density where data belongs
  (the per day table, the shopping list). Not the current uniform medium-gray everything.
- **Motion.** The weight bar fills toward its line. The strip scrolls and days snap. A carry that turns
  from heavy to good eases from orange back to ink. That is the whole motion budget. No confetti.

## 7. What we cut, fold, or keep

- **Cut the stat-box dashboards.** The grids of tiles go. Numbers live in the gut-check line, the weight
  bar, and the per day table where they belong.
- **Fold water, macros, and swaps into the carry.** Water becomes part of the weight bar and the strip.
  Macros are one tap under the gut-check for the people who care. Swaps become "Lighten this carry."
- **Keep the good bones.** Local first and offline, the food library, the segment math, sharing, the CSV
  and JSON export. None of that changes, it just stops being the star.
- **Rework sharing around the strip.** The shareable artifact is your trip strip, a single image worth
  posting. That is the thing that spreads, the way people post their LighterPack gear list.

## 8. Why this is worth getting

- **It matches how you think,** so planning feels like planning, not filling in a form.
- **The strip shows you your heavy days,** which no total can, and that is the moment that actually matters
  on a long trail.
- **The gut-check kills the anxiety** for first-timers, which is the strongest emotional reason to reach
  for a tool at all.
- **The trip strip is shareable and looks like something,** so the product spreads on its own.

## 9. How we will know it is not sloppy

- A stranger can look at the strip and, in five seconds, point to the heaviest carry. (Comprehension.)
- A first-timer plans a full week in under five minutes without a tutorial. (The model teaches itself.)
- Zero screens are a bare grid of stat tiles. (The taste test.)
- People screenshot their strip and post it unprompted. (It is worth showing off.)

## 10. Build order

- **Phase 1, the spine.** Rations, carries, and the trip strip with the weight profile. The gut-check line.
  This alone replaces most of the current app.
- **Phase 2, the trades.** Lighten this carry, the trade-off engine, water folded into the bar.
- **Phase 3, the polish.** The full field-notebook identity, the shareable strip image, on-trail today view,
  onboarding that drops you straight onto a strip.

## 11. Risks and how we handle them

- **The ration model is unfamiliar, people may expect an item list.** Onboarding builds one ration for you
  from a template so the idea lands in ten seconds, and per day override means you never feel boxed in.
- **The strip is ambitious to build well.** Ship it read-only and simple first (stops, carries, one weight
  bar each), add the weight-profile chart once the basics feel right.
- **A strong identity can go wrong.** Keep the blaze accent rare and the paper calm. If in doubt, remove
  color, not add it.

## 12. Open questions

- Do rations belong to a hike or to you (reused across every hike)? Leaning toward you, since your go-to day
  travels with you.
- How much trail data do we seed (known towns, typical carries) versus leaving it all user-entered?
- Is the trip strip horizontal-scroll on mobile, or does it reflow to a vertical timeline on small screens?
