import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/database.types";
import { formatDate, formatCurrency } from "@/lib/format";

export default async function AssetTimelinePage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const upper = ticker.toUpperCase();
  const supabase = await createClient();

  // Verify stock exists
  const { data: stock } = await supabase
    .from("stocks")
    .select("ticker, name")
    .eq("ticker", upper)
    .maybeSingle();

  if (!stock) notFound();

  // Get all transactions for this stock
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("ticker", upper)
    .order("trade_date", { ascending: true })
    .returns<Transaction[]>();

  // Calculate position over time
  let runningShares = 0;
  let totalCost = 0;
  const events = (transactions ?? []).map((tx) => {
    const isBuy = tx.type === "buy" || tx.type === "add";
    if (isBuy) {
      totalCost += tx.shares * tx.price;
      runningShares += tx.shares;
    } else {
      runningShares -= tx.shares;
    }
    return {
      ...tx,
      sharesAfter: runningShares,
      avgCostAfter: runningShares > 0 ? totalCost / runningShares : 0,
      valueAfter: 0, // Will be computed with live prices
    };
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-8">
        <Link
          href={`/stocks/${upper.toLowerCase()}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {stock.ticker}
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Asset Timeline</h1>
        <p className="text-muted-foreground">{stock.name}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border pb-2">
        <TabLink active href={`/stocks/${upper.toLowerCase()}/timeline`}>
          Timeline
        </TabLink>
        <TabLink href={`/stocks/${upper.toLowerCase()}/charts`}>Charts</TabLink>
      </div>

      {/* Timeline View */}
      <ol className="relative space-y-6 border-l border-border pl-6">
        {events.map((event, i) => (
          <li key={event.id} className="flex flex-col gap-1">
            <div className="absolute -left-[7px] h-2.5 w-2.5 rounded-full bg-accent" />
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {formatDate(event.trade_date)}
              </span>
              <span
                className={`badge ${
                  event.type === "buy" || event.type === "add"
                    ? "text-positive"
                    : "text-negative"
                }`}
              >
                {event.type.toUpperCase()}
              </span>
            </div>
            <p className="text-sm tabular-nums">
              {event.shares.toLocaleString()} × {formatCurrency(event.price)}
            </p>
            {event.sharesAfter > 0 && (
              <p className="text-xs text-muted-foreground">
                Position: {event.sharesAfter.toLocaleString()} shares @ avg{" "}
                {formatCurrency(event.avgCostAfter)}
              </p>
            )}
          </li>
        ))}
      </ol>

      {events.length === 0 && (
        <p className="text-muted-foreground">No transactions for {stock.ticker}.</p>
      )}
    </div>
  );
}

function TabLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {children}
      {active && <span className="ml-2 h-1 w-full bg-accent rounded-full block mt-1" />}
    </Link>
  );
}
