// ============================================================================
// KPI Dashboard — Computed metrics, not stored. Reads from transactions,
// snapshots, and decisions via Supabase.
// ============================================================================

import { formatPercent, formatNumber } from "@/lib/format";

export interface KPI {
  label: string;
  value: string | number;
  subtitle?: string;
}

interface KPIDashboardProps {
  kpis: {
    // From transactions
    totalTrades: number;
    avgHoldingDays: number;
    winRate: number;
    // From snapshots
    portfolioReturn: number;
    maxDrawdown: number;
    // From decisions
    avgConviction: number;
    // Misc
    cashRatio: number;
    largestPosition: number;
  };
}

export function KPIDashboard({ kpis }: KPIDashboardProps) {
  const items: KPI[] = [
    { label: "Total Trades", value: kpis.totalTrades },
    { label: "Avg Holding", value: `${kpis.avgHoldingDays} days` },
    {
      label: "Win Rate",
      value: formatPercent(kpis.winRate),
      subtitle: kpis.winRate >= 0.5 ? "positive" : "negative",
    },
    { label: "Portfolio Return", value: formatPercent(kpis.portfolioReturn) },
    { label: "Max Drawdown", value: formatPercent(kpis.maxDrawdown), subtitle: "negative" },
    { label: "Avg Conviction", value: `${kpis.avgConviction}/10` },
    { label: "Cash Ratio", value: formatPercent(kpis.cashRatio) },
    { label: "Largest Position", value: formatPercent(kpis.largestPosition) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((kpi) => (
        <div key={kpi.label} className="card">
          <p className="text-xs text-muted-foreground">{kpi.label}</p>
          <p
            className={`text-xl font-bold tabular-nums ${
              kpi.subtitle === "positive" ? "text-positive" : ""
            } ${kpi.subtitle === "negative" ? "text-negative" : ""}`}
          >
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  );
}
