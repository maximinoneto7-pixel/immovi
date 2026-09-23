import { prisma } from '@/lib/prisma'
import { getAsaasClient, isAsaasConfigured } from '@/lib/asaas'
import { ativarPagamento } from '@/lib/asaas-activation'

// Rede de segurança do pagamento: se o aviso do Asaas não chegar (webhook fora do ar,
// mal configurado ou recusado), o cliente pagaria sem receber o plano. Ao abrir
// Pagamentos ou Planos, o site pergunta ao Asaas o que essa pessoa já pagou e ativa.

const PAGOS = ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH']

/** Ativa o que já foi pago e ainda não constava no site. Devolve quantos ativou. */
export async function sincronizarPagamentos(userId: string): Promise<number> {
  if (!isAsaasConfigured()) return 0

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { asaasCustomerId: true },
  })
  if (!user?.asaasCustomerId) return 0

  try {
    const asaas = getAsaasClient()
    const { data } = await asaas.payments.listByCustomer(user.asaasCustomerId)
    const pagos = (data || []).filter((p) => PAGOS.includes(p.status) && p.externalReference)

    let ativados = 0
    for (const pagamento of pagos) {
      if (await ativarPagamento(pagamento)) ativados++
    }
    return ativados
  } catch (err) {
    // Uma falha aqui não pode derrubar a página: o webhook continua sendo o caminho normal
    console.error('[Asaas] Falha ao conferir pagamentos:', (err as Error).message)
    return 0
  }
}
