import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, isOverdue, getDaysUntil } from '@/lib/utils'
import { PrescriptionBadge, PriorityBadge } from '@/components/StatusBadge'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function TechnicienPrescriptionsPage() {
  const session = await getSession()
  if (!session || session.role !== 'TECHNICIEN') redirect('/login')

  const prescriptions = await prisma.commissionPrescription.findMany({
    where: { status: { in: ['OUVERTE', 'EN_COURS'] } },
    orderBy: [{ priorite: 'desc' }, { delaiImparti: 'asc' }],
    include: {
      erp: { select: { nom: true, ville: true, erpType: true, category: true } },
      visit: { select: { dateVisite: true, typeVisite: true } },
      liftings: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { technicien: { select: { name: true } } }
      }
    }
  })

  const overdue = prescriptions.filter(p => p.delaiImparti && isOverdue(p.delaiImparti))
  const upcoming = prescriptions.filter(p => !p.delaiImparti || !isOverdue(p.delaiImparti))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Prescriptions à lever</h1>
      <p className="text-gray-500 text-sm mb-6">Sélectionnez une prescription pour renseigner son attestation de levée.</p>

      {overdue.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <strong>{overdue.length} prescription{overdue.length > 1 ? 's' : ''}</strong> ont dépassé leur délai imparti.
        </div>
      )}

      <div className="space-y-3">
        {prescriptions.map(p => {
          const days = getDaysUntil(p.delaiImparti)
          const late = p.delaiImparti ? isOverdue(p.delaiImparti) : false
          return (
            <Link key={p.id} href={`/dashboard/technicien/prescriptions/${p.id}`}
              className="block bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{p.numero}</span>
                    <PriorityBadge priorite={p.priorite} />
                    <PrescriptionBadge status={p.status} />
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{p.description}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                    <span><strong>ERP :</strong> {p.erp.nom} ({p.erp.ville}) — Type {p.erp.erpType}</span>
                    {p.visit && <span><strong>Visite CS :</strong> {formatDate(p.visit.dateVisite)}</span>}
                    {p.referenceLegal && <span><strong>Réf. :</strong> {p.referenceLegal}</span>}
                  </div>
                  {p.liftings.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      Dernière attestation le {formatDate(p.liftings[0].createdAt)} par {p.liftings[0].technicien.name}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {p.delaiImparti ? (
                    <div>
                      <p className="text-xs text-gray-500">Délai imparti</p>
                      <p className="text-sm font-medium">{formatDate(p.delaiImparti)}</p>
                      {days !== null && (
                        <p className={`text-xs font-semibold ${late ? 'text-red-600' : 'text-orange-500'}`}>
                          {late ? `⚠ ${Math.abs(days)}j dépassé` : `J-${days}`}
                        </p>
                      )}
                    </div>
                  ) : <span className="text-xs text-gray-400">Pas de délai</span>}
                </div>
              </div>
            </Link>
          )
        })}

        {prescriptions.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune prescription ouverte.</p>
          </div>
        )}
      </div>
    </div>
  )
}
