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

export async function publishArticle(articleId: string) {
  const supabase = await requireAdmin()
  // Row Level Security independently re-checks is_admin() here too — this
  // isn't the only gate, just the first one.
  await supabase.from('articles').update({ status: 'published' }).eq('id', articleId).eq('status', 'pending')

  revalidatePath('/admin')
  revalidatePath('/')
}

export async function rejectArticle(articleId: string) {
  const supabase = await requireAdmin()
  await supabase.from('articles').update({ status: 'draft' }).eq('id', articleId).eq('status', 'pending')

  revalidatePath('/admin')
}
