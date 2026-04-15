import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NewInspectionForm } from './NewInspectionForm'

export default async function NouvelleVerificationPage() {
  const session = await getSession()
  if (!session || session.role !== 'TECHNICIEN') redirect('/login')

  const profile = await prisma.technicienProfile.findUnique({ where: { userId: session.id } })

  // Load ERPs the technician can work on (all active for now; in production filter by assignment)
  const erps = await prisma.eRP.findMany({
    where: { isActive: true },
    orderBy: { nom: 'asc' },
    select: { id: true, nom: true, erpType: true, category: true, ville: true },
  })

  const themes = await prisma.inspectionTheme.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
    include: { references: true },
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Nouvelle vérification technique</h1>
      <p className="text-gray-500 text-sm mb-6">
        Renseignez le résultat de votre mission de vérification. Tous les champs marqués * sont obligatoires.
      </p>
      <NewInspectionForm
        erps={erps}
        themes={themes}
        technicien={profile}
        technicienName={session.name}
      />
    </div>
  )
}
