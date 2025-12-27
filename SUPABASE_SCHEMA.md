# Supabase Schema Documentation

## Overview
This document contains the exact Supabase database schema for the Singularity Hackathon Admin Suite. The database consists of two main tables: `teams` and `members`, with enforced constraints and triggers for data integrity.

---

## Tables

### 1. `teams` Table

**Purpose**: Stores team information for hackathon registration.

**Columns**:

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique team identifier |
| `team_name` | VARCHAR(255) | NOT NULL | Name of the team |
| `leader_name` | VARCHAR(255) | NOT NULL | Full name of team leader |
| `leader_email` | VARCHAR(255) | NOT NULL, UNIQUE | Email of team leader (unique across all teams) |
| `ticket_type` | VARCHAR(50) | NOT NULL, CHECK constraint | Registration type: 'Early Bird', 'Proper Price', or 'Late Lateef' |
| `amount` | DECIMAL(10, 2) | NOT NULL | Original ticket price based on ticket_type |
| `money_collected` | DECIMAL(10, 2) | NOT NULL | Actual amount collected from the team (allows manual override) |
| `is_verified` | BOOLEAN | DEFAULT FALSE | Team verification status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**SQL Definition**:
```sql
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name VARCHAR(255) NOT NULL,
  leader_name VARCHAR(255) NOT NULL,
  leader_email VARCHAR(255) NOT NULL UNIQUE,
  ticket_type VARCHAR(50) NOT NULL CHECK (ticket_type IN ('Early Bird', 'Proper Price', 'Late Lateef')),
  amount DECIMAL(10, 2) NOT NULL,
  money_collected DECIMAL(10, 2) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Constraints**:
- `CHECK (ticket_type IN ('Early Bird', 'Proper Price', 'Late Lateef'))` - Ensures valid ticket types
- `UNIQUE (leader_email)` - One team per email address

---

### 2. `members` Table

**Purpose**: Stores team member information with a maximum of 4 members per team.

**Columns**:

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique member identifier |
| `team_id` | UUID | FOREIGN KEY REFERENCES teams(id) ON DELETE CASCADE | Reference to parent team |
| `name` | VARCHAR(255) | NOT NULL | Full name of the team member |
| `email` | VARCHAR(255) | NOT NULL | Email address of the member |
| `phone` | VARCHAR(20) | NOT NULL | Phone number of the member |
| `prn` | VARCHAR(100) | NOT NULL | Permanent Registration Number of the student |
| `year_of_study` | VARCHAR(50) | NULLABLE | Academic year (e.g., "1st Year", "2nd Year") |
| `department` | VARCHAR(255) | NULLABLE | Department name (e.g., "Computer Science") |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**SQL Definition**:
```sql
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  prn VARCHAR(100) NOT NULL,
  year_of_study VARCHAR(50),
  department VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_member_email_per_team UNIQUE(team_id, email)
);
```

**Constraints**:
- `FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE` - Ensures referential integrity; deletes members when team is deleted
- `UNIQUE (team_id, email)` - Ensures email uniqueness within a team

---

## Indexes

**Purpose**: Improve query performance for frequently searched columns.

```sql
CREATE INDEX IF NOT EXISTS idx_teams_verified ON teams(is_verified);
CREATE INDEX IF NOT EXISTS idx_teams_email ON teams(leader_email);
CREATE INDEX IF NOT EXISTS idx_teams_ticket_type ON teams(ticket_type);
CREATE INDEX IF NOT EXISTS idx_members_team_id ON members(team_id);
```

| Index Name | Table | Column(s) | Purpose |
|-----------|-------|-----------|---------|
| `idx_teams_verified` | teams | is_verified | Fast lookup of verified/unverified teams |
| `idx_teams_email` | teams | leader_email | Fast lookup by leader email |
| `idx_teams_ticket_type` | teams | ticket_type | Fast filtering by ticket type |
| `idx_members_team_id` | members | team_id | Fast lookup of members by team |

---

## Triggers & Functions

### Function: `check_team_member_limit()`

**Purpose**: Enforces a maximum of 4 members per team.

**SQL Definition**:
```sql
CREATE OR REPLACE FUNCTION check_team_member_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM members WHERE team_id = NEW.team_id) >= 4 THEN
    RAISE EXCEPTION 'Team cannot have more than 4 members';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Trigger: `enforce_team_member_limit`

**Purpose**: Calls the `check_team_member_limit()` function before inserting a new member.

**SQL Definition**:
```sql
DROP TRIGGER IF EXISTS enforce_team_member_limit ON members;
CREATE TRIGGER enforce_team_member_limit
  BEFORE INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_limit();
```

**Behavior**:
- Triggered: Before each INSERT operation on the members table
- Validation: Checks if the team already has 4 members
- Action: Raises an exception if the limit is exceeded, preventing the insert

---

## Row Level Security (RLS)

**Status**: Enabled for both tables.

**Policies**:

```sql
-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Allow all operations (can be customized for production)
CREATE POLICY "Allow all operations on teams" ON teams
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on members" ON members
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## Data Relationships

```
teams (1) ──────────── (Many) members
  │
  └─── leader_email (UNIQUE)
  └─── id (PK) ─── team_id (FK in members)
```

### Cascade Behavior:
- When a team is deleted, all associated members are automatically deleted (ON DELETE CASCADE)

---

## Financial Tracking Fields

### `amount` vs `money_collected`

| Scenario | amount | money_collected | Notes |
|----------|--------|-----------------|-------|
| Standard payment | $500 | $500 | Match when payment equals ticket price |
| Early discount applied | $500 | $400 | Actual collected is less |
| Late fee added | $500 | $600 | Actual collected is more |
| Partial payment | $500 | $250 | Track what was actually collected |

---

## Ticket Type System

Valid ticket types:
- **Early Bird** - Lower price for early registrations
- **Proper Price** - Standard pricing
- **Late Lateef** - Higher price for late registrations

Enforced at:
1. Database level via CHECK constraint
2. Backend API validation
3. CSV upload validation
4. Frontend form validation

---

## Key Features

✅ **UUID Primary Keys** - Cryptographically secure unique identifiers  
✅ **Referential Integrity** - Foreign key constraints with cascade delete  
✅ **Member Limit** - Automatic enforcement of 4-member maximum per team  
✅ **Email Uniqueness** - Team leaders must have unique emails; member emails unique per team  
✅ **Audit Trail** - created_at timestamps on all records  
✅ **Financial Flexibility** - Separate tracking of original price and actual collected amount  
✅ **Row Level Security** - Database-level access control (configurable)  
✅ **Performance Optimized** - Strategic indexes on frequently queried columns

---

## Complete SQL Setup Script

```sql
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
  money_collected DECIMAL(10, 2) NOT NULL,
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
  prn VARCHAR(100) NOT NULL,
  year_of_study VARCHAR(50),
  department VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_member_email_per_team UNIQUE(team_id, email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_teams_verified ON teams(is_verified);
CREATE INDEX IF NOT EXISTS idx_teams_email ON teams(leader_email);
CREATE INDEX IF NOT EXISTS idx_teams_ticket_type ON teams(ticket_type);
CREATE INDEX IF NOT EXISTS idx_members_team_id ON members(team_id);

-- Create function to enforce 4 members per team limit
CREATE OR REPLACE FUNCTION check_team_member_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM members WHERE team_id = NEW.team_id) >= 4 THEN
    RAISE EXCEPTION 'Team cannot have more than 4 members';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS enforce_team_member_limit ON members;
CREATE TRIGGER enforce_team_member_limit
  BEFORE INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_limit();

-- Add table comments
COMMENT ON TABLE teams IS 'Stores team information for hackathon registration';
COMMENT ON COLUMN teams.ticket_type IS 'Registration type: Early Bird, Proper Price, or Late Lateef';
COMMENT ON COLUMN teams.amount IS 'Original ticket price based on ticket_type (can be manually overridden)';
COMMENT ON COLUMN teams.money_collected IS 'Actual amount collected from the team (allows manual override)';
COMMENT ON TABLE members IS 'Stores team member information (max 4 members per team)';
COMMENT ON COLUMN members.prn IS 'Permanent Registration Number of the student';

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on teams" ON teams
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on members" ON members
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## Last Updated
December 25, 2025

## Version
1.0 - Production Schema
