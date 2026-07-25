import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Inkwell — every read pays the writer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#faf9f7',
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontStyle: 'italic',
            color: '#1c1917',
            display: 'flex',
          }}
        >
          Inkwell
        </div>
        <div style={{ fontSize: 34, color: '#145c43', marginTop: 20, display: 'flex' }}>
          Every read pays the writer.
        </div>
      </div>
    ),
    { ...size }
  )
}
