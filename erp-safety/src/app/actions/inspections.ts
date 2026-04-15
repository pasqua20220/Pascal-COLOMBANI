'use server'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addMonths, addYears } from 'date-fns'

function computeNextDate(dateVisite: Date, periodicity: string): Date {
  switch (periodicity) {
    case 'ANNUAL': return addYears(dateVisite, 1)
    case 'BIANNUAL': return addYears(dateVisite, 2)
    case 'THREE_YEARS': return addYears(dateVisite, 3)
    case 'FIVE_YEARS': return addYears(dateVisite, 5)
    default: return addYears(dateVisite, 1)
  }
}

export async function createInspectionAction(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== 'TECHNICIEN') {
    return { error: 'Accès refusé.' }
  }

  const erpId = formData.get('erpId') as string
  const themeId = formData.get('themeId') as string
  const dateVisite = new Date(formData.get('dateVisite') as string)
  const status = formData.get('status') as string
  const missionObjet = formData.get('missionObjet') as string
  const observations = formData.get('observations') as string
  const conclusion = formData.get('conclusion') as string
  const recommandations = formData.get('recommandations') as string
  const conformItems = formData.get('conformItems') as string
  const nonConformItems = formData.get('nonConformItems') as string
  const reserveItems = formData.get('reserveItems') as string
  const referenceIds = formData.getAll('referenceIds') as string[]
  const signedBy = formData.get('signedBy') as string

  if (!erpId || !themeId || !dateVisite || !status) {
    return { error: 'Champs obligatoires manquants.' }
  }

  const theme = await prisma.inspectionTheme.findUnique({ where: { id: themeId } })
  if (!theme) return { error: 'Thème introuvable.' }

  const dateProchaine = computeNextDate(dateVisite, theme.periodicity)

  const inspection = await prisma.inspection.create({
    data: {
      erpId,
      themeId,
      technicienId: session.id,
      dateVisite,
      dateProchaine,
      dateLimite: dateProchaine,
      status: status as any,
      missionObjet: missionObjet || null,
      observations: observations || null,
      conclusion: conclusion || null,
      recommandations: recommandations || null,
      conformItems: conformItems || null,
      nonConformItems: nonConformItems || null,
      reserveItems: reserveItems || null,
      signedBy: signedBy || null,
      signedAt: new Date(),
      references: referenceIds.length > 0 ? { connect: referenceIds.map(id => ({ id })) } : undefined,
    }
  })

  // Update previous inspections of same theme+ERP to reflect new inspection
  await prisma.inspection.updateMany({
    where: {
      erpId,
      themeId,
      id: { not: inspection.id },
      status: 'EN_RETARD',
    },
    data: { status: 'A_PLANIFIER' },
  })

  redirect(`/dashboard/technicien/verifications/${inspection.id}`)
}

export async function liftPrescriptionAction(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== 'TECHNICIEN') {
    return { error: 'Accès refusé.' }
  }

  const prescriptionId = formData.get('prescriptionId') as string
  const textAttestation = formData.get('textAttestation') as string
  const travauxRealises = formData.get('travauxRealises') as string
  const signedBy = formData.get('signedBy') as string
  const inspectionId = formData.get('inspectionId') as string || undefined

  if (!prescriptionId || !textAttestation) {
    return { error: 'Texte d\'attestation requis.' }
  }

  await prisma.$transaction(async (tx) => {
    await tx.prescriptionLifting.create({
      data: {
        prescriptionId,
        technicienId: session.id,
        inspectionId: inspectionId || null,
        textAttestation,
        travauxRealises: travauxRealises || null,
        signedAt: new Date(),
      }
    })
    await tx.commissionPrescription.update({
      where: { id: prescriptionId },
      data: { status: 'LEVEE', updatedAt: new Date() }
    })
  })

  redirect('/dashboard/technicien/prescriptions')
}
