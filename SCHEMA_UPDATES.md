# Schema Updates - December 21, 2025

## Overview
This document details the schema updates implemented to support ticket types, financial tracking, and team member requirements for the Singularity Hackathon Admin Suite.

---

## 🎫 Ticket Type System

### Three Categories Implemented:
1. **Early Bird** - Lower price for early registrations
2. **Proper Price** - Standard pricing
3. **Late Lateef** - Higher price for late registrations

### Implementation Details:
- **Database Level**: CHECK constraint ensures only valid ticket types
- **Backend Validation**: All API endpoints validate ticket type before insertion
- **CSV Upload**: Rejects rows with invalid ticket types
- **Manual Entry**: Form validation enforces correct values

```sql
ticket_type VARCHAR(50) NOT NULL CHECK (ticket_type IN ('Early Bird', 'Proper Price', 'Late Lateef'))
```

---

## 💰 Financial Tracking

### Two Fields for Pricing:
1. **amount** - Original ticket price based on ticket_type
2. **money_collected** - Actual amount collected (allows manual override)

### Use Cases:
- **Standard Flow**: When payment matches ticket price, both fields are equal
- **Discounts**: If special discount applied, `money_collected` < `amount`
- **Additional Fees**: If late fees added, `money_collected` > `amount`
- **Partial Payment**: Track what was actually collected vs. what was owed

### Default Behavior:
- If `money_collected` is not provided, it defaults to `amount` value
- Both fields can be manually edited at any time via API

### Revenue Reporting:
- Dashboard statistics use `money_collected` for accurate revenue tracking
- PDF invoices show both original price and actual amount collected

```sql
amount DECIMAL(10, 2) NOT NULL,
money_collected DECIMAL(10, 2) NOT NULL
```

---

## 👥 Team Structure Requirements

### Team Size Limit: 4 Members
- **Enforced by**: Database trigger `enforce_team_member_limit`
- **Trigger Function**: `check_team_member_limit()` validates count before insert
- **Backend Validation**: API endpoints check member count before insertion
- **Error Handling**: Returns clear error message when limit exceeded

### Required Member Fields:
Every team member MUST have:
1. **name** - Full name of the member
2. **email** - Email address (unique within team)
3. **phone** - Phone number
4. **prn** - Permanent Registration Number

### Optional Member Fields:
- **year_of_study** - Academic year (e.g., "1st Year", "2nd Year")
- **department** - Department name (e.g., "Computer Science")

### Changes from Previous Schema:
- ❌ Removed: `roll_number` (replaced with PRN)
- ✅ Made Required: `email`, `phone`, `prn`
- ✅ Added: Unique constraint on (team_id, email)

```sql
CREATE TABLE members (
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

---

## 🔧 Manual Override Capabilities

### Team Updates
**Endpoint**: `PUT /api/teams/:id`

Can update any field:
- team_name
- leader_name
- leader_email
- ticket_type (must be valid category)
- amount
- money_collected
- is_verified

### Member Updates
**Endpoint**: `PUT /api/teams/member/:id`

Can update any field:
- name
- email
- phone
- prn
- year_of_study
- department

### Member Management
- **Add Member**: `POST /api/teams/:teamId/member` (enforces 4-member limit)
- **Delete Member**: `DELETE /api/teams/member/:id`

---

## 📋 CSV Format Updates

### Required Changes to CSV Files:

**Team Fields:**
```csv
team_name,leader_name,leader_email,ticket_type,amount,money_collected
```
- `ticket_type` must be exactly: "Early Bird", "Proper Price", or "Late Lateef"
- `money_collected` is optional (defaults to `amount` if not provided)

**Member Fields (for each member 1-4):**
```csv
member1_name,member1_email,member1_phone,member1_prn,member1_year,member1_department
member2_name,member2_email,member2_phone,member2_prn,member2_year,member2_department
...
```
- Name, email, phone, and PRN are required
- Year and department are optional
- Maximum 4 members per team

See [CSV_FORMAT.md](CSV_FORMAT.md) for detailed examples.

---

## 🔄 Migration Guide

### For Existing Databases:

1. **Add new columns to teams table:**
```sql
ALTER TABLE teams 
ADD COLUMN money_collected DECIMAL(10, 2);

-- Set default value to amount for existing rows
UPDATE teams SET money_collected = amount WHERE money_collected IS NULL;

-- Make it required
ALTER TABLE teams ALTER COLUMN money_collected SET NOT NULL;

-- Add CHECK constraint for ticket_type
ALTER TABLE teams 
ADD CONSTRAINT valid_ticket_types 
CHECK (ticket_type IN ('Early Bird', 'Proper Price', 'Late Lateef'));
```

2. **Update members table:**
```sql
-- Rename roll_number to prn
ALTER TABLE members RENAME COLUMN roll_number TO prn;

-- Make fields required
ALTER TABLE members ALTER COLUMN email SET NOT NULL;
ALTER TABLE members ALTER COLUMN phone SET NOT NULL;
ALTER TABLE members ALTER COLUMN prn SET NOT NULL;

-- Add unique constraint
ALTER TABLE members 
ADD CONSTRAINT unique_member_email_per_team 
UNIQUE(team_id, email);
```

3. **Create member limit trigger:**
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

CREATE TRIGGER enforce_team_member_limit
  BEFORE INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_limit();
```

4. **Update existing data (if needed):**
```sql
-- Update ticket_types to match new categories
UPDATE teams SET ticket_type = 'Early Bird' WHERE ticket_type = 'early_bird';
UPDATE teams SET ticket_type = 'Proper Price' WHERE ticket_type = 'standard';
UPDATE teams SET ticket_type = 'Late Lateef' WHERE ticket_type = 'late';
```

### For Fresh Installations:
Simply run the updated [supabase_setup.sql](supabase_setup.sql) script.

---

## ✅ Testing Checklist

- [ ] Database schema created with all new fields
- [ ] Ticket type validation works (rejects invalid types)
- [ ] money_collected defaults to amount when not provided
- [ ] Manual override of money_collected works
- [ ] 4-member limit enforced (insertion fails on 5th member)
- [ ] Required member fields validated (email, phone, prn)
- [ ] CSV upload with new format works
- [ ] Manual team addition with new fields works
- [ ] Team update API allows field overrides
- [ ] Member update API allows field overrides
- [ ] PDF invoice shows both amount and money_collected
- [ ] Revenue statistics use money_collected
- [ ] Email verification includes correct pricing

---

## 📞 Support

For questions about the schema updates:
- Review [PROJECT_STATE.md](PROJECT_STATE.md) for current architecture
- Check [PROJECT_STATUS.md](PROJECT_STATUS.md) for implementation status
- See [CSV_FORMAT.md](CSV_FORMAT.md) for data format examples
