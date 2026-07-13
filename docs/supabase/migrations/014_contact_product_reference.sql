-- 014_contact_product_reference.sql
-- Run in Supabase Dashboard → SQL Editor
--
-- Lets a contact_messages row optionally reference a specific product,
-- so the admin Contact Inbox can distinguish a per-product inquiry from
-- a general contact message. Both nullable — general Contact Us
-- submissions omit these and are unaffected.

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS product_handle text;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS product_title text;
