import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Research, Stock } from "@/lib/database.types";

export const metadata = { title: "Research" };

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; country?: string }>;
}) {
  const { sector, country } = await searchParams;
  const supabase = await createClient();

  // Current research only (one per ticker via is_current, but use MAX(version))
  let stockQuery = supabase.from("stocks").select("*");
  if (sector) stockQuery = stockQuery.eq("sector", sector);
  if (country) stockQuery = stockQuery.eq("country", country);
  const { data: stocks } = await stockQuery.returns<Stock[]>();

  const tickers = (stocks ?? []).map((s) => s.ticker);
  const { data: researchList } =
    tickers.length > 0
      ? await supabase
          .from("research")
          .select("*")
          .in("ticker", tickers)
          .eq("is_current", true)
          .order("conviction", { ascending: false, nullsFirst: false })
          .returns<Research[]>()
      : { data: [] as Research[] };

  const stockMap = new Map((stocks ?? []).map((s) => [s.ticker, s]));

  // Filter facets
  const { data: allStocks } = await supabase.from("stocks").select("*");
  const sectors = [...new Set((allStocks ?? []).map((s) => s.sector).filter(Boolean))];
  const countries = [...new Set((allStocks ?? []).map((s) => s.country).filter(Boolean))];

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold">Research Hub</h1>

      {/* Filters */}
      <div className="mb-8 space-y-3">
        <Filter label="Sector" values={sectors as string[]} active={sector} param="sector" />
        <Filter label="Country" values={countries as string[]} active={country} param="country" />
      </div>

      {(!researchList || researchList.length === 0) && (
        <p className="text-muted-foreground">No research notes yet.</p>
      )}

      <ul className="space-y-4">
        {(researchList ?? []).map((r) => {
          const stock = stockMap.get(r.ticker);
          return (
            <li key={r.id} className="card">
              <div className="flex items-baseline justify-between">
                <Link
                  href={`/stocks/${r.ticker.toLowerCase()}`}
                  className="text-lg font-semibold hover:underline"
                >
                  {r.ticker}
                </Link>
                {r.conviction && (
                  <span className="text-sm text-muted-foreground">
                    Conviction {r.conviction}/10
                  </span>
                )}
              </div>
              {stock && (
                <p className="text-sm text-muted-foreground">
                  {stock.name}
                  {stock.sector ? ` · ${stock.sector}` : ""}
                </p>
              )}
              {r.thesis && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {r.thesis}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <span className="badge">v{r.version}</span>
                {r.research_level && (
                  <span className="badge capitalize">
                    {r.research_level.replace("_", " ")}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Filter({
  label,
  values,
  active,
  param,
}: {
  label: string;
  values: string[];
  active?: string;
  param: string;
}) {
  if (values.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <Link
        href="/research"
        className={`badge ${!active ? "bg-accent text-accent-foreground" : ""}`}
      >
        All
      </Link>
      {values.map((v) => (
        <Link
          key={v}
          href={`/research?${param}=${encodeURIComponent(v)}`}
          className={`badge ${active === v ? "bg-accent text-accent-foreground" : ""}`}
        >
          {v}
        </Link>
      ))}
    </div>
  );
}
