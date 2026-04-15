import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, formatDateTime, isOverdue, getERPTypeLabel, getERPCategoryLabel } from '@/lib/utils'
import { InspectionBadge, PrescriptionBadge, PriorityBadge } from '@/components/StatusBadge'
import { Building2, ClipboardList, AlertTriangle, FileText, Calendar, CheckCircle } from 'lucide-react'

export default async function InstitutionERPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.role !== 'INSTITUTION') redirect('/login')

  // Verify access
  const profile = await prisma.institutionProfile.findUnique({ where: { userId: session.id } })
  if (!profile) redirect('/login')

  const access = await prisma.eRPInstitutionAccess.findUnique({
    where: { erpId_institutionId: { erpId: id, institutionId: profile.id } }
  })
  if (!access) notFound()

  const erp = await prisma.eRP.findUnique({
    where: { id },
    include: {
      exploitant: { include: { user: { select: { name: true, email: true, phone: true } } } },
      inspections: {
        orderBy: { dateVisite: 'desc' },
        include: {
          theme: { include: { references: true } },
          technicien: { select: { name: true } },
          references: true,
        }
      },
      commissionVisits: { orderBy: { dateVisite: 'desc' } },
      prescriptions: {
        orderBy: [{ priorite: 'desc' }, { numero: 'asc' }],
        include: {
          visit: { select: { dateVisite: true } },
          liftings: {
            orderBy: { signedAt: 'desc' },
            include: { technicien: { select: { name: true } } }
          }
        }
      },
      specialReports: { orderBy: { dateRapport: 'desc' } },
    }
  })

  if (!erp) notFound()

  // Group inspections by theme
  const inspByTheme = new Map<string, typeof erp.inspections>()
  for (const i of erp.inspections) {
    if (!inspByTheme.has(i.themeId)) inspByTheme.set(i.themeId, [])
    inspByTheme.get(i.themeId)!.push(i)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <a href="/dashboard/institution" className="text-sm text-blue-600 hover:underline">← Retour au tableau de bord</a>

      {/* ERP Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">{erp.nom}</h1>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Type {erp.erpType}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{erp.category.replace('CAT', 'Cat. ')}</span>
            </div>
            <p className="text-sm text-gray-600">{erp.adresse}, {erp.codePostal} {erp.ville}</p>
            <p className="text-xs text-gray-400 mt-1">{getERPTypeLabel(erp.erpType)} · {getERPCategoryLabel(erp.category)}</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-xs text-gray-500">Effectif max</p>
            <p className="font-bold text-gray-800">{erp.effectifMax} pers.</p>
            {erp.numeroERP && <p className="text-xs text-gray-500 mt-1">Réf. : {erp.numeroERP}</p>}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Exploitant</p>
            <p className="font-medium text-gray-800">{erp.exploitant.user.name}</p>
            {erp.exploitant.company && <p className="text-xs text-gray-500">{erp.exploitant.company}</p>}
            <p className="text-xs text-gray-500">{erp.exploitant.user.email}</p>
          </div>
          {erp.activite && <div><p className="text-xs text-gray-500">Activité</p><p className="text-gray-700">{erp.activite}</p></div>}
        </div>
      </div>

      {/* Commission visits */}
      {erp.commissionVisits.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600" />Visites de la commission de sécurité</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {erp.commissionVisits.map(v => (
              <div key={v.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800">{formatDate(v.dateVisite)}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">{v.typeVisite}</span>
                      {v.avis && <span className={`text-xs font-semibold px-2 py-0.5 rounded ${v.avis.includes('FAVORABLE') && !v.avis.includes('DEFAVORABLE') ? 'bg-green-100 text-green-700' : v.avis.includes('DEFAVORABLE') ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{v.avis}</span>}
                    </div>
                    {v.composition && <p className="text-xs text-gray-500">Composition : {v.composition}</p>}
                    {v.observations && <p className="text-xs text-gray-600 mt-1">{v.observations}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Inspections by theme */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-blue-600" />Vérifications techniques par thème</h2>
        </div>
        {Array.from(inspByTheme.entries()).map(([themeId, inspections]) => {
          const theme = inspections[0].theme
          const latest = inspections[0]
          return (
            <div key={themeId} className="border-b border-gray-100 last:border-0">
              <div className="px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold">{theme.code}</span>
                  <h3 className="font-semibold text-gray-800">{theme.libelle}</h3>
                  <InspectionBadge status={latest.status} />
                </div>
                <div className="space-y-3">
                  {inspections.map((insp, idx) => (
                    <div key={insp.id} className={`rounded-lg border p-4 ${idx === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Visite du {formatDate(insp.dateVisite)}
                            {idx === 0 && <span className="ml-2 text-xs bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded">Dernière</span>}
                          </p>
                          {insp.technicien && <p className="text-xs text-gray-500">Par : {insp.technicien.name}</p>}
                          {insp.signedAt && <p className="text-xs text-gray-400">Signé le {formatDateTime(insp.signedAt)}</p>}
                        </div>
                        <div className="text-right text-xs">
                          <InspectionBadge status={insp.status} />
                          <p className="text-gray-500 mt-1">Prochaine : {formatDate(insp.dateProchaine)}</p>
                        </div>
                      </div>
                      {insp.missionObjet && <p className="text-xs text-gray-600 italic mb-1">{insp.missionObjet}</p>}
                      {insp.conclusion && <p className="text-xs text-gray-700"><strong>Conclusion :</strong> {insp.conclusion}</p>}
                      {insp.observations && <p className="text-xs text-gray-600 mt-1"><strong>Observations :</strong> {insp.observations}</p>}
                      {insp.reserveItems && JSON.parse(insp.reserveItems).length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs font-medium text-yellow-700">Réserves :</p>
                          {JSON.parse(insp.reserveItems).map((r: string, i: number) => (
                            <p key={i} className="text-xs text-yellow-600 ml-2">· {r}</p>
                          ))}
                        </div>
                      )}
                      {insp.nonConformItems && JSON.parse(insp.nonConformItems).length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs font-medium text-red-700">Non-conformités :</p>
                          {JSON.parse(insp.nonConformItems).map((r: string, i: number) => (
                            <p key={i} className="text-xs text-red-600 ml-2">· {r}</p>
                          ))}
                        </div>
                      )}
                      {insp.references.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {insp.references.map(r => (
                            <span key={r.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{r.code}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
        {erp.inspections.length === 0 && (
          <p className="px-6 py-6 text-sm text-gray-400">Aucune vérification disponible.</p>
        )}
      </section>

      {/* Prescriptions */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" />Prescriptions de la commission</h2>
        </div>
        {erp.prescriptions.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {erp.prescriptions.map(p => (
              <div key={p.id} className="px-6 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-sm">{p.numero}</span>
                    <PriorityBadge priorite={p.priorite} />
                    <PrescriptionBadge status={p.status} />
                  </div>
                  {p.delaiImparti && (
                    <span className={`text-xs ${isOverdue(p.delaiImparti) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      Délai : {formatDate(p.delaiImparti)} {isOverdue(p.delaiImparti) && '⚠ DÉPASSÉ'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-800">{p.description}</p>
                {p.referenceLegal && <p className="text-xs text-blue-600 mt-1 font-mono">{p.referenceLegal}</p>}

                {/* Liftings */}
                {p.liftings.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {p.liftings.map(l => (
                      <div key={l.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          <p className="text-xs font-semibold text-green-700">Attestation de levée</p>
                          <p className="text-xs text-gray-400">{formatDateTime(l.signedAt)} · {l.technicien.name}</p>
                        </div>
                        <p className="text-xs text-gray-700">{l.textAttestation}</p>
                        {l.travauxRealises && <p className="text-xs text-gray-500 mt-1">Travaux : {l.travauxRealises}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="px-6 py-6 text-sm text-gray-400">Aucune prescription enregistrée.</p>
        )}
      </section>

      {/* Special reports */}
      {erp.specialReports.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><FileText className="w-4 h-4 text-purple-600" />Rapports spéciaux (RVRAT, RVRE, etc.)</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {erp.specialReports.map(r => (
              <div key={r.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-semibold">{r.reportType}</span>
                      <p className="text-sm font-semibold text-gray-800">{r.titre}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(r.dateRapport)}
                      {r.organisme && ` · ${r.organisme}`}
                      {r.redacteur && ` · ${r.redacteur}`}
                    </p>
                    {r.conclusions && <p className="text-xs text-gray-600 mt-1">{r.conclusions}</p>}
                  </div>
                  {r.fileUrl && (
                    <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                      Télécharger →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
