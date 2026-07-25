import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * SERVER-ONLY. Uses the service_role key, which bypasses Row Level Security
 * entirely. Never import this from a Client Component, and never let
 * SUPABASE_SERVICE_ROLE_KEY end up in a NEXT_PUBLIC_* variable.
 *
 * Used by app/api/track-view/route.ts to call track_article_view(), which is
 * intentionally not granted to anon/authenticated (see schema.sql) so the
 * only way to record a view is through that trusted route.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
