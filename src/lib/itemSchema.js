export function isMissingItemSchemaField(error) {
  const message = String(error?.message || '').toLowerCase()

  return (
    message.includes('items.is_spotlight') ||
    message.includes('items.category') ||
    (message.includes('column') && message.includes('items') && message.includes('does not exist')) ||
    message.includes('schema cache')
  )
}
