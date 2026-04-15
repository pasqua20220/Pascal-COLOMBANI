import { cn, getInspectionStatusLabel, getInspectionStatusColor, getPrescriptionStatusLabel, getPrescriptionStatusColor } from '@/lib/utils'

export function InspectionBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', getInspectionStatusColor(status))}>
      {getInspectionStatusLabel(status)}
    </span>
  )
}

export function PrescriptionBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', getPrescriptionStatusColor(status))}>
      {getPrescriptionStatusLabel(status)}
    </span>
  )
}

export function PriorityBadge({ priorite }: { priorite: string }) {
  const colors: Record<string, string> = {
    URGENTE: 'bg-red-100 text-red-800 border-red-200',
    NORMALE: 'bg-gray-100 text-gray-700 border-gray-200',
    DIFFEREE: 'bg-blue-50 text-blue-700 border-blue-100',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', colors[priorite] ?? colors.NORMALE)}>
      {priorite}
    </span>
  )
}
