import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ArticleEditor from '@/components/ArticleEditor'
import { createArticle } from '../actions'
import type { JSONContent } from '@tiptap/core'

export default async function NewArticlePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: categories } = await supabase.from('categories').select('id, name').order('name')

  async function saveDraft(data: { title: string; content: JSONContent; categoryId: string | null }) {
    'use server'
    return createArticle(data, false)
  }

  async function submitForReview(data: { title: string; content: JSONContent; categoryId: string | null }) {
    'use server'
    return createArticle(data, true)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl text-ink-950">New article</h1>
      <p className="mt-1 text-sm text-ink-500">
        Save a draft any time, or submit straight for review when it's ready.
      </p>
      <div className="mt-6">
        <ArticleEditor
          userId={user.id}
          categories={categories ?? []}
          onSaveDraft={saveDraft}
          onSubmitForReview={submitForReview}
        />
      </div>
    </div>
  )
}
