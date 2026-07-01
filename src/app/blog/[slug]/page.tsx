import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Markdown } from "@/components/markdown";
import type { Post, Stock } from "@/lib/database.types";
import { formatDate } from "@/lib/format";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<Post>();

  if (!post) notFound();

  // Related tickers
  const { data: tickers } = await supabase
    .from("post_tickers")
    .select("stock_ticker")
    .eq("post_id", post.id);
  const tickerList = (tickers ?? []).map((t) => t.stock_ticker);
  const { data: stocks } =
    tickerList.length > 0
      ? await supabase
          .from("stocks")
          .select("*")
          .in("ticker", tickerList)
          .returns<Stock[]>()
      : { data: [] as Stock[] };

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/blog"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Blog
      </Link>

      <header className="mt-6 mb-10">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          {post.category && <span>{post.category}</span>}
          {post.published_at && (
            <>
              {post.category && <span>·</span>}
              <time>{formatDate(post.published_at)}</time>
            </>
          )}
        </div>
        <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>
        {post.excerpt && (
          <p className="mt-3 text-lg text-muted-foreground">{post.excerpt}</p>
        )}
      </header>

      <Markdown>{post.content}</Markdown>

      {(stocks ?? []).length > 0 && (
        <footer className="mt-12 border-t border-border pt-6">
          <p className="mb-2 text-sm font-medium">Mentioned stocks</p>
          <div className="flex flex-wrap gap-2">
            {(stocks ?? []).map((s) => (
              <Link
                key={s.ticker}
                href={`/stocks/${s.ticker.toLowerCase()}`}
                className="badge hover:bg-accent hover:text-accent-foreground"
              >
                {s.ticker}
              </Link>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .maybeSingle();
  if (!post) return { title: "Article" };
  return { title: post.title, description: post.excerpt ?? undefined };
}
