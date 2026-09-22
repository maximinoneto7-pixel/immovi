import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import NewPropertyForm from '@/components/imoveis/NewPropertyForm'
import { PROPERTY_STATUS } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Editar anúncio — Immovi' }

export default async function EditarImovelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect(`/login?redirect=/imoveis/${id}/editar`)

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: 'asc' }, select: { url: true, isCover: true } },
      features: { select: { name: true } },
    },
  })
  const canManage = property && (property.ownerId === session.user.id || session.user.role === 'ADMIN')
  if (!property || !canManage || property.status === 'DELETED') notFound()

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link href={`/imoveis/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar para o anúncio
          </Link>
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Editar anúncio</h1>
              <p className="text-gray-500 mt-1">{property.title}</p>
            </div>
            <span className="flex-shrink-0 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
              {PROPERTY_STATUS[property.status] || property.status}
            </span>
          </div>
          <NewPropertyForm
            userId={session.user.id}
            propertyId={id}
            initial={{
              title: property.title,
              description: property.description,
              story: property.story,
              type: property.type,
              listingType: property.listingType,
              price: property.price,
              rentPrice: property.rentPrice,
              area: property.area,
              builtArea: property.builtArea,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              parkingSpaces: property.parkingSpaces,
              furnished: property.furnished,
              acceptsPets: property.acceptsPets,
              condoFee: property.condoFee,
              condoFeeBy: property.condoFeeBy,
              iptu: property.iptu,
              iptuBy: property.iptuBy,
              address: property.address,
              city: property.city,
              state: property.state,
              neighborhood: property.neighborhood,
              zipCode: property.zipCode,
              latitude: property.latitude,
              longitude: property.longitude,
              videoUrl: property.videoUrl,
              features: property.features.map((f) => f.name),
              images: property.images,
            }}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
