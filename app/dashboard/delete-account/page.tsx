import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { deleteAccount } from '@/lib/actions/account'

export default async function DeleteAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error: failed } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { count: articleCount }] = await Promise.all([
    supabase.from('users').select('balance').eq('id', user.id).single(),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
  ])

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl text-ink-950">Delete your account</h1>
      <p className="mt-2 text-sm text-ink-500">This action is permanent and cannot be undone.</p>

      {failed && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          Something went wrong deleting your account. Please try again, or contact support.
        </p>
      )}

      <div className="mt-6 space-y-2 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        <p className="font-semibold">Deleting your account will immediately and permanently remove:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your login and profile</li>
          <li>
            All {articleCount ?? 0} of your articles — including any that are currently published and
            visible to readers
          </li>
          {(profile?.balance ?? 0) > 0 && (
            <li>Your accrued balance of {formatCurrency(profile?.balance ?? 0)}, which will be forfeited</li>
          )}
        </ul>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-700 hover:bg-paper"
        >
          Cancel
        </Link>
        <form action={deleteAccount}>
          <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            Yes, permanently delete my account
          </button>
        </form>
      </div>
    </div>
  )
}
