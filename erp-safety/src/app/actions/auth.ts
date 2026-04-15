'use server'

import { redirect } from 'next/navigation'
import { login, createSession, setSessionCookie, getSession, clearSessionCookie, deleteSession } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email et mot de passe requis.' }
  }

  const user = await login(email, password)
  if (!user) {
    return { error: 'Identifiants incorrects ou compte désactivé.' }
  }

  const token = await createSession(user.id)
  await setSessionCookie(token)

  // Redirect based on role
  const roleRoutes: Record<string, string> = {
    ADMIN: '/dashboard/admin',
    EXPLOITANT: '/dashboard/exploitant',
    TECHNICIEN: '/dashboard/technicien',
    ASSUREUR: '/dashboard/assureur',
    INSTITUTION: '/dashboard/institution',
  }

  redirect(roleRoutes[user.role] ?? '/dashboard')
}

export async function logoutAction() {
  const cookieStore = await cookies()
  const token = cookieStore.get('erp_session')?.value
  if (token) {
    await deleteSession(token)
  }
  await clearSessionCookie()
  redirect('/login')
}
