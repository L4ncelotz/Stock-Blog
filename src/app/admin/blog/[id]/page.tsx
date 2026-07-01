"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { savePost } from "../actions";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function BlogEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";
  const postId = isNew ? "" : String(params.id);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (isNew) setSlug(slugify(value));
  };

  // Load existing post for edit
  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/posts/${postId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setTitle(data.title ?? "");
          setSlug(data.slug ?? "");
          setCategory(data.category ?? "");
          setExcerpt(data.excerpt ?? "");
          setContent(data.content ?? "");
          setStatus(data.status ?? "draft");
          setFeatured(data.featured ?? false);
        }
      })
      .catch(() => {
        setError("Failed to load post");
      });
  }, [postId, isNew]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData();
    if (!isNew) fd.set("id", postId);
    fd.set("title", title);
    fd.set("slug", slug);
    fd.set("category", category);
    fd.set("excerpt", excerpt);
    fd.set("content", content);
    fd.set("status", status);
    if (featured) fd.set("featured", "on");

    const result = await savePost(fd);
    setSaving(false);

    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/admin/blog");
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{isNew ? "New Post" : "Edit Post"}</h1>
        <button
          type="button"
          onClick={() => router.push("/admin/blog")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Title</span>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            placeholder="Article title"
            className="rounded-md border border-border bg-card px-3 py-2 text-lg outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Slug</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="article-slug"
              className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Category</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Portfolio, Market..."
              className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Excerpt</span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="Short summary..."
            className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Content (Markdown)</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={20}
            placeholder="Write in Markdown..."
            className="rounded-md border border-border bg-card px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded"
            />
            Featured
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-border bg-card px-3 py-2 outline-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : status === "published" ? "Update" : "Save Draft"}
          </button>
          {status === "draft" && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setStatus("published");
              }}
              className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
            >
              Save & Publish
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
