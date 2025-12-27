# SMTP Connection Troubleshooting

## Common Issues and Solutions

### 1. Connection Timeout (ETIMEDOUT)

**Symptoms:** `Error: Connection timeout` with code `ETIMEDOUT`

**Possible Causes:**
- Incorrect SMTP host or port
- Firewall blocking outbound SMTP connections
- SMTP server not accepting connections from your IP/server
- Network connectivity issues

**Solutions:**

#### A. Verify Environment Variables
Make sure these are set correctly in your Render dashboard:
```
SMTP_HOST=smtp.gmail.com  # or your SMTP provider
SMTP_PORT=587  # or 465 for SSL
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # NOT your regular password
```

#### B. Common SMTP Provider Settings

**Gmail:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```
⚠️ **Important:** You MUST use an App Password, not your regular Gmail password:
1. Go to Google Account → Security → 2-Step Verification
2. Scroll down to "App passwords"
3. Generate a new app password for "Mail"
4. Use this 16-character password in SMTP_PASS

**SendGrid:**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-smtp-password
```

**AWS SES:**
```
SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # adjust region
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

**Outlook/Office 365:**
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### C. Use Alternative Ports

If port 587 is blocked, try:
- Port 465 (SSL/TLS)
- Port 2525 (alternative for 587)

Update your environment variable:
```
SMTP_PORT=465  # or 2525
```

#### D. Use a Transactional Email Service

For production, consider using:
1. **SendGrid** (12,000 free emails/month)
2. **Mailgun** (5,000 free emails/month)
3. **AWS SES** (62,000 free emails/month with AWS Free Tier)
4. **Postmark** (100 free emails/month)

These services are designed for transactional emails and rarely have connection issues.

### 2. Testing SMTP Connection

You can test your SMTP connection using the health check endpoint once the server starts. Check the server logs for:

✅ **Success:**
```
🔍 Verifying SMTP connection...
✅ SMTP connection verified successfully
```

❌ **Failure:**
```
❌ SMTP verification failed: Connection timeout
Check your SMTP settings:
  host: smtp.gmail.com
  port: 587
  user: ***configured***
```

### 3. Render-Specific Configuration

On Render:
1. Go to your web service
2. Click "Environment" tab
3. Add/update these variables:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
4. Click "Save Changes"
5. Render will automatically redeploy

### 4. Gmail-Specific Issues

If using Gmail and still getting timeouts after setting up App Password:

1. **Enable Less Secure Apps** (if available)
   - Go to https://myaccount.google.com/lesssecureapps
   - Turn ON "Allow less secure apps"

2. **Check "Allow access to your Google Account"**
   - Sometimes Google blocks the first connection attempt
   - Check your email for security alerts
   - Click "Yes, it was me" to allow

3. **Use OAuth2 instead** (more complex but more secure)

### 5. Quick Fix: Switch to SendGrid

If you need a quick solution:

1. Sign up for SendGrid (free tier)
2. Get your API key
3. Update environment variables:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```
4. Redeploy

## Updated Features

The email service now includes:
- ✅ Increased connection timeout (60 seconds)
- ✅ Automatic retry with exponential backoff (3 attempts)
- ✅ SMTP connection verification on server startup
- ✅ Better error logging and diagnostics
- ✅ Proper handling of different SMTP ports (465 vs 587)
- ✅ STARTTLS for port 587

## Need More Help?

Check the server logs on Render for detailed error messages:
1. Go to your Render dashboard
2. Click on your web service
3. Go to "Logs" tab
4. Look for 🔍 SMTP verification messages
