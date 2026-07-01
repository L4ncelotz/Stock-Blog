import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Decision,
  Research,
  Post,
  Transaction,
} from "@/lib/database.types";
import { formatDate, formatCurrency } from "@/lib/format";

export default async function DecisionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: decision } = await supabase
    .from("decisions")
    .select("*")
    .eq("display_id", Number(id))
    .maybeSingle<Decision>();

  if (!decision) notFound();

  // Get linked transaction
  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("decision_id", decision.id)
    .maybeSingle<Transaction>();

  // Get research version used
  const { data: research } = await supabase
    .from("research")
    .select("*")
    .eq("id", decision.research_version_id ?? "")
    .maybeSingle<Research>();

  // Get related posts
  const { data: postLinks } = await supabase
    .from("decision_posts")
    .select("posts(*)")
    .eq("decision_id", decision.id);

  const posts = (postLinks ?? [])
    .map((p) => p.posts as Post)
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/portfolio"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Portfolio
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="badge text-lg">#{id}</span>
          <h1 className="text-3xl font-bold">{decision.ticker}</h1>
          <span className="badge bg-accent text-accent-foreground">
            {decision.type.toUpperCase()}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatDate(decision.triggered_at)}
        </p>
      </div>

      {/* Context Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Decision Notes */}
        {decision.notes && (
          <section className="card">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">
              Decision Notes
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {decision.notes}
            </p>
          </section>
        )}

        {/* Thesis Snapshot at decision time */}
        {(decision.thesis_snapshot || research?.thesis) && (
          <section className="card">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">
              Thesis at Time
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
              {decision.thesis_snapshot || research?.thesis || "—"}
            </p>
            {research && (
              <p className="mt-2 text-xs text-muted-foreground">
                Research v{research.version}
              </p>
            )}
          </section>
        )}

        {/* Transaction Details */}
        {transaction && (
          <section className="card sm:col-span-2">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">
              Transaction
            </h2>
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <span className="text-muted-foreground">Shares:</span>{" "}
                {transaction.shares.toLocaleString()}
              </div>
              <div>
                <span className="text-muted-foreground">Price:</span>{" "}
                {formatCurrency(transaction.price)}
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>{" "}
                {formatDate(transaction.trade_date)}
              </div>
            </div>
          </section>
        )}

        {/* Related Articles */}
        {posts.length > 0 && (
          <section className="card sm:col-span-2">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">
              Related Articles
            </h2>
            <ul className="space-y-2">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return { title: `Decision #${id}` };
}