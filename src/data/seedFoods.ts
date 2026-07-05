import type { FoodItem } from '../db/db'

export type SeedFood = Omit<FoodItem, 'id' | 'source'>

// A starter library of common thru-hiker foods. Values are per single packed
// unit (one bar, one packet, one serving-as-carried). Weights in ounces,
// calories total for that unit, cost in USD. Users can edit or add their own.
export const seedFoods: SeedFood[] = [
  // Breakfast
  { name: 'Instant oatmeal packet', category: 'Breakfast', weightOz: 1.5, calories: 160, cost: 0.4 },
  { name: 'Pop-Tarts (2-pack)', category: 'Breakfast', weightOz: 3.5, calories: 400, cost: 0.6 },
  { name: 'Granola (1 cup)', category: 'Breakfast', weightOz: 3.5, calories: 450, cost: 1.0 },
  { name: 'Instant grits packet', category: 'Breakfast', weightOz: 1.0, calories: 100, cost: 0.35 },
  { name: 'Breakfast essentials shake mix', category: 'Breakfast', weightOz: 1.3, calories: 130, cost: 0.9 },

  // Dinner
  { name: 'Ramen (single brick)', category: 'Dinner', weightOz: 3.0, calories: 380, cost: 0.4 },
  { name: 'Knorr pasta/rice side', category: 'Dinner', weightOz: 4.3, calories: 500, cost: 1.25 },
  { name: 'Idahoan instant mashed potatoes', category: 'Dinner', weightOz: 4.0, calories: 320, cost: 1.0 },
  { name: 'Mac & cheese (Velveeta cup)', category: 'Dinner', weightOz: 4.0, calories: 460, cost: 1.5 },
  { name: 'Mountain House freeze-dried meal', category: 'Dinner', weightOz: 4.6, calories: 600, cost: 9.0 },
  { name: 'Couscous (1 cup dry)', category: 'Dinner', weightOz: 6.0, calories: 650, cost: 1.2 },
  { name: 'Instant refried beans', category: 'Dinner', weightOz: 3.5, calories: 340, cost: 1.1 },

  // Bars
  { name: 'Clif Bar', category: 'Bars', weightOz: 2.4, calories: 250, cost: 1.5 },
  { name: 'ProBar Meal', category: 'Bars', weightOz: 3.0, calories: 370, cost: 2.5 },
  { name: 'Honey Stinger waffle', category: 'Bars', weightOz: 1.0, calories: 140, cost: 1.5 },
  { name: 'Nature Valley crunchy (2-bar)', category: 'Bars', weightOz: 1.5, calories: 190, cost: 0.6 },
  { name: 'Kind bar', category: 'Bars', weightOz: 1.4, calories: 200, cost: 1.6 },
  { name: 'Belvita breakfast biscuits', category: 'Bars', weightOz: 1.76, calories: 230, cost: 1.0 },

  // Snacks
  { name: 'Fritos (single bag)', category: 'Snacks', weightOz: 2.0, calories: 320, cost: 1.2 },
  { name: 'Cheez-Its (single)', category: 'Snacks', weightOz: 1.5, calories: 210, cost: 1.0 },
  { name: 'Pringles (grab bag)', category: 'Snacks', weightOz: 2.5, calories: 380, cost: 1.5 },
  { name: 'Goldfish crackers (1 cup)', category: 'Snacks', weightOz: 1.5, calories: 200, cost: 0.9 },
  { name: 'Trail mix (2 oz)', category: 'Snacks', weightOz: 2.0, calories: 300, cost: 1.2 },
  { name: 'Dried mango (1 oz)', category: 'Snacks', weightOz: 1.0, calories: 90, cost: 1.0 },
  { name: 'Fruit snacks pouch', category: 'Snacks', weightOz: 0.9, calories: 90, cost: 0.5 },

  // Candy
  { name: 'Snickers bar', category: 'Candy', weightOz: 1.86, calories: 250, cost: 1.0 },
  { name: 'Peanut M&Ms (single)', category: 'Candy', weightOz: 1.74, calories: 250, cost: 1.0 },
  { name: 'Reeses Peanut Butter Cups', category: 'Candy', weightOz: 1.5, calories: 210, cost: 1.0 },
  { name: 'Sour Patch Kids', category: 'Candy', weightOz: 2.0, calories: 220, cost: 1.1 },
  { name: 'Payday bar', category: 'Candy', weightOz: 1.85, calories: 240, cost: 1.0 },

  // Nuts & Fats
  { name: 'Peanut butter (2 tbsp)', category: 'Nuts & Fats', weightOz: 1.1, calories: 190, cost: 0.35 },
  { name: 'Nutella packet', category: 'Nuts & Fats', weightOz: 1.2, calories: 200, cost: 0.9 },
  { name: 'Olive oil (1 oz)', category: 'Nuts & Fats', weightOz: 0.95, calories: 240, cost: 0.3 },
  { name: 'Almonds (1 oz)', category: 'Nuts & Fats', weightOz: 1.0, calories: 170, cost: 0.5 },
  { name: 'Peanuts (1 oz)', category: 'Nuts & Fats', weightOz: 1.0, calories: 160, cost: 0.35 },
  { name: 'Cashews (1 oz)', category: 'Nuts & Fats', weightOz: 1.0, calories: 160, cost: 0.6 },

  // Meat
  { name: 'Tuna packet', category: 'Meat', weightOz: 2.6, calories: 110, cost: 1.5 },
  { name: 'Chicken packet', category: 'Meat', weightOz: 2.6, calories: 90, cost: 1.6 },
  { name: 'Beef jerky (2 oz)', category: 'Meat', weightOz: 2.0, calories: 220, cost: 4.0 },
  { name: 'Summer sausage (5 oz)', category: 'Meat', weightOz: 5.0, calories: 600, cost: 4.0 },
  { name: 'Pepperoni (2 oz)', category: 'Meat', weightOz: 2.0, calories: 280, cost: 1.5 },
  { name: 'Spam single', category: 'Meat', weightOz: 2.5, calories: 180, cost: 1.6 },

  // Wraps / bread / dairy
  { name: 'Flour tortilla (1)', category: 'Wraps', weightOz: 1.6, calories: 140, cost: 0.3 },
  { name: 'Bagel (1)', category: 'Wraps', weightOz: 3.7, calories: 280, cost: 0.7 },
  { name: 'Babybel cheese (1)', category: 'Other', weightOz: 0.75, calories: 70, cost: 0.6 },
  { name: 'String cheese (1)', category: 'Other', weightOz: 1.0, calories: 80, cost: 0.5 },

  // Drinks
  { name: 'Starbucks Via instant coffee', category: 'Drinks', weightOz: 0.1, calories: 5, cost: 0.8 },
  { name: 'Gatorade powder (1 serving)', category: 'Drinks', weightOz: 0.8, calories: 80, cost: 0.5 },
  { name: 'Hot cocoa packet', category: 'Drinks', weightOz: 1.0, calories: 110, cost: 0.4 },
  { name: 'Electrolyte tab (1)', category: 'Drinks', weightOz: 0.15, calories: 10, cost: 0.5 },
  { name: 'Emergen-C packet', category: 'Drinks', weightOz: 0.3, calories: 25, cost: 0.4 },
]
