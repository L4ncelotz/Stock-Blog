import { createAdminClient } from '@/lib/supabase/admin'
import { getQuote } from './orchestrator'
import { getHistory } from './yahoo'
import type { Holding } from '@/lib/database.types'

// ============================================================================
// Daily snapshot job — runs after market close (cron / route handler).
// 1. Upsert latest daily_prices for held tickers
// 2. Compute portfolio value + cash + benchmark value
// 3. Insert portfolio_snapshots + portfolio_snapshot_positions (normalized)
// Source of truth for time-series. Runs with service role (bypasses RLS).
// ============================================================================

interface JobResult {
  date: string
  portfolioValue: number
  cash: number
  positions: number
}

export async function runDailySnapshot(date = new Date()): Promise<JobResult> {
  const supabase = createAdminClient()
  const dateStr = date.toISOString().slice(0, 10)
  const startedAt = Date.now()

  // Record job
  const { data: job } = await supabase
    .from('jobs')
    .insert({ type: 'snapshot', status: 'running', started_at: new Date().toISOString() })
    .select()
    .single()

  try {
    // 1. Get current holdings (materialized view)
    const { data: holdings, error: holdingsErr } = await supabase
      .from('mv_holdings')
      .select('*')
      .returns<Holding[]>()

    if (holdingsErr) throw holdingsErr
    if (!holdings || holdings.length === 0) {
      throw new Error('no holdings — add transactions first')
    }

    // 2. Fetch live quotes + compute position values
    const positions = await Promise.all(
      holdings.map(async (h) => {
        const quote = await getQuote(h.ticker)
        const marketValue = h.shares * quote.price

        // Upsert daily price (adjusted close = current price for today)
        await supabase.from('daily_prices').upsert(
          {
            ticker: h.ticker,
            date: dateStr,
            close_adj: quote.price,
            source: quote.source,
            fetched_at: quote.fetchedAt,
          },
          { onConflict: 'ticker,date' },
        )

        return {
          ticker: h.ticker,
          shares: h.shares,
          avg_cost: h.avg_cost,
          market_value: marketValue,
          weight: 0, // computed after summing
          quote_source: quote.source,
        }
      }),
    )

    // 3. Compute total + weights
    const grossValue = positions.reduce((sum, p) => sum + p.market_value, 0)

    // Cash: sum of cash deposits minus buys (simplified; refine via cash ledger later)
    const { data: cashRow } = await supabase
      .from('settings')
      .select('base_currency')
      .single()
    void cashRow

    // For MVP, cash tracked via a cash deposits concept later. Default 0.
    const cash = 0
    const portfolioValue = grossValue + cash

    positions.forEach((p) => {
      p.weight = grossValue > 0 ? (p.market_value / grossValue) * 100 : 0
    })

    // 4. Insert snapshot
    const { data: snapshot, error: snapErr } = await supabase
      .from('portfolio_snapshots')
      .upsert(
        {
          date: dateStr,
          portfolio_value: portfolioValue,
          cash,
          source: positions[0]?.quote_source ?? 'yahoo',
        },
        { onConflict: 'date' },
      )
      .select()
      .single()

    if (snapErr) throw snapErr

    // 5. Insert normalized positions
    await supabase
      .from('portfolio_snapshot_positions')
      .upsert(
        positions.map((p) => ({
          snapshot_id: snapshot.id,
          ticker: p.ticker,
          shares: p.shares,
          avg_cost: p.avg_cost,
          market_value: p.market_value,
          weight: p.weight,
        })),
        { onConflict: 'snapshot_id,ticker' },
      )

    // 6. Benchmark value (SPY by default)
    try {
      const spyQuote = await getQuote('SPY')
      await supabase
        .from('portfolio_snapshots')
        .update({ benchmark_value: spyQuote.price })
        .eq('id', snapshot.id)
    } catch {
      // non-fatal
    }

    const result: JobResult = {
      date: dateStr,
      portfolioValue,
      cash,
      positions: positions.length,
    }

    await supabase
      .from('jobs')
      .update({
        status: 'success',
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
        result: result as unknown as Record<string, unknown>,
      })
      .eq('id', job?.id)

    return result
  } catch (error) {
    await supabase
      .from('jobs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
        result: {
          error: error instanceof Error ? error.message : String(error),
        } as unknown as Record<string, unknown>,
      })
      .eq('id', job?.id)

    throw error
  }
}

// ============================================================================
// Backfill daily_prices history for a ticker from Yahoo (for charts).
// ============================================================================
export async function backfillPrices(ticker: string, days = 365) {
  const supabase = createAdminClient()
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)

  const history = await getHistory(
    ticker,
    from.toISOString().slice(0, 10),
    to.toISOString().slice(0, 10),
  )

  if (history.length === 0) return { ticker, inserted: 0 }

  const { error } = await supabase.from('daily_prices').upsert(
    history.map((p) => ({
      ticker: p.ticker,
      date: p.date,
      close_adj: p.closeAdj,
      source: 'yahoo',
    })),
    { onConflict: 'ticker,date' },
  )

  if (error) throw error
  return { ticker, inserted: history.length }
}
