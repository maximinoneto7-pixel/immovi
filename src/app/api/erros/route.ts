import { avisarErro } from '@/lib/alerta-erro'

// Recebe os erros que acontecem no navegador (tela branca, componente que quebrou)
// e avisa a administração. O próprio avisarErro segura repetição e enxurrada.
export async function POST(request: Request) {
  try {
    const { onde, mensagem, pilha, url } = await request.json()
    if (!mensagem) return Response.json({ ok: true })

    await avisarErro(
      `tela do navegador${onde ? ` (${String(onde).slice(0, 60)})` : ''}`,
      Object.assign(new Error(String(mensagem).slice(0, 300)), { stack: String(pilha || '').slice(0, 1200) }),
      { url: String(url || '').slice(0, 200) }
    )
  } catch {
    // Um aviso que falha não pode virar erro por si só
  }
  return Response.json({ ok: true })
}
