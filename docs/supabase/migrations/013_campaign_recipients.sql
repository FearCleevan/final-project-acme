-- 013_campaign_recipients.sql
-- Run in Supabase Dashboard → SQL Editor
--
-- Lets a campaign target a specific subset of subscribers instead of
-- always sending to everyone active. null = all active subscribers
-- (existing default behavior, unchanged); a JSON array = the exact
-- subset chosen when the campaign was composed.

ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS recipient_emails jsonb;
