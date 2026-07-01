import { createClient } from '@/lib/supabase/server'
import type { Holding, PortfolioSnapshot, Stock } from '@/lib/database.types'

// ============================================================================
// Portfolio data layer — read-only queries for public pages.
// Derived values (return, allocation, avg cost) are computed here, not stored.
// ============================================================================

export interface HoldingView extends Holding {
  name: string
  sector: string | null
  country: string | null
  market_cap: string | null
  currentPrice: number | null
  marketValue: number
  totalCost: number
  unrealizedGain: number
  unrealizedGainPct: number | null
  weight: number
  holdingDays: number
}

// Fetch holdings from materialized view + enrich with stock master + live price
export async function getHoldings(): Promise<HoldingView[]> {
  const supabase = await createClient()

  const { data: holdings } = await supabase
    .from('mv_holdings')
    .select('*')
    .returns<Holding[]>()

  if (!holdings || holdings.length === 0) return []

  const tickers = holdings.map((h) => h.ticker)
  const { data: stocks } = await supabase
    .from('stocks')
    .select('*')
    .in('ticker', tickers)
    .returns<Stock[]>()

  const stockMap = new Map((stocks ?? []).map((s) => [s.ticker, s]))
  const totalValue = holdings.reduce(
    (sum, h) => sum + h.shares * (stockMap.get(h.ticker) ? h.shares * h.avg_cost : 0),
    0,
  )
  void totalValue

  // Live prices fetched dynamically (per-ticker cached via orchestrator)
  const { getQuote } = await import('@/lib/prices/orchestrator')
  const enriched = await Promise.all(
    holdings.map(async (h): Promise<HoldingView> => {
      const stock = stockMap.get(h.ticker)
      let currentPrice: number | null = null
      try {
        const quote = await getQuote(h.ticker)
        currentPrice = quote.price
      } catch {
        currentPrice = null
      }

      const marketValue = currentPrice ? h.shares * currentPrice : 0
      const totalCost = h.shares * h.avg_cost
      const unrealizedGain = marketValue - totalCost
      const unrealizedGainPct = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : null
      const holdingDays = Math.round(
        (Date.now() - new Date(h.first_trade).getTime()) / 86_400_000,
      )

      return {
        ...h,
        name: stock?.name ?? h.ticker,
        sector: stock?.sector ?? null,
        country: stock?.country ?? null,
        market_cap: stock?.market_cap ?? null,
        currentPrice,
        marketValue,
        totalCost,
        unrealizedGain,
        unrealizedGainPct,
        weight: 0, // set below
        holdingDays,
      }
    }),
  )

  // Compute weights
  const gross = enriched.reduce((s, h) => s + h.marketValue, 0)
  enriched.forEach((h) => {
    h.weight = gross > 0 ? (h.marketValue / gross) * 100 : 0
  })
  enriched.sort((a, b) => b.marketValue - a.marketValue)

  return enriched
}

export async function getLatestSnapshot(): Promise<PortfolioSnapshot | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('portfolio_snapshots')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle<PortfolioSnapshot>()
  return data ?? null
}

export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalGain: number
  totalGainPct: number | null
  cash: number
  cashPct: number
  holdingsCount: number
  lastUpdated: string | null
}

export async function getPortfolioSummary(): Promise<PortfolioSummary | null> {
  const holdings = await getHoldings()
  if (holdings.length === 0) return null

  const totalValue = holdings.reduce((s, h) => s + h.marketValue, 0)
  const totalCost = holdings.reduce((s, h) => s + h.totalCost, 0)
  const totalGain = totalValue - totalCost
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : null

  const snapshot = await getLatestSnapshot()
  const cash = snapshot?.cash ?? 0
  const cashPct = totalValue > 0 ? (cash / (totalValue + cash)) * 100 : 0

  return {
    totalValue,
    totalCost,
    totalGain,
    totalGainPct,
    cash,
    cashPct,
    holdingsCount: holdings.length,
    lastUpdated: snapshot?.date ?? null,
  }
}
