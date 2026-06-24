-- Migration 005: Row Level Security policies
-- Run in Supabase Dashboard → SQL Editor
-- Our server always uses service_role key which bypasses RLS automatically.
-- These policies govern direct anon/public access only.

-- ── reviews ───────────────────────────────────────────────────────────────────

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews (storefront product pages)
CREATE POLICY "Public read approved reviews"
  ON public.reviews FOR SELECT
  USING (approved = true);

-- Anyone can submit a review (one-per-customer enforced by unique index)
CREATE POLICY "Anyone can submit review"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

-- ── review_helpful_votes ──────────────────────────────────────────────────────

ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read vote counts
CREATE POLICY "Anyone can read votes"
  ON public.review_helpful_votes FOR SELECT
  USING (true);

-- Anyone can cast a vote (duplicate prevented by PRIMARY KEY constraint)
CREATE POLICY "Anyone can vote"
  ON public.review_helpful_votes FOR INSERT
  WITH CHECK (true);

-- ── admin_activity_log ────────────────────────────────────────────────────────
-- RLS already enabled. Block all anon access — server uses service_role which bypasses RLS.

CREATE POLICY "No public access to activity log"
  ON public.admin_activity_log
  USING (false);

-- ── back_in_stock_requests ────────────────────────────────────────────────────
-- RLS already enabled. Allow public INSERT (subscribe), block public SELECT.

CREATE POLICY "Anyone can subscribe for restock"
  ON public.back_in_stock_requests FOR INSERT
  WITH CHECK (true);

-- ── page_views ────────────────────────────────────────────────────────────────
-- RLS already enabled. Block all anon access — only server writes these.

CREATE POLICY "No public access to page views"
  ON public.page_views
  USING (false);

-- ── increment_helpful function ────────────────────────────────────────────────
-- Fix mutable search path vulnerability

ALTER FUNCTION public.increment_helpful(uuid) SET search_path = public;
