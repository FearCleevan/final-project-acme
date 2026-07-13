-- 012_guest_cart_activity.sql
-- Run in Supabase Dashboard → SQL Editor
--
-- Allows cart_activity to track anonymous (not-logged-in) shoppers, identified
-- by a client-side visitor-id cookie instead of a customer_email. A row must
-- have at least one of the two identities. Also captures approximate
-- city-level location at write time (via Vercel's geo headers), since there
-- is no shared key to join this table to the separate page_views table.

ALTER TABLE cart_activity
  ALTER COLUMN customer_email DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

ALTER TABLE cart_activity
  DROP CONSTRAINT IF EXISTS cart_activity_identity_check;
ALTER TABLE cart_activity
  ADD CONSTRAINT cart_activity_identity_check
    CHECK (customer_email IS NOT NULL OR session_id IS NOT NULL);

-- Replace the email-only unique index with two, one per identity type, so a
-- guest session and a logged-in customer both get correct upsert-by-product
-- behavior without colliding with each other.
DROP INDEX IF EXISTS cart_activity_email_product_active_idx;

CREATE UNIQUE INDEX IF NOT EXISTS cart_activity_email_active_idx
  ON cart_activity(customer_email, product_id)
  WHERE status = 'active' AND customer_email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS cart_activity_session_active_idx
  ON cart_activity(session_id, product_id)
  WHERE status = 'active' AND session_id IS NOT NULL;
