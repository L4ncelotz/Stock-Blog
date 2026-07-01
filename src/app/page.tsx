import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section - Full bleed */}
      <section className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Investment OS
          </h1>
          <p className="mt-4 text-xl text-muted-foreground leading-relaxed">
            Portfolio, research notes, and investment journal. Transparent,
            data-driven, and thoughtfully documented.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/portfolio"
            className="btn btn-primary px-6 py-3"
          >
            View Portfolio
          </Link>
          <Link
            href="/blog"
            className="btn px-6 py-3 border border-border hover:bg-muted"
          >
            Read Articles
          </Link>
        </div>
      </section>

      {/* Philosophy Card */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="card max-w-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Investment Philosophy
          </h2>
          <p className="leading-relaxed">
            Long-term, concentrated positions in high-quality businesses. Focus on
            understanding the business, not predicting the price. Every decision is
            documented, reviewed, and scored.
          </p>
        </div>
      </section>

      {/* Quick Preview Grid */}
      <section className="mx-auto max-w-4xl px-6 pb-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <PreviewCard
          title="Portfolio"
          value="—"
          description="Connect Supabase to load data"
          href="/portfolio"
        />
        <PreviewCard
          title="Blog"
          value="— articles"
          description="Writing on investing and markets"
          href="/blog"
        />
        <PreviewCard
          title="Watchlist"
          value="— stocks"
          description="High-conviction ideas"
          href="/watchlist"
        />
      </section>
    </div>
  );
}

function PreviewCard({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="card group block">
      <h3 className="font-semibold mb-1 group-hover:text-accent transition-colors">
        {title}
      </h3>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
