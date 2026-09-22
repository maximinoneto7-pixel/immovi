import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { getActiveProvider, getKeyCount, PROVIDER_INFO } from '@/lib/document-ai'
import { isEmailConfigured } from '@/lib/email'
import BackupPanel from '@/components/admin/BackupPanel'
import {
  Shield, ArrowLeft, CheckCircle2, XCircle, Key,
  Database, Zap, Crown, Info, ExternalLink, Mail,
} from 'lucide-react'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default async function SistemaPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/')

  const activeProvider = getActiveProvider()
  const emailConfigured = isEmailConfigured()
  const claudeKeys = getKeyCount('claude')
  const geminiKeys = getKeyCount('gemini')
  const grokKeys = getKeyCount('grok')

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/admin" className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sistema e Configurações</h1>
              <p className="text-sm text-gray-500">Provedores de IA, chaves de API e backups</p>
            </div>
          </div>

          {/* ─── PROVEDORES DE IA ─────────────────────────────────────────── */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" />
              Provedores de IA para Verificação de Documentos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Grok — Principal */}
              <div className={`bg-white rounded-2xl border-2 p-5 ${activeProvider === 'grok' ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
                      <span className="text-sm font-bold text-white">X</span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{PROVIDER_INFO.grok.name}</div>
                      <div className="text-xs text-gray-500">{PROVIDER_INFO.grok.provider}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 bg-gray-900 text-white text-xs font-bold rounded-full">PRINCIPAL</span>
                    {activeProvider === 'grok' && (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">ATIVO</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-600 mb-3">{PROVIDER_INFO.grok.quality}</p>

                <div className="space-y-1.5 mb-3">
                  {[null, 1, 2, 3, 4, 5].map((n) => {
                    const envKey = n === null ? 'XAI_API_KEY' : `XAI_API_KEY_${n}`
                    const isActive = (n === null && grokKeys > 0) || (n !== null && grokKeys > n)
                    return (
                      <div key={envKey} className="flex items-center gap-2 text-xs">
                        {isActive
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                        }
                        <code className={`font-mono ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>{envKey}</code>
                        {isActive && <span className="text-green-600 font-medium">configurada</span>}
                      </div>
                    )
                  })}
                </div>

                <p className="text-xs text-amber-800 bg-amber-50 rounded-xl p-3">
                  No console da xAI, não ative o compartilhamento de dados em troca de créditos grátis: os documentos têm nome e CPF.
                </p>

                <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-1.5 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Obter chave no console da xAI
                </a>
              </div>

              {/* Gemini — Reserva */}
              <div className={`bg-white rounded-2xl border-2 p-5 ${activeProvider === 'gemini' ? 'border-indigo-400' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <span className="text-sm font-bold text-indigo-600">G</span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{PROVIDER_INFO.gemini.name}</div>
                      <div className="text-xs text-gray-500">{PROVIDER_INFO.gemini.provider}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">RESERVA</span>
                    {activeProvider === 'gemini' && (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">ATIVO</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-600 mb-3">{PROVIDER_INFO.gemini.quality}</p>

                {/* Status das chaves */}
                <div className="space-y-1.5 mb-3">
                  {[null, 1, 2, 3, 4, 5].map((n) => {
                    const envKey = n === null ? 'GOOGLE_AI_API_KEY' : `GOOGLE_AI_API_KEY_${n}`
                    const hasKey = geminiKeys > (n === null ? 0 : n)
                    const isActive = (n === null && geminiKeys > 0) || (n !== null && geminiKeys > n)
                    return (
                      <div key={envKey} className="flex items-center gap-2 text-xs">
                        {isActive
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                        }
                        <code className={`font-mono ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>{envKey}</code>
                        {isActive && <span className="text-green-600 font-medium">configurada</span>}
                      </div>
                    )
                  })}
                </div>

                <p className="text-xs text-indigo-800 bg-indigo-50 rounded-xl p-3">
                  Use o plano pago (com faturamento ativo): no gratuito o Google pode usar os documentos enviados para melhorar os produtos dele.
                </p>

                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Obter chave no Google AI Studio
                </a>
              </div>

              {/* Claude — Pago */}
              <div className={`bg-white rounded-2xl border-2 p-5 ${activeProvider === 'claude' ? 'border-violet-400' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                      <Crown className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{PROVIDER_INFO.claude.name}</div>
                      <div className="text-xs text-gray-500">{PROVIDER_INFO.claude.provider}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">PREMIUM</span>
                    {activeProvider === 'claude' && (
                      <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">ATIVO</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-600 mb-3">{PROVIDER_INFO.claude.quality}</p>

                {/* Status das chaves */}
                <div className="space-y-1.5 mb-3">
                  {[null, 1, 2, 3, 4, 5].map((n) => {
                    const envKey = n === null ? 'ANTHROPIC_API_KEY' : `ANTHROPIC_API_KEY_${n}`
                    const isActive = (n === null && claudeKeys > 0) || (n !== null && claudeKeys > n)
                    return (
                      <div key={envKey} className="flex items-center gap-2 text-xs">
                        {isActive
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                        }
                        <code className={`font-mono ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>{envKey}</code>
                        {isActive && <span className="text-green-600 font-medium">configurada</span>}
                      </div>
                    )
                  })}
                </div>

                {/* Limites */}
                <div className="bg-violet-50 rounded-xl p-3 space-y-1">
                  <div className="text-xs font-semibold text-violet-800">Com {claudeKeys} chave{claudeKeys !== 1 ? 's'  : ''}</div>
                  <div className="flex justify-between text-xs text-violet-700">
                    <span>Por minuto:</span>
                    <span className="font-bold">{(claudeKeys * 50).toLocaleString('pt-BR')} req</span>
                  </div>
                  <div className="flex justify-between text-xs text-violet-700">
                    <span>Por dia:</span>
                    <span className="font-bold">Ilimitado (créditos)</span>
                  </div>
                  <div className="flex justify-between text-xs text-violet-700">
                    <span>Custo:</span>
                    <span className="font-bold">~$0,015/verificação</span>
                  </div>
                </div>

                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-1.5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Obter chave no console.anthropic.com
                </a>
              </div>
            </div>

            {/* Lógica de prioridade */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1">
                <p className="font-semibold">Como o sistema escolhe o provedor:</p>
                <p>1. Se <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> estiver configurado → usa Claude (melhor qualidade)</p>
                <p>2. Se não → usa Gemini (gratuito)</p>
                <p>3. Se nenhum → verificação desabilitada com mensagem de configuração</p>
                <p className="font-semibold mt-2">Rotatividade automática com rate limit:</p>
                <p>Quando uma chave atinge o limite, o sistema troca automaticamente para a próxima (KEY_1 → KEY_2 → …). Com 5 chaves Gemini = 7.500 verificações gratuitas/dia.</p>
              </div>
            </div>

            {/* Como configurar */}
            <div className="mt-4 bg-gray-900 rounded-2xl p-4 text-sm font-mono text-green-400 overflow-x-auto">
              <p className="text-gray-500 mb-2"># Adicione no arquivo .env (C:\Users\SERVIDOR MAX\immovi\.env)</p>
              <p className="text-amber-400"># OPÇÃO GRATUITA — Google Gemini (1.500/dia por chave)</p>
              <p>GOOGLE_AI_API_KEY="AIza..."</p>
              <p>GOOGLE_AI_API_KEY_1="AIza..."  <span className="text-gray-500"># opcional — aumenta o limite</span></p>
              <p className="mt-2 text-amber-400"># OPÇÃO PREMIUM — Claude Opus (qualidade máxima)</p>
              <p>ANTHROPIC_API_KEY="sk-ant-..."</p>
              <p className="text-gray-500 mt-2"># Reinicie o servidor após adicionar as chaves</p>
            </div>
          </section>

          {/* ─── E-MAIL ──────────────────────────────────────────────────────── */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-500" />
              Notificações por E-mail (Resend)
            </h2>
            <div className={`flex items-start gap-3 p-4 rounded-2xl border mb-4 ${emailConfigured ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              {emailConfigured
                ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                : <XCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />}
              <div>
                <div className={`font-semibold text-sm ${emailConfigured ? 'text-green-900' : 'text-amber-900'}`}>
                  {emailConfigured ? '✅ E-mails ativos — Resend configurado' : '⚠️ E-mails em modo dev (aparecem no console)'}
                </div>
                <p className={`text-xs mt-0.5 ${emailConfigured ? 'text-green-700' : 'text-amber-700'}`}>
                  {emailConfigured
                    ? 'Boas-vindas, novas mensagens, verificação de documentos e contratos estão sendo enviados.'
                    : 'Sem RESEND_API_KEY, os e-mails são logados no terminal. Gratuito: 3.000 e-mails/mês.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {[
                { emoji: '👋', label: 'Boas-vindas', desc: 'Enviado ao novo usuário após cadastro' },
                { emoji: '💬', label: 'Nova mensagem', desc: 'Quando alguém envia mensagem no chat' },
                { emoji: '🎯', label: 'Interesse no imóvel', desc: 'Primeiro contato com o anunciante' },
                { emoji: '🛡️', label: 'Verificação de documento', desc: 'Resultado da análise por IA' },
                { emoji: '👑', label: 'Plano ativado', desc: 'Confirmação de assinatura' },
                { emoji: '⏰', label: 'Plano expirando', desc: 'Aviso 3 dias antes do vencimento' },
                { emoji: '🚀', label: 'Foguete ativado', desc: 'Anúncio em destaque confirmado' },
                { emoji: '📄', label: 'Contrato gerado', desc: 'Confirmação de emissão do contrato' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-xl">{item.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto flex-shrink-0" />
                </div>
              ))}
            </div>

            {!emailConfigured && (
              <div className="bg-gray-900 rounded-2xl p-4 text-sm font-mono text-green-400">
                <p className="text-gray-500 mb-2"># 1. Crie conta gratuita em resend.com</p>
                <p className="text-gray-500"># 2. Adicione no .env:</p>
                <p>RESEND_API_KEY="re_..."</p>
                <p>EMAIL_FROM="Immovi &lt;noreply@seudominio.com.br&gt;"</p>
                <p className="text-gray-500 mt-2"># 3. Reinicie o servidor</p>
              </div>
            )}
          </section>

          {/* ─── BACKUP ──────────────────────────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-green-500" />
              Backup do Banco de Dados
            </h2>
            <BackupPanel />
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
