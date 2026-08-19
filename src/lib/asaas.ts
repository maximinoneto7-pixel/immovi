// ─── Cliente Asaas ───────────────────────────────────────────────────────────
// Documentação: https://docs.asaas.com/reference

const ASAAS_BASE_URL = process.env.ASAAS_ENVIRONMENT === 'production'
  ? 'https://api.asaas.com/api/v3'
  : 'https://sandbox.asaas.com/api/v3'

export function getAsaasClient() {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) throw new Error('ASAAS_API_KEY não configurado.')

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
      method,
      headers: {
        'access_token': apiKey!,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      } as Record<string, string>,
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await res.json()

    if (!res.ok) {
      const msg = data.errors?.map((e: any) => e.description).join(', ') || data.message || 'Erro Asaas'
      throw new Error(msg)
    }

    return data as T
  }

  return {
    // ─── Clientes ─────────────────────────────────────────────────────
    customers: {
      create: (data: AsaasCustomerInput) =>
        request<AsaasCustomer>('POST', '/customers', data),

      findByCpfCnpj: (cpfCnpj: string) =>
        request<{ data: AsaasCustomer[] }>('GET', `/customers?cpfCnpj=${cpfCnpj}`),

      findByEmail: (email: string) =>
        request<{ data: AsaasCustomer[] }>('GET', `/customers?email=${encodeURIComponent(email)}`),
    },

    // ─── Assinaturas (planos recorrentes) ─────────────────────────────
    subscriptions: {
      create: (data: AsaasSubscriptionInput) =>
        request<AsaasSubscription>('POST', '/subscriptions', data),

      get: (id: string) =>
        request<AsaasSubscription>('GET', `/subscriptions/${id}`),

      cancel: (id: string) =>
        request<AsaasSubscription>('DELETE', `/subscriptions/${id}`),

      listPayments: (id: string) =>
        request<{ data: AsaasPayment[] }>('GET', `/subscriptions/${id}/payments`),
    },

    // ─── Cobranças avulsas (Foguete, verificação) ─────────────────────
    payments: {
      create: (data: AsaasPaymentInput) =>
        request<AsaasPayment>('POST', '/payments', data),

      get: (id: string) =>
        request<AsaasPayment>('GET', `/payments/${id}`),

      getPixQrCode: (id: string) =>
        request<{ encodedImage: string; payload: string; expirationDate: string }>('GET', `/payments/${id}/pixQrCode`),

      getBoletoBarCode: (id: string) =>
        request<{ bankSlipUrl: string; identificationField: string }>('GET', `/payments/${id}/identificationField`),

      getCheckoutUrl: (id: string) =>
        request<{ url: string }>('GET', `/payments/${id}/viewInvoiceUrl`),
    },
  }
}

export function isAsaasConfigured(): boolean {
  return !!process.env.ASAAS_API_KEY
}

// ─── Mapeamento de planos → preço Asaas ─────────────────────────────────────

export const ASAAS_PLANOS: Record<string, { value: number; cycle: 'MONTHLY'; description: string }> = {
  DESTAQUE:     { value: 99.00,  cycle: 'MONTHLY', description: 'Immovi — Plano Destaque' },
  PROFISSIONAL: { value: 199.00, cycle: 'MONTHLY', description: 'Immovi — Plano Profissional' },
  IMOBILIARIA:  { value: 499.00, cycle: 'MONTHLY', description: 'Immovi — Plano Imobiliária' },
}

export const ASAAS_FOGUETES: Record<string, { value: number; description: string }> = {
  FOGUETE_7:  { value: 29.00, description: 'Foguete 7 dias — Immovi' },
  FOGUETE_15: { value: 49.00, description: 'Foguete 15 dias — Immovi' },
  FOGUETE_30: { value: 79.00, description: 'Foguete 30 dias — Immovi' },
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface AsaasCustomerInput {
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
  mobilePhone?: string
  externalReference?: string
}

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj?: string
}

export type AsaasBillingType = 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'
export type AsaasCycle = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'

export interface AsaasSubscriptionInput {
  customer: string            // ID do cliente Asaas
  billingType: AsaasBillingType
  value: number
  nextDueDate: string         // YYYY-MM-DD
  cycle: AsaasCycle
  description?: string
  externalReference?: string  // nosso userId:planId
  callback?: {
    successUrl: string
    autoRedirect: boolean
  }
}

export interface AsaasSubscription {
  id: string
  status: string
  value: number
  nextDueDate: string
  billingType: string
}

export interface AsaasPaymentInput {
  customer: string
  billingType: AsaasBillingType
  value: number
  dueDate: string             // YYYY-MM-DD
  description?: string
  externalReference?: string
  callback?: {
    successUrl: string
    autoRedirect: boolean
  }
}

export interface AsaasPayment {
  id: string
  status: string              // PENDING, RECEIVED, CONFIRMED, OVERDUE, etc.
  value: number
  billingType: string
  dueDate: string
  invoiceUrl?: string
  bankSlipUrl?: string
  pixTransaction?: string
}

// ─── Helper: formatar data para Asaas (YYYY-MM-DD) ──────────────────────────

export function asaasDate(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

// ─── Helper: próxima data de vencimento (+1 dia a partir de hoje) ────────────

export function nextDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return asaasDate(d)
}
