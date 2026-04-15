import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, isOverdue, isDueSoon, getDaysUntil } from '@/lib/utils'
import { InspectionBadge, PrescriptionBadge } from '@/components/StatusBadge'
import { Bell, Building2, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react'
import Link from 'next/link'

export default async function AssureurDashboard() {
  const session = await getSession()
  if (!session || session.role !== 'ASSUREUR') redirect('/login')

  const assureurProfile = await prisma.assureurProfile.findUnique({
    where: { userId: session.id },
    include: {
      contrats: {
        where: { isActive: true },
        include: {
          erp: {
            include: {
              inspections: {
                orderBy: { dateVisite: 'desc' },
                include: { theme: true },
              },
              prescriptions: {
                where: { status: { not: 'LEVEE' } },
              }
            }
          }
        }
      }
    }
  })

  if (!assureurProfile) redirect('/login')

  const erps = assureurProfile.contrats.map(c => c.erp)

  // Compute global risk indicators
  const allInspections = erps.flatMap(e => e.inspections)
  const allPrescriptions = erps.flatMap(e => e.prescriptions)

  // Get the latest inspection per theme per ERP
  const latestByThemeERP = new Map<string, typeof allInspections[0]>()
  for (const insp of allInspections) {
    const key = `${insp.erpId}-${insp.themeId}`
    if (!latestByThemeERP.has(key) || insp.dateVisite > latestByThemeERP.get(key)!.dateVisite) {
      latestByThemeERP.set(key, insp)
    }
  }
  const latest = Array.from(latestByThemeERP.values())

  const overdueCount = latest.filter(i => i.status === 'EN_RETARD' || (i.dateLimite && isOverdue(i.dateLimite))).length
  const dueSoonCount = latest.filter(i => i.dateLimite && isDueSoon(i.dateLimite, 60) && !isOverdue(i.dateLimite)).length
  const urgentPrescriptions = allPrescriptions.filter(p => p.priorite === 'URGENTE').length

  // Risk score: simple heuristic
  const riskLevel = overdueCount > 2 || urgentPrescriptions > 0 ? 'ÉLEVÉ' : overdueCount > 0 || dueSoonCount > 3 ? 'MODÉRÉ' : 'FAIBLE'
  const riskColor = riskLevel === 'ÉLEVÉ' ? 'text-red-700 bg-red-50 border-red-200' :
    riskLevel === 'MODÉRÉ' ? 'text-orange-700 bg-orange-50 border-orange-200' :
      'text-green-700 bg-green-50 border-green-200'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Assureur</h1>
        <p className="text-gray-500 text-sm">{assureurProfile.compagnie} · {erps.length} ERP assuré{erps.length > 1 ? 's' : ''}</p>
      </div>

      {/* Risk indicator */}
      <div className={`rounded-xl p-5 border mb-6 ${riskColor}`}>
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7" />
          <div>
            <p className="font-semibold text-lg">Niveau de risque global : {riskLevel}</p>
            <p className="text-sm mt-0.5">
              {overdueCount} vérification{overdueCount > 1 ? 's' : ''} en retard ·
              {dueSoonCount} à échéance dans 60 jours ·
              {urgentPrescriptions} prescription{urgentPrescriptions > 1 ? 's' : ''} urgente{urgentPrescriptions > 1 ? 's' : ''} en cours
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-blue-600" /><span className="text-xs text-gray-500">ERP assurés</span></div>
          <p className="text-3xl font-bold">{erps.length}</p>
        </div>
        <div className={`rounded-xl p-4 border shadow-sm ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-xs text-gray-500">Vérifs. en retard</span></div>
          <p className="text-3xl font-bold">{overdueCount}</p>
        </div>
        <div className={`rounded-xl p-4 border shadow-sm ${dueSoonCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-orange-500" /><span className="text-xs text-gray-500">Échéances (60j)</span></div>
          <p className="text-3xl font-bold">{dueSoonCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-xs text-gray-500">Conformes</span></div>
          <p className="text-3xl font-bold">{latest.filter(i => i.status === 'CONFORME').length}</p>
        </div>
      </div>

      {/* Alerts section */}
      {(overdueCount > 0 || urgentPrescriptions > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alertes actives
          </h2>
          <div className="space-y-2">
            {latest.filter(i => i.status === 'EN_RETARD' || (i.dateLimite && isOverdue(i.dateLimite))).map(i => {
              const erp = erps.find(e => e.id === i.erpId)!
              const days = getDaysUntil(i.dateLimite)
              return (
                <div key={i.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-red-200">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{erp.nom}</p>
                    <p className="text-xs text-gray-500">
                      <span className="font-mono bg-gray-100 px-1 rounded">{i.theme.code}</span> {i.theme.libelle}
                    </p>
                  </div>
                  <div className="text-right">
                    <InspectionBadge status={i.status} />
                    {days !== null && (
                      <p className="text-xs text-red-600 font-semibold mt-1">{Math.abs(days)}j de retard</p>
                    )}
                  </div>
                </div>
              )
            })}
            {allPrescriptions.filter(p => p.priorite === 'URGENTE').map(p => {
              const erp = erps.find(e => e.id === p.erpId)!
              return (
                <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-red-200">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{erp.nom} — Prescription {p.numero}</p>
                    <p className="text-xs text-gray-500">{p.description}</p>
                  </div>
                  <PrescriptionBadge status={p.status} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ERP details */}
      {erps.map(erp => {
        const erpLatest = latest.filter(i => i.erpId === erp.id)
        const erpPrescriptions = allPrescriptions.filter(p => p.erpId === erp.id)

        return (
          <div key={erp.id} className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{erp.nom}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{erp.adresse}, {erp.codePostal} {erp.ville} · Type {erp.erpType} · {erp.category.replace('CAT', 'Cat. ')}</p>
                </div>
                <div className="flex gap-2">
                  {erpPrescriptions.length > 0 && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                      {erpPrescriptions.length} prescription{erpPrescriptions.length > 1 ? 's' : ''} ouvertes
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100">
                    <th className="text-left pb-2 font-medium">Thème</th>
                    <th className="text-left pb-2 font-medium">Dernière vérif.</th>
                    <th className="text-left pb-2 font-medium">Prochaine / Limite</th>
                    <th className="text-left pb-2 font-medium">État</th>
                    <th className="text-left pb-2 font-medium">Délai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {erpLatest.map(i => {
                    const late = i.dateLimite ? isOverdue(i.dateLimite) : false
                    const soon = i.dateLimite ? isDueSoon(i.dateLimite, 60) : false
                    const days = getDaysUntil(i.dateLimite)
                    return (
                      <tr key={i.id} className={late ? 'bg-red-50' : soon ? 'bg-orange-50' : ''}>
                        <td className="py-2">
                          <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mr-1.5">{i.theme.code}</span>
                          {i.theme.libelle}
                        </td>
                        <td className="py-2 text-gray-600">{formatDate(i.dateVisite)}</td>
                        <td className="py-2 text-gray-600">{formatDate(i.dateLimite)}</td>
                        <td className="py-2"><InspectionBadge status={i.status} /></td>
                        <td className="py-2">
                          {days !== null ? (
                            <span className={`text-xs font-semibold ${late ? 'text-red-600' : soon ? 'text-orange-500' : 'text-gray-400'}`}>
                              {late ? `⚠ ${Math.abs(days)}j` : `J-${days}`}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                  {erpLatest.length === 0 && (
                    <tr><td colSpan={5} className="py-3 text-gray-400 text-center text-xs">Aucune vérification enregistrée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
