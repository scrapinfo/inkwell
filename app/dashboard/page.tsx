import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { submitForReview, deleteArticle } from './actions'
import StatusBadge from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: articles }] = await Promise.all([
    supabase.from('users').select('balance').eq('id', user.id).single(),
    supabase
      .from('articles')
      .select('id, title, slug, status, created_at, views(count)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const publishedCount = articles?.filter((a) => a.status === 'published').length ?? 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl text-ink-950">Your dashboard</h1>
          <p className="mt-1 text-sm text-ink-500">Track your earnings and manage your articles.</p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center justify-center rounded-lg bg-ledger px-4 py-2 text-sm font-medium text-white hover:bg-ledger-dark"
        >
          + New article
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-ledger/20 bg-ledger-soft p-5">
          <p className="text-sm text-ledger-dark">PPV balance</p>
          <p className="mt-1 font-display text-3xl text-ledger-dark">
            {formatCurrency(profile?.balance ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm text-ink-500">Total articles</p>
          <p className="mt-1 font-display text-3xl text-ink-950">{articles?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm text-ink-500">Published</p>
          <p className="mt-1 font-display text-3xl text-ink-950">{publishedCount}</p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-ink-950">Your articles</h2>
        <div className="mt-4 divide-y divide-line rounded-xl border border-line bg-surface">
          {articles?.length ? (
            articles.map((article) => {
              const viewCount = (article.views as Array<{ count: number }> | null)?.[0]?.count ?? 0
              return (
                <div
                  key={article.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-ink-950">{article.title}</p>
                      <StatusBadge status={article.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {new Date(article.created_at).toLocaleDateString()} · {viewCount} view
                      {viewCount === 1 ? '' : 's'} · est. {formatCurrency(viewCount * 0.002)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-4 text-sm font-medium">
                    {article.status === 'published' ? (
                      <Link href={`/${article.slug}`} className="text-ledger hover:text-ledger-dark">
                        View
                      </Link>
                    ) : (
                      <>
                        <Link href={`/dashboard/${article.id}/edit`} className="text-ink-700 hover:text-ink-950">
                          Edit
                        </Link>
                        {article.status === 'draft' && (
                          <form action={submitForReview.bind(null, article.id)}>
                            <button className="text-ledger hover:text-ledger-dark">Submit</button>
                          </form>
                        )}
                        {article.status === 'draft' && (
                          <form action={deleteArticle.bind(null, article.id)}>
                            <button className="text-red-500 hover:text-red-600">Delete</button>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <p className="px-5 py-12 text-center text-sm text-ink-500">
              No articles yet — create your first one.
            </p>
          )}
        </div>
      </div>

      <div className="mt-14 border-t border-line pt-6">
        <Link href="/dashboard/delete-account" className="text-sm text-ink-500 hover:text-red-600">
          Delete my account
        </Link>
      </div>
    </div>
  )
}
