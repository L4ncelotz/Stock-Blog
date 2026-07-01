// ============================================================================
// Price providers — Yahoo (primary) → Finnhub (fallback) → cache.
// All providers return the same normalized shape. Failures fall through.
// ============================================================================

export interface Quote {
  ticker: string
  price: number
  changePct: number       // change % vs previous close
  currency: string
  source: 'yahoo' | 'finnhub' | 'cache'
  fetchedAt: string       // ISO timestamp
}

export interface HistoricalPrice {
  ticker: string
  date: string            // YYYY-MM-DD
  closeAdj: number
}

export class PriceProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public cause?: unknown,
  ) {
    super(message)
    this.name = 'PriceProviderError'
  }
}
