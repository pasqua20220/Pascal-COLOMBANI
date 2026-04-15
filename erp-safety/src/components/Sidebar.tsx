'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth'
import {
  ShieldCheck, LayoutDashboard, Building2, ClipboardList,
  FileText, Bell, Settings, LogOut, Users, AlertTriangle, BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navByRole: Record<string, NavItem[]> = {
  EXPLOITANT: [
    { href: '/dashboard/exploitant', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/dashboard/exploitant/erp', label: 'Mes ERP', icon: Building2 },
    { href: '/dashboard/exploitant/verifications', label: 'Vérifications', icon: ClipboardList },
    { href: '/dashboard/exploitant/prescriptions', label: 'Prescriptions', icon: AlertTriangle },
    { href: '/dashboard/exploitant/rapports', label: 'Rapports spéciaux', icon: FileText },
  ],
  TECHNICIEN: [
    { href: '/dashboard/technicien', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/dashboard/technicien/verifications', label: 'Mes vérifications', icon: ClipboardList },
    { href: '/dashboard/technicien/nouvelle', label: 'Nouvelle vérification', icon: FileText },
    { href: '/dashboard/technicien/prescriptions', label: 'Levées prescriptions', icon: AlertTriangle },
  ],
  ASSUREUR: [
    { href: '/dashboard/assureur', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/dashboard/assureur/erp', label: 'ERP assurés', icon: Building2 },
    { href: '/dashboard/assureur/alertes', label: 'Alertes', icon: Bell },
  ],
  INSTITUTION: [
    { href: '/dashboard/institution', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/dashboard/institution/erp', label: 'ERP du secteur', icon: Building2 },
    { href: '/dashboard/institution/verifications', label: 'Vérifications', icon: ClipboardList },
    { href: '/dashboard/institution/prescriptions', label: 'Prescriptions', icon: AlertTriangle },
    { href: '/dashboard/institution/rapports', label: 'Rapports spéciaux', icon: FileText },
  ],
  ADMIN: [
    { href: '/dashboard/admin', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/dashboard/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/dashboard/admin/erp', label: 'Tous les ERP', icon: Building2 },
    { href: '/dashboard/admin/themes', label: 'Thèmes / Références', icon: BookOpen },
  ],
}

const roleLabels: Record<string, string> = {
  EXPLOITANT: 'Exploitant',
  TECHNICIEN: 'Technicien compétent',
  ASSUREUR: 'Assureur',
  INSTITUTION: 'Institution',
  ADMIN: 'Administrateur',
}

const roleColors: Record<string, string> = {
  EXPLOITANT: 'bg-emerald-600',
  TECHNICIEN: 'bg-blue-600',
  ASSUREUR: 'bg-purple-600',
  INSTITUTION: 'bg-orange-600',
  ADMIN: 'bg-gray-700',
}

type Props = {
  user: { name: string; email: string; role: string }
}

export function Sidebar({ user }: Props) {
  const pathname = usePathname()
  const navItems = navByRole[user.role] ?? []

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">ERP Sécurité</p>
            <p className="text-gray-400 text-xs">Suivi réglementaire</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold', roleColors[user.role] ?? 'bg-gray-600')}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{roleLabels[user.role] ?? user.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700 space-y-1">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  )
}
