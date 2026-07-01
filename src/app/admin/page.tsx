import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Quick counts
  const [
    { count: stockCount },
    { count: holdingCount },
    { count: postCount },
    { count: publishedCount },
    { count: decisionCount },
    { count: watchlistCount },
    { count: jobCount },
  ] = await Promise.all([
    supabase.from("stocks").select("*", { count: "exact", head: true }),
    supabase.from("mv_holdings").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("decisions").select("*", { count: "exact", head: true }),
    supabase.from("watchlist").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }),
  ]);

  // Latest jobs
  const { data: recentJobs } = await supabase
    .from("jobs")
    .select("id, type, status, created_at, duration_ms")
    .order("created_at", { ascending: false })
    .limit(5);

  // Latest decisions
  const { data: recentDecisions } = await supabase
    .from("decisions")
    .select("display_id, ticker, type, triggered_at")
    .order("triggered_at", { ascending: false })
    .limit(5);

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

      {/* Stats grid */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DashboardCard label="Stocks Tracked" value={String(stockCount ?? 0)} />
        <DashboardCard label="Holdings" value={String(holdingCount ?? 0)} />
        <DashboardCard label="Blog Posts" value={`${publishedCount ?? 0} / ${postCount ?? 0}`} />
        <DashboardCard label="Decisions" value={String(decisionCount ?? 0)} />
        <DashboardCard label="Watchlist" value={String(watchlistCount ?? 0)} />
        <DashboardCard label="Jobs Run" value={String(jobCount ?? 0)} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Decisions */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent Decisions
            </h2>
            <Link href="/admin/portfolio" className="text-xs text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          {(recentDecisions ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No decisions yet.</p>
          ) : (
            <ul className="space-y-2">
              {(recentDecisions ?? []).map((d) => (
                <li key={d.display_id} className="flex items-center gap-3 text-sm">
                  <span className="font-medium">#{d.display_id}</span>
                  <span className="font-medium">{d.ticker}</span>
                  <span className="badge">{d.type}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent Jobs */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent Jobs
            </h2>
            <Link href="/admin/jobs" className="text-xs text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          {(recentJobs ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            <ul className="space-y-2">
              {(recentJobs ?? []).map((j) => (
                <li key={j.id} className="flex items-center gap-3 text-sm">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      j.status === "success"
                        ? "bg-positive"
                        : j.status === "failed"
                          ? "bg-negative"
                          : j.status === "running"
                            ? "bg-yellow-400"
                            : "bg-muted-foreground"
                    }`}
                  />
                  <span className="font-medium">{j.type}</span>
                  <span className="text-muted-foreground">{j.status}</span>
                  {j.duration_ms && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {j.duration_ms > 1000
                        ? `${(j.duration_ms / 1000).toFixed(1)}s`
                        : `${j.duration_ms}ms`}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function DashboardCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="card">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
