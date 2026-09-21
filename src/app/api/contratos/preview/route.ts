import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateContract, type ContractData, type Parte } from '@/lib/contract-templates'
import { canCreateContracts, CONTRACTS_PAYWALL_MESSAGE } from '@/lib/subscription'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { planId: true, planExpiresAt: true, role: true },
  })
  if (!canCreateContracts(user)) {
    return Response.json({ error: CONTRACTS_PAYWALL_MESSAGE }, { status: 403 })
  }

  const body = await request.json()

  // Monta partes a partir do body (tanto legado quanto novo formato)
  const parteA: Parte[] = body.parteA?.length ? body.parteA : body.sellerName ? [{
    nome: body.sellerName, cpf: body.sellerCpf, rg: body.sellerRg,
    endereco: body.sellerAddress, nacionalidade: body.sellerNationality,
    estadoCivil: body.sellerCivilStatus, naturalidade: body.sellerBirthplace,
    profissao: body.sellerProfession,
  }] : [{ nome: '_______________', cpf: '_______________' }]

  const parteB: Parte[] = body.parteB?.length ? body.parteB : body.buyerName ? [{
    nome: body.buyerName, cpf: body.buyerCpf, rg: body.buyerRg,
    endereco: body.buyerAddress, nacionalidade: body.buyerNationality,
    estadoCivil: body.buyerCivilStatus, naturalidade: body.buyerBirthplace,
    profissao: body.buyerProfession,
  }] : [{ nome: '_______________', cpf: '_______________' }]

  const date = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

  const contractData: ContractData = { ...body, parteA, parteB, date }
  const html = generateContract(contractData)

  return Response.json({ html })
}
