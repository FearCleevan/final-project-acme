-- 009_cart_activity.sql
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS cart_activity (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  customer_email text        NOT NULL,
  customer_id    text,

  product_id     text        NOT NULL,
  product_title  text        NOT NULL,
  variant_id     text,
  quantity       int         NOT NULL DEFAULT 1,

  status         text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted')),
  order_name     text,

  first_added_at timestamptz NOT NULL DEFAULT now(),
  last_added_at  timestamptz NOT NULL DEFAULT now(),
  converted_at   timestamptz
);

-- One row per customer+product — re-adding the same product upserts quantity
-- instead of creating a duplicate row.
CREATE UNIQUE INDEX IF NOT EXISTS cart_activity_email_product_idx
  ON cart_activity(customer_email, product_id);

CREATE INDEX IF NOT EXISTS cart_activity_status_idx
  ON cart_activity(status);

ALTER TABLE cart_activity ENABLE ROW LEVEL SECURITY;

-- Only service_role (our server) can access cart activity
DROP POLICY IF EXISTS "No public access to cart activity" ON cart_activity;
CREATE POLICY "No public access to cart activity"
  ON cart_activity
  USING (false);
