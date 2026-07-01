'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addTransaction(formData: FormData) {
  const supabase = await createClient()

  const ticker = (String(formData.get('ticker') ?? '')).toUpperCase()
  const type = String(formData.get('type') ?? '')
  const shares = Number(formData.get('shares'))
  const price = Number(formData.get('price'))
  const fee = Number(formData.get('fee') ?? 0)
  const tradeDate = String(formData.get('trade_date') ?? new Date().toISOString().slice(0, 10))
  const thesisSnapshot = String(formData.get('thesis_snapshot') ?? '')
  const confidence = Number(formData.get('confidence') ?? 5)

  if (!ticker || !type || !shares || !price) {
    return { error: 'Missing required fields: ticker, type, shares, price' }
  }

  // 1. Upsert stock if new
  await supabase.from('stocks').upsert(
    { ticker, name: ticker, is_active: true },
    { onConflict: 'ticker' },
  )

  // 2. Create decision
  const { data: decision } = await supabase
    .from('decisions')
    .insert({
      ticker,
      type,
      thesis_snapshot: thesisSnapshot || null,
      confidence: confidence || null,
    })
    .select('id')
    .single()

  // 3. Create transaction linked to decision
  const { error } = await supabase.from('transactions').insert({
    decision_id: decision?.id,
    ticker,
    type,
    shares,
    price,
    fee,
    trade_date: tradeDate,
  })

  if (error) return { error: error.message }

  revalidatePath('/portfolio')
  revalidatePath('/admin/portfolio')
  revalidatePath('/')

  return { ok: true }
}

export async function addStock(formData: FormData) {
  const supabase = await createClient()

  const ticker = (String(formData.get('ticker') ?? '')).toUpperCase()
  const name = String(formData.get('name') ?? '')
  const sector = String(formData.get('sector') ?? '') || null
  const industry = String(formData.get('industry') ?? '') || null
  const country = String(formData.get('country') ?? '') || null

  if (!ticker || !name) return { error: 'Ticker and name are required' }

  const { error } = await supabase.from('stocks').upsert(
    { ticker, name, sector, industry, country },
    { onConflict: 'ticker' },
  )

  if (error) return { error: error.message }

  revalidatePath('/portfolio')
  revalidatePath('/admin/portfolio')
  return { ok: true }
}
