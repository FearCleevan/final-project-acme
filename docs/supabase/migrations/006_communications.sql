-- 006_communications.sql
-- Run in Supabase Dashboard → SQL Editor

-- ── contact_messages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  email      text        NOT NULL,
  subject    text        NOT NULL,
  message    text        NOT NULL,
  read_at    timestamptz,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Only service_role (our server) can access contact messages
DROP POLICY IF EXISTS "No public access to contact messages" ON contact_messages;
CREATE POLICY "No public access to contact messages"
  ON contact_messages
  USING (false);

-- ── bench_notes ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bench_notes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text        NOT NULL DEFAULT '',
  body       text        NOT NULL,
  pinned     boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bench_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access to bench notes" ON bench_notes;
CREATE POLICY "No public access to bench notes"
  ON bench_notes
  USING (false);
