import { format, differenceInDays, isPast, isWithinInterval, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  return format(new Date(date), "dd/MM/yyyy 'à' HH:mm", { locale: fr })
}

export function getInspectionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    CONFORME: 'bg-green-100 text-green-800 border-green-200',
    NON_CONFORME: 'bg-red-100 text-red-800 border-red-200',
    RESERVE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    EN_COURS: 'bg-blue-100 text-blue-800 border-blue-200',
    A_PLANIFIER: 'bg-gray-100 text-gray-700 border-gray-200',
    EN_RETARD: 'bg-red-200 text-red-900 border-red-300',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
}

export function getInspectionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    CONFORME: 'Conforme',
    NON_CONFORME: 'Non conforme',
    RESERVE: 'Avec réserve(s)',
    EN_COURS: 'En cours',
    A_PLANIFIER: 'À planifier',
    EN_RETARD: 'En retard',
  }
  return labels[status] ?? status
}

export function getPrescriptionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OUVERTE: 'bg-red-100 text-red-800 border-red-200',
    EN_COURS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    LEVEE: 'bg-green-100 text-green-800 border-green-200',
    REJETEE: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
}

export function getPrescriptionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OUVERTE: 'Ouverte',
    EN_COURS: 'En cours de levée',
    LEVEE: 'Levée',
    REJETEE: 'Rejetée',
  }
  return labels[status] ?? status
}

export function getDaysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null
  return differenceInDays(new Date(date), new Date())
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false
  return isPast(new Date(date))
}

export function isDueSoon(date: Date | string | null | undefined, days = 30): boolean {
  if (!date) return false
  const d = new Date(date)
  return isWithinInterval(d, { start: new Date(), end: addDays(new Date(), days) })
}

export function getERPTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    J: 'Type J - Personnes âgées / handicapées',
    L: 'Type L - Salles d\'auditions / conférences',
    M: 'Type M - Magasins / centres commerciaux',
    N: 'Type N - Restaurants / débits de boissons',
    O: 'Type O - Hôtels / pensions de famille',
    P: 'Type P - Salles de danse / jeux',
    R: 'Type R - Établissements d\'enseignement',
    S: 'Type S - Bibliothèques',
    T: 'Type T - Salles d\'expositions',
    U: 'Type U - Établissements sanitaires',
    V: 'Type V - Établissements de culte',
    W: 'Type W - Administration / bureaux',
    X: 'Type X - Établissements sportifs couverts',
    Y: 'Type Y - Musées',
    PA: 'Type PA - Plein air',
    CTS: 'Type CTS - Chapiteaux / tentes',
    SG: 'Type SG - Structures gonflables',
    PS: 'Type PS - Parcs de stationnement',
    OA: 'Type OA - Hôtels-restaurants d\'altitude',
    GA: 'Type GA - Gares',
    EF: 'Type EF - Établissements flottants',
    REF: 'Type REF - Refuges de montagne',
  }
  return labels[type] ?? type
}

export function getERPCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    CAT1: '1ère catégorie (> 1500 personnes)',
    CAT2: '2ème catégorie (701 à 1500 personnes)',
    CAT3: '3ème catégorie (301 à 700 personnes)',
    CAT4: '4ème catégorie (jusqu\'à 300 personnes)',
    CAT5: '5ème catégorie (sous le seuil)',
  }
  return labels[cat] ?? cat
}

export function getPeriodicityLabel(p: string): string {
  const labels: Record<string, string> = {
    ANNUAL: 'Annuelle',
    BIANNUAL: 'Bi-annuelle',
    THREE_YEARS: 'Triennale',
    FIVE_YEARS: 'Quinquennale',
    ON_DEMAND: 'Sur demande',
  }
  return labels[p] ?? p
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
