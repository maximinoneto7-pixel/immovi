import { isAsaasConfigured } from '@/lib/asaas'

export async function GET() {
  const key = process.env.ASAAS_API_KEY || ''
  return Response.json({
    configured: isAsaasConfigured(),
    environment: process.env.ASAAS_ENVIRONMENT,
    startsWithDollarAact: key.startsWith('$aact_'),
    startsWithBackslash: key.startsWith('\\$'),
    length: key.length,
  })
}
