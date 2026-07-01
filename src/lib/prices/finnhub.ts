import { PriceProviderError, type Quote } from './types'

// Finnhub — backup provider. Requires FINNHUB_API_KEY.
// Free tier: ~60 calls/min. Use when Yahoo fails or rate-limits.

export async function getQuote(ticker: string): Promise<Quote> {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    throw new PriceProviderError('FINNHUB_API_KEY missing', 'finnhub')
  }

  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(
    ticker,
  )}&token=${apiKey}`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new PriceProviderError(
      `finnhub quote ${res.status} for ${ticker}`,
      'finnhub',
    )
  }

  const data = await res.json()
  const price = data?.c
  const prevClose = data?.pc

  if (price == null || price === 0) {
    throw new PriceProviderError(`no finnhub data for ${ticker}`, 'finnhub')
  }

  const changePct =
    prevClose && prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : 0

  return {
    ticker,
    price,
    changePct,
    currency: 'USD', // Finnhub free quotes are USD
    source: 'finnhub',
    fetchedAt: new Date().toISOString(),
  }
}
