'use client'

import { createClient } from '@/lib/supabase/client'

const MAX_SIZE_BYTES = 8 * 1024 * 1024 // 8MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function uploadMedia(file: File, userId: string): Promise<{ url?: string; error?: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Only JPEG, PNG, WebP, or GIF images are allowed.' }
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: 'Image is too large — 8MB max.' }
  }

  const supabase = createClient()
  const ext = file.name.split('.').pop() || 'jpg'
  // Path is prefixed with the uploader's own id — the Storage RLS policy
  // (media_storage_insert_own_folder in schema.sql) checks exactly this,
  // so a user literally cannot write outside their own folder.
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage.from('media').upload(path, file)
  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)

  const { error: insertError } = await supabase.from('media').insert({
    storage_path: path,
    url: urlData.publicUrl,
    filename: file.name,
    uploaded_by: userId,
  })
  if (insertError) return { error: insertError.message }

  return { url: urlData.publicUrl }
}
