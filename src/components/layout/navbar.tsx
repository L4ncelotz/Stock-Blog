import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/blog", label: "Blog" },
  { href: "/research", label: "Research" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <nav className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground hover:opacity-70 transition-opacity"
        >
          Investment OS
        </Link>

        <ul className="hidden items-center gap-8 sm:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <Link
            href="/search"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Search
          </Link>
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Admin
          </Link>
        </div>
      </nav>
    </header>
  );
}