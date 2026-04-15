'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/actions/auth'
import { ShieldCheck, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await loginAction(formData) ?? null
    },
    null
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ERP Sécurité</h1>
          <p className="text-blue-200 mt-2 text-sm">
            Plateforme de suivi des vérifications techniques obligatoires
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Connexion</h2>

          {state?.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="votre@email.fr"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200"
            >
              {pending ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-3">Comptes de démonstration (mot de passe : Demo1234!)</p>
            <div className="space-y-1.5">
              {[
                { role: 'Exploitant', email: 'exploitant@demo.fr', color: 'text-emerald-700 bg-emerald-50' },
                { role: 'Technicien', email: 'technicien@bureau-veritas.fr', color: 'text-blue-700 bg-blue-50' },
                { role: 'Assureur', email: 'assureur@axa.fr', color: 'text-purple-700 bg-purple-50' },
                { role: 'Institution (SDIS)', email: 'sdis@sdis75.fr', color: 'text-orange-700 bg-orange-50' },
              ].map(({ role, email, color }) => (
                <div key={email} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${color}`}>
                  <span className="font-medium">{role}</span>
                  <span className="font-mono">{email}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          Plateforme sécurisée · Données chiffrées · Conformité RGPD
        </p>
      </div>
    </div>
  )
}
