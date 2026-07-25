import type { Metadata } from 'next'
import { Newsreader, Manrope } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import NewsletterPopup from '@/components/NewsletterPopup'
import './globals.css'

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
})

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Inkwell — every read pays the writer', template: '%s · Inkwell' },
  description: 'A multi-author blog that shares ad-free, per-view revenue directly with its writers.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: 'admin' | 'author' = 'author'
  if (user) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    role = profile?.role ?? 'author'
  }

  return (
    <html lang="en" className={`${newsreader.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink-950 antialiased">
        <Navbar user={user ? { email: user.email!, role } : null} />
        <main>{children}</main>
        <Footer />
        <NewsletterPopup />
      </body>
    </html>
  )
}
