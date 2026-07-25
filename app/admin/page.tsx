import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { JSONContent } from '@tiptap/core'
import { createClient } from '@/lib/supabase/server'
import { articleJSONToSafeHTML } from '@/lib/tiptap-extensions'
import { formatAuthorName } from '@/lib/utils'
import { publishArticle, rejectArticle } from './actions'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // users(email) resolves via the articles.author_id -> users.id foreign key.
  const { data: pending } = await supabase
    .from('articles')
    .select('id, title, created_at, content, author:users!articles_author_id_fkey(email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-950">Pending review</h1>
          <p className="mt-1 text-sm text-ink-500">
            {pending?.length ?? 0} article{pending?.length === 1 ? '' : 's'} awaiting a decision.
          </p>
        </div>
        <Link href="/admin/media" className="text-sm font-medium text-ink-700 hover:text-ledger">
          Media library →
        </Link>
      </div>

      <div className="mt-8 space-y-6">
        {pending?.length ? (
          pending.map((article) => {
            const authorEmail = (article.author as unknown as { email: string } | null)?.email
            return (
              <div key={article.id} className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg text-ink-950">{article.title}</h2>
                    <p className="mt-1 text-sm text-ink-500">
                      {formatAuthorName(authorEmail)} · submitted{' '}
                      {new Date(article.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={rejectArticle.bind(null, article.id)}>
                      <button className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-paper">
                        Send back
                      </button>
                    </form>
                    <form action={publishArticle.bind(null, article.id)}>
                      <button className="rounded-lg bg-ledger px-3 py-1.5 text-sm font-medium text-white hover:bg-ledger-dark">
                        Publish
                      </button>
                    </form>
                  </div>
                </div>
                <div
                  className="prose prose-sm prose-stone mt-4 max-h-40 overflow-hidden border-t border-line pt-4"
                  dangerouslySetInnerHTML={{
                    __html: articleJSONToSafeHTML(article.content as JSONContent),
                  }}
                />
              </div>
            )
          })
        ) : (
          <p className="rounded-2xl border border-dashed border-line py-12 text-center text-sm text-ink-500">
            Nothing waiting on you right now.
          </p>
        )}
      </div>
    </div>
  )
}
