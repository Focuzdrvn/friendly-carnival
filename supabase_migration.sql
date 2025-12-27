-- Migration Script for Existing Database
-- Run this in Supabase SQL Editor if you already have data

-- Step 1: Add money_collected column to teams
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS money_collected DECIMAL(10, 2);

-- Set default value to amount for existing rows
UPDATE teams SET money_collected = amount WHERE money_collected IS NULL;

-- Make it required
ALTER TABLE teams ALTER COLUMN money_collected SET NOT NULL;

-- Step 2: Add CHECK constraint for ticket_type (drop if exists first)
ALTER TABLE teams DROP CONSTRAINT IF EXISTS valid_ticket_types;
ALTER TABLE teams 
ADD CONSTRAINT valid_ticket_types 
CHECK (ticket_type IN ('Early Bird', 'Proper Price', 'Late Lateef'));

-- Update existing ticket types if needed (adjust based on your current data)
-- Uncomment and modify these if you have existing data with different ticket type names:
-- UPDATE teams SET ticket_type = 'Early Bird' WHERE ticket_type = 'early_bird';
-- UPDATE teams SET ticket_type = 'Proper Price' WHERE ticket_type = 'standard';
-- UPDATE teams SET ticket_type = 'Late Lateef' WHERE ticket_type = 'late';

-- Step 3: Update members table
-- Rename roll_number to prn (if column exists)
DO $$ 
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns 
            WHERE table_name='members' AND column_name='roll_number') THEN
    ALTER TABLE members RENAME COLUMN roll_number TO prn;
  END IF;
END $$;

-- Add prn column if it doesn't exist
ALTER TABLE members ADD COLUMN IF NOT EXISTS prn VARCHAR(100);

-- Update NULL values with placeholder (you'll need to update these manually)
UPDATE members SET prn = 'PRN_' || id WHERE prn IS NULL OR prn = '';
UPDATE members SET email = 'member_' || id || '@placeholder.com' WHERE email IS NULL OR email = '';
UPDATE members SET phone = '0000000000' WHERE phone IS NULL OR phone = '';

-- Make fields required
ALTER TABLE members ALTER COLUMN email SET NOT NULL;
ALTER TABLE members ALTER COLUMN phone SET NOT NULL;
ALTER TABLE members ALTER COLUMN prn SET NOT NULL;

-- Add unique constraint (drop if exists first)
ALTER TABLE members DROP CONSTRAINT IF EXISTS unique_member_email_per_team;
ALTER TABLE members 
ADD CONSTRAINT unique_member_email_per_team 
UNIQUE(team_id, email);

-- Step 4: Create member limit trigger
CREATE OR REPLACE FUNCTION check_team_member_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM members WHERE team_id = NEW.team_id) >= 4 THEN
    RAISE EXCEPTION 'Team cannot have more than 4 members';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS enforce_team_member_limit ON members;
CREATE TRIGGER enforce_team_member_limit
  BEFORE INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_limit();

-- Step 5: Add index for ticket_type
CREATE INDEX IF NOT EXISTS idx_teams_ticket_type ON teams(ticket_type);

-- Verify the changes
SELECT 
  'teams' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'teams'
ORDER BY ordinal_position;

SELECT 
  'members' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'members'
ORDER BY ordinal_position;
