import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/database.types";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Blog" };

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data: posts } = await query.returns<Post[]>();

  // Fetch distinct categories for filter chips
  const { data: cats } = await supabase
    .from("posts")
    .select("category")
    .eq("status", "published")
    .not("category", "is", null);

  const categories = [...new Set((cats ?? []).map((c) => c.category))].filter(
    Boolean,
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold">Blog</h1>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={`badge ${!category ? "bg-accent text-accent-foreground" : ""}`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/blog?category=${encodeURIComponent(c as string)}`}
              className={`badge ${category === c ? "bg-accent text-accent-foreground" : ""}`}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {(!posts || posts.length === 0) && (
        <p className="text-muted-foreground">
          No articles {category ? `in "${category}"` : ""} yet.
        </p>
      )}

      <ul className="space-y-8">
        {(posts ?? []).map((post) => (
          <li key={post.id} className="border-b border-border pb-8">
            <article>
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                {post.category && <span>{post.category}</span>}
                {post.published_at && (
                  <>
                    {post.category && <span>·</span>}
                    <time>{formatDate(post.published_at)}</time>
                  </>
                )}
              </div>
              <h2 className="mb-2 text-xl font-semibold">
                <Link href={`/blog/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && (
                <p className="leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              )}
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
