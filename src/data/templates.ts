export interface TemplateFood {
  name: string // must match a seed food name
  qty: number
}

export interface TemplateSegment {
  name: string
  miles: number
  miPerDay: number
  resupplyType: 'town' | 'maildrop'
  maildropAddress?: string
  notes?: string
  foods: TemplateFood[]
}

export interface HikeTemplate {
  key: string
  name: string
  trail: string
  description: string
  dailyCalTarget: number
  targetCalOz: number
  segments: TemplateSegment[]
}

export const templates: HikeTemplate[] = [
  {
    key: 'at-ga-section',
    name: 'AT — Springer to Fontana (GA/NC)',
    trail: 'Appalachian Trail',
    description:
      'The classic first ~165 miles of a NOBO thru-hike: four resupplies from Springer Mountain through the Nantahalas to Fontana Dam, including one mail drop.',
    dailyCalTarget: 3000,
    targetCalOz: 110,
    segments: [
      {
        name: 'Springer Mtn → Neels Gap',
        miles: 31.7,
        miPerDay: 11,
        resupplyType: 'town',
        notes: 'Mountain Crossings outfitter — first shakedown. Buy here.',
        foods: [
          { name: 'Instant oatmeal packet', qty: 3 },
          { name: 'Pop-Tarts (2-pack)', qty: 3 },
          { name: 'Ramen (single brick)', qty: 3 },
          { name: 'Knorr pasta/rice side', qty: 2 },
          { name: 'Clif Bar', qty: 4 },
          { name: 'Snickers bar', qty: 4 },
          { name: 'Peanut butter (2 tbsp)', qty: 6 },
          { name: 'Flour tortilla (1)', qty: 6 },
          { name: 'Tuna packet', qty: 2 },
          { name: 'Trail mix (2 oz)', qty: 3 },
          { name: 'Starbucks Via instant coffee', qty: 3 },
        ],
      },
      {
        name: 'Neels Gap → Hiawassee',
        miles: 38.5,
        miPerDay: 11,
        resupplyType: 'town',
        notes: 'Hitch from Unicoi Gap into Hiawassee. Full grocery.',
        foods: [
          { name: 'Instant oatmeal packet', qty: 4 },
          { name: 'Pop-Tarts (2-pack)', qty: 4 },
          { name: 'Ramen (single brick)', qty: 4 },
          { name: 'Knorr pasta/rice side', qty: 3 },
          { name: 'Idahoan instant mashed potatoes', qty: 2 },
          { name: 'Clif Bar', qty: 5 },
          { name: 'Snickers bar', qty: 5 },
          { name: 'Peanut M&Ms (single)', qty: 3 },
          { name: 'Peanut butter (2 tbsp)', qty: 8 },
          { name: 'Olive oil (1 oz)', qty: 4 },
          { name: 'Flour tortilla (1)', qty: 8 },
          { name: 'Beef jerky (2 oz)', qty: 2 },
          { name: 'Trail mix (2 oz)', qty: 4 },
          { name: 'Starbucks Via instant coffee', qty: 4 },
        ],
      },
      {
        name: 'Hiawassee → NOC',
        miles: 42,
        miPerDay: 11,
        resupplyType: 'town',
        notes: 'Nantahala Outdoor Center — small store, decent hiker food.',
        foods: [
          { name: 'Instant oatmeal packet', qty: 4 },
          { name: 'Granola (1 cup)', qty: 2 },
          { name: 'Ramen (single brick)', qty: 4 },
          { name: 'Knorr pasta/rice side', qty: 3 },
          { name: 'Mac & cheese (Velveeta cup)', qty: 2 },
          { name: 'ProBar Meal', qty: 2 },
          { name: 'Clif Bar', qty: 4 },
          { name: 'Snickers bar', qty: 5 },
          { name: 'Peanut butter (2 tbsp)', qty: 8 },
          { name: 'Olive oil (1 oz)', qty: 4 },
          { name: 'Flour tortilla (1)', qty: 8 },
          { name: 'Summer sausage (5 oz)', qty: 1 },
          { name: 'Trail mix (2 oz)', qty: 4 },
          { name: 'Starbucks Via instant coffee', qty: 4 },
        ],
      },
      {
        name: 'NOC → Fontana Dam',
        miles: 27,
        miPerDay: 11,
        resupplyType: 'maildrop',
        maildropAddress:
          'Fontana Dam Village General Store, 300 Woods Rd, Fontana Dam, NC 28733 — Hold for AT Hiker (ETA on box)',
        notes: 'Tiny store at Fontana; a mail drop keeps you fed before the Smokies.',
        foods: [
          { name: 'Instant oatmeal packet', qty: 3 },
          { name: 'Pop-Tarts (2-pack)', qty: 3 },
          { name: 'Ramen (single brick)', qty: 3 },
          { name: 'Idahoan instant mashed potatoes', qty: 2 },
          { name: 'Clif Bar', qty: 4 },
          { name: 'Snickers bar', qty: 3 },
          { name: 'Peanut butter (2 tbsp)', qty: 6 },
          { name: 'Flour tortilla (1)', qty: 6 },
          { name: 'Chicken packet', qty: 2 },
          { name: 'Trail mix (2 oz)', qty: 3 },
          { name: 'Starbucks Via instant coffee', qty: 3 },
        ],
      },
    ],
  },
  {
    key: 'pct-socal-section',
    name: 'PCT — Campo to Warner Springs (SoCal)',
    trail: 'Pacific Crest Trail',
    description:
      'The first ~110 desert miles of a PCT NOBO hike. Bigger daily miles, higher calories, and a long dry carry into Warner Springs.',
    dailyCalTarget: 3200,
    targetCalOz: 115,
    segments: [
      {
        name: 'Campo → Mount Laguna',
        miles: 41,
        miPerDay: 14,
        resupplyType: 'town',
        notes: 'Mount Laguna store is small — grab calorie-dense items.',
        foods: [
          { name: 'Instant oatmeal packet', qty: 3 },
          { name: 'Pop-Tarts (2-pack)', qty: 3 },
          { name: 'Ramen (single brick)', qty: 3 },
          { name: 'Knorr pasta/rice side', qty: 2 },
          { name: 'ProBar Meal', qty: 2 },
          { name: 'Snickers bar', qty: 5 },
          { name: 'Peanut butter (2 tbsp)', qty: 8 },
          { name: 'Olive oil (1 oz)', qty: 3 },
          { name: 'Flour tortilla (1)', qty: 6 },
          { name: 'Beef jerky (2 oz)', qty: 2 },
          { name: 'Trail mix (2 oz)', qty: 4 },
          { name: 'Gatorade powder (1 serving)', qty: 4 },
        ],
      },
      {
        name: 'Mount Laguna → Warner Springs',
        miles: 68,
        miPerDay: 14,
        resupplyType: 'town',
        notes: 'Long, dry, exposed. Pack heavy on calories and electrolytes.',
        foods: [
          { name: 'Instant oatmeal packet', qty: 5 },
          { name: 'Granola (1 cup)', qty: 2 },
          { name: 'Ramen (single brick)', qty: 5 },
          { name: 'Knorr pasta/rice side', qty: 4 },
          { name: 'Idahoan instant mashed potatoes', qty: 2 },
          { name: 'ProBar Meal', qty: 3 },
          { name: 'Clif Bar', qty: 5 },
          { name: 'Snickers bar', qty: 6 },
          { name: 'Peanut M&Ms (single)', qty: 4 },
          { name: 'Peanut butter (2 tbsp)', qty: 10 },
          { name: 'Olive oil (1 oz)', qty: 5 },
          { name: 'Flour tortilla (1)', qty: 10 },
          { name: 'Summer sausage (5 oz)', qty: 1 },
          { name: 'Beef jerky (2 oz)', qty: 2 },
          { name: 'Trail mix (2 oz)', qty: 6 },
          { name: 'Gatorade powder (1 serving)', qty: 6 },
          { name: 'Electrolyte tab (1)', qty: 6 },
        ],
      },
    ],
  },
]

export function getTemplate(key: string): HikeTemplate | undefined {
  return templates.find((t) => t.key === key)
}
