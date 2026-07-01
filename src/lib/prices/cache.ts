// ============================================================================
// Next.js cache layer — keep database free of computed/cached values.
// Quotes are cached via Next's unstable_cache (15-min TTL) in orchestrator.ts.
// This file re-exports the shared cache tag for manual invalidation.
// ============================================================================

export const PRICE_CACHE_TAG = 'price-quote'
export const QUOTE_TTL_SECONDS = 15 * 60 // 15 minutes
