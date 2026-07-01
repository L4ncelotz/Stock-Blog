import Link from "next/link";
import { logout } from "@/app/auth/actions";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "□" },
  { href: "/admin/portfolio", label: "Portfolio", icon: "◈" },
  { href: "/admin/blog", label: "Blog", icon: "✎" },
  { href: "/admin/research", label: "Research", icon: "◎" },
  { href: "/admin/watchlist", label: "Watchlist", icon: "◉" },
  { href: "/admin/jobs", label: "Jobs", icon: "⚙" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl px-6 py-8">
      {/* Sidebar */}
      <aside className="mr-8 hidden w-48 shrink-0 md:block">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Admin
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-border pt-4">
          <Link
            href="/"
            className="mb-2 flex items-center gap-2 px-2 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to site
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
