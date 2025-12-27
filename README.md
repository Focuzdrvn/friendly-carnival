# Singularity Hackathon Admin Suite

A production-ready admin dashboard for managing hackathon registrations, payment verification, and automated PDF invoicing with a space-minimalist theme.

## 🚀 Tech Stack

### Frontend
- React + Vite
- Tailwind CSS
- Lucide-React (icons)

### Backend
- Node.js + Express
- JWT Authentication
- Bcrypt password hashing

### Databases
- **Supabase (PostgreSQL)**: Teams & Members data
- **MongoDB**: Admin authentication & Email templates

### Services
- **Nodemailer**: Email delivery via Google SMTP
- **PDFKit**: Lightweight PDF generation
- **PapaParse**: CSV parsing

## 📋 Features

- ✅ Secure admin login with JWT
- ✅ Password recovery via email
- ✅ CSV bulk upload for teams and members
- ✅ **Three ticket types**: Early Bird, Proper Price, Late Lateef
- ✅ **Flexible pricing**: Support for manual overrides on all financial fields
- ✅ **4-member team limit**: Enforced at database level
- ✅ **Required member data**: Email, Phone, PRN for all members
- ✅ Manual payment verification toggle
- ✅ Automated PDF invoice generation (shows original price vs. collected amount)
- ✅ Email template builder (CRUD)
- ✅ Bulk email communication to verified teams
- ✅ **Full CRUD operations**: Update any team or member field at any time

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- MongoDB account
- Supabase account
- Google account with App Password enabled

### Setup

1. **Clone and install dependencies**
   ```bash
   npm run install-all
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Set up databases**
   - Create a MongoDB database named `singularity-admin`
   - Create Supabase tables (see schema below)

4. **Run the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

## 🗄️ Database Schema

### Supabase (PostgreSQL)

```sql
-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name VARCHAR(255) NOT NULL,
  leader_name VARCHAR(255) NOT NULL,
  leader_email VARCHAR(255) NOT NULL UNIQUE,
  ticket_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  year_of_study VARCHAR(50),
  department VARCHAR(255),
  roll_number VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20)
);
```

### MongoDB Collections

- **admins**: `{ email, password (hashed), resetToken, resetExpiry }`
- **templates**: `{ name, subject, htmlBody }`

## 🌐 Deployment (Render)

1. Create a new Web Service
2. Connect your GitHub repository
3. Add environment variables in Render dashboard
4. Deploy!

## 📧 Email Setup

Enable 2FA on your Google account and generate an App Password:
1. Go to Google Account Settings
2. Security → 2-Step Verification → App Passwords
3. Generate password for "Mail"
4. Use this password in `SMTP_PASS`

## 📝 License

MIT
