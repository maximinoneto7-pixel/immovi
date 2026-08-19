'use client'

import { useState, useRef } from 'react'
import {
  Shield, Upload, CheckCircle2, XCircle, AlertTriangle,
  FileText, Loader2, Eye, ChevronDown, ChevronUp, X,
  Users, Home, Hash, Ruler, AlertCircle, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerificationResult {
  verified: boolean
  analysis: {
    owners: string[]
    registrationNumber: string
    area: string
    address: string
    documentType: string
    liens: string[]
    confidence: 'alta' | 'media' | 'baixa'
    ownerMatch: boolean
    ownerMatchDetails: string
    observations: string
    rawSummary: string
    isValid: boolean
  }
}

interface DocumentVerificationProps {
  propertyId: string
  isVerified: boolean
  documents?: {
    id: string
    status: string
    extractedOwners: string | null
    extractedArea: string | null
    extractedRegNumber: string | null
    createdAt: Date
  }[]
}

export default function DocumentVerification({
  propertyId,
  isVerified,
  documents = [],
}: DocumentVerificationProps) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const latestDoc = documents[0]

  const handleFile = async (file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Formato não suportado. Use PDF, JPG, PNG ou WebP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 10MB.')
      return
    }
    setSelectedFile(file)
    setError('')
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('propertyId', propertyId)

      const res = await fetch('/api/verificar-documento', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao verificar documento.')
      } else {
        setResult(data)
        setSelectedFile(null)
        setShowDetails(true)
      }
    } catch {
      setError('Falha na conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const confidenceColor = {
    alta: 'text-green-600 bg-green-50',
    media: 'text-amber-600 bg-amber-50',
    baixa: 'text-red-600 bg-red-50',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Shield className={cn('w-5 h-5', isVerified ? 'text-green-500' : 'text-gray-400')} />
          Verificação de Documentos
        </h3>
        {isVerified && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            IMÓVEL VERIFICADO
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Explicação */}
        <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
          <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-indigo-900">Verificação por Inteligência Artificial</p>
            <p className="text-xs text-indigo-700 mt-0.5">
              Nossa IA lê a matrícula do imóvel, identifica os proprietários automaticamente
              e verifica se você é o legítimo proprietário. Imóveis verificados recebem badge
              de confiança e aparecem em destaque.
            </p>
          </div>
        </div>

        {/* Histórico de documentos */}
        {latestDoc && !result && (
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-xl border',
            latestDoc.status === 'VERIFIED' ? 'bg-green-50 border-green-200' :
            latestDoc.status === 'MISMATCH' ? 'bg-red-50 border-red-200' :
            'bg-gray-50 border-gray-200'
          )}>
            <FileText className={cn(
              'w-5 h-5 flex-shrink-0',
              latestDoc.status === 'VERIFIED' ? 'text-green-600' :
              latestDoc.status === 'MISMATCH' ? 'text-red-500' : 'text-gray-500'
            )} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900">
                {latestDoc.status === 'VERIFIED' ? '✓ Documento verificado' :
                 latestDoc.status === 'MISMATCH' ? '✗ Proprietário não confirmado' :
                 'Documento em análise'}
              </div>
              {latestDoc.extractedOwners && (
                <div className="text-xs text-gray-500 mt-0.5">
                  Proprietário(s): {latestDoc.extractedOwners}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resultado da análise */}
        {result && (
          <div className={cn(
            'rounded-xl border overflow-hidden',
            result.verified ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
          )}>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                {result.verified ? (
                  <><CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-800">Documento verificado com sucesso!</span></>
                ) : (
                  <><AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-amber-800">Proprietário não confirmado</span></>
                )}
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs font-medium text-gray-600 hover:text-gray-800 flex items-center gap-1"
              >
                {showDetails ? <><ChevronUp className="w-3.5 h-3.5" />Ocultar</> : <><ChevronDown className="w-3.5 h-3.5" />Ver detalhes</>}
              </button>
            </div>

            {/* Resumo da IA */}
            {result.analysis.rawSummary && (
              <div className="px-4 pb-3">
                <p className="text-sm text-gray-700 italic">"{result.analysis.rawSummary}"</p>
              </div>
            )}

            {/* Detalhes expandíveis */}
            {showDetails && (
              <div className="border-t border-gray-200 bg-white p-4 space-y-3">
                {/* Confiança da leitura */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Confiança da leitura</span>
                  <span className={cn('px-2 py-0.5 rounded-full font-semibold capitalize', confidenceColor[result.analysis.confidence])}>
                    {result.analysis.confidence}
                  </span>
                </div>

                {/* Tipo de documento */}
                {result.analysis.documentType && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Documento</div>
                      <div className="text-sm font-medium text-gray-800">{result.analysis.documentType}</div>
                    </div>
                  </div>
                )}

                {/* Proprietários */}
                {result.analysis.owners.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Proprietário(s) identificado(s)</div>
                      {result.analysis.owners.map((owner, i) => (
                        <div key={i} className="text-sm font-medium text-gray-800">{owner}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matrícula */}
                {result.analysis.registrationNumber && (
                  <div className="flex items-start gap-2">
                    <Hash className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Matrícula / Inscrição</div>
                      <div className="text-sm font-medium text-gray-800">{result.analysis.registrationNumber}</div>
                    </div>
                  </div>
                )}

                {/* Área */}
                {result.analysis.area && (
                  <div className="flex items-start gap-2">
                    <Ruler className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Área</div>
                      <div className="text-sm font-medium text-gray-800">{result.analysis.area}</div>
                    </div>
                  </div>
                )}

                {/* Endereço */}
                {result.analysis.address && (
                  <div className="flex items-start gap-2">
                    <Home className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Endereço no documento</div>
                      <div className="text-sm font-medium text-gray-800">{result.analysis.address}</div>
                    </div>
                  </div>
                )}

                {/* Ônus */}
                {result.analysis.liens.length > 0 && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-amber-600 font-semibold">Ônus / Gravames encontrados</div>
                      {result.analysis.liens.map((lien, i) => (
                        <div key={i} className="text-sm text-amber-700">{lien}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Match do proprietário */}
                <div className={cn(
                  'p-3 rounded-lg border text-sm',
                  result.analysis.ownerMatch ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                )}>
                  <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                    {result.analysis.ownerMatch
                      ? <><CheckCircle2 className="w-4 h-4" /> Proprietário confirmado</>
                      : <><XCircle className="w-4 h-4" /> Proprietário não confirmado</>
                    }
                  </div>
                  <p className="text-xs">{result.analysis.ownerMatchDetails}</p>
                </div>

                {/* Observações */}
                {result.analysis.observations && (
                  <div className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                    <span className="font-medium">Obs.: </span>{result.analysis.observations}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Área de upload */}
        {!result || !result.verified ? (
          <>
            {/* Drag & Drop */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50',
                loading && 'pointer-events-none opacity-60'
              )}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />

              {loading ? (
                <div className="space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-gray-700">Analisando com IA...</p>
                  <p className="text-xs text-gray-400">A Claude está lendo o documento e identificando os proprietários</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {['Lendo documento...', 'Identificando proprietários...', 'Verificando dados...'].map((step, i) => (
                      <span key={i} className="text-xs text-indigo-600 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                        {step}
                      </span>
                    ))}
                  </div>
                </div>
              ) : selectedFile ? (
                <div className="space-y-2">
                  <FileText className="w-8 h-8 text-indigo-500 mx-auto" />
                  <p className="text-sm font-semibold text-gray-800">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto"
                  >
                    <X className="w-3 h-3" /> Remover
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-sm font-semibold text-gray-600">
                    Arraste ou clique para enviar a matrícula
                  </p>
                  <p className="text-xs text-gray-400">PDF, JPG, PNG ou WebP • Máx. 10MB</p>
                </div>
              )}
            </div>

            {/* Documentos aceitos */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              {[
                'Certidão de Matrícula',
                'Escritura Pública',
                'IPTU com nome',
                'Contrato de Compra e Venda',
              ].map((doc) => (
                <div key={doc} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  {doc}
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {selectedFile && !loading && (
              <button
                onClick={handleUpload}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Analisar com IA
              </button>
            )}

            <p className="text-center text-xs text-gray-400">
              Seus documentos são processados com segurança e não são armazenados permanentemente
            </p>
          </>
        ) : (
          <div className="text-center py-3">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-800">Imóvel verificado com sucesso!</p>
            <p className="text-xs text-gray-500 mt-1">O badge de verificado já está visível no seu anúncio.</p>
          </div>
        )}
      </div>
    </div>
  )
}
