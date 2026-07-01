import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Stock, WatchlistItem } from "@/lib/database.types";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata = { title: "Watchlist" };

const STATUS_ORDER = [
  "high_conviction",
  "researching",
  "waiting_price",
  "interested",
] as const;

const STATUS_LABEL: Record<string, string> = {
  high_conviction: "High Conviction",
  researching: "Researching",
  waiting_price: "Waiting for Price",
  interested: "Interested",
};

export default async function WatchlistPage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("watchlist")
    .select("*")
    .order("added_at", { ascending: false })
    .returns<WatchlistItem[]>();

  const tickers = (items ?? []).map((i) => i.ticker);
  const { data: stocks } =
    tickers.length > 0
      ? await supabase
          .from("stocks")
          .select("*")
          .in("ticker", tickers)
          .returns<Stock[]>()
      : { data: [] as Stock[] };

  const stockMap = new Map((stocks ?? []).map((s) => [s.ticker, s]));

  // Group by status
  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: (items ?? []).filter((i) => i.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold">Watchlist</h1>

      {(!items || items.length === 0) && (
        <p className="text-muted-foreground">No stocks on watchlist yet.</p>
      )}

      <div className="space-y-12">
        {grouped.map((group) => (
          <section key={group.status}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {STATUS_LABEL[group.status]} ({group.items.length})
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {group.items.map((item) => {
                const stock = stockMap.get(item.ticker);
                return (
                  <li key={item.id} className="card">
                    <div className="flex items-baseline justify-between">
                      <Link
                        href={`/stocks/${item.ticker.toLowerCase()}`}
                        className="text-lg font-semibold hover:underline"
                      >
                        {item.ticker}
                      </Link>
                      {item.target_price && (
                        <span className="text-sm text-muted-foreground">
                          Target {formatCurrency(item.target_price)}
                        </span>
                      )}
                    </div>
                    {stock && (
                      <p className="text-sm text-muted-foreground">
                        {stock.name}
                      </p>
                    )}
                    {item.thesis && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {item.thesis}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                      Added {formatDate(item.added_at)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
