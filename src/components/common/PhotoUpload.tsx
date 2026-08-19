'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Upload, X, Star, GripVertical, Loader2,
  ImageIcon, AlertCircle, CheckCircle2, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface UploadedPhoto {
  url: string
  filename: string
  isCover: boolean
  localPreview?: string // URL.createObjectURL para preview imediato
}

interface PhotoUploadProps {
  photos: UploadedPhoto[]
  onChange: (photos: UploadedPhoto[]) => void
  maxPhotos?: number
  folder?: string
}

export default function PhotoUpload({
  photos,
  onChange,
  maxPhotos = 20,
  folder = 'imoveis',
}: PhotoUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(async (files: File[]) => {
    if (!files.length) return
    const remaining = maxPhotos - photos.length
    if (remaining <= 0) {
      setError(`Máximo de ${maxPhotos} fotos atingido.`)
      return
    }

    const toUpload = files.slice(0, remaining)
    setError('')
    setUploading(true)
    setUploadProgress(0)

    // Preview imediato antes do upload
    const previews: UploadedPhoto[] = toUpload.map((file, i) => ({
      url: '',
      filename: file.name,
      isCover: photos.length === 0 && i === 0,
      localPreview: URL.createObjectURL(file),
    }))
    onChange([...photos, ...previews])

    try {
      const formData = new FormData()
      toUpload.forEach(f => formData.append('files', f))
      formData.append('folder', folder)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro no upload')

      // Substitui os previews pelos resultados reais
      const uploaded: UploadedPhoto[] = data.files.map((f: any, i: number) => ({
        url: f.url,
        filename: f.filename,
        isCover: photos.length === 0 && i === 0,
      }))

      // Revoga URLs de preview para liberar memória
      previews.forEach(p => p.localPreview && URL.revokeObjectURL(p.localPreview))

      onChange([...photos, ...uploaded])
      setUploadProgress(100)
    } catch (err: any) {
      // Remove os previews em caso de erro
      previews.forEach(p => p.localPreview && URL.revokeObjectURL(p.localPreview))
      onChange(photos)
      setError(err.message || 'Falha no upload. Tente novamente.')
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }, [photos, onChange, maxPhotos, folder])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    addFiles(Array.from(files))
  }

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index)
    // Se removeu a capa, promove a primeira como capa
    if (photos[index].isCover && updated.length > 0) {
      updated[0] = { ...updated[0], isCover: true }
    }
    onChange(updated)
  }

  const setCover = (index: number) => {
    onChange(photos.map((p, i) => ({ ...p, isCover: i === index })))
  }

  const movePhoto = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return
    const updated = [...photos]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    // Garante que a capa continua sendo a marcada
    onChange(updated)
  }

  const canAdd = photos.length < maxPhotos && !uploading

  return (
    <div className="space-y-4">
      {/* Área de drop */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => canAdd && fileRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center transition-all',
          dragging ? 'border-indigo-400 bg-indigo-50 scale-[1.01]' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50',
          canAdd ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
          disabled={!canAdd}
        />

        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
            <p className="font-semibold text-gray-700 text-sm">Enviando fotos...</p>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress || 30}%` }} />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="font-semibold text-gray-700">
              {photos.length === 0
                ? 'Arraste as fotos aqui ou clique para selecionar'
                : 'Adicionar mais fotos'}
            </p>
            <p className="text-xs text-gray-400">
              JPG, PNG, WebP · Máx. 10MB por foto · Até {maxPhotos} fotos
              {photos.length > 0 && ` · ${photos.length}/${maxPhotos} adicionadas`}
            </p>
          </div>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Grid de fotos */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {photos.length} foto{photos.length !== 1 ? 's' : ''} adicionada{photos.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-400">Clique na ⭐ para definir a capa</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo, i) => {
              const src = photo.localPreview || photo.url
              const isUploading = !photo.url && !!photo.localPreview

              return (
                <div key={i} className={cn(
                  'relative group rounded-xl overflow-hidden aspect-square bg-gray-100 border-2 transition-all',
                  photo.isCover ? 'border-amber-400 shadow-md' : 'border-transparent hover:border-gray-300'
                )}>
                  {/* Imagem */}
                  {src ? (
                    <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                  )}

                  {/* Overlay de loading */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}

                  {/* Badge capa */}
                  {photo.isCover && (
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-amber-400 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Capa
                    </div>
                  )}

                  {/* Número */}
                  {!photo.isCover && (
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/50 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {i + 1}
                    </div>
                  )}

                  {/* Ações (visíveis no hover) */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {/* Definir capa */}
                    {!photo.isCover && !isUploading && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setCover(i) }}
                        className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center hover:bg-amber-500 transition-colors"
                        title="Definir como capa"
                      >
                        <Star className="w-4 h-4 text-white" />
                      </button>
                    )}

                    {/* Mover para esquerda */}
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); movePhoto(i, i - 1) }}
                        className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors text-gray-700 font-bold text-sm"
                        title="Mover para esquerda"
                      >
                        ←
                      </button>
                    )}

                    {/* Mover para direita */}
                    {i < photos.length - 1 && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); movePhoto(i, i + 1) }}
                        className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors text-gray-700 font-bold text-sm"
                        title="Mover para direita"
                      >
                        →
                      </button>
                    )}

                    {/* Remover */}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removePhoto(i) }}
                      className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Remover foto"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Botão adicionar mais */}
            {canAdd && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 flex flex-col items-center justify-center gap-2 transition-colors text-gray-400 hover:text-indigo-500"
              >
                <Plus className="w-6 h-6" />
                <span className="text-xs font-medium">Adicionar</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
