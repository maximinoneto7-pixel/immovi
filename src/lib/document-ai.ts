import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

const keyIndex: Record<string, number> = { claude: 0, gemini: 0 }

function peekKeys(provider: 'claude' | 'gemini'): string[] {
  const prefix = provider === 'claude' ? 'ANTHROPIC_API_KEY' : 'GOOGLE_AI_API_KEY'
  return collectKeys(prefix)
}

export function getKeyCount(provider: 'claude' | 'gemini'): number {
  return peekKeys(provider).length
}

// ─── Provedor ativo ─────────────────────────────────────────────────────────

export type AIProvider = 'claude' | 'gemini' | 'none'

export function getActiveProvider(): AIProvider {
  if (peekKeys('claude').length) return 'claude'
  if (peekKeys('gemini').length) return 'gemini'
  return 'none'
}

export const PROVIDER_INFO = {
  claude: {
    name: 'Claude Opus 4.8',
    provider: 'Anthropic',
    tier: 'Pago',
    quality: 'Máxima — leitura de documentos complexos, manuscritos, baixa resolução',
    limits: { rpm: 50, rpd: 5000, notes: '~$0,015 por verificação. Sem limite diário com créditos.' },
    setup: 'console.anthropic.com → API Keys',
    envVars: ['ANTHROPIC_API_KEY', 'ANTHROPIC_API_KEY_1', '… até ANTHROPIC_API_KEY_5'],
    color: 'violet',
  },
  gemini: {
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    tier: 'Gratuito',
    quality: 'Boa — documentos legíveis, ótimo custo-benefício para começar',
    limits: { rpm: 15, rpd: 1500, notes: '1.500 verificações/dia grátis. Sem cartão de crédito.' },
    setup: 'aistudio.google.com → Get API Key',
    envVars: ['GOOGLE_AI_API_KEY', 'GOOGLE_AI_API_KEY_1', '… até GOOGLE_AI_API_KEY_5'],
    color: 'blue',
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

// ─── Claude (pago) — rotatividade automática entre chaves ──────────────────

async function analyzeWithClaude(fileBase64: string, mediaType: string, sellerName: string) {
  const keys = peekKeys('claude')
  if (!keys.length) throw new Error('NENHUMA_CHAVE')

  let lastError: any
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[(keyIndex.claude + attempt) % keys.length]
    try {
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

      // Avança o índice só quando sucesso
      keyIndex.claude = (keyIndex.claude + attempt + 1) % keys.length
      const text = response.content.filter((b) => b.type === 'text').map((b: any) => b.text).join('')
      return buildResult(parseJSON(text))
    } catch (err: any) {
      lastError = err
      // 429 = rate limit → tenta próxima chave; outros erros abortam
      if (!err?.status || err.status !== 429) break
    }
  }
  throw lastError
}

// ─── Gemini (gratuito) — rotatividade automática entre chaves ───────────────

async function analyzeWithGemini(fileBase64: string, mediaType: string, sellerName: string) {
  const keys = peekKeys('gemini')
  if (!keys.length) throw new Error('NENHUMA_CHAVE')

  let lastError: any
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[(keyIndex.gemini + attempt) % keys.length]
    try {
      const genAI = new GoogleGenerativeAI(key)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      const result = await model.generateContent([
        buildPrompt(sellerName),
        { inlineData: { data: fileBase64, mimeType: mediaType } },
      ])

      keyIndex.gemini = (keyIndex.gemini + attempt + 1) % keys.length
      return buildResult(parseJSON(result.response.text()))
    } catch (err: any) {
      lastError = err
      // 429 ou RESOURCE_EXHAUSTED → tenta próxima chave
      const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED')
      if (!isRateLimit) break
    }
  }
  throw lastError
}

// ─── Função pública ─────────────────────────────────────────────────────────

export async function analyzePropertyDocument(
  fileBase64: string,
  mediaType: string,
  sellerName: string
): Promise<{ analysis: DocumentAnalysis; ownerMatch: boolean; ownerMatchDetails: string; provider: AIProvider }> {
  const provider = getActiveProvider()

  if (provider === 'claude') {
    const result = await analyzeWithClaude(fileBase64, mediaType, sellerName)
    return { ...result, provider }
  }

  if (provider === 'gemini') {
    const result = await analyzeWithGemini(fileBase64, mediaType, sellerName)
    return { ...result, provider }
  }

  throw new Error('NENHUMA_CHAVE')
}
