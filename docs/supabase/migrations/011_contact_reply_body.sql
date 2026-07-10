-- 011_contact_reply_body.sql
-- Stores the HTML of the most recent in-app reply sent to a contact message.
-- Only the latest reply is kept — re-replying overwrites this column.

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS reply_body text;
