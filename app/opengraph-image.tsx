import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import path from 'path'

export const alt = 'Acme Vintage Supply — Authentic Antique Oil Lamp Parts'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const GRID_HEIGHT = 470
const BAR_HEIGHT = size.height - GRID_HEIGHT

const TILES = [
  { file: '01-antique-brass-oil-lamps.png', w: 600, h: 235 },
  { file: '02-green-etched-glass-oil-lamp-shade.png', w: 600, h: 235 },
  { file: '03-brass-antique-lamp-burner.png', w: 600, h: 235 },
  { file: '04-vintage-enamel-signs-collection.png', w: 600, h: 235 },
]

async function tileDataUrl(file: string, w: number, h: number) {
  const buf = await sharp(path.join(process.cwd(), 'public', 'assets', file))
    .resize(w, h, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 78 })
    .toBuffer()
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

export default async function Image() {
  const tiles = await Promise.all(TILES.map(t => tileDataUrl(t.file, t.w, t.h)))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#1E2022',
        }}
      >
        {/* Product photo mosaic */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            width: '100%',
            height: GRID_HEIGHT,
          }}
        >
          {tiles.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              width={TILES[i].w}
              height={TILES[i].h}
              style={{ objectFit: 'cover', display: 'flex' }}
            />
          ))}
        </div>

        {/* Brand strip */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: BAR_HEIGHT,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 1,
              background: 'rgba(194,155,71,0.45)',
              display: 'flex',
            }}
          />
          <span
            style={{
              color: '#FAF5EC',
              fontSize: 40,
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              letterSpacing: '0.01em',
              display: 'flex',
            }}
          >
            Acme Vintage Supply
          </span>
          <span
            style={{
              color: '#C29B47',
              fontSize: 15,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontFamily: '"Courier New", monospace',
              marginTop: 8,
              display: 'flex',
            }}
          >
            Antique Oil Lamps · Enamel Signs · North America
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
