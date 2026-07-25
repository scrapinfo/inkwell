'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  return supabase
}

export async function updateMediaTags(mediaId: string, tagsInput: string) {
  const supabase = await requireAdmin()
  const tags = tagsInput
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)

  const { error } = await supabase.from('media').update({ tags }).eq('id', mediaId)
  if (error) return { error: error.message }

  revalidatePath('/admin/media')
  return {}
}

export async function deleteMedia(mediaId: string, storagePath: string) {
  const supabase = await requireAdmin()

  // Remove the file bytes first, then the metadata row — if the row delete
  // failed first you'd be left with an orphaned, unmanageable file; this
  // order fails safe (worst case: an orphaned row you can still see and
  // retry deleting, not a file nobody can find again).
  const { error: storageError } = await supabase.storage.from('media').remove([storagePath])
  if (storageError) {
    console.error('deleteMedia storage removal failed:', storageError.message)
    return
  }

  const { error: dbError } = await supabase.from('media').delete().eq('id', mediaId)
  if (dbError) console.error('deleteMedia row removal failed:', dbError.message)

  revalidatePath('/admin/media')
}
