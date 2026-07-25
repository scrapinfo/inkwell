// Hand-written to match supabase/schema.sql. Once the project is running
// against a real Supabase instance, prefer generating this automatically:
//   npx supabase gen types typescript --project-id <ref> > types/database.ts
//
// Note: `Views`, and each table's `Relationships` array, are not optional —
// the installed @supabase/postgrest-js's GenericSchema/GenericTable types
// require them structurally. Omitting them doesn't error here; it silently
// makes every query resolve to `never`, which is a much more confusing bug
// to chase down. (Verified against @supabase/supabase-js by actually
// running `tsc --noEmit` against this project — see the note in the README.)

export type UserRole = 'admin' | 'author'
export type ArticleStatus = 'draft' | 'pending' | 'published'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: UserRole
          balance: number
          stripe_account_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: UserRole
          balance?: number
          stripe_account_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
        Relationships: []
      }
      articles: {
        Row: {
          id: string
          author_id: string
          title: string
          content: Record<string, unknown>
          slug: string
          status: ArticleStatus
          category_id: string | null
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          content?: Record<string, unknown>
          slug: string
          status?: ArticleStatus
          category_id?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['articles']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'articles_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'articles_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: { id: string; name: string; slug: string }
        Insert: { id?: string; name: string; slug: string }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
        Relationships: []
      }
      subscribers: {
        Row: { id: string; email: string; created_at: string }
        Insert: { id?: string; email: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['subscribers']['Insert']>
        Relationships: []
      }
      media: {
        Row: {
          id: string
          storage_path: string
          url: string
          filename: string
          alt_text: string | null
          tags: string[]
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          storage_path: string
          url: string
          filename: string
          alt_text?: string | null
          tags?: string[]
          uploaded_by: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['media']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'media_uploaded_by_fkey'
            columns: ['uploaded_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      views: {
        Row: {
          id: string
          article_id: string
          ip_address: string
          created_at: string
        }
        Insert: {
          id?: string
          article_id: string
          ip_address: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['views']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'views_article_id_fkey'
            columns: ['article_id']
            isOneToOne: false
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      track_article_view: {
        Args: { p_article_id: string; p_ip_address: string }
        Returns: boolean
      }
      platform_stats: {
        Args: Record<PropertyKey, never>
        Returns: { total_articles: number; total_authors: number; total_earned: number }[]
      }
      author_bylines: {
        Args: { p_author_ids: string[] }
        Returns: { id: string; email: string }[]
      }
    }
  }
}
