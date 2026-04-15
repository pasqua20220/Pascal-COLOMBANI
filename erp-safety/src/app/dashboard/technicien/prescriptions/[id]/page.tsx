import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, formatDateTime } from '@/lib/utils'
import { PrescriptionBadge, PriorityBadge } from '@/components/StatusBadge'
import { LiftPrescriptionForm } from './LiftPrescriptionForm'

export default async function LiftPrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.role !== 'TECHNICIEN') redirect('/login')

  const prescription = await prisma.commissionPrescription.findUnique({
    where: { id },
    include: {
      erp: true,
      visit: true,
      liftings: {
        orderBy: { createdAt: 'desc' },
        include: { technicien: { select: { name: true } }, inspection: { include: { theme: true } } }
      }
    }
  })

  if (!prescription) notFound()

  const profile = await prisma.technicienProfile.findUnique({ where: { userId: session.id } })

  // Get inspections for this ERP to link lifting
  const erpInspections = await prisma.inspection.findMany({
    where: { erpId: prescription.erpId },
    orderBy: { dateVisite: 'desc' },
    take: 20,
    include: { theme: true },
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <a href="/dashboard/technicien/prescriptions" className="text-sm text-blue-600 hover:underline">← Retour aux prescriptions</a>
      </div>

      {/* Prescription header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg text-gray-800 bg-gray-100 px-2.5 py-1 rounded">{prescription.numero}</span>
            <PriorityBadge priorite={prescription.priorite} />
            <PrescriptionBadge status={prescription.status} />
          </div>
        </div>

        <p className="text-base text-gray-800 font-medium mb-3">{prescription.description}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">ERP</p>
            <p className="font-medium">{prescription.erp.nom}</p>
            <p className="text-gray-500 text-xs">{prescription.erp.adresse}, {prescription.erp.ville}</p>
          </div>
          {prescription.referenceLegal && (
            <div>
              <p className="text-xs text-gray-500">Référence réglementaire</p>
              <p className="font-medium font-mono text-blue-700">{prescription.referenceLegal}</p>
            </div>
          )}
          {prescription.visit && (
            <div>
              <p className="text-xs text-gray-500">Visite commission</p>
              <p className="font-medium">{formatDate(prescription.visit.dateVisite)} — {prescription.visit.typeVisite}</p>
            </div>
          )}
          {prescription.delaiImparti && (
            <div>
              <p className="text-xs text-gray-500">Délai imparti</p>
              <p className="font-medium">{formatDate(prescription.delaiImparti)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Previous liftings */}
      {prescription.liftings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Historique des attestations</h2>
          <div className="space-y-4">
            {prescription.liftings.map(l => (
              <div key={l.id} className="border-l-4 border-blue-300 pl-4">
                <p className="text-sm text-gray-800">{l.textAttestation}</p>
                {l.travauxRealises && <p className="text-xs text-gray-500 mt-1">Travaux : {l.travauxRealises}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {l.technicien.name} · {formatDateTime(l.signedAt)}
                  {l.inspection && ` · Lié à vérif. ${l.inspection.theme.code}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lifting form - only if not already lifted */}
      {prescription.status !== 'LEVEE' && (
        <LiftPrescriptionForm
          prescriptionId={prescription.id}
          technicienName={session.name}
          technicien={profile}
          inspections={erpInspections}
        />
      )}

      {prescription.status === 'LEVEE' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-green-700 font-semibold">Cette prescription a été levée.</p>
        </div>
      )}
    </div>
  )
}
