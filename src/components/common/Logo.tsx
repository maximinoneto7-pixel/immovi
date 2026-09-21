import { cn } from '@/lib/utils'

/**
 * Símbolo do Immovi em grade 32×32: casa cheia com a porta em arco e a janela
 * redonda formando um "i". Também usado em app/icon.tsx, app/apple-icon.tsx e
 * nos PNGs do PWA — ao alterar aqui, regere os ícones.
 */
export const LOGO_HOUSE_PATH =
  'M14.6 7.6Q16 6.4 17.4 7.6L24.2 13.3Q25 14 25 15.1V23Q25 24.5 23.5 24.5H18V19A2 2 0 0 0 14 19V24.5H8.5Q7 24.5 7 23V15.1Q7 14 7.8 13.3ZM16 11A2 2 0 1 0 16 15A2 2 0 1 0 16 11Z'

/** light: fundo claro · dark: fundo escuro (rodapé) · brand: sobre painéis índigo */
type Tone = 'light' | 'dark' | 'brand'
type Size = 'sm' | 'md' | 'lg'

const markTone: Record<Tone, string> = {
  light: 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm shadow-indigo-600/25',
  dark: 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white',
  brand: 'bg-white text-indigo-600 shadow-lg shadow-indigo-950/20',
}

const wordTone: Record<Tone, [string, string]> = {
  light: ['text-gray-900', 'text-indigo-600'],
  dark: ['text-white', 'text-indigo-400'],
  brand: ['text-white', 'text-indigo-200'],
}

const sizes: Record<Size, { mark: string; word: string; gap: string }> = {
  sm: { mark: 'w-8 h-8', word: 'text-xl', gap: 'gap-2' },
  md: { mark: 'w-9 h-9', word: 'text-[1.375rem]', gap: 'gap-2.5' },
  lg: { mark: 'w-12 h-12', word: 'text-3xl', gap: 'gap-3' },
}

export function LogoMark({ tone = 'light', className }: { tone?: Tone; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 rounded-[28%]', markTone[tone], className)}>
      <svg viewBox="0 0 32 32" className="w-full h-full" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d={LOGO_HOUSE_PATH} />
      </svg>
    </span>
  )
}

export function Wordmark({ tone = 'light', className }: { tone?: Tone; className?: string }) {
  const [base, accent] = wordTone[tone]
  return (
    <span className={cn('font-brand font-extrabold tracking-tight leading-none', base, className)}>
      Immo<span className={accent}>vi</span>
    </span>
  )
}

interface LogoProps {
  tone?: Tone
  size?: Size
  className?: string
  /** Ex.: 'hidden sm:block' para esconder o nome em telas pequenas */
  wordmarkClassName?: string
}

export default function Logo({ tone = 'light', size = 'md', className, wordmarkClassName }: LogoProps) {
  const s = sizes[size]
  return (
    <span className={cn('flex items-center', s.gap, className)}>
      <LogoMark tone={tone} className={s.mark} />
      <Wordmark tone={tone} className={cn(s.word, wordmarkClassName)} />
    </span>
  )
}
