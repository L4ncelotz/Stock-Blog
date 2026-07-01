// ============================================================================
// Database types — mirrors the Supabase schema (supabase/migrations/0001_*).
// Single source of truth for TypeScript. Keep in sync with migrations.
// ============================================================================

export type UserRole = 'owner' | 'public'
export type TransactionType = 'buy' | 'sell' | 'add' | 'reduce'
export type ResearchLevel = 'quick_look' | 'reading' | 'deep_dive'
export type PostStatus = 'draft' | 'published' | 'archived'
export type WatchlistStatus = 'high_conviction' | 'researching' | 'waiting_price' | 'interested'
export type JobType = 'price_refresh' | 'snapshot' | 'import' | 'cache' | 'ai'
export type JobStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'
export type MarketCapClass = 'mega' | 'large' | 'mid' | 'small' | 'micro'

export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  created_at: string
}

export interface Settings {
  id: number
  base_currency: string
  default_benchmark_id: string | null
  theme: string
  site_title: string
  site_description: string | null
  updated_at: string
}

export interface Benchmark {
  id: string
  ticker: string
  name: string
  currency: string
  created_at: string
}

export interface BenchmarkPrice {
  benchmark_id: string
  date: string
  close_adj: number
}

export interface Tag {
  id: string
  name: string
  slug: string
}

export interface Stock {
  ticker: string
  name: string
  exchange: string | null
  sector: string | null
  industry: string | null
  country: string | null
  market_cap: MarketCapClass | null
  currency: string
  benchmark_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DailyPrice {
  ticker: string
  date: string
  close_adj: number
  source: string | null
  fetched_at: string
}

export interface Research {
  id: string
  ticker: string
  version: number
  thesis: string | null
  bull_case: string | null
  bear_case: string | null
  risks: string[] | null
  conviction: number | null
  research_level: ResearchLevel | null
  notes: string | null
  created_by: string | null
  created_at: string
  is_current: boolean
}

export interface Decision {
  id: string
  display_id: number
  ticker: string
  type: TransactionType
  research_version_id: string | null
  thesis_snapshot: string | null
  confidence: number | null
  time_horizon: string | null
  exit_criteria: string | null
  notes: string | null
  triggered_at: string
  created_at: string
}

export interface Transaction {
  id: string
  decision_id: string | null
  ticker: string
  type: TransactionType
  shares: number
  price: number
  fee: number
  currency: string
  trade_date: string
  created_at: string
}

export interface Dividend {
  id: string
  ticker: string
  ex_date: string
  pay_date: string | null
  amount_per_share: number
  shares_held: number | null
  created_at: string
}

export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string | null
  content: string
  cover_image: string | null
  status: PostStatus
  featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  search_vector?: unknown
}

export interface WatchlistItem {
  id: string
  ticker: string
  status: WatchlistStatus
  target_price: number | null
  thesis: string | null
  added_at: string
}

export interface PortfolioSnapshot {
  id: string
  date: string
  portfolio_value: number
  cash: number
  benchmark_value: number | null
  source: string | null
  created_at: string
}

export interface PortfolioSnapshotPosition {
  snapshot_id: string
  ticker: string
  shares: number
  avg_cost: number
  market_value: number
  weight: number
}

export interface Holding {
  ticker: string
  shares: number
  avg_cost: number
  tx_count: number
  first_trade: string
  last_trade: string
}

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  started_at: string | null
  finished_at: string | null
  duration_ms: number | null
  payload: Record<string, unknown> | null
  result: Record<string, unknown> | null
  created_at: string
}

export interface JobLog {
  id: string
  job_id: string
  level: string
  message: string
  meta: Record<string, unknown> | null
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  table_name: string
  record_id: string
  action: string
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  created_at: string
}

// Junction tables
export interface StockTag {
  stock_ticker: string
  tag_id: string
}

export interface PostTag {
  post_id: string
  tag_id: string
}

export interface PostTicker {
  post_id: string
  stock_ticker: string
}

export interface DecisionPost {
  decision_id: string
  post_id: string
}
