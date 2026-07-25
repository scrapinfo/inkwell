'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Credentials = { email: string; password: string; agreedToTerms?: boolean }
type AuthResult = { error?: string; message?: string }

export async function signIn({ email, password }: Credentials): Promise<AuthResult | undefined> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function signUp({ email, password, agreedToTerms }: Credentials): Promise<AuthResult> {
  if (!agreedToTerms) {
    return { error: 'You need to agree to the Terms of Service and Privacy Policy to create an account.' }
  }
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  return { message: 'Check your email to confirm your account, then sign in.' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
