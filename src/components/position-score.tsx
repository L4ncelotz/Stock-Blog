// ============================================================================
// Position Score — Multi-dimensional rating component.
// Displays score breakdown: Performance (35%), Alpha, Risk, Conviction, Time.
// ============================================================================

import { scoreToGrade } from "@/lib/format";

interface ScoreBreakdown {
  performance?: { score: number; max: number; label: string }; // Total return vs benchmark
  alpha?: { score: number; max: number; label: string }; // Outperformance
  drawdown?: { score: number; max: number; label: string }; // Max drawdown
  holding?: { score: number; max: number; label: string }; // Holding period
  conviction?: { score: number; max: number; label: string }; // Personal conviction
}

export function PositionScore({
  scores,
  overall,
}: {
  scores: ScoreBreakdown;
  overall?: number;
}) {
  const grade = overall ? scoreToGrade(overall) : "—";

  return (
    <div className="space-y-3">
      {/* Overall */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums">{overall ?? "—"}</span>
        <span className="text-muted-foreground">/ 100</span>
        <span className="badge text-sm font-semibold">{grade}</span>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-2">
        {Object.entries(scores).map(([key, s]) => {
          if (!s) return null;
          const pct = (s.score / s.max) * 100;
          return (
            <div key={key} className="text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="tabular-nums font-medium">
                  {s.score}/{s.max}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor:
                      pct >= 80
                        ? "hsl(var(--positive))"
                        : pct >= 60
                          ? "hsl(var(--accent))"
                          : "hsl(var(--muted-foreground))",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
