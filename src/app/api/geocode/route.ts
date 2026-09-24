// Geocoding via Nominatim (OpenStreetMap) — gratuito, sem API key.
//
// A rota é pública porque o mapa da busca precisa dela sem login. Para o Nominatim
// não cortar o site inteiro por excesso de chamadas, o resultado fica guardado em
// memória por um dia e cada IP tem um teto por minuto.

const CACHE_MS = 24 * 60 * 60 * 1000
const JANELA_MS = 60 * 1000
const POR_MINUTO = 30

type Coordenada = { lat: number | null; lng: number | null; displayName?: string }

const cache = new Map<string, { valor: Coordenada; em: number }>()
const usos = new Map<string, { contagem: number; zera: number }>()

function passouDoLimite(ip: string) {
  const agora = Date.now()
  const atual = usos.get(ip)
  if (!atual || atual.zera < agora) {
    usos.set(ip, { contagem: 1, zera: agora + JANELA_MS })
    return false
  }
  atual.contagem++
  return atual.contagem > POR_MINUTO
}

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido'
  if (passouDoLimite(ip)) {
    return Response.json({ error: 'Muitas consultas seguidas. Tente de novo em um minuto.' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const city = searchParams.get('city')
  const state = searchParams.get('state')

  const query = address
    ? `${address}, ${city}, ${state}, Brasil`
    : `${city}, ${state}, Brasil`

  const guardado = cache.get(query)
  if (guardado && Date.now() - guardado.em < CACHE_MS) {
    return Response.json(guardado.valor)
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}&countrycodes=br`,
      {
        headers: {
          'User-Agent': 'Immovi/1.0 (contato@immovi.com.br)',
          'Accept-Language': 'pt-BR',
        },
      }
    )

    if (!res.ok) throw new Error('Nominatim error')

    const data = await res.json()

    const valor: Coordenada = data.length
      ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name }
      : { lat: null, lng: null }

    cache.set(query, { valor, em: Date.now() })
    return Response.json(valor)
  } catch {
    return Response.json({ lat: null, lng: null })
  }
}
