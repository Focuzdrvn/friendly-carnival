# Sample CSV Format for Team Upload

## Required Fields (All teams must have these)
- **team_name**: Name of the team
- **leader_name**: Full name of team leader
- **leader_email**: Email address (must be unique)
- **ticket_type**: Type of registration - Must be one of:
  - "Early Bird"
  - "Proper Price"
  - "Late Lateef"
- **amount**: Original ticket price based on ticket_type (numeric only, no currency symbols)

## Optional Team Fields
- **money_collected**: Actual amount collected (if different from ticket price). If not provided, defaults to `amount` value. This allows for manual override of collected amounts.

## Required Member Fields (Maximum 4 members per team)
For each member (1-4), use the pattern: member{N}_{field}

**Required fields for each member:**
- **member{N}_name**: Full name of the member
- **member{N}_email**: Email address of the member
- **member{N}_phone**: Phone number of the member
- **member{N}_prn**: PRN (Permanent Registration Number) of the member

**Optional fields for each member:**
- **member{N}_year**: Year of study (e.g., "1st Year", "2nd Year", "3rd Year", "4th Year")
- **member{N}_department**: Department name (e.g., "Computer Science", "IT", "Electronics")

## Important Notes:
1. **Ticket Type Values**: Must be exactly "Early Bird", "Proper Price", or "Late Lateef" (case-sensitive)
2. **Team Member Limit**: Maximum 4 members per team
3. **Required Member Data**: Each member must have name, email, phone, and PRN
4. **Manual Overrides**: Both `amount` and `money_collected` can be manually set to handle special pricing
5. **No Currency Symbols**: Do not include ₹, $, or other symbols in amount fields
6. **Unique Emails**: Team leader emails must be unique across all teams
7. **No Empty Rows**: Ensure there are no empty rows between data entries
8. **File Extension**: Save file with .csv extension

## Example CSV Content:

### Example 1: With all 4 members
```csv
team_name,leader_name,leader_email,ticket_type,amount,money_collected,member1_name,member1_email,member1_phone,member1_prn,member1_year,member1_department,member2_name,member2_email,member2_phone,member2_prn,member2_year,member2_department,member3_name,member3_email,member3_phone,member3_prn,member3_year,member3_department,member4_name,member4_email,member4_phone,member4_prn,member4_year,member4_department
Team Alpha,John Doe,john.doe@example.com,Early Bird,500,500,Jane Smith,jane@example.com,9876543210,PRN001,3rd Year,Computer Science,Bob Wilson,bob@example.com,9876543211,PRN002,2nd Year,Information Technology,Mike Ross,mike@example.com,9876543212,PRN003,4th Year,Electronics,Rachel Zane,rachel@example.com,9876543213,PRN004,3rd Year,Mechanical
```

### Example 2: With manual override for money_collected
```csv
team_name,leader_name,leader_email,ticket_type,amount,money_collected,member1_name,member1_email,member1_phone,member1_prn,member1_year,member1_department,member2_name,member2_email,member2_phone,member2_prn,member2_year,member2_department
Team Beta,Alice Johnson,alice@example.com,Proper Price,750,700,Charlie Brown,charlie@example.com,9876543214,PRN005,4th Year,Computer Science,Diana Prince,diana@example.com,9876543215,PRN006,3rd Year,Civil Engineering
```

### Example 3: With Late Lateef pricing and minimal optional fields
```csv
team_name,leader_name,leader_email,ticket_type,amount,member1_name,member1_email,member1_phone,member1_prn,member2_name,member2_email,member2_phone,member2_prn
Team Gamma,Harvey Specter,harvey@example.com,Late Lateef,1000,Louis Litt,louis@example.com,9876543216,PRN007,Donna Paulsen,donna@example.com,9876543217,PRN008
```

## Pricing Guidelines:
- **Early Bird**: Lower price for early registrations
- **Proper Price**: Standard pricing
- **Late Lateef**: Higher price for late registrations
- Use `money_collected` field to manually override when actual payment differs from standard pricing
