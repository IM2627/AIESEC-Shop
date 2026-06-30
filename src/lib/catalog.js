export const ITEM_CATEGORIES = ['T-shirts', 'Hoodies', 'Bracelets', 'Stickers']

export function isValidItemCategory(value) {
  return ITEM_CATEGORIES.includes(value)
}

export function getItemCategoryLabel(value) {
  return isValidItemCategory(value) ? value : 'Unknown'
}
