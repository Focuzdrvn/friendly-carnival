# PROJECT STATE - Singularity Hackathon Admin Suite

**Last Updated:** December 21, 2025  
**Status:** ✅ PRODUCTION READY

---

## 📊 Project Overview

Full-stack admin dashboard for managing hackathon registrations, payment verification, and automated communications with a space-minimalist theme.

**Tech Stack:**
- Frontend: React 18, Vite, Tailwind CSS, Lucide-React
- Backend: Node.js, Express, JWT Authentication
- Databases: MongoDB (Auth/Templates), Supabase (Teams/Members)
- Services: Nodemailer (SMTP), PDFKit (Invoices)

---

## ✅ COMPLETED FEATURES

### 1. Backend Infrastructure
- ✅ Express server with error handling
- ✅ MongoDB connection and models (Admin, Template)
- ✅ Supabase client configuration
- ✅ JWT authentication middleware
- ✅ CORS and security setup

### 2. Authentication System
- ✅ Admin registration endpoint
- ✅ Login with JWT tokens (7-day expiry)
- ✅ Password reset via email
- ✅ Token verification middleware

### 3. Team Management
- ✅ CSV bulk upload (PapaParse)
- ✅ Dual-table insertion (Teams → Members)
- ✅ Team listing with pagination
- ✅ Search and filter functionality
- ✅ Payment verification toggle
- ✅ Statistics dashboard

### 4. PDF Invoice Generation
- ✅ PDFKit-based invoice generator
- ✅ Space-themed professional design
- ✅ Team and payment details included
- ✅ Auto-attach to verification emails

### 5. Email System
- ✅ Nodemailer with Google SMTP
- ✅ Password reset emails
- ✅ Payment verification emails
- ✅ Template placeholder replacement
- ✅ Bulk email with rate limiting (100ms delay)
- ✅ Test email endpoint

### 6. Email Template Builder
- ✅ CRUD operations for templates
- ✅ HTML editor with placeholders
- ✅ Live preview functionality
- ✅ Template selection for bulk emails

### 7. Frontend UI
- ✅ Space-minimalist theme (Purple/Blue gradient)
- ✅ Responsive layout with sidebar
- ✅ Login/Forgot Password/Reset Password pages
- ✅ Dashboard with statistics cards
- ✅ Teams management with verification
- ✅ Template builder UI
- ✅ Bulk email interface
- ✅ Loading states and error handling

---

## 📁 PROJECT STRUCTURE

```
singularity-hackathon-admin/
├── server/
│   ├── index.js                 # Express server entry
│   ├── config/
│   │   └── supabase.js          # Supabase client
│   ├── models/
│   │   ├── Admin.js             # MongoDB Admin schema
│   │   └── Template.js          # MongoDB Template schema
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   ├── teams.js             # Team management + CSV upload
│   │   ├── templates.js         # Template CRUD
│   │   └── email.js             # Email sending
│   └── services/
│       ├── emailService.js      # Nodemailer wrapper
│       └── pdfService.js        # PDF generation
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx       # Sidebar layout
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state management
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Teams.jsx
│   │   │   ├── Templates.jsx
│   │   │   └── BulkEmail.jsx
│   │   ├── utils/
│   │   │   └── api.js           # Axios instance
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── PROJECT_STATE.md
```

---

## 🗄️ DATABASE SCHEMAS

### MongoDB Collections

**admins:**
```javascript
{
  email: String (unique),
  password: String (hashed),
  resetToken: String,
  resetExpiry: Date
}
```

**templates:**
```javascript
{
  name: String (unique),
  subject: String,
  htmlBody: String  // Supports {{placeholders}}
}
```

### Supabase Tables

**teams:**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name VARCHAR(255) NOT NULL,
  leader_name VARCHAR(255) NOT NULL,
  leader_email VARCHAR(255) NOT NULL UNIQUE,
  ticket_type VARCHAR(50) NOT NULL CHECK (ticket_type IN ('Early Bird', 'Proper Price', 'Late Lateef')),
  amount DECIMAL(10, 2) NOT NULL,  -- Original ticket price (can be manually overridden)
  money_collected DECIMAL(10, 2) NOT NULL,  -- Actual amount collected (allows manual override)
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**members:**
```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,  -- Required
  phone VARCHAR(20) NOT NULL,  -- Required
  prn VARCHAR(100) NOT NULL,  -- PRN (Permanent Registration Number) - Required
  year_of_study VARCHAR(50),  -- Optional
  department VARCHAR(255),  -- Optional
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_member_email_per_team UNIQUE(team_id, email)
);
```

**Key Schema Features:**
- **Ticket Types**: Three categories enforced at DB level - "Early Bird", "Proper Price", "Late Lateef"
- **Flexible Pricing**: Both `amount` and `money_collected` fields allow manual overrides for special cases
- **Team Size Limit**: Maximum 4 members per team (enforced by database trigger)
- **Required Member Fields**: Email, Phone, and PRN are mandatory for all team members
- **Manual Editing**: All fields can be updated via API endpoints for flexibility

---

## 🔐 ENVIRONMENT VARIABLES REQUIRED

```env
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/singularity-admin

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Email (Google SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Set all environment variables in Render dashboard
- [ ] Create MongoDB database
- [ ] Create Supabase project and tables
- [ ] Enable Google App Password for SMTP
- [ ] Test email configuration

### Database Setup
1. **MongoDB**: Create database `singularity-admin` (collections auto-create)
2. **Supabase**: Run SQL scripts for `teams` and `members` tables

### Initial Admin Account
```bash
# After deployment, create first admin via API:
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "your-secure-password"
}

# Then disable this endpoint for security or add admin-only middleware
```

### Render Configuration
- **Build Command:** `npm install && cd client && npm install && npm run build`
- **Start Command:** `npm start`
- **Environment:** Node 18+

---

## 📝 CSV UPLOAD FORMAT

Required columns:
- `team_name`
- `leader_name`
- `leader_email`
- `ticket_type`
- `amount`

Optional member columns (supports multiple members):
- `member1_name`, `member1_year`, `member1_department`, `member1_roll`, `member1_email`, `member1_phone`
- `member2_name`, `member2_year`, `member2_department`, `member2_roll`, `member2_email`, `member2_phone`
- (continues for member3, member4, etc.)

---

## 🎯 KEY WORKFLOWS

### 1. Team Registration & Verification
1. Admin uploads CSV with team data
2. Teams and members inserted into Supabase
3. Admin reviews teams in dashboard
4. Admin clicks "Verify" on a team
5. System generates PDF invoice
6. Email sent to leader with invoice attached
7. Team status updated to verified

### 2. Bulk Communication
1. Admin creates email template (or uses custom)
2. Selects verification filter
3. System sends personalized emails to all matching teams
4. Placeholders replaced with actual team data
5. Results displayed with success/failure counts

---

## 🔧 API ENDPOINTS

### Authentication
- `POST /api/auth/register` - Register admin
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/verify` - Verify token

### Teams
- `GET /api/teams` - List teams (paginated)
- `GET /api/teams/:id` - Get team details
- `POST /api/teams/upload-csv` - Bulk upload
- `POST /api/teams/:id/verify` - Verify payment
- `GET /api/teams/stats/overview` - Get statistics

### Templates
- `GET /api/templates` - List templates
- `GET /api/templates/:id` - Get template
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Email
- `POST /api/email/send-to-team` - Send to one team
- `POST /api/email/bulk-send` - Send to multiple teams
- `POST /api/email/test` - Test email config

---

## ⚠️ KNOWN LIMITATIONS & NOTES

1. **PDF Storage**: PDFs are generated temporarily and deleted after email send
2. **Rate Limiting**: Bulk emails have 100ms delay between sends
3. **File Upload**: CSV uploads limited to 5MB
4. **Sessions**: JWT tokens expire after 7 days
5. **Render Free Tier**: May have cold starts; PDFKit chosen over Puppeteer for lighter resource usage

---

## 🐛 TROUBLESHOOTING

### Email Not Sending
- Verify Google App Password is correct
- Check 2FA is enabled on Google account
- Ensure SMTP credentials in .env

### Supabase Connection Failed
- Verify SUPABASE_URL and SUPABASE_ANON_KEY
- Check table schemas match exactly
- Enable Row Level Security policies if needed

### CSV Upload Fails
- Ensure required columns are present
- Check for duplicate leader_email values
- Verify amount is numeric

---

## 🎨 THEME COLORS

- Primary Blue: `#667eea`
- Primary Purple: `#764ba2`
- Dark Background: `#0f0f23`
- Card Background: `#1a1a2e`
- Gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

---

## 📚 ADDITIONAL RESOURCES

- [Supabase Documentation](https://supabase.com/docs)
- [PDFKit Guide](http://pdfkit.org/)
- [Nodemailer Docs](https://nodemailer.com/)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🔄 SESSION CONTINUITY NOTES

If you need to resume work in a new session:
1. Read this file first to understand current state
2. Check .env.example for required credentials
3. Review completed features list
4. Check troubleshooting section for common issues

**Status:** All core features implemented and tested. Ready for deployment to Render with proper environment variables configured.

---

*Generated on: December 21, 2025*
