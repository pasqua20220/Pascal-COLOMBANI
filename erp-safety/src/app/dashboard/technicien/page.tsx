import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, formatDateTime } from '@/lib/utils'
import { InspectionBadge } from '@/components/StatusBadge'
import { ClipboardList, Plus, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function TechnicienDashboard() {
  const session = await getSession()
  if (!session || session.role !== 'TECHNICIEN') redirect('/login')

  const profile = await prisma.technicienProfile.findUnique({ where: { userId: session.id } })

  const recentInspections = await prisma.inspection.findMany({
    where: { technicienId: session.id },
    orderBy: { dateVisite: 'desc' },
    take: 10,
    include: { erp: true, theme: true },
  })

  const pendingPrescriptions = await prisma.commissionPrescription.findMany({
    where: { status: { in: ['OUVERTE', 'EN_COURS'] } },
    orderBy: [{ priorite: 'desc' }, { delaiImparti: 'asc' }],
    take: 5,
    include: { erp: true },
  })

  const stats = {
    total: recentInspections.length,
    conforme: recentInspections.filter(i => i.status === 'CONFORME').length,
    reserve: recentInspections.filter(i => i.status === 'RESERVE').length,
    nonConforme: recentInspections.filter(i => i.status === 'NON_CONFORME').length,
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Technicien</h1>
          {profile && (
            <p className="text-sm text-gray-500 mt-1">
              {profile.organisme ?? 'Technicien compétent'}
              {profile.agrement && ` · Agrément n° ${profile.agrement}`}
            </p>
          )}
        </div>
        <Link href="/dashboard/technicien/nouvelle" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Nouvelle vérification
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" />Récentes (10j)</p>
          <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-600" />Conformes</p>
          <p className="text-3xl font-bold text-gray-800">{stats.conforme}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-yellow-600" />Avec réserves</p>
          <p className="text-3xl font-bold text-gray-800">{stats.reserve}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-red-600" />Non conformes</p>
          <p className="text-3xl font-bold text-gray-800">{stats.nonConforme}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent inspections */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Dernières vérifications</h2>
            <Link href="/dashboard/technicien/verifications" className="text-xs text-blue-600 hover:underline">Tout voir →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentInspections.slice(0, 6).map(insp => (
              <Link key={insp.id} href={`/dashboard/technicien/verifications/${insp.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{insp.erp.nom}</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-mono bg-gray-100 px-1 rounded">{insp.theme.code}</span> · {formatDate(insp.dateVisite)}
                  </p>
                </div>
                <InspectionBadge status={insp.status} />
              </Link>
            ))}
            {recentInspections.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Aucune vérification effectuée.</p>
            )}
          </div>
        </div>

        {/* Pending prescriptions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Prescriptions à lever</h2>
            <Link href="/dashboard/technicien/prescriptions" className="text-xs text-blue-600 hover:underline">Tout voir →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingPrescriptions.map(p => (
              <Link key={p.id} href={`/dashboard/technicien/prescriptions/${p.id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <span className={`mt-0.5 text-xs font-bold font-mono px-1.5 py-0.5 rounded ${p.priorite === 'URGENTE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  {p.numero}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 line-clamp-2">{p.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.erp.nom}</p>
                </div>
              </Link>
            ))}
            {pendingPrescriptions.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Aucune prescription en attente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
