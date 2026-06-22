-- 004_back_in_stock.sql

CREATE TABLE IF NOT EXISTS back_in_stock_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text        NOT NULL,
  product_handle text        NOT NULL,
  product_title  text        NOT NULL,
  notified_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- One signup per email per product (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS back_in_stock_requests_email_handle_idx
  ON back_in_stock_requests(email, product_handle);

CREATE INDEX IF NOT EXISTS back_in_stock_requests_handle_idx
  ON back_in_stock_requests(product_handle);

CREATE INDEX IF NOT EXISTS back_in_stock_requests_notified_idx
  ON back_in_stock_requests(notified_at)
  WHERE notified_at IS NULL;
