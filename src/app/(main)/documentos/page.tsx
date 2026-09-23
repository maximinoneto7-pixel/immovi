import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import DocumentVerification from '@/components/imoveis/DocumentVerification'
import { getActiveProvider, PROVIDER_INFO } from '@/lib/document-ai'
import {
  Shield, Home, CheckCircle2, Clock, AlertTriangle,
  PlusCircle, Info, Sparkles, ExternalLink,
} from 'lucide-react'
import { PROPERTY_TYPES } from '@/lib/utils'

export default async function DocumentosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?redirect=/documentos')

  const properties = await prisma.property.findMany({
    where: { ownerId: session.user.id, status: { not: 'DELETED' } },
    orderBy: { createdAt: 'desc' },
    include: {
      images: { take: 1, orderBy: { order: 'asc' } },
      documents: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true, status: true, extractedOwners: true,
          extractedArea: true, extractedRegNumber: true, createdAt: true,
        },
      },
    },
  })

  const verified = properties.filter((p) => p.verified).length
  const pending = properties.filter((p) => !p.verified).length

  const activeProvider = getActiveProvider()
  const providerInfo = activeProvider !== 'none' ? PROVIDER_INFO[activeProvider] : null

  const STATUS = {
    VERIFIED:   { label: 'Verificado', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
    MISMATCH:   { label: 'Não confirmado', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    PROCESSING: { label: 'Processando', icon: Clock, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    PENDING:    { label: 'Pendente', icon: Clock, color: 'text-gray-500 bg-gray-50 border-gray-200' },
  }

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-16">
        {/* Hero */}
        <section className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white py-10">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold">Verificação de Documentos</h1>
            </div>
            <p className="text-indigo-100 max-w-2xl">
              Envie a matrícula ou outro documento do imóvel. Nossa IA lê o documento, identifica os proprietários e coloca o badge <strong>"Verificado"</strong> no seu anúncio — aumentando a confiança e os contatos em até 4x.
            </p>

            {/* Estatísticas */}
            <div className="flex gap-6 mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{properties.length}</div>
                <div className="text-indigo-200 text-sm">Imóveis</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <div className="text-3xl font-bold text-green-300">{verified}</div>
                <div className="text-indigo-200 text-sm">Verificados</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-300">{pending}</div>
                <div className="text-indigo-200 text-sm">Pendentes</div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

          {/* Status do provedor de IA */}
          {providerInfo ? (
            <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
              activeProvider === 'gemini' ? 'bg-indigo-50 border-indigo-200' : 'bg-violet-50 border-violet-200'
            }`}>
              <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 ${activeProvider === 'gemini' ? 'text-indigo-600' : 'text-violet-600'}`} />
              <div className="flex-1">
                <div className={`font-semibold text-sm ${activeProvider === 'gemini' ? 'text-indigo-900' : 'text-violet-900'}`}>
                  IA ativa: {providerInfo.name}
                  <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                    activeProvider === 'gemini' ? 'bg-green-100 text-green-700' : 'bg-violet-100 text-violet-700'
                  }`}>{providerInfo.tier}</span>
                </div>
                <p className={`text-xs mt-0.5 ${activeProvider === 'gemini' ? 'text-indigo-700' : 'text-violet-700'}`}>
                  {providerInfo.limits.notes}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-900 text-sm">Verificação por IA não configurada</div>
                <p className="text-xs text-amber-700 mt-0.5">
                  Configure uma chave de API gratuita do Google Gemini para ativar.{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                    className="underline font-medium">
                    Obter chave gratuita →
                  </a>
                </p>
                <Link href="/admin/sistema" className="mt-2 inline-flex items-center gap-1 text-xs text-amber-800 font-medium hover:underline">
                  Ver painel de configuração <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Nenhum imóvel */}
          {properties.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700 mb-2">Você ainda não tem imóveis anunciados</h3>
              <p className="text-sm text-gray-400 mb-5">
                Cadastre seu imóvel para poder enviar os documentos de verificação.
              </p>
              <Link href="/imoveis/novo"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                <PlusCircle className="w-4 h-4" />
                Anunciar primeiro imóvel
              </Link>
            </div>
          )}

          {/* Lista de imóveis com uploader */}
          {properties.map((property) => {
            const latestDoc = property.documents[0]
            const docStatus = latestDoc ? STATUS[latestDoc.status as keyof typeof STATUS] || STATUS.PENDING : null
            const StatusIcon = docStatus?.icon

            return (
              <div key={property.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Cabeçalho do imóvel */}
                <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100">
                  {/* Thumb */}
                  {property.images[0] ? (
                    <img
                      src={property.images[0].url}
                      alt={property.title}
                      className="w-16 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Home className="w-6 h-6 text-gray-300" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <Link href={`/imoveis/${property.id}`}
                      className="font-bold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1">
                      {property.title}
                    </Link>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {PROPERTY_TYPES[property.type] || property.type} • {property.city}, {property.state}
                    </div>
                  </div>

                  {/* Badge de status */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    {property.verified ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        <Shield className="w-3.5 h-3.5" />
                        VERIFICADO
                      </span>
                    ) : docStatus ? (
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${docStatus.color}`}>
                        {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                        {docStatus.label}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium border border-gray-200">
                        <Clock className="w-3.5 h-3.5" />
                        Sem documentos
                      </span>
                    )}

                    {latestDoc?.extractedOwners && (
                      <div className="text-xs text-gray-400 truncate max-w-[180px]">
                        {latestDoc.extractedOwners}
                      </div>
                    )}
                  </div>
                </div>

                {/* Componente de verificação */}
                <div className="p-4">
                  <DocumentVerification
                    propertyId={property.id}
                    isVerified={property.verified}
                    documents={property.documents as any}
                  />
                </div>
              </div>
            )
          })}

          {/* Documentos aceitos */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" />
              Documentos aceitos para verificação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Certidão de Matrícula', desc: 'Emitida pelo Cartório de Registro de Imóveis. Documento principal.', ideal: true },
                { title: 'Escritura Pública', desc: 'Escritura de compra e venda ou doação lavrada em cartório.' },
                { title: 'IPTU com nome do proprietário', desc: 'Carnê ou certidão do IPTU mostrando o nome do titular.' },
                { title: 'Contrato de Compra e Venda', desc: 'Contrato registrado ou com reconhecimento de firma.' },
                { title: 'Declaração de Domínio', desc: 'Em casos de imóveis rurais ou em inventário.' },
                { title: 'Escritura de Herança / Inventário', desc: 'Formal de partilha ou carta de adjudicação.' },
              ].map((doc) => (
                <div key={doc.title} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      {doc.title}
                      {doc.ideal && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded">Ideal</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{doc.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-xs text-indigo-700">
              <strong>Formatos aceitos:</strong> PDF, JPG, PNG, WebP • <strong>Tamanho máximo:</strong> 10 MB •
              <strong> Dica:</strong> documentos escaneados em boa resolução têm melhor precisão na leitura pela IA.
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
