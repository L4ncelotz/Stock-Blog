import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-20">
      <div className="mx-auto max-w-4xl px-6 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-bold text-foreground mb-2">Investment OS</p>
          <p className="text-sm text-muted-foreground">
            A transparent investment portfolio and research journal.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Pages
          </p>
          <div className="flex flex-col gap-1.5 text-sm">
            <Link href="/portfolio" className="text-muted-foreground hover:text-foreground transition-colors">
              Portfolio
            </Link>
            <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
              Blog
            </Link>
            <Link href="/research" className="text-muted-foreground hover:text-foreground transition-colors">
              Research
            </Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            More
          </p>
          <div className="flex flex-col gap-1.5 text-sm">
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
              Search
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}