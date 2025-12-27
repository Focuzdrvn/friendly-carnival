import nodemailer from 'nodemailer';

// Create transporter with connection pooling
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    pool: true, // Enable connection pooling
    maxConnections: 5, // Max simultaneous connections
    maxMessages: 100, // Max messages per connection
    rateDelta: 1000, // Rate limiting: 1 second between messages
    rateLimit: 5, // Max 5 messages per rateDelta period
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates
    }
  });
};

export const sendEmail = async (to, subject, html, attachments = []) => {
  // Create a fresh transporter for each email to avoid connection issues
  const transporter = createTransporter();
  
  try {
    console.log(`📧 Attempting to send email to: ${to}`);
    
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
    console.error('❌ Email error:', error.message);
    console.error('❌ Error details:', error);
    
    // Make sure to close connection on error too
    transporter.close();
    
    throw error;
  }
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
