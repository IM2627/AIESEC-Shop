const currencyFormatter = new Intl.NumberFormat('fr-TN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatCurrency(amount) {
  const numericAmount = Number(amount ?? 0)
  return `${currencyFormatter.format(Number.isFinite(numericAmount) ? numericAmount : 0)} TND`
}

export function formatDateLabel(value) {
  if (!value) {
    return 'Flexible'
  }

  const parsedDate = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsedDate.getTime()) ? value : dateFormatter.format(parsedDate)
}

export function getTodayIsoDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getInitials(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join('')
}
