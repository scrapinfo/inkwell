import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  let articleId: unknown

  try {
    const body = await request.json()
    articleId = body?.articleId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (typeof articleId !== 'string' || !articleId) {
    return NextResponse.json({ error: 'articleId is required.' }, { status: 400 })
  }

  // Never trust an IP the client claims to be — derive it from headers the
  // platform/proxy sets. On Vercel this is x-forwarded-for; if you deploy
  // behind a different proxy, adjust getClientIp() accordingly.
  const ip = getClientIp(request)
  if (!ip) {
    return NextResponse.json({ error: 'Could not determine client IP.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // track_article_view() does the "seen this IP in the last 24h?" check and
  // the balance increment atomically (advisory-locked per article+IP), so
  // there's no race window between checking and crediting here.
  const { data: counted, error } = await supabase.rpc('track_article_view', {
    p_article_id: articleId,
    p_ip_address: ip,
  })

  if (error) {
    console.error('track_article_view failed:', error.message)
    return NextResponse.json({ error: 'Failed to record view.' }, { status: 500 })
  }

  return NextResponse.json({ counted })
}

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return null
}
