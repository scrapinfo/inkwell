import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { resolveAuthorEmails } from '@/lib/authors'
import { estimateReadingTime, extractExcerpt, formatAuthorName, formatCurrency } from '@/lib/utils'
import ArticleCover from '@/components/ArticleCover'
import CategoryBadge from '@/components/CategoryBadge'
import HeroReveal from '@/components/gsap/HeroReveal'
import RevealGroup from '@/components/gsap/RevealGroup'
import type { JSONContent } from '@tiptap/core'

export const revalidate = 60
const PAGE_SIZE = 8

type ArticleRow = {
  id: string
  title: string
  slug: string
  content: JSONContent
  author_id: string
  published_at: string | null
  category: { name: string; slug: string } | { name: string; slug: string }[] | null
}

function categoryOf(category: ArticleRow['category']) {
  return Array.isArray(category) ? category[0] : category
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const { page: pageParam, q } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1)
  const query = (q ?? '').trim()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let articlesQuery = supabase
    .from('articles')
    .select('id, title, slug, content, author_id, published_at, category:categories(name, slug)', {
      count: 'exact',
    })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to)

  if (query) articlesQuery = articlesQuery.ilike('title', `%${query}%`)

  const [{ data: stats }, { data: articles, count }] = await Promise.all([
    query ? Promise.resolve({ data: null }) : supabase.rpc('platform_stats').maybeSingle(),
    articlesQuery,
  ])

  const rows = (articles ?? []) as ArticleRow[]
  const authorEmails = await resolveAuthorEmails(
    supabase,
    rows.map((a) => a.author_id)
  )

  const featured = page === 1 && !query ? rows[0] : null
  const rest = page === 1 && !query ? rows.slice(1) : rows
  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {/* Hero */}
      <HeroReveal>
        <section className="text-center">
          <h1 className="hero-item font-display text-4xl leading-tight text-ink-950 sm:text-5xl">
            Every read <span className="italic text-ledger">pays</span> the writer.
          </h1>
          <p className="hero-item mx-auto mt-4 max-w-xl text-balance text-ink-500">
            Inkwell is a multi-author blog with no ads and no algorithm games — just writing, reviewed
            by editors and paid for by readers, one view at a time.
          </p>
          <div className="hero-item mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={user ? '/dashboard' : '/login'}
              className="inline-flex items-center justify-center rounded-lg bg-ink-950 px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-700"
            >
              {user ? 'Go to your dashboard' : 'Start writing'}
            </Link>
          </div>
          <form action="/" className="hero-item mx-auto mt-8 max-w-sm">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search articles…"
              className="w-full rounded-full border border-line bg-surface px-4 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ledger/40"
            />
          </form>
        </section>

        {/* Live platform stats — a real aggregate query, not placeholder numbers */}
        {stats && (
          <section className="hero-item mt-12 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface py-6">
            <Stat label="Published" value={String(stats.total_articles)} />
            <Stat label="Writers" value={String(stats.total_authors)} />
            <Stat label="Earned by writers" value={formatCurrency(stats.total_earned)} accent />
          </section>
        )}
      </HeroReveal>

      {query && (
        <p className="mt-10 text-sm text-ink-500">
          {count ?? 0} result{count === 1 ? '' : 's'} for "{query}"
        </p>
      )}

      <RevealGroup>
        {/* Featured article */}
        {featured && (
          <section className="mt-14">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-ledger">Latest</p>
              {categoryOf(featured.category) && (
                <CategoryBadge
                  slug={categoryOf(featured.category)!.slug}
                  name={categoryOf(featured.category)!.name}
                />
              )}
            </div>
            <Link
              href={`/${featured.slug}`}
              className="reveal-item group grid gap-5 sm:grid-cols-2 sm:items-center"
            >
              <ArticleCover
                seed={featured.id}
                title={featured.title}
                className="aspect-[5/3] w-full rounded-xl"
              />
              <div>
                <h2 className="font-display text-3xl leading-tight text-ink-950 group-hover:text-ledger-dark">
                  {featured.title}
                </h2>
                <p className="mt-3 text-ink-700">{extractExcerpt(featured.content, 180)}</p>
                <p className="mt-4 text-sm text-ink-500">
                  {formatAuthorName(authorEmails.get(featured.author_id))} ·{' '}
                  {estimateReadingTime(featured.content)} min read
                  {featured.published_at && ` · ${new Date(featured.published_at).toLocaleDateString()}`}
                </p>
              </div>
            </Link>
          </section>
        )}

        {/* Article list */}
        {rest.length > 0 && (
          <section className="mt-14">
            {page === 1 && !query && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">More stories</p>
            )}
            <div className="grid gap-6 sm:grid-cols-2">
              {rest.map((article) => {
                const cat = categoryOf(article.category)
                return (
                  <div key={article.id} className="reveal-item group">
                    <div className="relative">
                      <Link href={`/${article.slug}`}>
                        <ArticleCover
                          seed={article.id}
                          title={article.title}
                          className="aspect-[5/3] w-full rounded-xl"
                        />
                      </Link>
                      {cat && (
                        <div className="absolute left-2 top-2">
                          <CategoryBadge slug={cat.slug} name={cat.name} />
                        </div>
                      )}
                    </div>
                    <Link href={`/${article.slug}`} className="block">
                      <h3 className="mt-3 font-display text-xl text-ink-950 group-hover:text-ledger-dark">
                        {article.title}
                      </h3>
                      <p className="mt-1 text-sm text-ink-500">
                        {formatAuthorName(authorEmails.get(article.author_id))} ·{' '}
                        {estimateReadingTime(article.content)} min read
                        {article.published_at && ` · ${new Date(article.published_at).toLocaleDateString()}`}
                      </p>
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </RevealGroup>

      {!featured && rest.length === 0 && (
        <p className="mt-14 py-12 text-center text-sm text-ink-500">
          {query ? `No articles match "${query}".` : page === 1 ? 'No published articles yet.' : 'Nothing more to show.'}
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-14 flex items-center justify-between border-t border-line pt-6 text-sm font-medium">
          {page > 1 ? (
            <Link
              href={`/?${new URLSearchParams({ ...(query && { q: query }), page: String(page - 1) })}`}
              className="text-ink-700 hover:text-ink-950"
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/?${new URLSearchParams({ ...(query && { q: query }), page: String(page + 1) })}`}
              className="text-ink-700 hover:text-ink-950"
            >
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  )
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="px-2 text-center">
      <p className={`font-display text-2xl ${accent ? 'text-ledger' : 'text-ink-950'}`}>{value}</p>
      <p className="mt-1 text-xs text-ink-500">{label}</p>
    </div>
  )
}
