import { NextResponse } from 'next/server'
import { runDailySnapshot } from '@/lib/prices/snapshot'

// Vercel Cron — runs daily after US market close (21:00 UTC ≈ 4pm ET).
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/snapshot", "schedule": "0 21 * * *" }] }
// Protected by CRON_SECRET bearer token.
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const result = await runDailySnapshot()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
