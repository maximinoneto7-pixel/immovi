import Anthropic from '@anthropic-ai/sdk'

// ─── Rotatividade de chaves (até 5 por provedor) ────────────────────────────

function collectKeys(prefix: string): string[] {
  const keys: string[] = []
  const base = process.env[prefix]
  if (base) keys.push(base)
  for (let i = 1; i <= 5; i++) {
    const k = process.env[`${prefix}_${i}`]
    if (k) keys.push(k)
  }
  return [...new Set(keys)]
}

type Provider = 'grok' | 'gemini' | 'claude'

const KEY_PREFIX: Record<Provider, string> = {
  grok: 'XAI_API_KEY',
  gemini: 'GOOGLE_AI_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
}

const keyIndex: Record<Provider, number> = { grok: 0, gemini: 0, claude: 0 }

function peekKeys(provider: Provider): string[] {
  return collectKeys(KEY_PREFIX[provider])
}

export function getKeyCount(provider: Provider): number {
  return peekKeys(provider).length
}

// Modelos configuráveis sem novo deploy de código (a Vercel só precisa reiniciar)
const GROK_MODEL = process.env.XAI_MODEL || 'grok-4.7'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

// ─── Provedores: ordem de uso e formatos aceitos ───────────────────────────
// Grok é o principal; Gemini é a reserva e também lê PDF e WebP, que o Grok não aceita.

const PROVIDER_ORDER: Provider[] = ['grok', 'gemini', 'claude']

const ACCEPTS: Record<Provider, string[]> = {
  grok: ['image/jpeg', 'image/png'],
  gemini: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  claude: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
}

export type AIProvider = Provider | 'none'

/** Primeiro provedor configurado (o que o painel mostra como principal) */
export function getActiveProvider(): AIProvider {
  return PROVIDER_ORDER.find((p) => peekKeys(p).length) ?? 'none'
}

export const PROVIDER_INFO = {
  grok: {
    name: `Grok (${GROK_MODEL})`,
    provider: 'xAI',
    tier: 'Pago — principal',
    quality: 'Lê fotos de documentos (JPG e PNG); PDFs vão para a reserva',
    limits: { rpm: 60, rpd: 0, notes: 'Cobrado por uso nos créditos da conta xAI.' },
    setup: 'console.x.ai → API Keys',
    envVars: ['XAI_API_KEY', 'XAI_API_KEY_1', '… até XAI_API_KEY_5'],
    color: 'gray',
  },
  gemini: {
    name: `Gemini (${GEMINI_MODEL})`,
    provider: 'Google',
    tier: 'Pago — reserva',
    quality: 'Lê PDF e imagens; assume quando o Grok falha ou o arquivo é PDF/WebP',
    limits: { rpm: 60, rpd: 0, notes: 'Plano pago do Google AI Studio (o gratuito pode usar os dados para treino).' },
    setup: 'aistudio.google.com → Get API Key → ativar faturamento',
    envVars: ['GOOGLE_AI_API_KEY', 'GOOGLE_AI_API_KEY_1', '… até GOOGLE_AI_API_KEY_5'],
    color: 'blue',
  },
  claude: {
    name: 'Claude Opus 4.8',
    provider: 'Anthropic',
    tier: 'Pago — opcional',
    quality: 'Máxima — leitura de documentos complexos, manuscritos, baixa resolução',
    limits: { rpm: 50, rpd: 5000, notes: '~$0,015 por verificação. Sem limite diário com créditos.' },
    setup: 'console.anthropic.com → API Keys',
    envVars: ['ANTHROPIC_API_KEY', 'ANTHROPIC_API_KEY_1', '… até ANTHROPIC_API_KEY_5'],
    color: 'violet',
  },
  none: {
    name: 'Nenhum configurado',
    provider: '—',
    tier: '—',
    quality: '—',
    limits: { rpm: 0, rpd: 0, notes: 'Configure uma chave de API para ativar.' },
    setup: '',
    envVars: [],
    color: 'gray',
  },
} as const

// ─── Prompt e parsers ───────────────────────────────────────────────────────

function buildPrompt(sellerName: string) {
  return `Você é um especialista em documentos imobiliários brasileiros.
Analise este documento (matrícula, IPTU, escritura ou similar) e extraia todas as informações.

Nome do vendedor para comparação: "${sellerName}"

Retorne EXCLUSIVAMENTE um JSON válido (sem markdown):
{
  "owners": ["Nome do proprietário 1"],
  "cpfs": ["CPF do proprietário 1"],
  "registrationNumber": "matrícula ou inscrição",
  "area": "área total com unidade",
  "address": "endereço completo",
  "city": "cidade",
  "state": "UF",
  "liens": ["ônus/gravames: hipoteca, penhora, usufruto"],
  "documentDate": "data do documento",
  "documentType": "tipo do documento",
  "isValid": true,
  "confidence": "alta",
  "ownerMatchAnalysis": "SIM/NÃO/POSSIVELMENTE — justificativa de se '${sellerName}' é proprietário",
  "ownerMatch": true,
  "observations": "observações relevantes",
  "rawSummary": "resumo em 2-3 frases"
}
REGRAS: confidence = alta/media/baixa. ownerMatch = true se nome confere (aceite variações/abreviações).
Retorne APENAS o JSON, sem texto adicional.`
}

function parseJSON(text: string) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('IA não retornou JSON válido. Use uma imagem mais nítida.')
  return JSON.parse(match[0])
}

function buildResult(parsed: any) {
  const analysis: DocumentAnalysis = {
    owners: parsed.owners || [],
    cpfs: parsed.cpfs || [],
    registrationNumber: parsed.registrationNumber || '',
    area: parsed.area || '',
    address: parsed.address || '',
    city: parsed.city || '',
    state: parsed.state || '',
    liens: parsed.liens || [],
    documentDate: parsed.documentDate || '',
    documentType: parsed.documentType || 'Documento imobiliário',
    isValid: parsed.isValid !== false,
    confidence: parsed.confidence || 'media',
    observations: parsed.observations || '',
    rawSummary: parsed.rawSummary || '',
  }
  return {
    analysis,
    ownerMatch: !!parsed.ownerMatch,
    ownerMatchDetails: parsed.ownerMatchAnalysis || '',
  }
}

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface DocumentAnalysis {
  owners: string[]
  cpfs: string[]
  registrationNumber: string
  area: string
  address: string
  city: string
  state: string
  liens: string[]
  documentDate: string
  documentType: string
  isValid: boolean
  confidence: 'alta' | 'media' | 'baixa'
  observations: string
  rawSummary: string
}

class ProviderError extends Error {
  constructor(message: string, public status?: number) { super(message) }
}

/** Tenta cada chave do provedor; 429 (limite) passa para a próxima chave */
async function withKeyRotation<T>(provider: Provider, call: (key: string) => Promise<T>): Promise<T> {
  const keys = peekKeys(provider)
  if (!keys.length) throw new Error('NENHUMA_CHAVE')

  let lastError: any
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[(keyIndex[provider] + attempt) % keys.length]
    try {
      const result = await call(key)
      keyIndex[provider] = (keyIndex[provider] + attempt + 1) % keys.length
      return result
    } catch (err: any) {
      lastError = err
      const isRateLimit = err?.status === 429 || /429|RESOURCE_EXHAUSTED/.test(err?.message || '')
      if (!isRateLimit) break
    }
  }
  throw lastError
}

// ─── Grok (xAI) — principal ─────────────────────────────────────────────────

async function analyzeWithGrok(fileBase64: string, mediaType: string, sellerName: string) {
  return withKeyRotation('grok', async (key) => {
    const res = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROK_MODEL,
        input: [{
          role: 'user',
          content: [
            { type: 'input_image', image_url: `data:${mediaType};base64,${fileBase64}`, detail: 'high' },
            { type: 'input_text', text: buildPrompt(sellerName) },
          ],
        }],
      }),
    })
    const data: any = await res.json().catch(() => ({}))
    if (!res.ok) throw new ProviderError(`xAI ${res.status}: ${data?.error?.message || data?.error || 'erro'}`, res.status)

    const text: string = data.output_text
      ?? (data.output || []).flatMap((o: any) => o.content || []).filter((c: any) => c.type === 'output_text').map((c: any) => c.text).join('')
    return buildResult(parseJSON(text || ''))
  })
}

// ─── Gemini (Google) — reserva ──────────────────────────────────────────────

async function analyzeWithGemini(fileBase64: string, mediaType: string, sellerName: string) {
  return withKeyRotation('gemini', async (key) => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: buildPrompt(sellerName) },
              { inline_data: { mime_type: mediaType, data: fileBase64 } },
            ],
          }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
      },
    )
    const data: any = await res.json().catch(() => ({}))
    if (!res.ok) throw new ProviderError(`Gemini ${res.status}: ${data?.error?.message || 'erro'}`, res.status)

    const text: string = (data.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('')
    return buildResult(parseJSON(text))
  })
}

// ─── Claude (Anthropic) — opcional, só se houver chave ──────────────────────

async function analyzeWithClaude(fileBase64: string, mediaType: string, sellerName: string) {
  return withKeyRotation('claude', async (key) => {
    const client = new Anthropic({ apiKey: key })
    const contentBlock = mediaType === 'application/pdf'
      ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: fileBase64 } }
      : { type: 'image' as const, source: { type: 'base64' as const, media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp', data: fileBase64 } }

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: [contentBlock as any, { type: 'text', text: buildPrompt(sellerName) }] }],
    })
    const text = response.content.filter((b) => b.type === 'text').map((b: any) => b.text).join('')
    return buildResult(parseJSON(text))
  })
}

const ANALYZERS: Record<Provider, typeof analyzeWithGrok> = {
  grok: analyzeWithGrok,
  gemini: analyzeWithGemini,
  claude: analyzeWithClaude,
}

// ─── Função pública ─────────────────────────────────────────────────────────

/**
 * Lê o documento com o primeiro provedor configurado que aceita o formato;
 * se ele falhar, passa para o próximo (Grok → Gemini → Claude).
 */
export async function analyzePropertyDocument(
  fileBase64: string,
  mediaType: string,
  sellerName: string
): Promise<{ analysis: DocumentAnalysis; ownerMatch: boolean; ownerMatchDetails: string; provider: AIProvider }> {
  const candidates = PROVIDER_ORDER.filter((p) => peekKeys(p).length && ACCEPTS[p].includes(mediaType))
  if (!candidates.length) throw new Error('NENHUMA_CHAVE')

  let lastError: unknown
  for (const provider of candidates) {
    try {
      const result = await ANALYZERS[provider](fileBase64, mediaType, sellerName)
      return { ...result, provider }
    } catch (err) {
      console.error(`[document-ai] ${provider} falhou:`, (err as Error).message)
      lastError = err
    }
  }
  throw lastError
}
