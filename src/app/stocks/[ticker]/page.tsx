import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getQuote } from "@/lib/prices/orchestrator";
import type {
  Decision,
  Post,
  Research,
  Stock,
  Transaction,
} from "@/lib/database.types";
import {
  formatCurrency,
  formatPercent,
  formatDate,
  scoreToGrade,
} from "@/lib/format";

export default async function StockPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const upper = ticker.toUpperCase();
  const supabase = await createClient();

  const { data: stock } = await supabase
    .from("stocks")
    .select("*")
    .eq("ticker", upper)
    .maybeSingle<Stock>();

  if (!stock) notFound();

  // Current research (use MAX(version) as source of truth)
  const { data: research } = await supabase
    .from("research")
    .select("*")
    .eq("ticker", upper)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<Research>();

  // Decision history (timeline of events)
  const { data: decisions } = await supabase
    .from("decisions")
    .select("*")
    .eq("ticker", upper)
    .order("triggered_at", { ascending: false })
    .returns<Decision[]>();

  // Transactions for this stock
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("ticker", upper)
    .order("trade_date", { ascending: false })
    .returns<Transaction[]>();

  // Related articles
  const { data: postIds } = await supabase
    .from("post_tickers")
    .select("post_id")
    .eq("stock_ticker", upper);
  const ids = (postIds ?? []).map((p) => p.post_id);
  const { data: posts } =
    ids.length > 0
      ? await supabase
          .from("posts")
          .select("*")
          .in("id", ids)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .returns<Post[]>()
      : { data: [] as Post[] };

  // Live price
  let quote: { price: number; changePct: number; currency: string } | null = null;
  try {
    const q = await getQuote(upper);
    quote = { price: q.price, changePct: q.changePct, currency: q.currency };
  } catch {
    quote = null;
  }

  // Aggregate position from transactions
  const buyShares = (transactions ?? [])
    .filter((t) => t.type === "buy" || t.type === "add")
    .reduce((s, t) => s + t.shares, 0);
  const sellShares = (transactions ?? [])
    .filter((t) => t.type === "sell" || t.type === "reduce")
    .reduce((s, t) => s + t.shares, 0);
  const netShares = buyShares - sellShares;
  const avgCost =
    buyShares > 0
      ? (transactions ?? [])
          .filter((t) => t.type === "buy" || t.type === "add")
          .reduce((s, t) => s + t.shares * t.price, 0) / buyShares
      : 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <Link
          href="/portfolio"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Portfolio
        </Link>
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">{stock.ticker}</h1>
            <p className="mt-1 text-lg text-muted-foreground">{stock.name}</p>
          </div>
          {quote && (
            <div className="text-right">
              <p className="text-3xl font-bold tabular-nums">
                {formatCurrency(quote.price, quote.currency)}
              </p>
              <p
                className={`tabular-nums ${
                  quote.changePct >= 0 ? "text-positive" : "text-negative"
                }`}
              >
                {formatPercent(quote.changePct)} today
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        {(stock.sector || stock.country || stock.market_cap) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {stock.sector && <span className="badge">{stock.sector}</span>}
            {stock.industry && <span className="badge">{stock.industry}</span>}
            {stock.country && <span className="badge">{stock.country}</span>}
            {stock.market_cap && (
              <span className="badge uppercase">{stock.market_cap} cap</span>
            )}
          </div>
        )}
      </div>

      {/* Position summary */}
      {netShares > 0 && (
        <section className="mb-12 grid gap-4 sm:grid-cols-4">
          <Stat label="Shares" value={netShares.toLocaleString()} />
          <Stat label="Avg Cost" value={formatCurrency(avgCost)} />
          <Stat
            label="Market Value"
            value={quote ? formatCurrency(netShares * quote.price) : "—"}
          />
          <Stat
            label="Return"
            value={
              quote
                ? formatPercent(((quote.price - avgCost) / avgCost) * 100)
                : "—"
            }
            tone={quote && quote.price >= avgCost ? "positive" : "negative"}
          />
        </section>
      )}

      <div className="grid gap-12 lg:grid-cols-3">
        {/* Thesis (main column) */}
        <div className="lg:col-span-2">
          {research ? (
            <>
              <section className="mb-10">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Investment Thesis</h2>
                  <span className="badge">v{research.version}</span>
                </div>
                {research.thesis && (
                  <p className="leading-relaxed text-muted-foreground">
                    {research.thesis}
                  </p>
                )}
              </section>

              <div className="mb-10 grid gap-6 sm:grid-cols-2">
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-positive">
                    Bull Case
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {research.bull_case || "—"}
                  </p>
                </section>
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-negative">
                    Bear Case
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {research.bear_case || "—"}
                  </p>
                </section>
              </div>

              {research.risks && research.risks.length > 0 && (
                <section className="mb-10">
                  <h3 className="mb-2 text-sm font-semibold">Risks</h3>
                  <ul className="list-inside list-disc text-sm text-muted-foreground">
                    {research.risks.map((r, i) => (
                      <li key={i} className="mb-1">
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {research.conviction && (
                <section className="mb-10">
                  <h3 className="mb-2 text-sm font-semibold">Conviction</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {research.conviction}
                    </span>
                    <span className="text-muted-foreground">/ 10</span>
                  </div>
                </section>
              )}
            </>
          ) : (
            <section className="mb-10">
              <h2 className="mb-3 text-xl font-semibold">Investment Thesis</h2>
              <p className="text-muted-foreground">
                No thesis published yet for {stock.ticker}.
              </p>
            </section>
          )}
        </div>

        {/* Sidebar: Decision history */}
        <aside>
          <h3 className="mb-4 text-sm font-semibold">Decision History</h3>
          {(decisions ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No decisions recorded yet.
            </p>
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-4">
              {(decisions ?? []).map((d) => (
                <li key={d.id}>
                  <div className="absolute -left-[5px] h-2.5 w-2.5 rounded-full bg-accent" />
                  <Link
                    href={`/decisions/${d.display_id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    #{d.display_id} · {d.type.toUpperCase()}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(d.triggered_at)}
                    {d.confidence ? ` · conviction ${d.confidence}/10` : ""}
                  </p>
                  {d.thesis_snapshot && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {d.thesis_snapshot}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>

      {/* Related articles */}
      {posts && posts.length > 0 && (
        <section className="mt-16 border-t border-border pt-8">
          <h2 className="mb-4 text-xl font-semibold">Related Articles</h2>
          <ul className="space-y-3">
            {posts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="font-medium hover:underline"
                >
                  {p.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatDate(p.published_at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="card">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          tone === "positive"
            ? "text-positive"
            : tone === "negative"
              ? "text-negative"
              : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
