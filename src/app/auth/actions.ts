'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUpOwner(formData: FormData) {
  // Used ONCE to bootstrap the first owner account. Disable after setup.
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const name = String(formData.get('name') ?? '')

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  if (data.user) {
    // Insert profile; RLS allows the user to write their own row.
    // Promote to owner manually via SQL after verifying identity:
    //   update users set role = 'owner' where email = '...';
    await supabase.from('users').insert({
      id: data.user.id,
      email,
      name: name || null,
      role: 'public',
    })
  }

  redirect('/login?signedUp=1')
}
