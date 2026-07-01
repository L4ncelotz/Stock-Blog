import { createClient } from '@supabase/supabase-js'

// Admin (service-role) client — bypasses RLS. SERVER-ONLY.
// Use ONLY in trusted backend code: cron jobs, webhooks, price pipeline, imports.
// NEVER import in Client Components or expose to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
}
