import type { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/**
 * Resolves author_id -> email for a batch of articles on a PUBLIC page.
 *
 * Do not try to get this via a PostgREST embed like
 * `articles.select('..., author:users(email)')` — RLS on `users` correctly
 * denies anonymous SELECT on that table, so the embed silently comes back
 * null for every visitor who isn't logged in. author_bylines() is a
 * SECURITY DEFINER function built specifically for this (see schema.sql).
 */
export async function resolveAuthorEmails(
  supabase: SupabaseClient,
  authorIds: string[]
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(authorIds)]
  if (uniqueIds.length === 0) return new Map()

  const { data } = await supabase.rpc('author_bylines', { p_author_ids: uniqueIds })
  return new Map((data ?? []).map((row) => [row.id, row.email]))
}
