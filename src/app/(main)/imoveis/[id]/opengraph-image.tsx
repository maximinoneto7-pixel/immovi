import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'
import { LOGO_HOUSE_PATH } from '@/components/common/Logo'
import { formatCurrency, formatArea, isRural, mainArea, PROPERTY_TYPES } from '@/lib/utils'
import { absoluteUrl } from '@/lib/site'

// Imagem que WhatsApp, Facebook, Telegram e Google mostram quando alguém compartilha o anúncio
export const alt = 'Anúncio na Immovi'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/jpeg'

/**
 * O ImageResponse devolve PNG, e uma foto em PNG passa de 1 MB — acima do que o
 * WhatsApp aceita para mostrar a prévia. Reempacota em JPEG (cerca de 10x menor).
 */
async function asJpeg(image: ImageResponse): Promise<Response> {
  // Carregado só aqui: o sharp é nativo e, importado no topo, atrapalha a geração dos ícones
  const { default: sharp } = await import('sharp')
  const png = Buffer.from(await image.arrayBuffer())
  const jpeg = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer()
  const headers = new Headers(image.headers)
  headers.set('Content-Type', 'image/jpeg')
  headers.delete('Content-Length')
  return new Response(new Uint8Array(jpeg), { headers })
}

/** Baixa a fonte da marca em TTF (sem User-Agent o Google devolve truetype, que é o que o satori lê) */
async function brandFont(weight: 500 | 800): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@${weight}`, {
      signal: AbortSignal.timeout(3000),
    }).then((r) => r.text())
    const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('truetype'\)/)?.[1]
    if (!url) return null
    return await fetch(url, { signal: AbortSignal.timeout(3000) }).then((r) => r.arrayBuffer())
  } catch {
    return null
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      title: true, price: true, rentPrice: true, listingType: true, type: true,
      area: true, builtArea: true, city: true, state: true, status: true,
      owner: { select: { official: true } },
      images: { orderBy: { order: 'asc' }, select: { url: true, isCover: true } },
    },
  })

  const [bold, regular] = await Promise.all([brandFont(800), brandFont(500)])
  const fonts = bold && regular
    ? [
        { name: 'Jakarta', data: bold, weight: 800 as const, style: 'normal' as const },
        { name: 'Jakarta', data: regular, weight: 500 as const, style: 'normal' as const },
      ]
    : undefined
  const font = fonts ? 'Jakarta' : undefined

  // Anúncio apagado ou inexistente: cartão só com a marca
  if (!property || property.status === 'DELETED') {
    return asJpeg(new ImageResponse(
      (
        <div
          style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 24,
            backgroundImage: 'linear-gradient(135deg, #6366f1, #312e81)', color: '#ffffff',
            fontFamily: font,
          }}
        >
          <svg width="120" height="120" viewBox="0 0 32 32">
            <path fill="#ffffff" fillRule="evenodd" d={LOGO_HOUSE_PATH} />
          </svg>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1 }}>immovi</div>
          <div style={{ fontSize: 30, color: '#c7d2fe' }}>Compre, venda e alugue com confiança</div>
        </div>
      ),
      { ...size, fonts },
    ))
  }

  const cover = property.images.find((img) => img.isCover) || property.images[0]
  const coverUrl = cover ? absoluteUrl(cover.url) : null

  const price = property.listingType === 'RENT' ? property.rentPrice : property.price
  const priceLabel = `${formatCurrency(price || 0)}${property.listingType === 'RENT' ? '/mês' : ''}`

  const area = mainArea(property)
  const areaLabel = area ? formatArea(area, property.type) : null
  const builtLabel = property.type === 'HOUSE' && property.builtArea ? `${formatArea(property.builtArea)} construídos` : null
  const meta = [
    isRural(property.type) ? areaLabel : builtLabel || areaLabel,
    PROPERTY_TYPES[property.type] || property.type,
    `${property.city} – ${property.state}`,
  ].filter(Boolean).join(' · ')

  const title = property.title.length > 58 ? `${property.title.slice(0, 57)}…` : property.title

  return asJpeg(new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', backgroundImage: 'linear-gradient(135deg, #6366f1, #312e81)', fontFamily: font }}>
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" width={1200} height={630} style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' }} />
        )}

        {/* Escurece a base para o texto ficar legível sobre qualquer foto */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex',
            backgroundImage: 'linear-gradient(to top, rgba(12,14,30,0.92) 8%, rgba(12,14,30,0.45) 48%, rgba(12,14,30,0.10) 100%)',
          }}
        />

        <div style={{ position: 'absolute', top: 44, left: 52, right: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, display: 'flex', borderRadius: 16, backgroundImage: 'linear-gradient(135deg, #6366f1, #4338ca)' }}>
              <svg width="56" height="56" viewBox="0 0 32 32">
                <path fill="#ffffff" fillRule="evenodd" d={LOGO_HOUSE_PATH} />
              </svg>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#ffffff', letterSpacing: -1 }}>immovi</div>
          </div>

          {property.owner.official && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#4f46e5', color: '#ffffff', borderRadius: 12, padding: '10px 18px', fontSize: 26, fontWeight: 800 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12.5 9.5 18 20 6" />
              </svg>
              Oficial Immovi
            </div>
          )}
        </div>

        <div style={{ position: 'absolute', left: 52, right: 52, bottom: 48, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, fontWeight: 800, color: '#ffffff', letterSpacing: -2, lineHeight: 1 }}>{priceLabel}</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#ffffff', marginTop: 14 }}>{title}</div>
          <div style={{ fontSize: 28, fontWeight: 500, color: '#d5d8ee', marginTop: 8 }}>{meta}</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  ))
}
