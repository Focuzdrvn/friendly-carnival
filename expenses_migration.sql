-- Expenses Table Migration
-- Add this to your Supabase SQL Editor

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) CHECK (payment_method IS NULL OR payment_method IN ('Cash', 'Card', 'UPI', 'Bank Transfer', 'Other')),
  vendor_name VARCHAR(255),
  receipt_number VARCHAR(100),
  notes TEXT,
  created_by VARCHAR(255), -- Admin email who created the expense
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS expenses_updated_at_trigger ON expenses;
CREATE TRIGGER expenses_updated_at_trigger
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

-- Add comments for documentation
COMMENT ON TABLE expenses IS 'Stores expense records for the hackathon';
COMMENT ON COLUMN expenses.category IS 'Expense category (e.g., Venue, Food, Prizes, Marketing)';
COMMENT ON COLUMN expenses.amount IS 'Expense amount in currency';
COMMENT ON COLUMN expenses.payment_method IS 'Method of payment used';

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed)
CREATE POLICY "Allow all operations on expenses" ON expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'expenses';
