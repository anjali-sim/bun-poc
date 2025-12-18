/**
 * Category Constants
 * Centralized category definitions with emojis and descriptions
 */

export const CATEGORY_NAMES = [
  "Food",
  "Transport",
  "Entertainment",
  "Utilities",
  "Shopping",
  "Health",
  "Other",
] as const;

export type CategoryType = (typeof CATEGORY_NAMES)[number];

export const DEFAULT_CATEGORIES = [
  { name: "Food", emoji: "🍽️", description: "Meals, groceries, dining" },
  { name: "Transport", emoji: "🚗", description: "Gas, public transit, taxi" },
  {
    name: "Entertainment",
    emoji: "🎬",
    description: "Movies, games, hobbies",
  },
  {
    name: "Utilities",
    emoji: "💡",
    description: "Electricity, water, internet",
  },
  {
    name: "Shopping",
    emoji: "🛍️",
    description: "Clothes, gifts, personal items",
  },
  { name: "Health", emoji: "⚕️", description: "Medical, fitness, wellness" },
  { name: "Other", emoji: "📦", description: "Miscellaneous expenses" },
] as const;

/**
 * Get emoji for a category name
 */
export function getCategoryEmoji(categoryName: string): string {
  const category = DEFAULT_CATEGORIES.find((cat) => cat.name === categoryName);
  return category?.emoji || "📦";
}

/**
 * Get description for a category name
 */
export function getCategoryDescription(categoryName: string): string {
  const category = DEFAULT_CATEGORIES.find((cat) => cat.name === categoryName);
  return category?.description || "Custom category";
}

/**
 * Get all category names as an array
 */
export const CATEGORY_LIST = [...CATEGORY_NAMES];
