-- 015_pageview_user_agent.sql
-- Run in Supabase Dashboard → SQL Editor
--
-- Stores the raw user-agent on each page_views row, so a JS-executing
-- crawler (e.g. Googlebot, which runs JavaScript for most crawls) can be
-- identified after the fact, since it isn't caught by the bot-signature
-- filter applied at insert time in app/api/track/pageview/route.ts.

ALTER TABLE page_views ADD COLUMN IF NOT EXISTS user_agent text;
