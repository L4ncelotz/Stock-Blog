import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Chart stub - will integrate with Recharts + position history in Phase 2
export default async function AssetChartsPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const upper = ticker.toUpperCase();
  const supabase = await createClient();

  const { data: stock } = await supabase
    .from("stocks")
    .select("ticker, name")
    .eq("ticker", upper)
    .maybeSingle();

  if (!stock) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-8">
        <Link
          href={`/stocks/${upper.toLowerCase()}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {stock.ticker}
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Asset Charts</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border pb-2">
        <TabLink href={`/stocks/${upper.toLowerCase()}/timeline`}>
          Timeline
        </TabLink>
        <TabLink active href={`/stocks/${upper.toLowerCase()}/charts`}>
          Charts
        </TabLink>
      </div>

      {/* Chart placeholders */}
      <div className="space-y-6">
        <ChartPlaceholder title="Position Weight Over Time" />
        <ChartPlaceholder title="Average Cost Over Time" />
        <ChartPlaceholder title="Returns vs Benchmark" />
      </div>
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
    </Link>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="card aspect-video flex items-center justify-center">
      <p className="text-muted-foreground text-sm">{title} — Integrate with Recharts</p>
    </div>
  );
}