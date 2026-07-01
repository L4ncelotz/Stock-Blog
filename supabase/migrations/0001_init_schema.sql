-- ============================================================================
-- Investment OS — Initial Schema
-- Principle: store only Source of Truth. All derived values (return, allocation,
-- avg cost, win rate, score) are computed via views / cache, NOT stored.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('owner', 'public');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_type as enum ('buy', 'sell', 'add', 'reduce');
exception when duplicate_object then null; end $$;

do $$ begin
  create type research_level as enum ('quick_look', 'reading', 'deep_dive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type post_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type watchlist_status as enum ('high_conviction', 'researching', 'waiting_price', 'interested');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_type as enum ('price_refresh', 'snapshot', 'import', 'cache', 'ai');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_status as enum ('pending', 'running', 'success', 'failed', 'skipped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type market_cap_class as enum ('mega', 'large', 'mid', 'small', 'micro');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 1. users — Owner / public mapping (links to auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  name        text,
  role        user_role not null default 'public',
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. settings — single-row config (centralized, not hardcoded)
-- ----------------------------------------------------------------------------
create table if not exists public.settings (
  id                  int primary key default 1 check (id = 1),
  base_currency       text not null default 'USD',
  default_benchmark_id uuid,
  theme               text not null default 'light',
  site_title          text not null default 'Investment OS',
  site_description    text,
  updated_at          timestamptz not null default now()
);

insert into public.settings (id) values (1) on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 3. benchmarks — multiple selectable benchmarks (SPY, QQQ, etc.)
-- ----------------------------------------------------------------------------
create table if not exists public.benchmarks (
  id          uuid primary key default uuid_generate_v4(),
  ticker      text not null unique,    -- SPY, QQQ, VWRA.MI
  name        text not null,
  currency    text not null default 'USD',
  created_at  timestamptz not null default now()
);

alter table public.settings
  add constraint settings_default_benchmark_fk
  foreign key (default_benchmark_id) references public.benchmarks(id) on delete set null;

-- ----------------------------------------------------------------------------
-- 4. benchmark_prices — daily adjusted close per benchmark
-- ----------------------------------------------------------------------------
create table if not exists public.benchmark_prices (
  benchmark_id uuid not null references public.benchmarks(id) on delete cascade,
  date         date not null,
  close_adj    numeric(18,6) not null,
  primary key (benchmark_id, date)
);

create index if not exists idx_benchmark_prices_date
  on public.benchmark_prices (date);

-- ----------------------------------------------------------------------------
-- 5. tags — normalized tag table (for Tag Pages, Top Tags in the future)
--    MVP: optional. Kept here so future features don't need schema rewrite.
-- ----------------------------------------------------------------------------
create table if not exists public.tags (
  id    uuid primary key default uuid_generate_v4(),
  name  text not null unique,
  slug  text not null unique
);

-- ----------------------------------------------------------------------------
-- 6. stocks — master data
-- ----------------------------------------------------------------------------
create table if not exists public.stocks (
  ticker        text primary key,            -- META, NVDA
  name          text not null,
  exchange      text,
  sector        text,
  industry      text,
  country       text,
  market_cap    market_cap_class,
  currency      text not null default 'USD',
  benchmark_id  uuid references public.benchmarks(id) on delete set null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_stocks_sector   on public.stocks (sector);
create index if not exists idx_stocks_country  on public.stocks (country);
create index if not exists idx_stocks_benchmark on public.stocks (benchmark_id);

-- ----------------------------------------------------------------------------
-- 7. stock_tags — many-to-many between stocks and tags
-- ----------------------------------------------------------------------------
create table if not exists public.stock_tags (
  stock_ticker text not null references public.stocks(ticker) on delete cascade,
  tag_id       uuid not null references public.tags(id) on delete cascade,
  primary key (stock_ticker, tag_id)
);

-- ----------------------------------------------------------------------------
-- 8. post_tags — many-to-many between posts and tags
-- ----------------------------------------------------------------------------
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id  uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- NOTE: posts is defined below; this table created after posts. See reorder.

-- ----------------------------------------------------------------------------
-- 9. daily_prices — adjusted close per ticker per day
-- ----------------------------------------------------------------------------
create table if not exists public.daily_prices (
  ticker    text not null references public.stocks(ticker) on delete cascade,
  date      date not null,
  close_adj numeric(18,6) not null,        -- split + dividend adjusted
  source    text,                          -- yahoo / finnhub
  fetched_at timestamptz not null default now(),
  primary key (ticker, date)
);

create index if not exists idx_daily_prices_date on public.daily_prices (date);

-- ----------------------------------------------------------------------------
-- 10. research — thesis versions (SNAPSHOT model)
--     Current version determined by MAX(version) per ticker,
--     reinforced with a partial unique index on is_current.
-- ----------------------------------------------------------------------------
create table if not exists public.research (
  id             uuid primary key default uuid_generate_v4(),
  ticker         text not null references public.stocks(ticker) on delete cascade,
  version        int not null,
  thesis         text,
  bull_case      text,
  bear_case      text,
  risks          text[],
  conviction     int check (conviction between 1 and 10),
  research_level research_level,
  notes          text,
  created_by     uuid references public.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  is_current     boolean not null default false,
  unique (ticker, version)
);

-- Only ONE current research version per ticker
create unique index if not exists uq_research_current_per_ticker
  on public.research (ticker) where is_current = true;

create index if not exists idx_research_ticker on public.research (ticker, version desc);

-- ----------------------------------------------------------------------------
-- 11. decisions — the center of everything
-- ----------------------------------------------------------------------------
create table if not exists public.decisions (
  id                  uuid primary key default uuid_generate_v4(),
  display_id          bigserial,                 -- #145 for UI (not PK)
  ticker              text not null references public.stocks(ticker) on delete restrict,
  type                transaction_type not null,
  research_version_id uuid references public.research(id) on delete set null,
  thesis_snapshot     text,                      -- short reason captured at decision time
  confidence          int check (confidence between 1 and 10),
  time_horizon        text,                      -- 'short','medium','long'
  exit_criteria       text,
  notes               text,
  triggered_at        timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index if not exists idx_decisions_display on public.decisions (display_id);
create index if not exists idx_decisions_ticker  on public.decisions (ticker, triggered_at desc);
create index if not exists idx_decisions_type    on public.decisions (type);

-- ----------------------------------------------------------------------------
-- 12. transactions — every event (buy/sell/add/reduce). Source of truth.
-- ----------------------------------------------------------------------------
create table if not exists public.transactions (
  id            uuid primary key default uuid_generate_v4(),
  decision_id   uuid references public.decisions(id) on delete set null,
  ticker        text not null references public.stocks(ticker) on delete restrict,
  type          transaction_type not null,
  shares        numeric(18,6) not null check (shares > 0),
  price         numeric(18,6) not null check (price > 0),
  fee           numeric(18,6) not null default 0,
  currency      text not null default 'USD',
  trade_date    date not null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_tx_ticker on public.transactions (ticker, trade_date desc);
create index if not exists idx_tx_decision on public.transactions (decision_id);
create index if not exists idx_tx_date on public.transactions (trade_date);

-- ----------------------------------------------------------------------------
-- 13. dividends — for total return
-- ----------------------------------------------------------------------------
create table if not exists public.dividends (
  id               uuid primary key default uuid_generate_v4(),
  ticker           text not null references public.stocks(ticker) on delete cascade,
  ex_date          date not null,
  pay_date         date,
  amount_per_share numeric(18,6) not null,
  shares_held      numeric(18,6),
  created_at       timestamptz not null default now()
);

create index if not exists idx_dividends_ticker on public.dividends (ticker, ex_date desc);

-- ----------------------------------------------------------------------------
-- 14. posts — blog
-- ----------------------------------------------------------------------------
create table if not exists public.posts (
  id               uuid primary key default uuid_generate_v4(),
  title            text not null,
  slug             text not null unique,
  excerpt          text,
  category         text,                        -- dynamic, optional (NOT enum)
  content          text not null,               -- Markdown
  cover_image      text,
  status           post_status not null default 'draft',
  featured         boolean not null default false,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references public.users(id) on delete set null
);

create index if not exists idx_posts_status   on public.posts (status, published_at desc);
create index if not exists idx_posts_category on public.posts (category);
create index if not exists idx_posts_featured on public.posts (featured) where featured = true;

-- Full-text search vector for posts
alter table public.posts add column if not exists search_vector tsvector;

create index if not exists idx_posts_search on public.posts
  using gin (search_vector);

-- ----------------------------------------------------------------------------
-- 15. post_tickers — which tickers a post mentions (many-to-many)
-- ----------------------------------------------------------------------------
create table if not exists public.post_tickers (
  post_id       uuid not null references public.posts(id) on delete cascade,
  stock_ticker  text not null references public.stocks(ticker) on delete cascade,
  primary key (post_id, stock_ticker)
);

-- ----------------------------------------------------------------------------
-- 16. decision_posts — many-to-many between decisions and posts
--     (replaces related_post_ids uuid[])
-- ----------------------------------------------------------------------------
create table if not exists public.decision_posts (
  decision_id uuid not null references public.decisions(id) on delete cascade,
  post_id     uuid not null references public.posts(id) on delete cascade,
  primary key (decision_id, post_id)
);

-- ----------------------------------------------------------------------------
-- 17. watchlist
-- ----------------------------------------------------------------------------
create table if not exists public.watchlist (
  id            uuid primary key default uuid_generate_v4(),
  ticker        text not null references public.stocks(ticker) on delete cascade,
  status        watchlist_status not null default 'interested',
  target_price  numeric(18,6),
  thesis        text,
  added_at      timestamptz not null default now()
);

create index if not exists idx_watchlist_status on public.watchlist (status);

-- ----------------------------------------------------------------------------
-- 18. portfolio_snapshots — one row per day (source of truth for time-series)
-- ----------------------------------------------------------------------------
create table if not exists public.portfolio_snapshots (
  id              uuid primary key default uuid_generate_v4(),
  date            date not null unique,
  portfolio_value numeric(18,6) not null,
  cash            numeric(18,6) not null default 0,
  benchmark_value numeric(18,6),       -- benchmark value at same date (for alpha)
  source          text,                -- yahoo / finnhub
  created_at      timestamptz not null default now()
);

-- NOTE: investment_scores are NOT stored here. They live in Next.js cache/Redis.

-- ----------------------------------------------------------------------------
-- 19. portfolio_snapshot_positions — normalized positions per snapshot
-- ----------------------------------------------------------------------------
create table if not exists public.portfolio_snapshot_positions (
  snapshot_id  uuid not null references public.portfolio_snapshots(id) on delete cascade,
  ticker       text not null references public.stocks(ticker) on delete restrict,
  shares       numeric(18,6) not null,
  avg_cost     numeric(18,6) not null,
  market_value numeric(18,6) not null,
  weight       numeric(8,4) not null,    -- percentage of portfolio
  primary key (snapshot_id, ticker)
);

create index if not exists idx_psp_snapshot on public.portfolio_snapshot_positions (snapshot_id);
create index if not exists idx_psp_ticker   on public.portfolio_snapshot_positions (ticker, snapshot_id desc);

-- ----------------------------------------------------------------------------
-- 20. holdings — MATERIALZED VIEW (NOT source of truth)
--     Computed from transactions. Refresh on every transaction change.
-- ----------------------------------------------------------------------------
create materialized view if not exists public.mv_holdings as
select
  t.ticker,
  sum(case when t.type in ('buy','add')  then t.shares else -t.shares end) as shares,
  sum(case when t.type in ('buy','add')  then t.shares * t.price else 0 end)
    / nullif(sum(case when t.type in ('buy','add')  then t.shares else 0 end), 0) as avg_cost,
  count(*) as tx_count,
  min(t.trade_date) as first_trade,
  max(t.trade_date) as last_trade
from public.transactions t
group by t.ticker
having sum(case when t.type in ('buy','add')  then t.shares else -t.shares end) > 0;

create unique index if not exists idx_mv_holdings_ticker
  on public.mv_holdings (ticker);

-- ----------------------------------------------------------------------------
-- 21. jobs — cron / refresh / import / cache / ai
-- ----------------------------------------------------------------------------
create table if not exists public.jobs (
  id          uuid primary key default uuid_generate_v4(),
  type        job_type not null,
  status      job_status not null default 'pending',
  started_at  timestamptz,
  finished_at timestamptz,
  duration_ms int,
  payload     jsonb,
  result      jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_jobs_type_status on public.jobs (type, status, created_at desc);

-- ----------------------------------------------------------------------------
-- 22. job_logs — detailed logs per job (for debugging)
-- ----------------------------------------------------------------------------
create table if not exists public.job_logs (
  id         uuid primary key default uuid_generate_v4(),
  job_id     uuid not null references public.jobs(id) on delete cascade,
  level      text not null default 'info',     -- info / warn / error
  message    text not null,
  meta       jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_job_logs_job on public.job_logs (job_id, created_at);

-- ----------------------------------------------------------------------------
-- 23. audit_logs — track admin changes (who / what / when / old / new)
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id         uuid primary key default uuid_generate_v4(),
  actor_id   uuid references public.users(id) on delete set null,
  table_name text not null,
  record_id  text not null,
  action     text not null,             -- insert / update / delete
  old_value  jsonb,
  new_value  jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_table_record on public.audit_logs (table_name, record_id);
create index if not exists idx_audit_actor on public.audit_logs (actor_id, created_at desc);

-- ============================================================================
-- Full-text search triggers (posts)
-- ============================================================================
create or replace function public.posts_search_tsv() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')),    'A') ||
    setweight(to_tsvector('english', coalesce(new.excerpt, '')),  'B') ||
    setweight(to_tsvector('english', coalesce(new.content, '')),  'C');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_posts_search on public.posts;
create trigger trg_posts_search
  before insert or update on public.posts
  for each row execute function public.posts_search_tsv();

-- ============================================================================
-- updated_at maintenance
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_stocks_touch on public.stocks;
create trigger trg_stocks_touch before update on public.stocks
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_posts_touch on public.posts;
create trigger trg_posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_settings_touch on public.settings;
create trigger trg_settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.users                       enable row level security;
alter table public.settings                    enable row level security;
alter table public.benchmarks                  enable row level security;
alter table public.benchmark_prices            enable row level security;
alter table public.stocks                      enable row level security;
alter table public.tags                        enable row level security;
alter table public.stock_tags                  enable row level security;
alter table public.post_tags                   enable row level security;
alter table public.daily_prices                enable row level security;
alter table public.research                    enable row level security;
alter table public.decisions                   enable row level security;
alter table public.decision_posts              enable row level security;
alter table public.transactions                enable row level security;
alter table public.dividends                   enable row level security;
alter table public.posts                       enable row level security;
alter table public.post_tickers                enable row level security;
alter table public.watchlist                   enable row level security;
alter table public.portfolio_snapshots         enable row level security;
alter table public.portfolio_snapshot_positions enable row level security;
alter table public.jobs                        enable row level security;
alter table public.job_logs                    enable row level security;
alter table public.audit_logs                  enable row level security;

-- Helper: is the current user the owner?
create or replace function public.is_owner()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'owner'
  );
$$;

-- Public READ policies (read-only for everyone)
do $$
declare t text;
begin
  for t in select unnest(array[
    'settings','benchmarks','benchmark_prices','stocks','tags','stock_tags',
    'post_tags','daily_prices','research','decisions','decision_posts',
    'transactions','dividends','posts','post_tickers','watchlist',
    'portfolio_snapshots','portfolio_snapshot_positions'
  ]) loop
    execute format('drop policy if exists public_read on public.%I;', t);
    execute format('create policy public_read on public.%I for select using (true);', t);
  end loop;
end $$;

-- Owner WRITE policies (all tables) — insert/update/delete
do $$
declare t text;
begin
  for t in select unnest(array[
    'settings','benchmarks','benchmark_prices','stocks','tags','stock_tags',
    'post_tags','daily_prices','research','decisions','decision_posts',
    'transactions','dividends','posts','post_tickers','watchlist',
    'portfolio_snapshots','portfolio_snapshot_positions','jobs','job_logs',
    'audit_logs'
  ]) loop
    execute format('drop policy if exists owner_write on public.%I;', t);
    execute format(
      'create policy owner_write on public.%I for all using (public.is_owner()) with check (public.is_owner());',
      t
    );
  end loop;
end $$;

-- users table: a row is readable by itself or by owner; writable by owner
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
  for select using (id = auth.uid() or public.is_owner());

drop policy if exists users_owner_write on public.users;
create policy users_owner_write on public.users
  for all using (public.is_owner()) with check (public.is_owner());
