-- 003_analytics_activity.sql

-- ── Page views ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  path           text        NOT NULL,
  product_handle text,
  referrer       text,
  device         text        CHECK (device IN ('mobile', 'tablet', 'desktop')),
  country        text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_views_created_at_idx       ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_path_idx             ON page_views(path);
CREATE INDEX IF NOT EXISTS page_views_product_handle_idx   ON page_views(product_handle)
  WHERE product_handle IS NOT NULL;

-- ── Admin activity log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action       text        NOT NULL,
  entity_type  text        NOT NULL,
  entity_id    text,
  entity_label text,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_activity_log_created_at_idx  ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_activity_log_entity_type_idx ON admin_activity_log(entity_type);
