import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/database.types";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Admin — Blog" };

export default async function AdminBlogPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .order("updated_at", { ascending: false })
    .returns<Post[]>();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Blog</h1>
        <Link
          href="/admin/blog/new"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          New Post
        </Link>
      </div>

      {(!posts || posts.length === 0) && (
        <p className="text-muted-foreground">No posts yet. Create your first article.</p>
      )}

      <ul className="space-y-2">
        {(posts ?? []).map((post) => (
          <li key={post.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">{post.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`badge ${post.status === "published" ? "text-positive" : ""}`}>
                  {post.status}
                </span>
                {post.category && <span>{post.category}</span>}
                <span>{formatDate(post.updated_at)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/blog/${post.id}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Edit
              </Link>
              {post.status === "published" && (
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  View
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
