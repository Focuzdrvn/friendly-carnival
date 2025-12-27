-- Supabase SQL Setup Script
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name VARCHAR(255) NOT NULL,
  leader_name VARCHAR(255) NOT NULL,
  leader_email VARCHAR(255) NOT NULL UNIQUE,
  ticket_type VARCHAR(50) NOT NULL CHECK (ticket_type IN ('Early Bird', 'Proper Price', 'Late Lateef')),
  amount DECIMAL(10, 2) NOT NULL,
  money_collected DECIMAL(10, 2) NOT NULL, -- Actual amount collected, allows manual override
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  prn VARCHAR(100) NOT NULL, -- PRN (Permanent Registration Number)
  year_of_study VARCHAR(50),
  department VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_member_email_per_team UNIQUE(team_id, email)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_teams_verified ON teams(is_verified);
CREATE INDEX IF NOT EXISTS idx_teams_email ON teams(leader_email);
CREATE INDEX IF NOT EXISTS idx_teams_ticket_type ON teams(ticket_type);
CREATE INDEX IF NOT EXISTS idx_members_team_id ON members(team_id);

-- Function to enforce 4 members per team limit
CREATE OR REPLACE FUNCTION check_team_member_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM members WHERE team_id = NEW.team_id) >= 4 THEN
    RAISE EXCEPTION 'Team cannot have more than 4 members';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce member limit on insert
DROP TRIGGER IF EXISTS enforce_team_member_limit ON members;
CREATE TRIGGER enforce_team_member_limit
  BEFORE INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_limit();

-- Add comments for documentation
COMMENT ON TABLE teams IS 'Stores team information for hackathon registration';
COMMENT ON COLUMN teams.ticket_type IS 'Registration type: Early Bird, Proper Price, or Late Lateef';
COMMENT ON COLUMN teams.amount IS 'Original ticket price based on ticket_type (can be manually overridden)';
COMMENT ON COLUMN teams.money_collected IS 'Actual amount collected from the team (allows manual override)';
COMMENT ON TABLE members IS 'Stores team member information (max 4 members per team)';
COMMENT ON COLUMN members.prn IS 'Permanent Registration Number of the student';

-- Enable Row Level Security (Optional - for additional security)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust as needed)
CREATE POLICY "Allow all operations on teams" ON teams
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on members" ON members
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('teams', 'members');
