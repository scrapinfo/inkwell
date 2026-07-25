import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const supabase = await createClient()

  const { data: articles } = await supabase
    .from('articles')
    .select('slug, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    ...(articles ?? []).map((article) => ({
      url: `${siteUrl}/${article.slug}`,
      lastModified: article.published_at ?? undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
