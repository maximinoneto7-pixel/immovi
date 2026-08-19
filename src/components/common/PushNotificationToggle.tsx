'use client'

import { useEffect, useState } from 'react'
import { Bell, BellRing, BellOff, Loader2 } from 'lucide-react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

type Status = 'unsupported' | 'checking' | 'subscribed' | 'unsubscribed' | 'denied'

export default function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>('checking')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC_KEY) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'subscribed' : 'unsubscribed')
    }).catch(() => setStatus('unsupported'))
  }, [])

  const subscribe = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      })

      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })

      setStatus('subscribed')
    } catch (err) {
      console.error('[Push] Erro ao assinar:', err)
    } finally {
      setBusy(false)
    }
  }

  const unsubscribe = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, { method: 'DELETE' })
        await sub.unsubscribe()
      }
      setStatus('unsubscribed')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'checking' || status === 'unsupported') return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        status === 'subscribed' ? 'bg-indigo-100' : 'bg-gray-100'
      }`}>
        {status === 'subscribed'
          ? <BellRing className="w-5 h-5 text-indigo-600" />
          : <BellOff className="w-5 h-5 text-gray-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 text-sm">Notificações push</div>
        <div className="text-xs text-gray-500">
          {status === 'denied'
            ? 'Bloqueadas no navegador — habilite nas configurações do site para ativar.'
            : status === 'subscribed'
              ? 'Ativadas neste dispositivo — você recebe avisos instantâneos dos seus alertas.'
              : 'Receba um aviso instantâneo no celular/navegador, além do e-mail.'}
        </div>
      </div>
      {status !== 'denied' && (
        <button
          onClick={status === 'subscribed' ? unsubscribe : subscribe}
          disabled={busy}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
            status === 'subscribed'
              ? 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : status === 'subscribed' ? 'Desativar' : 'Ativar'}
        </button>
      )}
    </div>
  )
}
