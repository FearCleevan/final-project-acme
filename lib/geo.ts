import { NextRequest } from 'next/server'

function parseGeoFloat(raw: string | null): number | null {
  if (!raw) return null
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : null
}

export function getRequestGeo(req: NextRequest) {
  return {
    country: req.headers.get('x-vercel-ip-country') ?? null,
    city:    req.headers.get('x-vercel-ip-city')     ?? null,
    lat:     parseGeoFloat(req.headers.get('x-vercel-ip-latitude')),
    lng:     parseGeoFloat(req.headers.get('x-vercel-ip-longitude')),
  }
}
