-- 008_admin_settings.sql
-- Run in Supabase Dashboard → SQL Editor

-- ── admin_settings ────────────────────────────────────────────────────────────
-- Singleton table (single store, single admin) — always exactly one row, id = 'main'.
CREATE TABLE IF NOT EXISTS admin_settings (
  id                        text        PRIMARY KEY DEFAULT 'main',

  store_name                text        NOT NULL DEFAULT 'Acme Vintage Supply',
  store_email               text        NOT NULL DEFAULT '',
  store_phone               text        NOT NULL DEFAULT '',
  store_address             text        NOT NULL DEFAULT '',
  store_city                text        NOT NULL DEFAULT '',
  store_province            text        NOT NULL DEFAULT '',
  store_country             text        NOT NULL DEFAULT '',

  currency                  text        NOT NULL DEFAULT 'CAD',
  timezone                  text        NOT NULL DEFAULT 'America/Halifax',
  date_format               text        NOT NULL DEFAULT 'DD MMM YYYY',

  notify_order_placed       boolean     NOT NULL DEFAULT true,
  notify_order_fulfilled    boolean     NOT NULL DEFAULT true,
  notify_low_stock          boolean     NOT NULL DEFAULT true,
  notify_abandoned_checkout boolean     NOT NULL DEFAULT false,
  notify_weekly_digest      boolean     NOT NULL DEFAULT true,

  updated_at                timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT admin_settings_singleton CHECK (id = 'main')
);

-- Seed the one row if it doesn't exist yet
INSERT INTO admin_settings (id)
VALUES ('main')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Only service_role (our server) can access settings
DROP POLICY IF EXISTS "No public access to admin settings" ON admin_settings;
CREATE POLICY "No public access to admin settings"
  ON admin_settings
  USING (false);
