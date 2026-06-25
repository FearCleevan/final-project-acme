-- 007_newsletter.sql
-- Run in Supabase Dashboard → SQL Editor

-- ── newsletter_subscribers ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text        UNIQUE NOT NULL,
  subscribed_at    timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at  timestamptz
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access to newsletter_subscribers" ON newsletter_subscribers;
CREATE POLICY "No public access to newsletter_subscribers"
  ON newsletter_subscribers
  USING (false);

-- ── email_campaigns ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaigns (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          text        NOT NULL,
  body             text        NOT NULL,
  cta_label        text,
  cta_url          text,
  status           text        NOT NULL DEFAULT 'draft',
  scheduled_for    timestamptz,
  sent_at          timestamptz,
  recipient_count  integer,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access to email_campaigns" ON email_campaigns;
CREATE POLICY "No public access to email_campaigns"
  ON email_campaigns
  USING (false);
