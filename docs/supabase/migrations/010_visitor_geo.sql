-- 010_visitor_geo.sql
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE page_views
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS lat  double precision,
  ADD COLUMN IF NOT EXISTS lng  double precision;

-- Partial index — only rows with real coordinates are ever queried by the map
CREATE INDEX IF NOT EXISTS page_views_geo_idx
  ON page_views(lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;
