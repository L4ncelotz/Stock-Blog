import { unstable_cache } from 'next/cache'
import { getQuote as yahooGetQuote } from './yahoo'
import { getQuote as finnhubGetQuote } from './finnhub'
import { PriceProviderError, type Quote } from './types'

// ============================================================================
// Orchestrator — Yahoo (primary) → Finnhub (fallback) → Next cache.
// Each ticker cached for 15 minutes. Invalidation via revalidateTag.
// ============================================================================

const QUOTE_TTL = 15 * 60 // 15 min

const fetchQuoteUncached = async (ticker: string): Promise<Quote> => {
  // 1. Yahoo (primary)
  try {
    return await yahooGetQuote(ticker)
  } catch (err) {
    console.warn(
      `[prices] yahoo failed for ${ticker}:`,
      err instanceof Error ? err.message : err,
    )
  }

  // 2. Finnhub (fallback)
  try {
    return await finnhubGetQuote(ticker)
  } catch (err) {
    console.warn(
      `[prices] finnhub failed for ${ticker}:`,
      err instanceof Error ? err.message : err,
    )
  }

  throw new PriceProviderError(`all providers failed for ${ticker}`, 'orchestrator')
}

// Per-ticker cached fetch. The ticker is part of the cache key, so each
// ticker is cached independently. All share one tag for bulk invalidation.
const cachedFetch = unstable_cache(
  async (ticker: string): Promise<Quote> => fetchQuoteUncached(ticker),
  ['price-quote-v1'],
  { revalidate: QUOTE_TTL, tags: ['price-quote'] },
)

export async function getQuote(ticker: string): Promise<Quote> {
  return cachedFetch(ticker)
}

// Manual refresh (owner "refresh" button). Bypasses cache and re-validates.
export async function refreshQuote(ticker: string): Promise<Quote> {
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/', 'layout')
  return fetchQuoteUncached(ticker)
}
