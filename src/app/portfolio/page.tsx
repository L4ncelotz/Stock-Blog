import Link from "next/link";
import { getHoldings, getPortfolioSummary } from "@/lib/portfolio/queries";
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
  formatDate,
} from "@/lib/format";

export const metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const [summary, holdings] = await Promise.all([
    getPortfolioSummary(),
    getHoldings(),
  ]);

  if (!summary) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">
          No holdings yet. Transactions will appear here once added.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        {summary.lastUpdated && (
          <p className="mt-1 text-sm text-muted-foreground">
            Last updated {formatDate(summary.lastUpdated)}
          </p>
        )}
      </div>

      {/* Summary cards */}
      <div className="mb-12 grid gap-4 sm:grid-cols-4">
        <Stat
          label="Total Value"
          value={formatCompactCurrency(summary.totalValue)}
        />
        <Stat
          label="Total Return"
          value={formatPercent(summary.totalGainPct)}
          tone={summary.totalGain >= 0 ? "positive" : "negative"}
        />
        <Stat
          label="Cash"
          value={`${formatCompactCurrency(summary.cash)} (${summary.cashPct.toFixed(1)}%)`}
        />
        <Stat label="Holdings" value={String(summary.holdingsCount)} />
      </div>

      {/* Holdings table */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Holdings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Ticker</th>
                <th className="py-2 pr-4 font-medium">Shares</th>
                <th className="py-2 pr-4 font-medium">Avg Cost</th>
                <th className="py-2 pr-4 font-medium">Price</th>
                <th className="py-2 pr-4 text-right font-medium">Value</th>
                <th className="py-2 pr-4 text-right font-medium">Weight</th>
                <th className="py-2 pr-4 text-right font-medium">Return</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.ticker} className="border-b border-border/60">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/stocks/${h.ticker.toLowerCase()}`}
                      className="font-medium hover:underline"
                    >
                      {h.ticker}
                    </Link>
                    <p className="text-xs text-muted-foreground">{h.name}</p>
                  </td>
                  <td className="py-3 pr-4 tabular-nums">
                    {h.shares.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">
                    {formatCurrency(h.avg_cost)}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">
                    {h.currentPrice ? formatCurrency(h.currentPrice) : "—"}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {formatCompactCurrency(h.marketValue)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {h.weight.toFixed(1)}%
                  </td>
                  <td
                    className={`py-3 pr-4 text-right tabular-nums ${
                      (h.unrealizedGainPct ?? 0) >= 0
                        ? "text-positive"
                        : "text-negative"
                    }`}
                  >
                    {formatPercent(h.unrealizedGainPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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
