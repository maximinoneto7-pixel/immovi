import * as webpush from 'web-push'
import { prisma } from '@/lib/prisma'

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT || 'mailto:contato@immovi.com.br'

export function isPushConfigured() {
  return !!publicKey && !!privateKey
}

if (isPushConfigured()) {
  webpush.setVapidDetails(subject, publicKey!, privateKey!)
}

interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!isPushConfigured()) return

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } })
  await sendToSubscriptions(subscriptions, payload)
}

export async function sendPushToSubscriptionId(subscriptionId: string, payload: PushPayload) {
  if (!isPushConfigured()) return

  const subscription = await prisma.pushSubscription.findUnique({ where: { id: subscriptionId } })
  if (subscription) await sendToSubscriptions([subscription], payload)
}

async function sendToSubscriptions(
  subscriptions: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload
) {
  const body = JSON.stringify(payload)

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        )
      } catch (err: any) {
        // Assinatura expirada/inválida — remove do banco
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        } else {
          console.error('[Push] Erro ao enviar:', err?.message || err)
        }
      }
    })
  )
}
