import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'
import { prisma } from '@/lib/prisma'

// Robôs de busca e monitores enchiam o registro de visitas sem dizer nada sobre gente
const ROBOS = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|uptime|curl|wget|python-requests|axios|postman/i

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl
  const agente = request.headers.get('user-agent') || ''

  if (!ROBOS.test(agente)) {
    event.waitUntil(
      prisma.pageView
        .create({
          data: {
            path: pathname,
            referrer: request.headers.get('referer') || null,
          },
        })
        .catch(() => {})
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    {
      source:
        '/((?!api|admin|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
