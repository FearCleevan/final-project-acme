// components/admin/analytics/VisitorMap.tsx
'use client'

import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import worldData from 'world-atlas/countries-110m.json'
import type { VisitorLocation } from '@/lib/analytics'

interface Props {
  locations: VisitorLocation[]
}

const MIN_RADIUS = 3
const MAX_RADIUS = 14

function radiusFor(count: number, maxCount: number): number {
  if (maxCount <= 0) return MIN_RADIUS
  const scale = Math.sqrt(count) / Math.sqrt(maxCount)
  return MIN_RADIUS + scale * (MAX_RADIUS - MIN_RADIUS)
}

export default function VisitorMap({ locations }: Props) {
  if (locations.length === 0) {
    return (
      <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-5">
        <p className="text-[13px] font-semibold text-(--admin-text) mb-4">Visitor Locations (30 days)</p>
        <p className="text-[12px] text-(--admin-text-muted)">No location data yet.</p>
      </div>
    )
  }

  const maxCount = Math.max(...locations.map(l => l.count))

  return (
    <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-5">
      <p className="text-[13px] font-semibold text-(--admin-text) mb-4">Visitor Locations (30 days)</p>
      <ComposableMap
        projectionConfig={{ scale: 140 }}
        width={800}
        height={400}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={worldData}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="var(--admin-surface-2)"
                stroke="var(--admin-border)"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover:   { outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>
        {locations.map(loc => (
          <Marker key={`${loc.city}-${loc.lat}-${loc.lng}`} coordinates={[loc.lng, loc.lat]}>
            <circle
              r={radiusFor(loc.count, maxCount)}
              fill="var(--admin-accent)"
              fillOpacity={0.6}
              stroke="var(--admin-accent)"
              strokeWidth={1}
            >
              <title>
                {`${loc.city}${loc.country ? `, ${loc.country}` : ''} — ${loc.count} visit${loc.count !== 1 ? 's' : ''}`}
              </title>
            </circle>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  )
}
