import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PrintButton from '@/components/contratos/PrintButton'

export default async function ImprimirContratoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const contract = await prisma.contract.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!contract) notFound()

  return (
    <>
      {/* Barra de ações — oculta na impressão */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{contract.title}</p>
          <p className="text-xs text-gray-500">Imprima ou salve como PDF</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/contratos/${id}`}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            ← Voltar
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Conteúdo imprimível */}
      <div className="print:mt-0 mt-16 bg-white min-h-screen">
        <div
          dangerouslySetInnerHTML={{ __html: contract.content }}
        />
      </div>

      {/* Estilos de impressão */}
      <style>{`
        @media print {
          body { margin: 0; }
          @page { margin: 20mm; size: A4; }
        }
      `}</style>
    </>
  )
}
