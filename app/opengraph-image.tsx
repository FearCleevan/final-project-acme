import { ImageResponse } from 'next/og'

export const alt = 'Acme Vintage Supply — Authentic Antique Oil Lamp Parts'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1E2022',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, "Times New Roman", serif',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Outer border frame */}
        <div style={{ position: 'absolute', inset: 24, border: '1px solid rgba(194,155,71,0.35)', display: 'flex' }} />

        {/* Corner marks */}
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
          <div
            key={pos}
            style={{
              position: 'absolute',
              ...(pos.includes('top') ? { top: 36 } : { bottom: 36 }),
              ...(pos.includes('left') ? { left: 36 } : { right: 36 }),
              color: '#C29B47',
              fontSize: 18,
              display: 'flex',
              opacity: 0.8,
            }}
          >
            ✦
          </div>
        ))}

        {/* Eyebrow label */}
        <div
          style={{
            color: '#C29B47',
            fontSize: 13,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            fontFamily: '"Courier New", monospace',
            marginBottom: 28,
            display: 'flex',
            opacity: 0.9,
          }}
        >
          Antique Oil Lamps · Enamel Signs · North America
        </div>

        {/* Brand name */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
          }}
        >
          <span
            style={{
              color: '#FAF5EC',
              fontSize: 72,
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              lineHeight: 1.05,
              display: 'flex',
            }}
          >
            Acme Vintage Supply
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 100,
            height: 1,
            background: 'rgba(194,155,71,0.55)',
            margin: '32px 0',
            display: 'flex',
          }}
        />

        {/* Tagline */}
        <div
          style={{
            color: 'rgba(250,245,236,0.55)',
            fontSize: 20,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            textAlign: 'center',
            maxWidth: 680,
            lineHeight: 1.6,
            display: 'flex',
          }}
        >
          Antique oil lamp chimneys, shades, pressure lamps &amp; original Victorian enamel advertising signs —
          individually sourced, bench-tested, and shipped across North America.
        </div>
      </div>
    ),
    { ...size },
  )
}
