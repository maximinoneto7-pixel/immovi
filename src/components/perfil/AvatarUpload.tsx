'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { shrinkImage } from '@/lib/image-resize'

interface AvatarUploadProps {
  name: string
  initialUrl: string | null
  fallbackLetter: string
}

export default function AvatarUpload({ name, initialUrl, fallbackLetter }: AvatarUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(initialUrl)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('files', await shrinkImage(file, 800))
      formData.append('folder', 'avatars')

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro no upload')

      setUrl(data.files[0].url)
    } catch (err: any) {
      setError(err.message || 'Falha no upload. Tente novamente.')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const displaySrc = preview || url

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div
          onClick={() => fileRef.current?.click()}
          className="w-20 h-20 rounded-2xl overflow-hidden bg-indigo-100 flex items-center justify-center cursor-pointer group relative"
        >
          {displaySrc ? (
            <img src={displaySrc} alt="Foto de perfil" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-indigo-700">{fallbackLetter}</span>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
        {url && !uploading && (
          <button
            type="button"
            onClick={() => { setUrl(null); setPreview(null) }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
            title="Remover foto"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        )}
      </div>
      <div>
        <button type="button" onClick={() => fileRef.current?.click()}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          {url ? 'Trocar foto' : 'Adicionar foto'}
        </button>
        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG ou WebP · Máx. 10MB</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input type="hidden" name={name} value={url || ''} readOnly />
    </div>
  )
}
