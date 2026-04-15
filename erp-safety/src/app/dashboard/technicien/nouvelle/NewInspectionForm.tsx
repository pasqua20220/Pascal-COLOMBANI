'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { createInspectionAction } from '@/app/actions/inspections'
import { FileText, CheckSquare, AlertCircle, BookOpen, PenTool } from 'lucide-react'

type ERP = { id: string; nom: string; erpType: string; category: string; ville: string }
type Theme = { id: string; code: string; libelle: string; periodicity: string; references: Ref[] }
type Ref = { id: string; code: string; titre: string; article: string }
type Profile = { organisme?: string | null; agrement?: string | null; signatureUrl?: string | null } | null

export function NewInspectionForm({ erps, themes, technicien, technicienName }: {
  erps: ERP[]; themes: Theme[]; technicien: Profile; technicienName: string
}) {
  const [selectedThemeId, setSelectedThemeId] = useState('')
  const [selectedRefs, setSelectedRefs] = useState<string[]>([])
  const [conformItems, setConformItems] = useState([''])
  const [nonConformItems, setNonConformItems] = useState([''])
  const [reserveItems, setReserveItems] = useState([''])

  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      // Inject lists
      formData.set('conformItems', JSON.stringify(conformItems.filter(Boolean)))
      formData.set('nonConformItems', JSON.stringify(nonConformItems.filter(Boolean)))
      formData.set('reserveItems', JSON.stringify(reserveItems.filter(Boolean)))
      selectedRefs.forEach(id => formData.append('referenceIds', id))
      return await createInspectionAction(formData) ?? null
    },
    null
  )

  const selectedTheme = themes.find(t => t.id === selectedThemeId)

  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => setter(prev => [...prev, ''])
  const updateItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, i: number, v: string) =>
    setter(prev => prev.map((x, idx) => idx === i ? v : x))
  const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, i: number) =>
    setter(prev => prev.filter((_, idx) => idx !== i))

  const toggleRef = (id: string) =>
    setSelectedRefs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <form action={action} className="space-y-6">
      {state?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{state.error}</div>
      )}

      {/* Section 1 : Identification */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          1. Identification de la mission
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ERP *</label>
            <select name="erpId" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Sélectionner un ERP...</option>
              {erps.map(erp => (
                <option key={erp.id} value={erp.id}>{erp.nom} — {erp.ville} (Type {erp.erpType})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thématique de vérification *</label>
            <select
              name="themeId"
              required
              value={selectedThemeId}
              onChange={e => { setSelectedThemeId(e.target.value); setSelectedRefs([]) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner une thématique...</option>
              {themes.map(t => (
                <option key={t.id} value={t.id}>[{t.code}] {t.libelle}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de visite *</label>
            <input type="date" name="dateVisite" required defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Résultat / Statut *</label>
            <select name="status" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Choisir un résultat...</option>
              <option value="CONFORME">Conforme</option>
              <option value="RESERVE">Conforme avec réserve(s)</option>
              <option value="NON_CONFORME">Non conforme</option>
              <option value="EN_COURS">En cours (intervention en plusieurs étapes)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Objet / Champ de la mission *</label>
            <input type="text" name="missionObjet" required
              placeholder="Ex : Vérification périodique annuelle des installations électriques - ERP type O 3ème catégorie"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>
      </section>

      {/* Section 2 : References réglementaires */}
      {selectedTheme && selectedTheme.references.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            2. Références réglementaires applicables
          </h2>
          <p className="text-xs text-gray-500 mb-3">Cochez les articles réglementaires qui s'appliquent à cette vérification.</p>
          <div className="space-y-2">
            {selectedTheme.references.map(ref => (
              <label key={ref.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedRefs.includes(ref.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="checkbox" className="mt-0.5" checked={selectedRefs.includes(ref.id)} onChange={() => toggleRef(ref.id)} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    <span className="font-mono text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded text-xs mr-2">{ref.code}</span>
                    {ref.titre}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Art. {ref.article}</p>
                </div>
              </label>
            ))}
          </div>
        </section>
      )}

      {/* Section 3 : Constatations */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-blue-600" />
          3. Constatations
        </h2>

        <ItemList label="Points conformes" items={conformItems} setter={setConformItems} addItem={addItem} updateItem={updateItem} removeItem={removeItem} color="green" />
        <ItemList label="Réserves" items={reserveItems} setter={setReserveItems} addItem={addItem} updateItem={updateItem} removeItem={removeItem} color="yellow" />
        <ItemList label="Non-conformités" items={nonConformItems} setter={setNonConformItems} addItem={addItem} updateItem={updateItem} removeItem={removeItem} color="red" />

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observations détaillées</label>
          <textarea name="observations" rows={4}
            placeholder="Décrivez vos observations de manière détaillée..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Conclusion *</label>
          <textarea name="conclusion" rows={3} required
            placeholder="Conclusion de la vérification..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Recommandations</label>
          <textarea name="recommandations" rows={3}
            placeholder="Recommandations pour l'exploitant..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
        </div>
      </section>

      {/* Section 4 : Signature */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <PenTool className="w-4 h-4 text-blue-600" />
          4. Identification et signature
        </h2>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Technicien / Organisme</p>
              <p className="font-semibold text-gray-800">{technicienName}</p>
              {technicien?.organisme && <p className="text-gray-600">{technicien.organisme}</p>}
            </div>
            {technicien?.agrement && (
              <div>
                <p className="text-xs text-gray-500">N° Agrément</p>
                <p className="font-semibold text-gray-800">{technicien.agrement}</p>
              </div>
            )}
          </div>
        </div>

        <input type="hidden" name="signedBy"
          value={`${technicienName}${technicien?.organisme ? ` - ${technicien.organisme}` : ''}${technicien?.agrement ? ` (Agr. ${technicien.agrement})` : ''}`} />

        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Attestation du technicien</p>
            <p>En soumettant ce formulaire, j'atteste que les informations renseignées sont exactes et que la vérification a été effectuée conformément aux dispositions réglementaires en vigueur (arrêté du 25 juin 1980 et textes modificatifs).</p>
            <p className="mt-1 text-xs text-blue-600">Horodatage automatique à la validation.</p>
          </div>
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        <a href="/dashboard/technicien" className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          Annuler
        </a>
        <button type="submit" disabled={pending}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-colors">
          {pending ? 'Enregistrement...' : 'Enregistrer la vérification'}
        </button>
      </div>
    </form>
  )
}

function ItemList({ label, items, setter, addItem, updateItem, removeItem, color }: {
  label: string; items: string[]
  setter: React.Dispatch<React.SetStateAction<string[]>>
  addItem: (s: React.Dispatch<React.SetStateAction<string[]>>) => void
  updateItem: (s: React.Dispatch<React.SetStateAction<string[]>>, i: number, v: string) => void
  removeItem: (s: React.Dispatch<React.SetStateAction<string[]>>, i: number) => void
  color: string
}) {
  const colorMap: Record<string, string> = { green: 'text-green-700', yellow: 'text-yellow-700', red: 'text-red-700' }
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <label className={`text-sm font-medium ${colorMap[color] ?? 'text-gray-700'}`}>{label}</label>
        <button type="button" onClick={() => addItem(setter)} className="text-xs text-blue-600 hover:underline">+ Ajouter</button>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={item} onChange={e => updateItem(setter, i, e.target.value)}
              placeholder={`Élément ${i + 1}...`}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            {items.length > 1 && (
              <button type="button" onClick={() => removeItem(setter, i)} className="text-red-400 hover:text-red-600 text-xs px-2">✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
