import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Search" };

const TYPES = ["all", "blog", "stock", "research", "watchlist"] as const;
const TYPE_LABELS: Record<string, string> = {
  all: "All",
  blog: "Blog",
  stock: "Stocks",
  research: "Research",
  watchlist: "Watchlist",
};

// ============================================================================
// Global Search — full-text across posts (tsvector), stocks (name/ticker),
// research (thesis), watchlist (thesis). Results grouped by type.
// ============================================================================
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const supabase = await createClient();

  const query = (q ?? "").trim();
  const activeType = TYPES.includes(type as (typeof TYPES)[number]) ? type : "all";

  const results: {
    stocks: { ticker: string; name: string; sector: string | null }[];
    posts: { id: string; title: string; slug: string; excerpt: string | null; published_at: string | null }[];
    research: { id: string; ticker: string; version: number; thesis: string | null }[];
    watchlist: { id: string; ticker: string; thesis: string | null; status: string }[];
  } = { stocks: [], posts: [], research: [], watchlist: [] };

  if (query) {
    // Full-text search on posts (tsvector — already indexed)
    if (activeType === "all" || activeType === "blog") {
      const { data } = await supabase
        .from("posts")
        .select("id, title, slug, excerpt, published_at")
        .eq("status", "published")
        .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
        .order("published_at", { ascending: false })
        .limit(10);
      results.posts = data ?? [];
    }

    // Stocks: ticker or name (ilike — small table, fast enough)
    if (activeType === "all" || activeType === "stock") {
      const { data } = await supabase
        .from("stocks")
        .select("ticker, name, sector")
        .or(`ticker.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(10);
      results.stocks = data ?? [];
    }

    // Research: thesis text
    if (activeType === "all" || activeType === "research") {
      const { data } = await supabase
        .from("research")
        .select("id, ticker, version, thesis")
        .eq("is_current", true)
        .or(`thesis.ilike.%${query}%,ticker.ilike.%${query}%`)
        .limit(10);
      results.research = data ?? [];
    }

    // Watchlist: thesis
    if (activeType === "all" || activeType === "watchlist") {
      const { data } = await supabase
        .from("watchlist")
        .select("id, ticker, thesis, status")
        .or(`thesis.ilike.%${query}%,ticker.ilike.%${query}%`)
        .limit(10);
      results.watchlist = data ?? [];
    }
  }

  const totalResults =
    results.stocks.length +
    results.posts.length +
    results.research.length +
    results.watchlist.length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold">Search</h1>

      {/* Search form */}
      <form action="/search" method="get" className="mb-6">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search stocks, articles, research..."
            autoFocus
            className="flex-1 rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </div>
      </form>

      {/* Type filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <Link
            key={t}
            href={`/search?q=${encodeURIComponent(query)}&type=${t}`}
            className={`badge ${activeType === t ? "bg-accent text-accent-foreground" : ""}`}
          >
            {TYPE_LABELS[t]}
          </Link>
        ))}
      </div>

      {!query && (
        <p className="text-muted-foreground">Type a query to search across stocks, blog, research, and watchlist.</p>
      )}

      {query && totalResults === 0 && (
        <p className="text-muted-foreground">
          No results for &ldquo;{query}&rdquo;.
        </p>
      )}

      {/* Results */}
      <div className="space-y-10">
        {results.stocks.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Stocks ({results.stocks.length})
            </h2>
            <ul className="space-y-2">
              {results.stocks.map((s) => (
                <li key={s.ticker} className="card">
                  <Link
                    href={`/stocks/${s.ticker.toLowerCase()}`}
                    className="font-semibold hover:underline"
                  >
                    {s.ticker}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {s.name}
                    {s.sector ? ` · ${s.sector}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {results.posts.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Blog ({results.posts.length})
            </h2>
            <ul className="space-y-2">
              {results.posts.map((p) => (
                <li key={p.id} className="card">
                  <Link
                    href={`/blog/${p.slug}`}
                    className="font-semibold hover:underline"
                  >
                    {p.title}
                  </Link>
                  {p.excerpt && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {p.excerpt}
                    </p>
                  )}
                  {p.published_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(p.published_at)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {results.research.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Research ({results.research.length})
            </h2>
            <ul className="space-y-2">
              {results.research.map((r) => (
                <li key={r.id} className="card">
                  <Link
                    href={`/stocks/${r.ticker.toLowerCase()}`}
                    className="font-semibold hover:underline"
                  >
                    {r.ticker}
                  </Link>
                  <span className="badge ml-2">v{r.version}</span>
                  {r.thesis && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {r.thesis}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {results.watchlist.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Watchlist ({results.watchlist.length})
            </h2>
            <ul className="space-y-2">
              {results.watchlist.map((w) => (
                <li key={w.id} className="card">
                  <Link
                    href={`/stocks/${w.ticker.toLowerCase()}`}
                    className="font-semibold hover:underline"
                  >
                    {w.ticker}
                  </Link>
                  <span className="badge ml-2 capitalize">{w.status.replace("_", " ")}</span>
                  {w.thesis && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {w.thesis}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
