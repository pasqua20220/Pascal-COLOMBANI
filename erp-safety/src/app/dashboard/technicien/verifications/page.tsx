import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { InspectionBadge } from '@/components/StatusBadge'
import { ClipboardList } from 'lucide-react'
import Link from 'next/link'

export default async function TechnicienVerificationsPage() {
  const session = await getSession()
  if (!session || session.role !== 'TECHNICIEN') redirect('/login')

  const inspections = await prisma.inspection.findMany({
    where: { technicienId: session.id },
    orderBy: { dateVisite: 'desc' },
    include: { erp: { select: { nom: true, ville: true, erpType: true } }, theme: true },
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Mes vérifications</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-gray-800">{inspections.length} vérification{inspections.length > 1 ? 's' : ''}</span>
        </div>
        <div className="divide-y divide-gray-50">
          {inspections.map(insp => (
            <Link key={insp.id} href={`/dashboard/technicien/verifications/${insp.id}`}
              className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0 grid grid-cols-4 gap-3 items-center">
                <div>
                  <p className="text-sm font-medium text-gray-800 truncate">{insp.erp.nom}</p>
                  <p className="text-xs text-gray-500">{insp.erp.ville} · Type {insp.erp.erpType}</p>
                </div>
                <div>
                  <span className="font-mono text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">{insp.theme.code}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{insp.theme.libelle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Visite</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(insp.dateVisite)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Prochaine</p>
                  <p className="text-sm text-gray-700">{formatDate(insp.dateProchaine)}</p>
                </div>
              </div>
              <InspectionBadge status={insp.status} />
            </Link>
          ))}
          {inspections.length === 0 && (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">Aucune vérification effectuée.</p>
          )}
        </div>
      </div>
    </div>
  )
}
