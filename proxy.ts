import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * IMPORTANT — read before trusting this file with anything sensitive:
 *
 * Next.js 16 renamed the middleware.ts convention to proxy.ts (mechanical
 * rename: same NextRequest/NextResponse API, same config.matcher — only the
 * file name and exported function name changed). The rename itself is
 * cosmetic, but it exists to make a real point: this file is a network
 * boundary for UX redirects, not an authorization system.
 *
 * That point is reinforced by a real, recurring class of Next.js
 * authorization-bypass vulnerabilities in this exact layer (e.g.
 * CVE-2025-29927, and the CVE-2026-44573/44574/44575 family patched in
 * 15.5.16+/16.2.5+, with a Turbopack follow-up in 15.5.18+/16.2.6+). Crafted
 * `.rsc`/segment-prefetch requests or dynamic route parameters have been
 * able to reach a page without this check running at all.
 *
 * Two things follow from that:
 *   1. Keep next >= 16.2.6 (see package.json) so the known variants are patched.
 *   2. Never treat this file as the authorization boundary. It exists purely
 *      to redirect logged-out users before a page renders, for UX. The real
 *      checks live in every protected Server Component and Server Action
 *      (see app/dashboard/page.tsx, app/admin/page.tsx, etc., which each call
 *      supabase.auth.getUser() themselves) and, ultimately, in Postgres Row
 *      Level Security, which no request shape can bypass.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not add logic between createServerClient and getUser() — it needs to
  // run on every request for the session cookie to stay fresh.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
