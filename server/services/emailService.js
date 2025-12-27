import nodemailer from 'nodemailer';

// Create transporter with connection pooling
const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT);
  const secure = port === 465; // Use secure for port 465
  
  const config = {
    host: process.env.SMTP_HOST,
    port: port,
    secure: secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    pool: true, // Enable connection pooling
    maxConnections: 5, // Max simultaneous connections
    maxMessages: 100, // Max messages per connection
    rateDelta: 1000, // Rate limiting: 1 second between messages
    rateLimit: 5, // Max 5 messages per rateDelta period
    connectionTimeout: 60000, // 60 seconds connection timeout
    greetingTimeout: 30000, // 30 seconds greeting timeout
    socketTimeout: 60000, // 60 seconds socket timeout
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates
    }
  };
  
  // For port 587, explicitly require STARTTLS
  if (port === 587) {
    config.requireTLS = true;
    config.secure = false;
  }
  
  console.log(`📧 SMTP Config: ${config.host}:${config.port} (secure: ${config.secure})`);
  
  return nodemailer.createTransport(config);
};

// Verify SMTP connection
export const verifyConnection = async () => {
  const transporter = createTransporter();
  
  try {
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    transporter.close();
    return true;
  } catch (error) {
    console.error('❌ SMTP verification failed:', error.message);
    console.error('Check your SMTP settings:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? '***configured***' : '❌ MISSING'
    });
    transporter.close();
    throw error;
  }
};

export const sendEmail = async (to, subject, html, attachments = [], retries = 3) => {
  // Create a fresh transporter for each email to avoid connection issues
  const transporter = createTransporter();
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📧 Attempting to send email to: ${to} (attempt ${attempt}/${retries})`);
      
      const mailOptions = {
        from: `"Singularity Hackathon" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        attachments
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      console.log('📬 Accepted recipients:', info.accepted);
      
      // Close the transporter connection after sending
      transporter.close();
      
      return info;
    } catch (error) {
      console.error(`❌ Email error (attempt ${attempt}/${retries}):`, error.message);
      
      if (attempt === retries) {
        console.error('❌ Error details:', error);
        // Make sure to close connection on final error
        transporter.close();
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // This should never be reached, but just in case
  transporter.close();
  throw new Error('Failed to send email after all retries');
};

// Replace handlebars-style placeholders
export const replacePlaceholders = (template, data) => {
  let result = template;
  
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  
  return result;
};
