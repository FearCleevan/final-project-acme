-- Migration 001: Reviews schema
-- Run this in Supabase Dashboard → SQL Editor, or via MCP apply_migration

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Main reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_handle    TEXT        NOT NULL,
  product_id        TEXT        NOT NULL,
  customer_email    TEXT        NOT NULL,
  customer_name     TEXT        NOT NULL,
  rating            SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title             TEXT        NOT NULL CHECK (char_length(title) <= 100),
  body              TEXT        NOT NULL CHECK (char_length(body) >= 20 AND char_length(body) <= 2000),
  verified_purchase BOOLEAN     NOT NULL DEFAULT FALSE,
  approved          BOOLEAN     NOT NULL DEFAULT FALSE,
  helpful_count     INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One review per customer per product
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_customer
  ON reviews (customer_email, product_handle);

-- Fast lookup: approved reviews for a product page
CREATE INDEX IF NOT EXISTS reviews_handle_approved
  ON reviews (product_handle, approved);

-- Fast lookup: pending reviews for admin moderation queue
CREATE INDEX IF NOT EXISTS reviews_pending
  ON reviews (approved, created_at DESC);

-- Helpful votes table (prevents duplicate votes)
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  review_id    UUID  NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  voter_token  TEXT  NOT NULL,
  PRIMARY KEY  (review_id, voter_token)
);

-- Function to safely increment helpful_count
CREATE OR REPLACE FUNCTION increment_helpful(row_id UUID)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = row_id;
$$;
