'use client'

import { useState, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createPropertyAndReturn, updateProperty } from '@/app/actions/property'
import { PROPERTY_TYPES, STATES, M2_PER_HECTARE, formatAlqueires, isRural } from '@/lib/utils'
import { typeFields, RURAL_IMPROVEMENTS } from '@/lib/property-fields'
import {
  AlertCircle, Info, Upload, X,
  Shield, CheckCircle2, Loader2, FileText,
  Sparkles, AlertTriangle, BadgeCheck, Video,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import PhotoUpload, { type UploadedPhoto } from '@/components/common/PhotoUpload'
import LocationPicker, { type LocationPickerHandle } from '@/components/imoveis/LocationPicker'

const PRESET_FEATURES = [
  'Piscina', 'Churrasqueira', 'Portaria 24h', 'Portão eletrônico', 'Cerca elétrica',
  'Alarme', 'Câmeras de segurança', 'Área de lazer', 'Salão de festas', 'Academia',
  'Playground', 'Quadra poliesportiva', 'Elevador', 'Varanda', 'Sacada gourmet',
  'Ar condicionado', 'Armários planejados', 'Closet', 'Lareira', 'Jardim',
  'Quintal', 'Garagem coberta', 'Interfone', 'Gerador', 'Poço artesiano',
  'Energia solar', 'Internet fibra', 'Vista para o mar', 'Vista panorâmica',
  'Próximo ao comércio',
]

/** Dados de um anúncio existente, para abrir o formulário em modo de edição */
export interface EditableProperty {
  title: string; description: string; story: string | null
  type: string; listingType: string; price: number; rentPrice: number | null
  area: number; builtArea: number | null
  bedrooms: number | null; bathrooms: number | null; parkingSpaces: number | null
  furnished: boolean; acceptsPets: boolean
  condoFee: number | null; condoFeeBy: string | null; iptu: number | null; iptuBy: string | null
  address: string; city: string; state: string; neighborhood: string | null; zipCode: string | null
  latitude: number | null; longitude: number | null
  videoUrl: string | null
  features: string[]
  images: { url: string; isCover: boolean }[]
}

interface NewPropertyFormProps {
  userId: string
  /** Com propertyId + initial o formulário edita o anúncio em vez de publicar um novo */
  propertyId?: string
  initial?: EditableProperty
}

export default function NewPropertyForm({ userId, propertyId, initial }: NewPropertyFormProps) {
  const router = useRouter()
  const editing = !!propertyId && !!initial
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [listingType, setListingType] = useState(initial?.listingType ?? 'SALE')

  // Os campos de medida e cômodos mudam conforme o tipo (lib/property-fields)
  const [propertyType, setPropertyType] = useState(initial?.type ?? 'HOUSE')
  const [areaValue, setAreaValue] = useState(
    initial ? String(isRural(initial.type) ? initial.area / M2_PER_HECTARE : initial.area) : ''
  )
  const fields = typeFields(propertyType)
  const rural = isRural(propertyType)
  const areaHectares = parseFloat(areaValue.replace(',', '.'))

  const changeType = (next: string) => {
    // Rural ↔ urbano muda a unidade da área e a lista de características
    if (isRural(next) !== rural) {
      setAreaValue('')
      setSelectedFeatures([])
    }
    setPropertyType(next)
  }

  // Fotos com upload real
  const [photos, setPhotos] = useState<UploadedPhoto[]>(() => {
    const list = (initial?.images ?? []).map((img) => ({
      url: img.url, filename: img.url.split('/').pop() || img.url, isCover: img.isCover,
    }))
    if (list.length && !list.some((p) => p.isCover)) list[0].isCover = true
    return list
  })
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? '')

  // Localização no mapa
  const addressInputRef = useRef<HTMLInputElement>(null)
  const cityInputRef = useRef<HTMLInputElement>(null)
  const stateSelectRef = useRef<HTMLSelectElement>(null)
  const locationPickerRef = useRef<LocationPickerHandle>(null)
  const initialCoords = initial?.latitude != null && initial?.longitude != null
    ? { lat: initial.latitude, lng: initial.longitude }
    : null
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(initialCoords)

  // Características
  // Na edição, o que está na lista do tipo vira seleção e o resto volta para "Outros"
  const initialPresets = initial && isRural(initial.type) ? RURAL_IMPROVEMENTS : PRESET_FEATURES
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    initial?.features.filter((f) => initialPresets.includes(f)) ?? []
  )
  const [customFeatures, setCustomFeatures] = useState(
    initial?.features.filter((f) => !initialPresets.includes(f)).join('\n') ?? ''
  )

  // Estado do documento
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docDragging, setDocDragging] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [docResult, setDocResult] = useState<{
    verified: boolean
    analysis?: { owners: string[]; confidence: string; ownerMatch: boolean }
  } | null>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  const handleDocFile = (file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { setError('Documento: use PDF, JPG, PNG ou WebP.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Documento muito grande. Máximo 10MB.'); return }
    setDocFile(file)
    setDocResult(null)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)

    // Adiciona as fotos já enviadas
    const uploadedPhotos = photos.filter(p => p.url)
    uploadedPhotos.forEach(p => formData.append('imageUrls', p.url))

    // Marca a capa
    const coverIndex = uploadedPhotos.findIndex(p => p.isCover)
    if (coverIndex >= 0) formData.set('coverIndex', String(coverIndex))

    // Vídeo
    if (videoUrl) formData.set('videoUrl', videoUrl)

    // Características ou benfeitorias (selecionadas na lista do tipo + descritas em "Outros")
    const customList = customFeatures.split('\n').map((f) => f.trim()).filter(Boolean)
    const presetList = rural ? RURAL_IMPROVEMENTS : PRESET_FEATURES
    formData.set('features', [...selectedFeatures.filter((f) => presetList.includes(f)), ...customList].join('\n'))

    // Localização marcada no mapa (fallback: geocodificação automática no servidor)
    if (coords) {
      formData.set('latitude', String(coords.lat))
      formData.set('longitude', String(coords.lng))
    }

    startTransition(async () => {
      // Edição: salva e volta para o anúncio
      if (editing) {
        const updated = await updateProperty(propertyId!, formData)
        if (!updated || 'error' in updated) {
          setError(updated?.error || 'Erro ao salvar as alterações.')
          return
        }
        router.push(`/imoveis/${propertyId}`)
        router.refresh()
        return
      }

      // 1. Cria o imóvel
      const result = await createPropertyAndReturn(formData)

      if (!result || 'error' in result) {
        setError(result?.error || 'Erro ao publicar anúncio.')
        return
      }

      const newId = result.propertyId

      // 2. Se tiver documento, envia para verificação por IA
      if (docFile && !docResult) {
        setDocUploading(true)
        try {
          const docForm = new FormData()
          docForm.append('file', docFile)
          docForm.append('propertyId', newId)

          const res = await fetch('/api/verificar-documento', {
            method: 'POST',
            body: docForm,
          })
          const data = await res.json()

          if (res.ok) {
            setDocResult({ verified: data.verified, analysis: data.analysis })
            // Aguarda um momento para o usuário ver o resultado antes de redirecionar
            await new Promise((r) => setTimeout(r, 2000))
          }
        } finally {
          setDocUploading(false)
        }
      }

      // 3. Redireciona para o imóvel criado
      router.push(`/imoveis/${newId}`)
    })
  }

  const isSubmitting = isPending || docUploading

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Overlay de progresso ao publicar */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
            <div>
              <div className="font-bold text-gray-900 text-lg">
                {docUploading ? 'Verificando documentos...' : editing ? 'Salvando alterações...' : 'Publicando anúncio...'}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {docUploading
                  ? 'A IA está lendo o documento e identificando os proprietários'
                  : editing ? 'Atualizando seu anúncio' : 'Criando seu anúncio na plataforma'}
              </p>
            </div>
            {docResult && (
              <div className={cn('p-3 rounded-xl text-sm font-medium',
                docResult.verified ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800')}>
                {docResult.verified
                  ? '✓ Documento verificado! Badge aplicado.'
                  : '⚠ Proprietário não confirmado. Você pode reenviar depois.'}
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── SEÇÃO 1: Básico ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">
            1. Informações básicas
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título do anúncio *</label>
            <input type="text" name="title" required defaultValue={initial?.title}
              placeholder="Ex: Casa ampla com quintal no centro de Campinas"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de imóvel *</label>
              <select name="type" required value={propertyType} onChange={(e) => changeType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {Object.entries(PROPERTY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Finalidade *</label>
              <select name="listingType" required value={listingType} onChange={(e) => setListingType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="SALE">Venda</option>
                <option value="RENT">Aluguel</option>
                <option value="BOTH">Venda e Aluguel</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {listingType === 'RENT' ? 'Valor do aluguel (R$) *' : 'Preço de venda (R$) *'}
              </label>
              <input type="number" name="price" required min={0} step="any" placeholder="Ex: 450000" defaultValue={initial?.price}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {listingType === 'BOTH' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor do aluguel (R$)</label>
                <input type="number" name="rentPrice" min={0} placeholder="Ex: 2500" defaultValue={initial?.rentPrice ?? undefined}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            )}
          </div>

          <div className={cn('grid grid-cols-1 gap-4', fields.builtArea && 'sm:grid-cols-2')}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{fields.areaLabel} *</label>
              <input type="number" name="area" required min={rural ? 0.01 : 1} step="any"
                value={areaValue} onChange={(e) => setAreaValue(e.target.value)}
                placeholder={rural ? 'Ex: 48,4' : 'Ex: 120'}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {rural && areaHectares > 0 && (
                <p className="text-xs text-indigo-700 font-medium mt-1.5">
                  = {(areaHectares * M2_PER_HECTARE).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m²
                  {' · '}≈ {formatAlqueires(areaHectares * M2_PER_HECTARE)}
                </p>
              )}
            </div>
            {fields.builtArea && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Área construída (m²){fields.builtArea === 'required' && ' *'}
                </label>
                <input type="number" name="builtArea" required={fields.builtArea === 'required'} min={1} step="any"
                  placeholder="Ex: 180" defaultValue={initial?.builtArea ?? undefined}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            )}
          </div>

          {rural && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
              Quartos e banheiros da casa sede podem ser descritos nas benfeitorias, na seção 3.
            </p>
          )}

          {(fields.bedrooms || fields.bathroomsAndParking) && (
            <div className={cn('grid gap-4', fields.bedrooms && fields.bathroomsAndParking ? 'grid-cols-3' : 'grid-cols-2')}>
              {[
                fields.bedrooms && { label: 'Quartos', name: 'bedrooms', max: 7 },
                fields.bathroomsAndParking && { label: 'Banheiros', name: 'bathrooms', max: 5 },
                fields.bathroomsAndParking && { label: 'Vagas', name: 'parkingSpaces', max: 5 },
              ].filter((f): f is { label: string; name: string; max: number } => !!f).map(({ label, name, max }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <select name={name} defaultValue={initial?.[name as 'bedrooms' | 'bathrooms' | 'parkingSpaces'] ?? ''} className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="">-</option>
                    {Array.from({ length: max }, (_, i) => i + (name === 'parkingSpaces' ? 0 : 1)).map((n) => (
                      <option key={n} value={n}>{n === max ? `${n}+` : n}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {fields.furnishedAndPets && (
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="furnished" value="true" defaultChecked={initial?.furnished} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm text-gray-700">Mobiliado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="acceptsPets" value="true" defaultChecked={initial?.acceptsPets} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm text-gray-700">Aceita pets</span>
              </label>
            </div>
          )}

          {/* Condomínio e IPTU — apenas para aluguel */}
          {(listingType === 'RENT' || listingType === 'BOTH') && (
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">Aluguel</span>
                Custos adicionais mensais
              </p>

              {/* Condomínio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Condomínio (R$/mês)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">R$</span>
                    <input type="number" name="condoFee" min={0} step="any" placeholder="0,00" defaultValue={initial?.condoFee ?? undefined}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Condomínio por conta do
                  </label>
                  <select name="condoFeeBy" defaultValue={initial?.condoFeeBy ?? 'LOCATARIO'}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="LOCATARIO">Locatário (inquilino)</option>
                    <option value="LOCADOR">Locador (proprietário)</option>
                    <option value="INCLUSO">Incluso no aluguel</option>
                  </select>
                </div>
              </div>

              {/* IPTU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    IPTU (R$/mês)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">R$</span>
                    <input type="number" name="iptu" min={0} step="any" placeholder="0,00" defaultValue={initial?.iptu ?? undefined}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    IPTU por conta do
                  </label>
                  <select name="iptuBy" defaultValue={initial?.iptuBy ?? 'LOCATARIO'}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="LOCATARIO">Locatário (inquilino)</option>
                    <option value="LOCADOR">Locador (proprietário)</option>
                    <option value="INCLUSO">Incluso no aluguel</option>
                  </select>
                </div>
              </div>

              {/* Custo total estimado */}
              <div className="p-3 bg-indigo-50 rounded-xl">
                <p className="text-xs text-indigo-700">
                  <strong>Dica:</strong> Informe estes valores com clareza — locatários consideram o custo total
                  (aluguel + condomínio + IPTU) na decisão. Imóveis com custos transparentes recebem mais contatos.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── SEÇÃO 2: Localização ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">2. Localização</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço *</label>
            <input ref={addressInputRef} type="text" name="address" required placeholder="Rua, número" defaultValue={initial?.address}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade *</label>
              <input ref={cityInputRef} type="text" name="city" required placeholder="Ex: São Paulo" defaultValue={initial?.city}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado *</label>
              <select ref={stateSelectRef} name="state" required defaultValue={initial?.state ?? ''} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Selecione</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bairro</label>
              <input type="text" name="neighborhood" placeholder="Ex: Jardim América" defaultValue={initial?.neighborhood ?? undefined}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CEP</label>
              <input type="text" name="zipCode" placeholder="00000-000" defaultValue={initial?.zipCode ?? undefined}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <LocationPicker
            ref={locationPickerRef}
            getAddress={() => ({
              address: addressInputRef.current?.value || '',
              city: cityInputRef.current?.value || '',
              state: stateSelectRef.current?.value || '',
            })}
            onChange={(lat, lng) => setCoords({ lat, lng })}
            initial={initialCoords}
          />
        </div>

        {/* ─── SEÇÃO 3: Descrição ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">3. Descrição e história</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição do imóvel *</label>
            <textarea name="description" required rows={4} defaultValue={initial?.description}
              placeholder="Descreva o imóvel: tamanho dos cômodos, reformas, diferenciais..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              A história deste lugar
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Diferencial</span>
            </label>
            <div className="flex items-start gap-2 mb-2">
              <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">Conte o que ama neste lugar. Isso cria conexão com o comprador e diferencia seu anúncio!</p>
            </div>
            <textarea name="story" rows={4} defaultValue={initial?.story ?? undefined}
              placeholder='Ex: "Morei aqui por 10 anos. O que mais vou sentir falta é o silêncio pela manhã..."'
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-amber-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {rural ? 'Benfeitorias' : 'Características e diferenciais'}
            </label>
            <p className="text-xs text-gray-400 mb-2">
              {rural ? 'Selecione as que existem na propriedade' : 'Selecione as que se aplicam'}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {(rural ? RURAL_IMPROVEMENTS : PRESET_FEATURES).map((feature) => {
                const active = selectedFeatures.includes(feature)
                return (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => setSelectedFeatures((prev) =>
                      active ? prev.filter((f) => f !== feature) : [...prev, feature]
                    )}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                      active
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                    )}
                  >
                    {feature}
                  </button>
                )
              })}
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {rural ? 'Outras benfeitorias' : 'Outros'}
            </label>
            <p className="text-xs text-gray-400 mb-2">
              {rural ? 'Detalhe ou acrescente benfeitorias, uma por linha' : 'Não achou na lista? Descreva aqui, uma por linha'}
            </p>
            <textarea
              value={customFeatures}
              onChange={(e) => setCustomFeatures(e.target.value)}
              rows={3}
              placeholder={rural ? 'Ex: Casa sede com 3 quartos e varanda\n2 represas com peixes' : 'Ex: Vista para a serra\nQuadra de tênis'}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
        </div>

        {/* ─── SEÇÃO 4: Fotos e Vídeo ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">
            4. Fotos e Vídeo
          </h2>

          {/* Upload de fotos */}
          <PhotoUpload
            photos={photos}
            onChange={setPhotos}
            maxPhotos={20}
            folder="imoveis"
          />

          {/* Vídeo */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <a href="/guia-video" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl text-white hover:opacity-95 transition-opacity">
              <Video className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm">Como gravar um vídeo imersivo?</div>
                <div className="text-xs text-indigo-200">Imóveis com vídeo recebem 4× mais contatos → Ver guia</div>
              </div>
            </a>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                URL do vídeo <span className="text-gray-400 font-normal">(YouTube, Google Drive etc.)</span>
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* ─── SEÇÃO 5: DOCUMENTOS (só ao publicar; na edição fica no painel do anúncio) ─── */}
        {!editing && (
          <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-sm overflow-hidden">
            {/* Header com badge */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-50 to-green-50 border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <BadgeCheck className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">5. Comprovação de Propriedade</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Opcional — mas recomendado</p>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Verificação por IA
              </span>
            </div>

            <div className="p-6 space-y-4">
              {/* Benefício */}
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  <strong>Anúncios verificados recebem até 4x mais contatos.</strong> Nossa IA lê a matrícula ou IPTU,
                  identifica você como proprietário e coloca o badge <strong>"Verificado"</strong> automaticamente.
                </p>
              </div>

              {/* Drop zone */}
              {!docFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDocDragging(true) }}
                  onDragLeave={() => setDocDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDocDragging(false); const f = e.dataTransfer.files[0]; if (f) handleDocFile(f) }}
                  onClick={() => docInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                    docDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  )}
                >
                  <input ref={docInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocFile(f) }} />
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-600">Arraste ou clique para enviar</p>
                  <p className="text-xs text-gray-400 mt-1">Matrícula, IPTU, Escritura • PDF, JPG, PNG • Máx. 10MB</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <FileText className="w-8 h-8 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">{docFile.name}</div>
                    <div className="text-xs text-gray-500">{(docFile.size / 1024).toFixed(0)} KB • A IA vai ler este documento ao publicar</div>
                  </div>
                  <button type="button" onClick={() => { setDocFile(null); setDocResult(null) }}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Documentos aceitos */}
              <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-500">
                {['Certidão de Matrícula', 'Escritura Pública', 'IPTU com nome', 'Contrato registrado'].map((d) => (
                  <div key={d} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    {d}
                  </div>
                ))}
              </div>

              <p className="text-xs text-center text-gray-400">
                Pode pular agora e verificar depois em <strong>Minha Conta → Verificar Documentos</strong>
              </p>
            </div>
          </div>
        )}

        {/* Botão de publicar / salvar */}
        {editing ? (
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Link href={`/imoveis/${propertyId}`}
              className="sm:w-48 py-4 text-center border border-gray-200 bg-white text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-colors">
              Cancelar
            </Link>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-base shadow-lg shadow-indigo-200">
              {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        ) : (
          <button type="submit" disabled={isSubmitting}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-base shadow-lg shadow-indigo-200">
            {isSubmitting
              ? docUploading ? 'Verificando documentos...' : 'Publicando...'
              : docFile ? 'Publicar anúncio + Verificar documento' : 'Publicar anúncio'
            }
          </button>
        )}
      </form>
    </div>
  )
}
