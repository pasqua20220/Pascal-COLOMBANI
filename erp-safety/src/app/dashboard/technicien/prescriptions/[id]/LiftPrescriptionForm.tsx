'use client'

import { useActionState } from 'react'
import { liftPrescriptionAction } from '@/app/actions/inspections'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PenTool, AlertCircle } from 'lucide-react'

type Profile = { organisme?: string | null; agrement?: string | null } | null
type Inspection = { id: string; theme: { code: string; libelle: string }; dateVisite: Date }

export function LiftPrescriptionForm({ prescriptionId, technicienName, technicien, inspections }: {
  prescriptionId: string
  technicienName: string
  technicien: Profile
  inspections: Inspection[]
}) {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await liftPrescriptionAction(formData) ?? null
    },
    null
  )

  const now = format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })

  return (
    <form action={action} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <PenTool className="w-4 h-4 text-blue-600" />
        Attestation de levée de prescription
      </h2>

      {state?.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{state.error}</div>
      )}

      <input type="hidden" name="prescriptionId" value={prescriptionId} />
      <input type="hidden" name="signedBy"
        value={`${technicienName}${technicien?.organisme ? ` - ${technicien.organisme}` : ''}${technicien?.agrement ? ` (Agr. ${technicien.agrement})` : ''}`} />

      <div className="space-y-4">
        {/* Link to inspection */}
        {inspections.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lier à une vérification (optionnel)</label>
            <select name="inspectionId" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">— Aucune vérification liée —</option>
              {inspections.map(i => (
                <option key={i.id} value={i.id}>
                  [{i.theme.code}] {i.theme.libelle} — {format(new Date(i.dateVisite), 'dd/MM/yyyy')}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Travaux / actions réalisés</label>
          <textarea name="travauxRealises" rows={3}
            placeholder="Décrivez les travaux ou actions réalisés pour répondre à la prescription..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Texte d'attestation de levée *</label>
          <textarea name="textAttestation" rows={5} required
            placeholder="Je soussigné(e) [NOM Prénom], technicien compétent / organisme agréé, atteste que la prescription n° [...] a été levée suite aux travaux/actions suivants...&#10;&#10;Les éléments vérifiés sont désormais conformes aux exigences réglementaires."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {/* Signature block */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Identification du signataire</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">{technicienName}</p>
              {technicien?.organisme && <p className="text-xs text-gray-600">{technicien.organisme}</p>}
              {technicien?.agrement && <p className="text-xs text-gray-500">Agrément n° {technicien.agrement}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Horodaté le</p>
              <p className="text-sm font-mono font-medium text-gray-700">{now}</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            En validant, vous attestez sous votre responsabilité professionnelle que cette prescription a été levée. L'attestation sera horodatée et ne pourra pas être modifiée après validation.
          </p>
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-5">
        <a href="/dashboard/technicien/prescriptions" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
          Annuler
        </a>
        <button type="submit" disabled={pending}
          className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-semibold transition-colors">
          {pending ? 'Validation...' : 'Valider l\'attestation de levée'}
        </button>
      </div>
    </form>
  )
}
