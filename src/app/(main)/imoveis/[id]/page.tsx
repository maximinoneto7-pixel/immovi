import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PropertyGallery from '@/components/imoveis/PropertyGallery'
import ContactForm from '@/components/imoveis/ContactForm'
import DocumentVerification from '@/components/imoveis/DocumentVerification'
import CompareToggleButton from '@/components/imoveis/CompareToggleButton'
import CompareBar from '@/components/imoveis/CompareBar'
import { getVideoEmbedUrl } from '@/lib/video'
import {
  Bed, Bath, Car, Maximize2, MapPin, Shield, Star, Phone,
  MessageCircle, Heart, Share2, Calendar, Eye, CheckCircle2,
  Home, BookOpen, Leaf, Users, Video, ExternalLink,
} from 'lucide-react'
import { formatCurrency, formatArea, formatDate, PROPERTY_TYPES, LISTING_TYPES } from '@/lib/utils'

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true, name: true, email: true, image: true, phone: true,
          bio: true, verified: true, createdAt: true,
          _count: { select: { properties: true, reviewsReceived: true } },
        },
      },
      images: { orderBy: { order: 'asc' } },
      features: true,
      documents: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, status: true, extractedOwners: true, extractedArea: true, extractedRegNumber: true, createdAt: true },
      },
      reviews: {
        include: {
          reviewer: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: { select: { favorites: true } },
    },
  })

  if (!property) notFound()

  const isFavorited = session?.user?.id
    ? !!(await prisma.favorite.findUnique({
        where: { userId_propertyId: { userId: session.user.id, propertyId: id } },
      }))
    : false

  const avgRating = property.reviews.length
    ? property.reviews.reduce((a, r) => a + r.rating, 0) / property.reviews.length
    : 0

  const displayPrice =
    property.listingType === 'RENT'
      ? property.rentPrice || property.price
      : property.price

  const BASE_URL = process.env.NEXTAUTH_URL || 'https://immovi.com.br'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: `${BASE_URL}/imoveis/${property.id}`,
    datePosted: property.createdAt.toISOString(),
    image: property.images.map((img) => img.url),
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: property.state,
      postalCode: property.zipCode || undefined,
      addressCountry: 'BR',
    },
    ...(property.latitude != null && property.longitude != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: property.latitude, longitude: property.longitude } }
      : {}),
    offers: {
      '@type': 'Offer',
      price: displayPrice,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/imoveis/${property.id}`,
    },
    floorSize: { '@type': 'QuantitativeValue', value: property.area, unitCode: 'MTK' },
    ...(property.bedrooms != null ? { numberOfRooms: property.bedrooms } : {}),
    ...(property.bathrooms != null ? { numberOfBathroomsTotal: property.bathrooms } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Header user={session?.user as any} />

      <main className="flex-1 pb-16">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-sm text-gray-500 flex items-center gap-2">
            <Link href="/" className="hover:text-gray-700">Início</Link>
            <span>/</span>
            <Link href="/imoveis" className="hover:text-gray-700">Imóveis</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium truncate">{property.title}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gallery */}
              <PropertyGallery images={property.images} title={property.title} />

              {/* Vídeo do imóvel */}
              {property.videoUrl && (() => {
                const embedUrl = getVideoEmbedUrl(property.videoUrl)
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Video className="w-5 h-5 text-indigo-500" />
                      Tour em vídeo
                    </h2>
                    {embedUrl ? (
                      <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                        <iframe
                          src={embedUrl}
                          title={`Vídeo do imóvel — ${property.title}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <a
                        href={property.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-4 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
                      >
                        Assistir vídeo do imóvel <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )
              })()}

              {/* Title + badges */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                    {PROPERTY_TYPES[property.type] || property.type}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    property.listingType === 'SALE' ? 'bg-green-100 text-green-700' :
                    property.listingType === 'RENT' ? 'bg-violet-100 text-violet-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {LISTING_TYPES[property.listingType]}
                  </span>
                  {property.verified && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full">
                      <Shield className="w-3 h-3" /> Verificado
                    </span>
                  )}
                  {property.featured && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                      <Star className="w-3 h-3 fill-current" /> Destaque
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>

                <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <span>
                    {property.neighborhood ? `${property.neighborhood}, ` : ''}
                    {property.address}, {property.city} – {property.state}
                    {property.zipCode ? `, CEP ${property.zipCode}` : ''}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-end gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(displayPrice)}
                    </span>
                    {property.listingType === 'RENT' && <span className="text-gray-500 text-sm">/mês</span>}
                    {property.listingType === 'BOTH' && property.rentPrice && (
                      <div className="text-sm text-green-600 font-medium mt-0.5">
                        ou {formatCurrency(property.rentPrice)}/mês no aluguel
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400 ml-auto">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" /> {property.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" /> {property._count.favorites}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {formatDate(property.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <Maximize2 className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                    <div className="font-semibold text-gray-900">{formatArea(property.area)}</div>
                    <div className="text-xs text-gray-500">Área</div>
                  </div>
                  {property.bedrooms != null && (
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <Bed className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                      <div className="font-semibold text-gray-900">{property.bedrooms}</div>
                      <div className="text-xs text-gray-500">Quartos</div>
                    </div>
                  )}
                  {property.bathrooms != null && (
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <Bath className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                      <div className="font-semibold text-gray-900">{property.bathrooms}</div>
                      <div className="text-xs text-gray-500">Banheiros</div>
                    </div>
                  )}
                  {property.parkingSpaces != null && (
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <Car className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                      <div className="font-semibold text-gray-900">{property.parkingSpaces}</div>
                      <div className="text-xs text-gray-500">Vagas</div>
                    </div>
                  )}
                </div>

                {/* Extra tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {property.furnished && (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mobiliado
                    </span>
                  )}
                  {property.acceptsPets && (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                      <Leaf className="w-3.5 h-3.5" /> Aceita pets
                    </span>
                  )}
                </div>

                {/* Condomínio e IPTU — somente para aluguel */}
                {(property.listingType === 'RENT' || property.listingType === 'BOTH') &&
                 ((property as any).condoFee || (property as any).iptu) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Custos adicionais mensais</p>
                    {(property as any).condoFee > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Condomínio</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((property as any).condoFee)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            (property as any).condoFeeBy === 'LOCADOR' ? 'bg-indigo-100 text-indigo-700' :
                            (property as any).condoFeeBy === 'INCLUSO' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {(property as any).condoFeeBy === 'LOCADOR' ? 'Por conta do locador' :
                             (property as any).condoFeeBy === 'INCLUSO' ? 'Incluso no aluguel' :
                             'Por conta do locatário'}
                          </span>
                        </div>
                      </div>
                    )}
                    {(property as any).iptu > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">IPTU</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((property as any).iptu)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            (property as any).iptuBy === 'LOCADOR' ? 'bg-indigo-100 text-indigo-700' :
                            (property as any).iptuBy === 'INCLUSO' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {(property as any).iptuBy === 'LOCADOR' ? 'Por conta do locador' :
                             (property as any).iptuBy === 'INCLUSO' ? 'Incluso no aluguel' :
                             'Por conta do locatário'}
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Custo total */}
                    {(property as any).condoFee > 0 && (property as any).iptu > 0 && (
                      <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                        <span className="font-semibold text-gray-700">Custo total estimado/mês</span>
                        <span className="font-bold text-indigo-700">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            (property as any).rentPrice + (property as any).condoFee + (property as any).iptu
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Home className="w-5 h-5 text-indigo-500" />
                  Sobre o imóvel
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{property.description}</p>
              </div>

              {/* Story — O diferencial! */}
              {property.story && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    A história deste lugar
                  </h2>
                  <p className="text-gray-700 leading-relaxed italic whitespace-pre-wrap">
                    "{property.story}"
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                    <span>—</span>
                    <span>{property.owner.name}</span>
                    {property.owner.verified && (
                      <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                  </div>
                </div>
              )}

              {/* Features */}
              {property.features.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Características e diferenciais</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {property.features.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {f.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {property.reviews.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500 fill-current" />
                      Avaliações ({property.reviews.length})
                    </h2>
                    <div className="text-2xl font-bold text-gray-900">
                      {avgRating.toFixed(1)}
                      <span className="text-sm font-normal text-gray-400">/5</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {property.reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center gap-3 mb-2">
                          {review.reviewer.image ? (
                            <img src={review.reviewer.image} alt={review.reviewer.name} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-xs font-semibold text-indigo-700">
                                {review.reviewer.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{review.reviewer.name}</div>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Owner card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  Anunciante
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  {property.owner.image ? (
                    <img src={property.owner.image} alt={property.owner.name} className="w-14 h-14 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-700 text-xl font-bold">{property.owner.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">{property.owner.name}</span>
                      {property.owner.verified && (
                        <Shield className="w-4 h-4 text-indigo-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {property.owner._count.properties} anúncio{property.owner._count.properties !== 1 ? 's' : ''}
                      {' · '}
                      Desde {new Date(property.owner.createdAt).getFullYear()}
                    </div>
                  </div>
                </div>

                {property.owner.bio && (
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 italic">"{property.owner.bio}"</p>
                )}

                <Link
                  href={`/perfil/${property.owner.id}`}
                  className="block text-center py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Ver perfil completo
                </Link>
              </div>

              {/* Contact */}
              <ContactForm
                propertyId={property.id}
                ownerId={property.owner.id}
                ownerName={property.owner.name}
                ownerPhone={property.owner.phone}
                isLoggedIn={!!session}
              />

              {/* Actions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex flex-wrap gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                    {isFavorited ? 'Favoritado' : 'Favoritar'}
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Share2 className="w-4 h-4" />
                    Compartilhar
                  </button>
                  <CompareToggleButton propertyId={property.id} />
                </div>
              </div>

              {/* Security badge */}
              <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-indigo-900 mb-1">Negociação segura</div>
                    <p className="text-xs text-indigo-700 leading-relaxed">
                      Mantenha todas as conversas e combinações dentro da plataforma para garantir segurança e ter histórico documentado.
                    </p>
                  </div>
                </div>
              </div>

              {/* Verificação de Documentos — só para o dono */}
              {session?.user?.id === property.ownerId && (
                <DocumentVerification
                  propertyId={property.id}
                  isVerified={property.verified}
                  documents={property.documents as any}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <CompareBar />
      <Footer />
    </>
  )
}
