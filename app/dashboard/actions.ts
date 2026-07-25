'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { JSONContent } from '@tiptap/core'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

type ArticlePayload = { title: string; content: JSONContent; categoryId?: string | null }
type ActionResult = { error?: string } | undefined

async function requireAuthor() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

/** Finds a free slug, appending -2, -3, ... on collision. */
async function uniqueSlugFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  title: string,
  excludeId?: string
) {
  const base = slugify(title)
  let slug = base
  let attempt = 1

  // Bounded to avoid a pathological infinite loop; effectively unreachable.
  while (attempt < 1000) {
    let query = supabase.from('articles').select('id').eq('slug', slug)
    if (excludeId) query = query.neq('id', excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return slug
    attempt += 1
    slug = `${base}-${attempt}`
  }
  return `${base}-${Date.now()}`
}

export async function createArticle(payload: ArticlePayload, submit = false): Promise<ActionResult> {
  const { supabase, user } = await requireAuthor()
  if (!payload.title.trim()) return { error: 'Title is required.' }

  const slug = await uniqueSlugFor(supabase, payload.title)

  const { data, error } = await supabase
    .from('articles')
    .insert({
      author_id: user.id,
      title: payload.title.trim(),
      content: payload.content as never,
      slug,
      status: submit ? 'pending' : 'draft',
      category_id: payload.categoryId ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  redirect(`/dashboard/${data.id}/edit`)
}

export async function updateArticle(
  articleId: string,
  payload: ArticlePayload,
  submit = false
): Promise<ActionResult> {
  const { supabase, user } = await requireAuthor()
  if (!payload.title.trim()) return { error: 'Title is required.' }

  const { data: existing } = await supabase
    .from('articles')
    .select('author_id, status, slug, title')
    .eq('id', articleId)
    .single()

  if (!existing || existing.author_id !== user.id) return { error: 'Article not found.' }
  if (existing.status === 'published') return { error: 'Published articles cannot be edited directly.' }

  const slug =
    existing.title === payload.title ? existing.slug : await uniqueSlugFor(supabase, payload.title, articleId)

  const { error } = await supabase
    .from('articles')
    .update({
      title: payload.title.trim(),
      content: payload.content as never,
      slug,
      status: submit ? 'pending' : existing.status,
      category_id: payload.categoryId ?? null,
    })
    .eq('id', articleId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/${articleId}/edit`)
  return {}
}

export async function submitForReview(articleId: string) {
  const { supabase, user } = await requireAuthor()
  await supabase
    .from('articles')
    .update({ status: 'pending' })
    .eq('id', articleId)
    .eq('author_id', user.id)
    .eq('status', 'draft')

  revalidatePath('/dashboard')
}

export async function deleteArticle(articleId: string) {
  const { supabase, user } = await requireAuthor()
  await supabase
    .from('articles')
    .delete()
    .eq('id', articleId)
    .eq('author_id', user.id)
    .eq('status', 'draft')

  revalidatePath('/dashboard')
}
