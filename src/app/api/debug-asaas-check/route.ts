import { getAsaasClient, isAsaasConfigured } from '@/lib/asaas'

export async function GET() {
  const key = process.env.ASAAS_API_KEY || ''
  const base = {
    configured: isAsaasConfigured(),
    environment: process.env.ASAAS_ENVIRONMENT,
    length: key.length,
  }

  if (!isAsaasConfigured()) return Response.json(base)

  try {
    const asaas = getAsaasClient()
    await asaas.customers.findByEmail('debug-check@immovi.com.br')
    return Response.json({ ...base, apiCallSucceeded: true })
  } catch (err: any) {
    return Response.json({ ...base, apiCallSucceeded: false, error: err.message })
  }
}
