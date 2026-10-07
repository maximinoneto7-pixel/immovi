import CadastroForm from '@/components/auth/CadastroForm'

// Quem chega de uma página feita para um perfil já cai no formulário certo:
// /cadastro?perfil=corretor pula a escolha. Valor desconhecido cai na escolha normal.
const ATALHOS: Record<string, 'BUYER' | 'SELLER' | 'AGENT'> = {
  corretor: 'AGENT',
  agent: 'AGENT',
  vendedor: 'SELLER',
  seller: 'SELLER',
  comprador: 'BUYER',
  buyer: 'BUYER',
}

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ perfil?: string }>
}) {
  const { perfil } = await searchParams
  return <CadastroForm perfilInicial={ATALHOS[(perfil || '').toLowerCase()] ?? null} />
}
