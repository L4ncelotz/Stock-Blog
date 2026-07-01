// ============================================================================
// Formatting helpers — currency, percent, compact numbers
// ============================================================================

export function formatCurrency(
  value: number | null | undefined,
  currency = 'USD',
  opts: Intl.NumberFormatOptions = {},
): string {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    ...opts,
  }).format(value)
}

export function formatCompactCurrency(
  value: number | null | undefined,
  currency = 'USD',
): string {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatPercent(
  value: number | null | undefined,
  digits = 2,
): string {
  if (value == null || Number.isNaN(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

export function formatNumber(
  value: number | null | undefined,
  digits = 0,
): string {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatDate(
  value: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', opts).format(new Date(value))
}

export function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value).getTime()
  const now = Date.now()
  const diffSec = Math.round((now - date) / 1000)
  const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })

  if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, 'second')
  const diffMin = Math.round(diffSec / 60)
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, 'minute')
  const diffHr = Math.round(diffMin / 60)
  if (Math.abs(diffHr) < 24) return rtf.format(-diffHr, 'hour')
  const diffDay = Math.round(diffHr / 24)
  if (Math.abs(diffDay) < 30) return rtf.format(-diffDay, 'day')
  const diffMonth = Math.round(diffDay / 30)
  if (Math.abs(diffMonth) < 12) return rtf.format(-diffMonth, 'month')
  return rtf.format(-Math.round(diffMonth / 12), 'year')
}

// Convert numeric score to letter grade
export function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 85) return 'A−'
  if (score >= 80) return 'B+'
  if (score >= 75) return 'B'
  if (score >= 70) return 'B−'
  if (score >= 60) return 'C'
  return 'D'
}
