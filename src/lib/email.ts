import { Resend } from 'resend'

// ─── Cliente ──────────────────────────────────────────────────────────────────

const apiKey = process.env.RESEND_API_KEY
const resend = apiKey && apiKey !== 'cole_sua_chave_aqui'
  ? new Resend(apiKey)
  : null

const FROM = process.env.EMAIL_FROM || 'Immovi <notificacoes@immovi.com.br>'
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3001'

export function isEmailConfigured() {
  const key = process.env.RESEND_API_KEY
  return !!key && key !== 'cole_sua_chave_aqui'
}

// ─── Utilitário de envio ──────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    // Em dev: loga no console em vez de enviar
    console.log('\n📧 [EMAIL — modo dev]')
    console.log(`Para: ${to}`)
    console.log(`Assunto: ${subject}`)
    console.log('─'.repeat(50))
    return { success: true, dev: true }
  }

  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) throw error
    return { success: true, id: data?.id }
  } catch (err: any) {
    console.error('[Email] Erro ao enviar:', err.message)
    return { success: false, error: err.message }
  }
}

// ─── Layout base ─────────────────────────────────────────────────────────────

function layout(content: string, previewText = '') {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>Immovi</title>
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden">${previewText}&nbsp;‌‌‌‌‌‌‌‌‌‌‌‌‌‌</div>` : ''}
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#3730a3;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;line-height:36px;text-align:center;font-size:18px;">🏠</div>
                <span style="color:#fff;font-size:20px;font-weight:bold;">Immo<span style="color:#a5b4fc;">vi</span></span>
              </div>
            </td>
          </tr></table>
        </td></tr>

        <!-- Corpo -->
        <tr><td style="background:#fff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
          <p style="color:#6b7280;font-size:12px;margin:0 0 8px;">
            © ${new Date().getFullYear()} Immovi · Ivolândia — GO, Brasil
          </p>
          <p style="color:#9ca3af;font-size:11px;margin:0;">
            <a href="${BASE_URL}/privacidade" style="color:#6b7280;">Privacidade</a> &nbsp;·&nbsp;
            <a href="${BASE_URL}/termos" style="color:#6b7280;">Termos</a> &nbsp;·&nbsp;
            <a href="${BASE_URL}/perfil" style="color:#6b7280;">Gerenciar notificações</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Componentes reutilizáveis ────────────────────────────────────────────────

const btn = (href: string, text: string, color = '#4338ca') =>
  `<table cellpadding="0" cellspacing="0" style="margin:24px auto;">
    <tr><td style="background:${color};border-radius:10px;padding:14px 28px;text-align:center;">
      <a href="${href}" style="color:#fff;font-size:15px;font-weight:bold;text-decoration:none;">${text}</a>
    </td></tr>
  </table>`

const divider = `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>`

const infoRow = (icon: string, label: string, value: string) =>
  `<tr>
    <td style="padding:8px 0;font-size:14px;color:#374151;width:40px;">${icon}</td>
    <td style="padding:8px 0;font-size:14px;color:#6b7280;width:120px;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${value}</td>
  </tr>`

// ─── 1. Boas-vindas ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const html = layout(`
    <h1 style="color:#111827;font-size:22px;margin:0 0 20px;">Redefinir sua senha</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Olá, <strong style="color:#111827;">${name}</strong></p>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
      Recebemos um pedido para redefinir a senha da sua conta Immovi. Clique no botão abaixo para escolher uma nova senha.
    </p>

    ${btn(resetUrl, 'Redefinir senha')}

    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:16px 0 0;">
      Este link expira em 1 hora. Se você não pediu essa redefinição, pode ignorar este e-mail com segurança —
      sua senha continua a mesma.
    </p>
  `, `Redefinir sua senha no Immovi`)

  return send(to, `🔒 Redefinir sua senha — Immovi`, html)
}

export async function sendWelcomeEmail(to: string, name: string, role: string) {
  const roleMap: Record<string, string> = {
    BUYER: 'Comprador(a)',
    SELLER: 'Vendedor(a)',
    AGENT: 'Corretor(a)',
  }
  const roleLabel = roleMap[role] || 'Usuário'
  const html = layout(`
    <h1 style="color:#111827;font-size:24px;margin:0 0 8px;">Bem-vindo(a), ${name}! 🎉</h1>
    <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">
      Sua conta de <strong>${roleLabel}</strong> foi criada com sucesso no Immovi.
      Aqui você encontra e anuncia imóveis com transparência, segurança e humanidade.
    </p>

    <div style="background:#eff6ff;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#4338ca;font-size:14px;margin:0;font-weight:600;">🚀 Primeiros passos</p>
      <ul style="color:#374151;font-size:13px;margin:8px 0 0;padding-left:16px;line-height:2;">
        ${role === 'BUYER' ? '<li>Busque imóveis por cidade, tipo ou valor</li><li>Salve seus favoritos</li><li>Entre em contato direto com o vendedor</li>' : ''}
        ${role === 'SELLER' ? '<li>Publique seu primeiro anúncio gratuitamente</li><li>Envie a matrícula para verificação por IA</li><li>Responda os interessados pelo chat</li>' : ''}
        ${role === 'AGENT' ? '<li>Configure seu perfil de corretor</li><li>Publique até 20 anúncios no plano Profissional</li><li>Verifique seu CRECI para ganhar credibilidade</li>' : ''}
      </ul>
    </div>

    ${btn(`${BASE_URL}`, 'Acessar a plataforma')}
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
      Ficou com dúvidas? Fale conosco em qualquer momento.
    </p>
  `, `Bem-vindo(a) ao Immovi, ${name}!`)

  return send(to, `Bem-vindo(a) ao Immovi, ${name}! 🏠`, html)
}

// ─── 2. Nova mensagem no chat ─────────────────────────────────────────────────

export async function sendNewMessageEmail(
  to: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  propertyTitle: string,
  conversationId: string
) {
  const preview = messagePreview.length > 120
    ? messagePreview.slice(0, 120) + '...'
    : messagePreview

  const html = layout(`
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Olá, <strong style="color:#111827;">${recipientName}</strong></p>
    <h1 style="color:#111827;font-size:22px;margin:0 0 20px;">Você recebeu uma mensagem 💬</h1>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:40px;height:40px;background:#dbeafe;border-radius:50%;text-align:center;line-height:40px;font-weight:bold;color:#4338ca;font-size:16px;">
          ${senderName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style="margin:0;font-weight:700;color:#111827;font-size:15px;">${senderName}</p>
          <p style="margin:0;color:#6b7280;font-size:12px;">Sobre: ${propertyTitle}</p>
        </div>
      </div>
      <div style="background:#fff;border-radius:8px;padding:14px;border-left:3px solid #6366f1;">
        <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;font-style:italic;">"${preview}"</p>
      </div>
    </div>

    ${btn(`${BASE_URL}/mensagens/${conversationId}`, 'Responder agora')}

    <p style="color:#9ca3af;font-size:12px;text-align:center;">
      Responda pelo chat da plataforma para manter suas negociações seguras e documentadas.
    </p>
  `, `${senderName} enviou uma mensagem sobre ${propertyTitle}`)

  return send(to, `💬 ${senderName} enviou uma mensagem`, html)
}

// ─── 3. Interesse em imóvel (primeiro contato) ────────────────────────────────

export async function sendPropertyInterestEmail(
  to: string,
  ownerName: string,
  interestedName: string,
  propertyTitle: string,
  propertyId: string,
  propertyCity: string,
  propertyPrice: string
) {
  const html = layout(`
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Olá, <strong style="color:#111827;">${ownerName}</strong></p>
    <h1 style="color:#111827;font-size:22px;margin:0 0 20px;">Alguém se interessou pelo seu imóvel! 🎯</h1>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="color:#166534;font-size:14px;font-weight:600;margin:0 0 4px;">✅ Novo interessado</p>
      <p style="color:#15803d;font-size:22px;font-weight:bold;margin:0;">${interestedName}</p>
      <p style="color:#166534;font-size:13px;margin:4px 0 0;">entrou em contato pelo chat da plataforma</p>
    </div>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${infoRow('🏠', 'Imóvel', propertyTitle)}
      ${infoRow('📍', 'Cidade', propertyCity)}
      ${infoRow('💰', 'Valor', propertyPrice)}
    </table>

    ${divider}
    <p style="color:#374151;font-size:14px;text-align:center;margin:0 0 16px;">
      Acesse o chat para responder e não perder esse contato!
    </p>
    ${btn(`${BASE_URL}/mensagens`, 'Ver mensagens', '#16a34a')}
  `, `${interestedName} se interessou pelo seu imóvel`)

  return send(to, `🎯 ${interestedName} se interessou pelo seu imóvel!`, html)
}

// ─── 4. Documento verificado pela IA ─────────────────────────────────────────

export async function sendDocumentVerifiedEmail(
  to: string,
  ownerName: string,
  propertyTitle: string,
  propertyId: string,
  verified: boolean,
  owners: string[]
) {
  const html = layout(`
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Olá, <strong style="color:#111827;">${ownerName}</strong></p>
    <h1 style="color:#111827;font-size:22px;margin:0 0 20px;">
      ${verified ? '✅ Documento verificado com sucesso!' : '⚠️ Verificação de documento'}
    </h1>

    <div style="background:${verified ? '#f0fdf4' : '#fffbeb'};border:1px solid ${verified ? '#bbf7d0' : '#fde68a'};border-radius:12px;padding:20px;margin-bottom:24px;">
      ${verified ? `
        <p style="color:#166534;font-size:15px;font-weight:700;margin:0 0 8px;">🛡️ Propriedade confirmada</p>
        <p style="color:#15803d;font-size:14px;margin:0 0 12px;">Nossa IA analisou o documento e confirmou sua titularidade. O badge <strong>"Verificado"</strong> foi aplicado ao seu anúncio.</p>
        ${owners.length > 0 ? `<p style="color:#166534;font-size:13px;margin:0;">Proprietário(s) identificado(s): <strong>${owners.join(', ')}</strong></p>` : ''}
      ` : `
        <p style="color:#92400e;font-size:15px;font-weight:700;margin:0 0 8px;">⚠️ Proprietário não confirmado</p>
        <p style="color:#78350f;font-size:14px;margin:0;">Não conseguimos confirmar sua titularidade no documento enviado. Tente enviar a matrícula atualizada ou entre em contato com o suporte.</p>
      `}
    </div>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${infoRow('🏠', 'Imóvel', propertyTitle)}
      ${infoRow('📋', 'Status', verified ? 'VERIFICADO' : 'Pendente de revisão')}
    </table>

    ${btn(`${BASE_URL}/imoveis/${propertyId}`, 'Ver meu anúncio')}
  `, verified ? `Seu imóvel foi verificado!` : `Resultado da verificação do documento`)

  return send(
    to,
    verified ? `✅ Seu imóvel foi verificado com sucesso!` : `⚠️ Verificação de documento — resultado`,
    html
  )
}

// ─── 5. Plano ativado ─────────────────────────────────────────────────────────

export async function sendPlanActivatedEmail(
  to: string,
  userName: string,
  planName: string,
  expiresAt: string,
  features: string[]
) {
  const html = layout(`
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Olá, <strong style="color:#111827;">${userName}</strong></p>
    <h1 style="color:#111827;font-size:22px;margin:0 0 20px;">Plano ${planName} ativado! 🚀</h1>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#3730a3;font-size:14px;font-weight:700;margin:0 0 12px;">✨ O que você tem acesso agora:</p>
      <ul style="margin:0;padding-left:20px;">
        ${features.map(f => `<li style="color:#312e81;font-size:14px;margin-bottom:6px;">${f}</li>`).join('')}
      </ul>
    </div>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${infoRow('👑', 'Plano', planName)}
      ${infoRow('📅', 'Válido até', expiresAt)}
    </table>

    ${btn(`${BASE_URL}/pagamentos`, 'Gerenciar meu plano')}
  `, `Plano ${planName} ativado!`)

  return send(to, `👑 Plano ${planName} ativado com sucesso!`, html)
}

// ─── 6. Plano expirando em breve ─────────────────────────────────────────────

export async function sendPlanExpiringEmail(
  to: string,
  userName: string,
  planName: string,
  daysLeft: number,
  expiresAt: string
) {
  const html = layout(`
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Olá, <strong style="color:#111827;">${userName}</strong></p>
    <h1 style="color:#111827;font-size:22px;margin:0 0 20px;">Seu plano expira em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}!</h1>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#92400e;font-size:15px;font-weight:700;margin:0 0 8px;">⏰ Renove para não perder seus benefícios</p>
      <p style="color:#78350f;font-size:14px;margin:0;">Seu plano <strong>${planName}</strong> vence em <strong>${expiresAt}</strong>. Após o vencimento, seus anúncios voltarão para o plano gratuito.</p>
    </div>

    ${btn(`${BASE_URL}/planos`, 'Renovar agora', '#d97706')}

    <p style="color:#9ca3af;font-size:12px;text-align:center;">
      Se preferir não renovar, seus dados e histórico serão mantidos.
    </p>
  `, `Seu plano ${planName} expira em ${daysLeft} dias`)

  return send(to, `⏰ Seu plano ${planName} expira em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`, html)
}

// ─── 6b. Cobrança de renovação falhou/venceu ─────────────────────────────────

export async function sendPaymentOverdueEmail(to: string, userName: string, planName: string) {
  const html = layout(`
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Olá, <strong style="color:#111827;">${userName}</strong></p>
    <h1 style="color:#111827;font-size:22px;margin:0 0 20px;">⚠️ Não conseguimos processar sua renovação</h1>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#991b1b;font-size:15px;font-weight:700;margin:0 0 8px;">Cobrança do plano ${planName} vencida</p>
      <p style="color:#7f1d1d;font-size:14px;margin:0;">
        A cobrança da renovação do seu plano <strong>${planName}</strong> venceu e ainda não foi paga.
        Seus benefícios foram temporariamente suspensos até a regularização.
      </p>
    </div>

    ${btn(`${BASE_URL}/pagamentos`, 'Atualizar pagamento', '#dc2626')}

    <p style="color:#9ca3af;font-size:12px;text-align:center;">
      Se você já pagou, pode levar algumas horas para atualizarmos automaticamente.
    </p>
  `, `Cobrança do plano ${planName} vencida`)

  return send(to, `⚠️ Cobrança vencida — plano ${planName}`, html)
}

// ─── 7. Foguete ativado ───────────────────────────────────────────────────────

export async function sendBoostActivatedEmail(
  to: string,
  userName: string,
  propertyTitle: string,
  propertyId: string,
  boostDays: number,
  expiresAt: string
) {
  const html = layout(`
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Olá, <strong style="color:#111827;">${userName}</strong></p>
    <h1 style="color:#111827;font-size:22px;margin:0 0 20px;">🚀 Foguete ativado!</h1>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">🚀</div>
      <p style="color:#9a3412;font-size:16px;font-weight:700;margin:0 0 4px;">Seu imóvel está no topo!</p>
      <p style="color:#c2410c;font-size:14px;margin:0;">Aparecendo em primeiro lugar nos resultados por <strong>${boostDays} dias</strong></p>
    </div>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${infoRow('🏠', 'Imóvel', propertyTitle)}
      ${infoRow('📅', 'Ativo até', expiresAt)}
      ${infoRow('📊', 'Duração', `${boostDays} dias`)}
    </table>

    ${btn(`${BASE_URL}/imoveis/${propertyId}`, 'Ver meu anúncio em destaque', '#ea580c')}
  `, `Seu imóvel está no topo por ${boostDays} dias!`)

  return send(to, `🚀 Foguete ativado! Seu imóvel está no topo por ${boostDays} dias`, html)
}

// ─── 8. Alerta — novo imóvel na busca salva ───────────────────────────────────

export async function sendPropertyAlertEmail(
  to: string,
  userName: string,
  searchName: string,
  properties: { id: string; title: string; price: number; city: string; state: string; type: string; image?: string }[],
  searchUrl: string
) {
  const formatPrice = (p: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(p)

  const propCards = properties.slice(0, 3).map(p => `
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
      <tr>
        ${p.image ? `<td style="width:90px;vertical-align:top;">
          <img src="${p.image}" alt="${p.title}" style="width:90px;height:70px;object-fit:cover;display:block;"/>
        </td>` : ''}
        <td style="padding:10px 12px;vertical-align:top;">
          <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:3px;line-height:1.3;">${p.title}</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:6px;">📍 ${p.city}/${p.state}</div>
          <div style="font-size:15px;font-weight:800;color:#4338ca;">${formatPrice(p.price)}</div>
        </td>
        <td style="padding:10px 12px;vertical-align:middle;text-align:right;">
          <a href="${BASE_URL}/imoveis/${p.id}" style="background:#4338ca;color:#fff;padding:7px 14px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700;">Ver →</a>
        </td>
      </tr>
    </table>
  `).join('')

  const html = layout(`
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Olá, <strong style="color:#111827;">${userName}</strong> 👋</p>
    <h1 style="color:#111827;font-size:22px;margin:0 0 6px;">Novos imóveis para você! 🏠</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">
      Encontramos <strong>${properties.length} imóvel${properties.length !== 1 ? 's' : ''}</strong>
      que combina${properties.length !== 1 ? 'm' : ''} com seu alerta <strong>"${searchName}"</strong>.
    </p>

    ${propCards}

    ${properties.length > 3 ? `
      <p style="text-align:center;color:#6b7280;font-size:13px;margin:4px 0 16px;">
        + ${properties.length - 3} imóvel${properties.length - 3 !== 1 ? 's' : ''} não exibido${properties.length - 3 !== 1 ? 's' : ''}
      </p>
    ` : ''}

    ${btn(searchUrl, `Ver todos os ${properties.length} imóveis`)}

    <p style="color:#9ca3af;font-size:11px;text-align:center;margin:8px 0 0;">
      Para pausar este alerta, acesse <a href="${BASE_URL}/alertas" style="color:#6b7280;">Meus Alertas</a>.
    </p>
  `, `${properties.length} novo${properties.length !== 1 ? 's' : ''} imóvel${properties.length !== 1 ? 'is' : ''} para "${searchName}"`)

  return send(to, `🏠 ${properties.length} novo${properties.length !== 1 ? 's imóveis' : ' imóvel'} no seu alerta "${searchName}"`, html)
}

// ─── 9. Contrato gerado ───────────────────────────────────────────────────────

export async function sendContractGeneratedEmail(
  to: string,
  userName: string,
  contractTitle: string,
  contractType: string,
  contractId: string
) {
  const typeMap: Record<string, string> = {
    PROMESSA_COMPRA_VENDA: 'Promessa de Compra e Venda',
    LOCACAO: 'Contrato de Locação',
    PERMUTA: 'Contrato de Permuta',
    CESSAO: 'Cessão de Direitos',
  }

  const html = layout(`
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Olá, <strong style="color:#111827;">${userName}</strong></p>
    <h1 style="color:#111827;font-size:22px;margin:0 0 20px;">📄 Contrato gerado com sucesso</h1>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#166534;font-size:15px;font-weight:700;margin:0 0 8px;">✅ Documento criado</p>
      <p style="color:#15803d;font-size:14px;margin:0;">${contractTitle}</p>
    </div>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${infoRow('📋', 'Tipo', typeMap[contractType] || contractType)}
      ${infoRow('📅', 'Criado em', new Date().toLocaleDateString('pt-BR'))}
      ${infoRow('⚖️', 'Status', 'Rascunho — aguardando assinaturas')}
    </table>

    <p style="color:#374151;font-size:14px;margin:0 0 16px;">
      Para dar validade jurídica máxima, recomendamos o reconhecimento de firmas em cartório após as assinaturas.
    </p>

    ${btn(`${BASE_URL}/contratos/${contractId}`, 'Visualizar e imprimir contrato', '#16a34a')}
  `, `Contrato gerado: ${contractTitle}`)

  return send(to, `📄 Contrato gerado: ${contractTitle}`, html)
}

// ─── 11. Novo lead de avaliação instantânea (para o admin) ──────────────────

export async function sendValuationLeadEmail(lead: {
  name: string
  email: string
  phone?: string | null
  type: string
  listingType: string
  city: string
  state: string
  neighborhood?: string | null
  area: number
  bedrooms?: number | null
  estimateMin: number
  estimateMax: number
}) {
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  const adminTo = process.env.EMAIL_FROM_ADMIN || 'contato@immovi.com.br'

  const html = layout(`
    <h1 style="color:#111827;font-size:22px;margin:0 0 20px;">💰 Novo lead de avaliação de imóvel</h1>

    <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="color:#3730a3;font-size:14px;font-weight:600;margin:0 0 4px;">Estimativa gerada</p>
      <p style="color:#4338ca;font-size:20px;font-weight:bold;margin:0;">${fmt(lead.estimateMin)} – ${fmt(lead.estimateMax)}</p>
    </div>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${infoRow('👤', 'Nome', lead.name)}
      ${infoRow('✉️', 'E-mail', lead.email)}
      ${infoRow('📱', 'Telefone', lead.phone || '—')}
      ${infoRow('🏠', 'Tipo', lead.type)}
      ${infoRow('📍', 'Local', `${lead.neighborhood ? lead.neighborhood + ', ' : ''}${lead.city} – ${lead.state}`)}
      ${infoRow('📐', 'Área', `${lead.area} m²`)}
    </table>

    ${divider}
    <p style="color:#374151;font-size:14px;text-align:center;margin:0;">
      Entre em contato para transformar esse lead em anúncio na plataforma.
    </p>
  `, `Novo lead de avaliação: ${lead.name}`)

  return send(adminTo, `💰 Novo lead de avaliação — ${lead.name}`, html)
}
