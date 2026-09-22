'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Pause, Play, CheckCircle2, Trash2, AlertCircle, Loader2, Settings2 } from 'lucide-react'
import { setPropertyStatus, type ManageableStatus } from '@/app/actions/property'
import { cn, PROPERTY_STATUS } from '@/lib/utils'

interface ManageListingPanelProps {
  propertyId: string
  status: string
  listingType: string
  stats: { views: number; favorites: number; conversations: number }
}

const STATUS_PILL: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-amber-100 text-amber-800',
  PENDING: 'bg-amber-100 text-amber-800',
  SOLD: 'bg-indigo-100 text-indigo-700',
  RENTED: 'bg-indigo-100 text-indigo-700',
}

export default function ManageListingPanel({ propertyId, status, listingType, stats }: ManageListingPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<ManageableStatus | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  const change = (next: ManageableStatus) => {
    setError('')
    setPendingAction(next)
    startTransition(async () => {
      const result = await setPropertyStatus(propertyId, next)
      setPendingAction(null)
      if ('error' in result) {
        setError(result.error ?? 'Não foi possível alterar o anúncio.')
        return
      }
      if (next === 'DELETED') router.push('/perfil#meus-anuncios')
      else router.refresh()
    })
  }

  const isActive = status === 'ACTIVE'
  const isClosed = status === 'SOLD' || status === 'RENTED'
  // "Vendido" para venda, "alugado" para aluguel; quem anuncia os dois vê as duas opções
  const closeOptions: { status: ManageableStatus; label: string }[] = isClosed ? [] : [
    ...(listingType !== 'RENT' ? [{ status: 'SOLD' as const, label: 'Marcar como vendido' }] : []),
    ...(listingType !== 'SALE' ? [{ status: 'RENTED' as const, label: 'Marcar como alugado' }] : []),
  ]

  const spinner = (action: ManageableStatus) =>
    pendingAction === action ? <Loader2 className="w-4 h-4 animate-spin" /> : null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-indigo-500" />
          Gerenciar anúncio
        </h3>
        <span className={cn('px-2.5 py-1 text-xs font-bold rounded-full', STATUS_PILL[status] || 'bg-gray-100 text-gray-600')}>
          {PROPERTY_STATUS[status] || status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'visitas', value: stats.views },
          { label: 'favoritos', value: stats.favorites },
          { label: 'conversas', value: stats.conversations },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-xl py-2.5">
            <div className="font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {error.replace(' em /planos.', '.')}
            {error.includes('/planos') && (
              <> <Link href="/planos" className="font-semibold underline">Ver planos</Link></>
            )}
          </span>
        </div>
      )}

      <div className="space-y-2">
        <Link
          href={`/imoveis/${propertyId}/editar`}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Pencil className="w-4 h-4" /> Editar anúncio e fotos
        </Link>

        {isActive ? (
          <button onClick={() => change('INACTIVE')} disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors">
            {spinner('INACTIVE') ?? <Pause className="w-4 h-4" />} Pausar anúncio
          </button>
        ) : (
          <button onClick={() => change('ACTIVE')} disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors">
            {spinner('ACTIVE') ?? <Play className="w-4 h-4" />} Reativar anúncio
          </button>
        )}

        {closeOptions.map((opt) => (
          <button key={opt.status} onClick={() => change(opt.status)} disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors">
            {spinner(opt.status) ?? <CheckCircle2 className="w-4 h-4" />} {opt.label}
          </button>
        ))}

        {confirmDelete ? (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-2">
            <p className="text-xs text-red-800">
              O anúncio sai do site para todos. As conversas antigas continuam abertas. Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} disabled={isPending}
                className="flex-1 py-2 border border-gray-200 bg-white rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => change('DELETED')} disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-60">
                {spinner('DELETED')} Sim, excluir
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            <Trash2 className="w-4 h-4" /> Excluir anúncio
          </button>
        )}
      </div>
    </div>
  )
}
