-- Add status column to replace boolean approved flag
-- Supports: pending | approved | deactivated
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Backfill from existing approved column
UPDATE reviews SET status = CASE WHEN approved = true THEN 'approved' ELSE 'pending' END;

-- Swap index to use status instead of approved
DROP INDEX IF EXISTS reviews_product_approved_idx;
CREATE INDEX IF NOT EXISTS reviews_product_status_idx ON reviews(product_handle, status);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews(status);
