# 🔧 Team Verification Setup Guide

## Issue: Unable to Verify Teams

If you're unable to verify teams, it's likely due to missing credentials in your `.env` file.

---

## ✅ Required Configuration

### 1. SMTP Email Configuration

The verification process sends an invoice email to the team leader. You need a Gmail App Password.

#### Steps to Get Gmail App Password:

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Singularity Admin"
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Update server/.env file:**
   ```bash
   SMTP_PASS=your_16_character_app_password
   ```

### 2. Supabase Configuration

Verify your Supabase anonymous key is correct:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the "anon public" key
5. Update `server/.env`:
   ```bash
   SUPABASE_ANON_KEY=your_actual_key_here
   ```

---

## 🔄 After Configuration

1. **Restart the backend server:**
   ```bash
   # Press Ctrl+C in the server terminal
   cd server
   npm run dev
   ```

2. **Try verifying a team again**
   - The verification will now work
   - An email with PDF invoice will be sent
   - You'll see detailed logs in the server console

---

## 📊 Verification Process

When you click "Verify Payment":

1. ✅ Team status is updated to `is_verified: true`
2. 📄 PDF invoice is generated with team details
3. 📧 Email is sent to team leader with invoice attached
4. 🗑️ PDF is cleaned up after 10 seconds

---

## 🐛 Troubleshooting

### Error: "Email service not configured"
- Check `SMTP_PASS` in `server/.env`
- Make sure it's a 16-character Gmail App Password
- No spaces or quotes in the password

### Error: "Team verified but email failed"
- Team is successfully verified
- But email could not be sent
- Check SMTP credentials
- Check Gmail account is not locked

### Error: "Failed to fetch team"
- Check Supabase connection
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Check if tables exist in Supabase

### No error but nothing happens
- Open browser console (F12)
- Look for network errors
- Check server logs for detailed error messages

---

## 📝 Enhanced Error Logging

The verification endpoint now includes detailed logging:

- 📋 Starting verification
- ✅ Team found
- ✅ Members fetched
- 📝 Updating status
- 📄 Generating PDF
- 📧 Sending email
- ✅ Verification complete
- ❌ Any errors with stack traces

Check your server terminal for these logs!

---

## 🎯 Quick Test

Test if SMTP is working:

```bash
cd server
node -e "
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP Error:', error.message);
  } else {
    console.log('✅ SMTP is ready to send emails');
  }
});
"
```

---

*Last Updated: December 21, 2025*
