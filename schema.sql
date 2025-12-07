-- Enable uuid generation if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Orders table (stores each reservation)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  schedule TEXT NOT NULL,
  agreed BOOLEAN NOT NULL DEFAULT FALSE,
  people_count INTEGER NOT NULL DEFAULT 1,
  total_amount INTEGER,
  product_type TEXT NOT NULL DEFAULT 'tree',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Form configuration table (single row, id = 1)
CREATE TABLE IF NOT EXISTS form_config (
  id INTEGER PRIMARY KEY,
  schedules JSONB,
  details TEXT,
  bank_name TEXT,
  account_number TEXT,
  depositor TEXT,
  price TEXT,
  price_2_people TEXT,
  background_image TEXT,
  email_notification_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  admin_email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensure required columns exist (for existing deployments)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS people_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_amount INTEGER,
  ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'tree';

ALTER TABLE form_config
  ADD COLUMN IF NOT EXISTS price_2_people TEXT,
  ADD COLUMN IF NOT EXISTS background_image TEXT,
  ADD COLUMN IF NOT EXISTS email_notification_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_email TEXT;

-- Note: schedules is stored as JSONB. Example value:
-- [{ "time": "12월 25일 14:00", "capacity": 4 }]
