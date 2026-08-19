import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Immovi — Compre, venda e alugue com confiança',
  description:
    'Plataforma imobiliária humana e segura. Conectamos compradores e vendedores diretamente, com histórias reais, perfis verificados e negociações transparentes.',
  keywords: 'imóveis, comprar casa, vender apartamento, aluguel, fazenda, terreno',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Immovi' },
  formatDetection: { telephone: false },
  other: { 'mobile-web-app-capable': 'yes' },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f7f9fc] text-[#1a202c]">
        {children}
      </body>
    </html>
  )
}
