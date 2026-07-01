import { PriceProviderError, type Quote, type HistoricalPrice } from './types'

// Yahoo Finance — unofficial endpoints (no API key required for basic use).
// Rate limits apply. We set a realistic User-Agent to avoid blocking.

const UA = process.env.YAHOO_USER_AGENT ?? 'InvestmentOS/1.0'

async function getCrumb(): Promise<string> {
  // Yahoo requires a "crumb" + cookie for some endpoints. Best-effort fetch.
  const res = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA },
    cache: 'no-store',
  })
  if (!res.ok) throw new PriceProviderError('crumb fetch failed', 'yahoo')
  return res.text()
}

export async function getQuote(ticker: string): Promise<Quote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker,
  )}?interval=1d&range=5d`

  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new PriceProviderError(
      `yahoo quote ${res.status} for ${ticker}`,
      'yahoo',
    )
  }

  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) {
    throw new PriceProviderError(`no yahoo result for ${ticker}`, 'yahoo')
  }

  const meta = result.meta
  const quotes = result.indicators?.quote?.[0]
  const closes: (number | null)[] = quotes?.close ?? []
  const validCloses = closes.filter((c): c is number => c != null)
  const price = meta?.regularMarketPrice ?? validCloses.at(-1) ?? 0
  const prevClose = meta?.chartPreviousClose ?? validCloses.at(-2) ?? price
  const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0

  return {
    ticker,
    price,
    changePct,
    currency: meta?.currency ?? 'USD',
    source: 'yahoo',
    fetchedAt: new Date().toISOString(),
  }
}

export async function getHistory(
  ticker: string,
  from: string, // YYYY-MM-DD
  to: string,   // YYYY-MM-DD
): Promise<HistoricalPrice[]> {
  const period1 = Math.floor(new Date(from).getTime() / 1000)
  const period2 = Math.floor(new Date(to).getTime() / 1000) + 86400
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker,
  )}?interval=1d&period1=${period1}&period2=${period2}`

  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new PriceProviderError(
      `yahoo history ${res.status} for ${ticker}`,
      'yahoo',
    )
  }

  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) return []

  const timestamps: number[] = result.timestamp ?? []
  // Adjusted close accounts for splits + dividends (total return basis).
  const adjClose: (number | null)[] =
    result.indicators?.adjclose?.[0]?.adjclose ??
    result.indicators?.quote?.[0]?.close ??
    []

  return timestamps
    .map((ts, i) => {
      const close = adjClose[i]
      if (close == null) return null
      return {
        ticker,
        date: new Date(ts * 1000).toISOString().slice(0, 10),
        closeAdj: close,
      }
    })
    .filter((p): p is HistoricalPrice => p !== null)
}

export { getCrumb }
