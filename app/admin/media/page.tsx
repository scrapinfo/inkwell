import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteMedia } from './actions'
import MediaTagEditor from './MediaTagEditor'

export default async function AdminMediaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Admins can read any users row per RLS, so this embed resolves correctly
  // here — unlike the public pages, which had to use author_bylines()
  // instead (see the note in lib/authors.ts).
  const { data: media } = await supabase
    .from('media')
    .select('id, url, filename, tags, storage_path, created_at, uploader:users(email)')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-ink-950">Media library</h1>
      <p className="mt-1 text-sm text-ink-500">
        {media?.length ?? 0} file{media?.length === 1 ? '' : 's'} uploaded across all authors.
      </p>

      {media?.length ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => {
            const uploaderEmail = (item.uploader as unknown as { email: string } | null)?.email
            return (
              <div key={item.id} className="overflow-hidden rounded-xl border border-line bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element -- external Storage URLs, not local assets */}
                <img src={item.url} alt={item.filename} className="aspect-video w-full object-cover" />
                <div className="space-y-2 p-3">
                  <p className="truncate text-sm font-medium text-ink-950" title={item.filename}>
                    {item.filename}
                  </p>
                  <p className="text-xs text-ink-500">
                    {uploaderEmail ?? 'Unknown'} · {new Date(item.created_at).toLocaleDateString()}
                  </p>
                  <MediaTagEditor mediaId={item.id} initialTags={item.tags} />
                  <form action={deleteMedia.bind(null, item.id, item.storage_path)}>
                    <button className="text-xs font-medium text-red-500 hover:text-red-600">Delete</button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-14 py-12 text-center text-sm text-ink-500">
          No media uploaded yet — images authors add to articles will show up here.
        </p>
      )}
    </div>
  )
}
