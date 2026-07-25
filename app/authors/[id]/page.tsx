import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { resolveAuthorEmails } from '@/lib/authors'
import { estimateReadingTime, formatAuthorName } from '@/lib/utils'
import ArticleCover from '@/components/ArticleCover'
import RevealGroup from '@/components/gsap/RevealGroup'
import type { JSONContent } from '@tiptap/core'

export const revalidate = 60

async function getAuthorAndArticles(id: string) {
  const supabase = await createClient()

  const [emails, { data: articles }] = await Promise.all([
    resolveAuthorEmails(supabase, [id]),
    supabase
      .from('articles')
      .select('id, title, slug, content, published_at')
      .eq('author_id', id)
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
  ])

  const email = emails.get(id)
  // If author_bylines() returns nothing, this id has no published articles —
  // treat it the same as "not found" rather than showing an empty profile
  // for someone who's never published (and never leak that the id exists).
  if (!email) return null

  return { email, articles: articles ?? [] }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const author = await getAuthorAndArticles(id)
  if (!author) return { title: 'Author not found' }
  return { title: formatAuthorName(author.email) }
}

export default async function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const author = await getAuthorAndArticles(id)
  if (!author) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ledger-soft font-display text-2xl text-ledger-dark">
          {formatAuthorName(author.email).charAt(0)}
        </div>
        <div>
          <h1 className="font-display text-2xl text-ink-950">{formatAuthorName(author.email)}</h1>
          <p className="text-sm text-ink-500">
            {author.articles.length} article{author.articles.length === 1 ? '' : 's'} on Inkwell
          </p>
        </div>
      </div>

      <RevealGroup className="mt-10 grid gap-6 sm:grid-cols-2">
        {author.articles.map((article) => (
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
              {estimateReadingTime(article.content as JSONContent)} min read
              {article.published_at && ` · ${new Date(article.published_at).toLocaleDateString()}`}
            </p>
          </Link>
        ))}
      </RevealGroup>
    </div>
  )
}
