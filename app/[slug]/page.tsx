import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { JSONContent } from '@tiptap/core'
import { createClient } from '@/lib/supabase/server'
import { articleJSONToSafeHTML } from '@/lib/tiptap-extensions'
import { resolveAuthorEmails } from '@/lib/authors'
import { extractExcerpt, formatAuthorName } from '@/lib/utils'
import ReadingProgress from '@/components/gsap/ReadingProgress'
import CategoryBadge from '@/components/CategoryBadge'
import ViewTracker from './ViewTracker'

export const revalidate = 60 // ISR — re-check for edits/republishes every 60s

async function getPublishedArticle(slug: string) {
  const supabase = await createClient()
  const { data: article } = await supabase
    .from('articles')
    .select('id, title, content, author_id, published_at, category:categories(name, slug)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (!article) return null

  const authorEmails = await resolveAuthorEmails(supabase, [article.author_id])
  return { ...article, authorEmail: authorEmails.get(article.author_id) }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getPublishedArticle(slug)
  if (!article) return { title: 'Article not found' }
  const description = extractExcerpt(article.content as JSONContent)
  return {
    title: article.title,
    description,
    openGraph: { title: article.title, description, type: 'article' },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getPublishedArticle(slug)
  if (!article) notFound()

  const html = articleJSONToSafeHTML(article.content as JSONContent)
  const category = Array.isArray(article.category) ? article.category[0] : article.category

  return (
    <article id="article-content" className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <ReadingProgress targetId="article-content" />
      <ViewTracker articleId={article.id} />

      {category && (
        <div className="mb-3">
          <CategoryBadge slug={category.slug} name={category.name} />
        </div>
      )}

      <h1 className="font-display text-3xl leading-tight text-ink-950 sm:text-4xl">{article.title}</h1>
      <div className="mt-3 flex items-center gap-2 text-sm text-ink-500">
        <Link href={`/authors/${article.author_id}`} className="font-medium text-ink-700 hover:text-ledger">
          {formatAuthorName(article.authorEmail)}
        </Link>
        {article.published_at && (
          <>
            <span>·</span>
            <time dateTime={article.published_at}>
              {new Date(article.published_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </>
        )}
      </div>

      <div
        className="prose prose-stone prose-lg mt-8 max-w-none font-display"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  )
}
