import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, formatDateTime } from '@/lib/utils'
import { InspectionBadge } from '@/components/StatusBadge'
import { FileText, CheckCircle, AlertTriangle, BookOpen, PenTool, Building2 } from 'lucide-react'

export default async function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.role !== 'TECHNICIEN') redirect('/login')

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      erp: true,
      theme: { include: { references: true } },
      technicien: { select: { name: true } },
      references: true,
    }
  })

  if (!inspection) notFound()

  const conformItems: string[] = inspection.conformItems ? JSON.parse(inspection.conformItems) : []
  const nonConformItems: string[] = inspection.nonConformItems ? JSON.parse(inspection.nonConformItems) : []
  const reserveItems: string[] = inspection.reserveItems ? JSON.parse(inspection.reserveItems) : []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <a href="/dashboard/technicien/verifications" className="text-sm text-blue-600 hover:underline">← Retour aux vérifications</a>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded">{inspection.theme.code}</span>
              <h1 className="text-xl font-bold text-gray-900">{inspection.theme.libelle}</h1>
              <InspectionBadge status={inspection.status} />
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Building2 className="w-3.5 h-3.5" />
              <span>{inspection.erp.nom} — {inspection.erp.ville}</span>
              <span className="text-gray-300">·</span>
              <span>Type {inspection.erp.erpType} {inspection.erp.category.replace('CAT', 'Cat.')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs text-gray-500">Date de visite</p>
            <p className="font-semibold text-gray-800">{formatDate(inspection.dateVisite)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Prochaine vérification</p>
            <p className="font-semibold text-gray-800">{formatDate(inspection.dateProchaine)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Technicien</p>
            <p className="font-semibold text-gray-800">{inspection.technicien?.name ?? 'N/A'}</p>
          </div>
          {inspection.signedAt && (
            <div>
              <p className="text-xs text-gray-500">Signé le</p>
              <p className="font-semibold text-gray-800">{formatDateTime(inspection.signedAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mission */}
      {inspection.missionObjet && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Objet de la mission
          </h2>
          <p className="text-sm text-gray-700 italic">{inspection.missionObjet}</p>
        </div>
      )}

      {/* References */}
      {inspection.references.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Références réglementaires appliquées
          </h2>
          <div className="flex flex-wrap gap-2">
            {inspection.references.map(ref => (
              <div key={ref.id} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <p className="text-xs font-mono font-bold text-blue-700">{ref.code}</p>
                <p className="text-xs text-gray-700 mt-0.5">{ref.titre}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constatations */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          Constatations
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {conformItems.length > 0 && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs font-semibold text-green-700 mb-2">Points conformes</p>
              {conformItems.map((item, i) => <p key={i} className="text-xs text-green-600">· {item}</p>)}
            </div>
          )}
          {reserveItems.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-xs font-semibold text-yellow-700 mb-2">Réserves</p>
              {reserveItems.map((item, i) => <p key={i} className="text-xs text-yellow-600">· {item}</p>)}
            </div>
          )}
          {nonConformItems.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="text-xs font-semibold text-red-700 mb-2">Non-conformités</p>
              {nonConformItems.map((item, i) => <p key={i} className="text-xs text-red-600">· {item}</p>)}
            </div>
          )}
        </div>

        {inspection.observations && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Observations :</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">{inspection.observations}</p>
          </div>
        )}

        {inspection.conclusion && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 font-medium mb-1">Conclusion :</p>
            <p className="text-sm text-gray-800 font-medium bg-blue-50 rounded-lg p-3 border border-blue-200">{inspection.conclusion}</p>
          </div>
        )}

        {inspection.recommandations && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 font-medium mb-1">Recommandations :</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">{inspection.recommandations}</p>
          </div>
        )}
      </div>

      {/* Signature block */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <PenTool className="w-4 h-4" />
          Identification et signature
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">{inspection.signedBy ?? inspection.technicien?.name ?? 'N/A'}</p>
          </div>
          {inspection.signedAt && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Attesté et signé le</p>
              <p className="text-sm font-mono font-medium">{formatDateTime(inspection.signedAt)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
