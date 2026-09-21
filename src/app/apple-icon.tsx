import { ImageResponse } from 'next/og'
import { LOGO_HOUSE_PATH } from '@/components/common/Logo'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Sem cantos arredondados: o iOS aplica a própria máscara
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundImage: 'linear-gradient(135deg, #6366f1, #4338ca)',
        }}
      >
        <svg width="180" height="180" viewBox="0 0 32 32">
          <path fill="#ffffff" fillRule="evenodd" d={LOGO_HOUSE_PATH} />
        </svg>
      </div>
    ),
    { ...size }
  )
}
