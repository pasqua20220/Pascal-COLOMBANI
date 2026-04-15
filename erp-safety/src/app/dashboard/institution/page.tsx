import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, isOverdue, isDueSoon, getDaysUntil, getERPTypeLabel, getERPCategoryLabel } from '@/lib/utils'
import { InspectionBadge, PrescriptionBadge } from '@/components/StatusBadge'
import { Building2, ClipboardList, AlertTriangle, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function InstitutionDashboard() {
  const session = await getSession()
  if (!session || session.role !== 'INSTITUTION') redirect('/login')

  const institutionProfile = await prisma.institutionProfile.findUnique({
    where: { userId: session.id },
    include: {
      accessibleERPs: {
        include: {
          erp: {
            include: {
              inspections: {
                orderBy: { dateVisite: 'desc' },
                include: { theme: true, technicien: { select: { name: true } } },
              },
              prescriptions: { orderBy: { createdAt: 'desc' } },
              specialReports: { orderBy: { dateRapport: 'desc' } },
              commissionVisits: { orderBy: { dateVisite: 'desc' }, take: 1 },
            }
          }
        }
      }
    }
  })

  if (!institutionProfile) redirect('/login')

  const erps = institutionProfile.accessibleERPs.map(a => a.erp)

  const allInspections = erps.flatMap(e => e.inspections)
  const allPrescriptions = erps.flatMap(e => e.prescriptions)

  // Latest per theme per ERP
  const latestMap = new Map<string, typeof allInspections[0]>()
  for (const i of allInspections) {
    const k = `${i.erpId}-${i.themeId}`
    if (!latestMap.has(k) || i.dateVisite > latestMap.get(k)!.dateVisite) latestMap.set(k, i)
  }
  const latest = Array.from(latestMap.values())

  const overdueCount = latest.filter(i => i.status === 'EN_RETARD' || (i.dateLimite && isOverdue(i.dateLimite))).length
  const openPrescriptions = allPrescriptions.filter(p => p.status !== 'LEVEE').length
  const specialReportsCount = erps.flatMap(e => e.specialReports).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Institution</h1>
        <p className="text-gray-500 text-sm">
          {institutionProfile.institutionType} · {institutionProfile.departement && `Département ${institutionProfile.departement}`}
          {institutionProfile.commune && ` · ${institutionProfile.commune}`}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Accès en lecture seule · {erps.length} ERP accessible{erps.length > 1 ? 's' : ''} dans votre secteur
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-blue-600" /><span className="text-xs text-gray-500">ERP du secteur</span></div>
          <p className="text-3xl font-bold">{erps.length}</p>
        </div>
        <div className={`rounded-xl p-4 border shadow-sm ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-xs text-gray-500">Vérifs. en retard</span></div>
          <p className="text-3xl font-bold">{overdueCount}</p>
        </div>
        <div className={`rounded-xl p-4 border shadow-sm ${openPrescriptions > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-orange-500" /><span className="text-xs text-gray-500">Prescriptions ouvertes</span></div>
          <p className="text-3xl font-bold">{openPrescriptions}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-purple-600" /><span className="text-xs text-gray-500">Rapports spéciaux</span></div>
          <p className="text-3xl font-bold">{specialReportsCount}</p>
        </div>
      </div>

      {/* ERP Cards */}
      {erps.map(erp => {
        const erpLatest = latest.filter(i => i.erpId === erp.id)
        const erpPrescriptions = erp.prescriptions
        const erpSpecial = erp.specialReports
        const lastVisit = erp.commissionVisits[0]

        const openPresc = erpPrescriptions.filter(p => p.status !== 'LEVEE')
        const urgentPresc = openPresc.filter(p => p.priorite === 'URGENTE')

        return (
          <div key={erp.id} className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-gray-900">{erp.nom}</h2>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Type {erp.erpType}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{erp.category.replace('CAT', 'Cat. ')}</span>
                    {urgentPresc.length > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium animate-pulse">
                        ⚠ {urgentPresc.length} prescription urgente
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{erp.adresse}, {erp.codePostal} {erp.ville}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Effectif max : {erp.effectifMax} pers. · {getERPTypeLabel(erp.erpType)}</p>
                </div>
                <Link href={`/dashboard/institution/erp/${erp.id}`} className="text-sm text-blue-600 hover:underline whitespace-nowrap">
                  Détail complet →
                </Link>
              </div>

              {lastVisit && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 inline-flex">
                  <Calendar className="w-3.5 h-3.5" />
                  Dernière visite CS : {formatDate(lastVisit.dateVisite)} · Avis : <span className="font-semibold ml-1">{lastVisit.avis ?? 'N/A'}</span>
                </div>
              )}
            </div>

            <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
              {/* Verifications */}
              <div className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Vérifications par thème
                </h3>
                {erpLatest.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-100">
                        <th className="text-left pb-1.5 font-medium">Thème</th>
                        <th className="text-left pb-1.5 font-medium">Dernière</th>
                        <th className="text-left pb-1.5 font-medium">Prochaine</th>
                        <th className="text-left pb-1.5 font-medium">État</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {erpLatest.map(i => (
                        <tr key={i.id} className="hover:bg-gray-50">
                          <td className="py-2 font-medium">
                            <span className="font-mono bg-gray-100 px-1 rounded text-gray-600 mr-1">{i.theme.code}</span>
                          </td>
                          <td className="py-2 text-gray-600">{formatDate(i.dateVisite)}</td>
                          <td className="py-2 text-gray-600">{formatDate(i.dateProchaine)}</td>
                          <td className="py-2"><InspectionBadge status={i.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-xs text-gray-400">Aucune vérification disponible.</p>}
              </div>

              {/* Prescriptions + Special reports */}
              <div className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Prescriptions ({openPresc.length} ouverte{openPresc.length > 1 ? 's' : ''})
                </h3>
                {openPresc.length > 0 ? (
                  <div className="space-y-1.5">
                    {openPresc.slice(0, 4).map(p => (
                      <div key={p.id} className="flex items-start gap-2">
                        <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5">{p.numero}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 line-clamp-1">{p.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <PrescriptionBadge status={p.status} />
                            {p.delaiImparti && (
                              <span className={`text-xs ${isOverdue(p.delaiImparti) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                {isOverdue(p.delaiImparti) ? '⚠ Dépassé' : `Limite : ${formatDate(p.delaiImparti)}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-gray-400 mb-3">Aucune prescription ouverte.</p>}

                {erpSpecial.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Rapports spéciaux (RVRAT/RVRE)
                    </h4>
                    {erpSpecial.map(r => (
                      <div key={r.id} className="flex items-center gap-2 text-xs py-1">
                        <span className="font-mono bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">{r.reportType}</span>
                        <span className="text-gray-700 truncate">{r.titre}</span>
                        <span className="text-gray-400 flex-shrink-0">{formatDate(r.dateRapport)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {erps.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucun ERP accessible dans votre secteur.</p>
          <p className="text-sm mt-1">Contactez un administrateur pour configurer vos accès.</p>
        </div>
      )}
    </div>
  )
}
