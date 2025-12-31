-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Customer information
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_address TEXT,
  
  -- Invoice dates
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_date TIMESTAMP,
  
  -- Items as JSON array
  items JSONB NOT NULL DEFAULT '[]',
  
  -- Financial details
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_percentage DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  
  -- Status: 'pending', 'paid', 'overdue', 'cancelled'
  status VARCHAR(20) DEFAULT 'pending',
  
  -- Payment information
  payment_method VARCHAR(50),
  payment_terms TEXT,
  
  -- Additional information
  notes TEXT,
  
  -- Company information (for PDF generation)
  company_name VARCHAR(255),
  company_address TEXT,
  company_email VARCHAR(255),
  company_phone VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_email ON invoices(customer_email);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_name ON invoices(customer_name);

-- Enable Row Level Security (RLS)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to manage invoices
CREATE POLICY "Allow authenticated users to view invoices" ON invoices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert invoices" ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update invoices" ON invoices
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete invoices" ON invoices
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- Create function to auto-update overdue status
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data (optional)
INSERT INTO invoices (
  invoice_number,
  customer_name,
  customer_email,
  customer_phone,
  customer_address,
  invoice_date,
  due_date,
  items,
  subtotal,
  tax_percentage,
  tax_amount,
  total_amount,
  status,
  payment_terms,
  notes,
  company_name,
  company_address,
  company_email,
  company_phone
) VALUES (
  'INV-2024-001',
  'John Doe',
  'john.doe@example.com',
  '+1234567890',
  '123 Main St, City, State 12345',
  '2024-12-30',
  '2025-01-30',
  '[
    {"description": "Web Development Services", "quantity": 40, "rate": 50, "amount": 2000},
    {"description": "UI/UX Design", "quantity": 20, "rate": 60, "amount": 1200}
  ]'::jsonb,
  3200.00,
  18.00,
  576.00,
  3776.00,
  'pending',
  'Payment due within 30 days. Accept credit cards, bank transfer, or PayPal.',
  'Thank you for your business!',
  'Your Company Name',
  '456 Business Ave, City, State 67890',
  'contact@yourcompany.com',
  '+0987654321'
);
