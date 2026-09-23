import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Diz aos buscadores o que indexar e onde está o mapa do site.
// Áreas de conta e administração ficam de fora: não têm nada a oferecer na busca.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/perfil', '/mensagens', '/pagamentos', '/contratos', '/favoritos', '/alertas'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
