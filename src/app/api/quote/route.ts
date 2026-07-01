import { NextResponse } from 'next/server'
import { getQuote, refreshQuote } from '@/lib/prices/orchestrator'

// GET /api/quote?ticker=META         — cached quote
// POST /api/quote?ticker=META        — force refresh (owner)
export async function GET(request: Request) {
  const ticker = new URL(request.url).searchParams.get('ticker')
  if (!ticker) {
    return NextResponse.json({ error: 'ticker required' }, { status: 400 })
  }

  try {
    const quote = await getQuote(ticker.toUpperCase())
    return NextResponse.json(quote)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'fetch failed' },
      { status: 502 },
    )
  }
}

export async function POST(request: Request) {
  const ticker = new URL(request.url).searchParams.get('ticker')
  if (!ticker) {
    return NextResponse.json({ error: 'ticker required' }, { status: 400 })
  }

  // Owner-only: protect via session check in production
  try {
    const quote = await refreshQuote(ticker.toUpperCase())
    return NextResponse.json(quote)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'refresh failed' },
      { status: 502 },
    )
  }
}
