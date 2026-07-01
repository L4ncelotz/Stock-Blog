'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function savePost(formData: FormData) {
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '')
  const title = String(formData.get('title') ?? '')
  const slug = String(formData.get('slug') ?? '')
  const category = String(formData.get('category') ?? '') || null
  const excerpt = String(formData.get('excerpt') ?? '') || null
  const content = String(formData.get('content') ?? '')
  const status = String(formData.get('status') ?? 'draft')
  const featured = formData.get('featured') === 'on'

  if (!title || !content) return { error: 'Title and content are required' }

  const publishedAt = status === 'published' ? new Date().toISOString() : null

  if (id) {
    // Update
    const { error } = await supabase
      .from('posts')
      .update({
        title,
        slug,
        category,
        excerpt,
        content,
        status,
        featured,
        published_at: publishedAt,
      })
      .eq('id', id)

    if (error) return { error: error.message }
  } else {
    // Insert
    const { error } = await supabase.from('posts').insert({
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category,
      excerpt,
      content,
      status,
      featured,
      published_at: publishedAt,
    })

    if (error) return { error: error.message }
  }

  revalidatePath('/blog')
  revalidatePath('/admin/blog')
  revalidatePath('/')

  return { ok: true }
}

export async function deletePost(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') ?? '')

  if (!id) return { error: 'Post ID required' }

  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/blog')
  revalidatePath('/admin/blog')
  return { ok: true }
}
