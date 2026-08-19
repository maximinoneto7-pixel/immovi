'use client'

import { useState, useEffect, useCallback } from 'react'
import { Database, Download, Trash2, RefreshCw, CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react'

interface BackupInfo {
  name: string
  size: number
  createdAt: string
}

interface BackupData {
  database: { path: string; size: number; lastModified: string }
  backups: BackupInfo[]
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}

export default function BackupPanel() {
  const [data, setData] = useState<BackupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/backup')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createBackup = async () => {
    setCreating(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/backup', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: json.message })
        load()
      } else {
        setMessage({ type: 'error', text: json.error })
      }
    } finally {
      setCreating(false)
    }
  }

  const deleteBackup = async (name: string) => {
    if (!confirm(`Apagar backup "${name}"?`)) return
    setDeleting(name)
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) load()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-green-500" />
          <div>
            <div className="font-semibold text-gray-900 text-sm">Banco de Dados SQLite</div>
            {data && (
              <div className="text-xs text-gray-400">
                Tamanho: {formatBytes(data.database.size)} • {data.backups.length} backup{data.backups.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Atualizar">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={createBackup}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {creating ? 'Criando...' : 'Criar backup'}
          </button>
        </div>
      </div>

      {/* Mensagem */}
      {message && (
        <div className={`flex items-center gap-2 px-5 py-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Conteúdo */}
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
          </div>
        ) : !data?.backups.length ? (
          <div className="text-center py-8 text-gray-400">
            <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum backup criado ainda</p>
            <p className="text-xs mt-1">Crie o primeiro backup agora</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.backups.map((backup) => (
              <div key={backup.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Database className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{backup.name}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span>{formatBytes(backup.size)}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(backup.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteBackup(backup.name)}
                  disabled={deleting === backup.name}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Apagar backup"
                >
                  {deleting === backup.name
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-xs text-indigo-700 space-y-1">
          <p className="font-semibold">ℹ️ Sobre os backups</p>
          <p>• Os backups são cópias do arquivo <code className="bg-indigo-100 px-1 rounded">dev.db</code> salvos na pasta <code className="bg-indigo-100 px-1 rounded">backups/</code></p>
          <p>• Os 10 backups mais recentes são mantidos automaticamente (os mais antigos são removidos)</p>
          <p>• Para produção: configure backups automáticos para um serviço externo (S3, Google Drive, etc.)</p>
        </div>
      </div>
    </div>
  )
}
