import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import { SITE_URL } from '@/lib/site'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Só o peso do logotipo (componente Logo)
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: '800',
})

export const metadata: Metadata = {
  // Base para os links absolutos das prévias de compartilhamento (og:image, canonical)
  metadataBase: new URL(SITE_URL),
  title: 'Immovi — Compre, venda e alugue com confiança',
  description:
    'Plataforma imobiliária humana e segura. Conectamos compradores e vendedores diretamente, com histórias reais, sem comissão obrigatória e com contrato pronto na plataforma.',
  keywords: 'imóveis, comprar casa, vender apartamento, aluguel, fazenda, terreno',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Immovi' },
  formatDetection: { telephone: false },
  other: { 'mobile-web-app-capable': 'yes' },
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
