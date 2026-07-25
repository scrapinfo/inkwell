import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { resolveAuthorEmails } from '@/lib/authors'
import { formatAuthorName } from '@/lib/utils'

export const alt = 'Article on Inkwell'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: article } = await supabase
    .from('articles')
    .select('title, author_id')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  const title = article?.title ?? 'Inkwell'
  const authorEmail = article
    ? (await resolveAuthorEmails(supabase, [article.author_id])).get(article.author_id)
    : undefined

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#faf9f7',
          padding: 80,
        }}
      >
        <div style={{ fontSize: 28, fontStyle: 'italic', color: '#145c43', display: 'flex' }}>Inkwell</div>
        <div style={{ fontSize: 58, color: '#1c1917', lineHeight: 1.2, display: 'flex' }}>{title}</div>
        <div style={{ fontSize: 28, color: '#78716c', display: 'flex' }}>{formatAuthorName(authorEmail)}</div>
      </div>
    ),
    { ...size }
  )
}
