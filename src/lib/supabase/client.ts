import { createBrowserClient } from '@supabase/ssr'

// Public (browser) Supabase client — read-only by default via RLS.
// Use this in Client Components and Server Components without auth context.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
