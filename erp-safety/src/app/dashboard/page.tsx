import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const roleRoutes: Record<string, string> = {
    ADMIN: '/dashboard/admin',
    EXPLOITANT: '/dashboard/exploitant',
    TECHNICIEN: '/dashboard/technicien',
    ASSUREUR: '/dashboard/assureur',
    INSTITUTION: '/dashboard/institution',
  }

  redirect(roleRoutes[session.role] ?? '/login')
}
