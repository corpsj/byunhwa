-- Add columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS people_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_amount INTEGER,
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'tree';

-- Add columns to form_config table
ALTER TABLE form_config 
ADD COLUMN IF NOT EXISTS price_2_people TEXT,
ADD COLUMN IF NOT EXISTS background_image TEXT;

-- Note: The 'schedules' column in form_config is already a JSONB or Text array.
-- We will now store objects like {"time": "12월 25일 14:00", "capacity": 4} 
-- instead of just strings. Existing string values will need to be migrated 
-- or handled gracefully by the application code (which we will do).
