'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Permanently deletes the CURRENTLY LOGGED IN user's own account. Deleting
 * the auth.users row cascades (via the FKs in schema.sql) through
 * public.users -> public.articles -> public.views, so this also removes
 * every article the person has written, published or not, and any accrued
 * balance. That's disclosed clearly on the confirmation page — deletion
 * should never surprise someone with what it actually does.
 *
 * Uses the service-role admin client because deleting a row from
 * `auth.users` requires elevated privileges that the regular per-request
 * client (scoped to the user's own session) doesn't have. We still verify
 * the caller's own session first, so this can only ever delete the
 * requester's own account, never someone else's.
 */
export async function deleteAccount() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('deleteAccount failed:', error.message)
    redirect('/dashboard/delete-account?error=1')
  }

  await supabase.auth.signOut()
  redirect('/')
}
