import express from 'express';
import supabase from '../config/supabase.js';
import Template from '../models/Template.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendEmail, replacePlaceholders } from '../services/emailService.js';

const router = express.Router();

// Send email to specific team
router.post('/send-to-team', authMiddleware, async (req, res) => {
  try {
    const { teamId, templateId, customSubject, customBody } = req.body;

    // Get team details
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;

    let subject, htmlBody;

    if (templateId) {
      // Use template
      const template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Replace placeholders
      const data = {
        team_name: team.team_name,
        leader_name: team.leader_name,
        leader_email: team.leader_email,
        ticket_type: team.ticket_type,
        amount: team.amount
      };

      subject = replacePlaceholders(template.subject, data);
      htmlBody = replacePlaceholders(template.htmlBody, data);
    } else {
      // Use custom content
      if (!customSubject || !customBody) {
        return res.status(400).json({ error: 'Subject and body are required' });
      }
      subject = customSubject;
      htmlBody = customBody;
    }

    await sendEmail(team.leader_email, subject, htmlBody);

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk send to all verified teams
router.post('/bulk-send', authMiddleware, async (req, res) => {
  try {
    const { templateId, customSubject, customBody, verifiedOnly = true } = req.body;

    // Get teams
    let query = supabase.from('teams').select('*');
    
    if (verifiedOnly) {
      query = query.eq('is_verified', true);
    }

    const { data: teams, error: teamsError } = await query;

    if (teamsError) throw teamsError;

    if (!teams || teams.length === 0) {
      return res.status(400).json({ error: 'No teams found' });
    }

    let subject, htmlBodyTemplate;

    if (templateId) {
      const template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      subject = template.subject;
      htmlBodyTemplate = template.htmlBody;
    } else {
      if (!customSubject || !customBody) {
        return res.status(400).json({ error: 'Subject and body are required' });
      }
      subject = customSubject;
      htmlBodyTemplate = customBody;
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Send emails with rate limiting
    for (const team of teams) {
      try {
        const data = {
          team_name: team.team_name,
          leader_name: team.leader_name,
          leader_email: team.leader_email,
          ticket_type: team.ticket_type,
          amount: team.amount
        };

        const personalizedSubject = replacePlaceholders(subject, data);
        const personalizedBody = replacePlaceholders(htmlBodyTemplate, data);

        await sendEmail(team.leader_email, personalizedSubject, personalizedBody);
        
        results.successful++;

        // Rate limiting: wait 100ms between emails
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (emailError) {
        results.failed++;
        results.errors.push({
          team: team.team_name,
          email: team.leader_email,
          error: emailError.message
        });
      }
    }

    res.json({
      message: 'Bulk email process completed',
      ...results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test email configuration
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <h2 style="color: #667eea;">✅ Email Configuration Test</h2>
          <p style="color: #333;">This is a test email from Singularity Hackathon Admin Suite.</p>
          <p style="color: #333;">If you received this, your email configuration is working correctly!</p>
        </div>
      </div>
    `;

    await sendEmail(email, 'Test Email - Singularity Admin', testHtml);

    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
