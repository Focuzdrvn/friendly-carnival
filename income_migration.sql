-- Income Table Migration
-- Add this to your Supabase SQL Editor

-- Create income table
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) CHECK (payment_method IS NULL OR payment_method IN ('Cash', 'Card', 'UPI', 'Bank Transfer', 'Other')),
  source_name VARCHAR(255), -- Name of sponsor/donor/customer
  reference_number VARCHAR(100),
  notes TEXT,
  created_by VARCHAR(255), -- Admin email who created the income entry
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date DESC);
CREATE INDEX IF NOT EXISTS idx_income_category ON income(category);
CREATE INDEX IF NOT EXISTS idx_income_created_by ON income(created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_income_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS income_updated_at_trigger ON income;
CREATE TRIGGER income_updated_at_trigger
  BEFORE UPDATE ON income
  FOR EACH ROW
  EXECUTE FUNCTION update_income_updated_at();

-- Add comments for documentation
COMMENT ON TABLE income IS 'Stores additional income records for the hackathon (beyond registration fees)';
COMMENT ON COLUMN income.category IS 'Income category (e.g., Sponsorship, Merchandise, Donations)';
COMMENT ON COLUMN income.amount IS 'Income amount in currency';
COMMENT ON COLUMN income.payment_method IS 'Method of payment received';
COMMENT ON COLUMN income.source_name IS 'Name of the sponsor, donor, or customer';

-- Enable Row Level Security
ALTER TABLE income ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed)
CREATE POLICY "Allow all operations on income" ON income
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'income';
