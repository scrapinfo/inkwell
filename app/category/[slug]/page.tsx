import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { JSONContent } from '@tiptap/core'
import { createClient } from '@/lib/supabase/server'
import { resolveAuthorEmails } from '@/lib/authors'
import { estimateReadingTime, formatAuthorName } from '@/lib/utils'
import ArticleCover from '@/components/ArticleCover'
import RevealGroup from '@/components/gsap/RevealGroup'

export const revalidate = 60

async function getCategoryAndArticles(slug: string) {
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!category) return null

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, content, author_id, published_at')
    .eq('category_id', category.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const authorEmails = await resolveAuthorEmails(
    supabase,
    (articles ?? []).map((a) => a.author_id)
  )

  return { category, articles: articles ?? [], authorEmails }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const result = await getCategoryAndArticles(slug)
  if (!result) return { title: 'Category not found' }
  return { title: result.category.name }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = await getCategoryAndArticles(slug)
  if (!result) notFound()

  const { category, articles, authorEmails } = result

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-ledger">Category</p>
      <h1 className="mt-1 font-display text-3xl text-ink-950">{category.name}</h1>
      <p className="mt-2 text-sm text-ink-500">
        {articles.length} article{articles.length === 1 ? '' : 's'}
      </p>

      {articles.length > 0 ? (
        <RevealGroup className="mt-10 grid gap-6 sm:grid-cols-2">
          {articles.map((article) => (
            <Link key={article.id} href={`/${article.slug}`} className="reveal-item group block">
              <ArticleCover
                seed={article.id}
                title={article.title}
                className="aspect-[5/3] w-full rounded-xl"
              />
              <h3 className="mt-3 font-display text-xl text-ink-950 group-hover:text-ledger-dark">
                {article.title}
              </h3>
              <p className="mt-1 text-sm text-ink-500">
                {formatAuthorName(authorEmails.get(article.author_id))} ·{' '}
                {estimateReadingTime(article.content as JSONContent)} min read
                {article.published_at && ` · ${new Date(article.published_at).toLocaleDateString()}`}
              </p>
            </Link>
          ))}
        </RevealGroup>
      ) : (
        <p className="mt-14 py-12 text-center text-sm text-ink-500">
          No published articles in this category yet.
        </p>
      )}
    </div>
  )
}
