'use server'

import { createClient } from '@/lib/supabase/server'

export async function subscribe(email: string) {
  const trimmed = email.trim()
  if (!trimmed || !trimmed.includes('@')) {
    return { error: 'Enter a valid email address.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('subscribers').insert({ email: trimmed })

  if (error) {
    // Unique violation just means they're already subscribed — treat as success.
    if (error.code === '23505') return { message: "You're already on the list." }
    return { error: 'Something went wrong. Try again in a moment.' }
  }

  return { message: "You're in — thanks for subscribing." }
}
