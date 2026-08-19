import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateContract, type ContractData, type Parte } from '@/lib/contract-templates'
import { sendContractGeneratedEmail } from '@/lib/email'

function buildPartes(body: any, prefix: string): Parte[] {
  // Suporta tanto formato legado (sellerName, sellerCpf) quanto novo (parteA: [...])
  if (body[`${prefix}s`]?.length) return body[`${prefix}s`] // array de partes
  if (body[`${prefix}Name`]) {
    return [{
      nome: body[`${prefix}Name`],
      cpf: body[`${prefix}Cpf`] || '',
      rg: body[`${prefix}Rg`],
      endereco: body[`${prefix}Address`],
      nacionalidade: body[`${prefix}Nationality`],
      estadoCivil: body[`${prefix}CivilStatus`],
      naturalidade: body[`${prefix}Birthplace`],
      profissao: body[`${prefix}Profession`],
    }]
  }
  return []
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const body = await request.json()

  const parteA = buildPartes(body, 'seller') || buildPartes(body, 'locador') ||
                 buildPartes(body, 'permutanteA') || buildPartes(body, 'cedente') ||
                 (body.parteA || [])

  const parteB = buildPartes(body, 'buyer') || buildPartes(body, 'locatario') ||
                 buildPartes(body, 'permutanteB') || buildPartes(body, 'cessionario') ||
                 (body.parteB || [])

  if (!parteA.length || !parteB.length) {
    return Response.json({ error: 'Informe os dados das partes do contrato.' }, { status: 400 })
  }
  if (!body.propertyAddress && !body.cessaoObject && !body.propertyADescription) {
    return Response.json({ error: 'Informe os dados do imóvel.' }, { status: 400 })
  }

  const date = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

  const contractData: ContractData = {
    ...body,
    parteA,
    parteB,
    date,
  }

  const content = generateContract(contractData)

  const sellerNames = parteA.map(p => p.nome).join(', ')
  const buyerNames = parteB.map(p => p.nome).join(', ')

  const contract = await prisma.contract.create({
    data: {
      type: body.type || 'PROMESSA_COMPRA_VENDA',
      title: body.title || `Contrato — ${sellerNames} e ${buyerNames}`,
      content,
      status: 'DRAFT',
      sellerName: sellerNames,
      sellerCpf: parteA[0]?.cpf || '',
      buyerName: buyerNames,
      buyerCpf: parteB[0]?.cpf || '',
      userId: session.user.id,
    },
  })

  // E-mail de confirmação
  prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  }).then(user => {
    if (user) {
      sendContractGeneratedEmail(
        user.email, user.name,
        contract.title, contract.type, contract.id
      ).catch(console.error)
    }
  }).catch(console.error)

  return Response.json({ id: contract.id })
}
