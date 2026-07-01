-- ============================================================================
-- Materialized view refresh on transaction change
-- ============================================================================

-- Refresh mv_holdings whenever transactions are inserted/updated/deleted
create or replace function public.refresh_mv_holdings()
returns trigger language plpgsql security definer as $$
begin
  refresh materialized view concurrently public.mv_holdings;
  return null;
end;
$$;

drop trigger if exists trg_tx_refresh_holdings on public.transactions;
create trigger trg_tx_refresh_holdings
  after insert or update or delete on public.transactions
  referencing new table as new table old table as old table
  for each statement execute function public.refresh_mv_holdings();

-- ============================================================================
-- Seed data — default benchmarks + settings wiring
-- ============================================================================
insert into public.benchmarks (ticker, name, currency) values
  ('SPY',     'SPDR S&P 500 ETF',                'USD'),
  ('QQQ',     'Invesco QQQ Trust (Nasdaq 100)',  'USD'),
  ('VWRA.MI', 'Vanguard FTSE All-World UCITS',   'USD'),
  ('VTI',     'Vanguard Total Stock Market',     'USD')
on conflict (ticker) do nothing;

-- Wire default benchmark to S&P 500
update public.settings
  set default_benchmark_id = (select id from public.benchmarks where ticker = 'SPY')
  where default_benchmark_id is null;
