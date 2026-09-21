import { ImageResponse } from 'next/og'
import { LOGO_HOUSE_PATH } from '@/components/common/Logo'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundImage: 'linear-gradient(135deg, #6366f1, #4338ca)',
          borderRadius: 9,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <path fill="#ffffff" fillRule="evenodd" d={LOGO_HOUSE_PATH} />
        </svg>
      </div>
    ),
    { ...size }
  )
}
