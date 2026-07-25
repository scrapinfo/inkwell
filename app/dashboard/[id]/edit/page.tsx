import { notFound, redirect } from 'next/navigation'
import type { JSONContent } from '@tiptap/core'
import { createClient } from '@/lib/supabase/server'
import ArticleEditor from '@/components/ArticleEditor'
import StatusBadge from '@/components/StatusBadge'
import { updateArticle } from '../../actions'

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: article }, { data: categories }] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, content, status, category_id')
      .eq('id', id)
      .eq('author_id', user.id)
      .single(),
    supabase.from('categories').select('id, name').order('name'),
  ])

  if (!article) notFound()
  if (article.status === 'published') redirect('/dashboard')

  async function saveDraft(data: { title: string; content: JSONContent; categoryId: string | null }) {
    'use server'
    return updateArticle(id, data, false)
  }

  async function submitForReview(data: { title: string; content: JSONContent; categoryId: string | null }) {
    'use server'
    return updateArticle(id, data, true)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink-950">Edit article</h1>
        <StatusBadge status={article.status} />
      </div>
      <div className="mt-6">
        <ArticleEditor
          userId={user.id}
          initialTitle={article.title}
          initialContent={article.content as JSONContent}
          initialCategoryId={article.category_id}
          categories={categories ?? []}
          onSaveDraft={saveDraft}
          onSubmitForReview={article.status === 'draft' ? submitForReview : undefined}
        />
      </div>
    </div>
  )
}
