import express from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateInvoicePDF } from '../services/pdfService.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all teams with pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', verified } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('teams')
      .select('*', { count: 'exact' });

    // Search filter
    if (search) {
      query = query.or(`team_name.ilike.%${search}%,leader_name.ilike.%${search}%,leader_email.ilike.%${search}%`);
    }

    // Verification filter
    if (verified !== undefined) {
      query = query.eq('is_verified', verified === 'true');
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      teams: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single team with members
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Get team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (teamError) throw teamError;

    // Get members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('team_id', id);

    if (membersError) throw membersError;

    res.json({ team, members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CSV bulk upload
router.post('/upload-csv', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const errors = [];
          const successfulTeams = [];

          for (const row of results.data) {
            try {
              // Validate required fields
              if (!row.team_name || !row.leader_name || !row.leader_email || !row.ticket_type || !row.amount) {
                errors.push({ row, error: 'Missing required team fields' });
                continue;
              }

              // Validate ticket_type
              const validTicketTypes = ['Early Bird', 'Proper Price', 'Late Lateef'];
              if (!validTicketTypes.includes(row.ticket_type)) {
                errors.push({ row, error: `Invalid ticket_type. Must be one of: ${validTicketTypes.join(', ')}` });
                continue;
              }

              // Insert team
              const amount = parseFloat(row.amount);
              const moneyCollected = row.money_collected ? parseFloat(row.money_collected) : amount;
              
              const { data: team, error: teamError } = await supabase
                .from('teams')
                .insert([{
                  team_name: row.team_name,
                  leader_name: row.leader_name,
                  leader_email: row.leader_email,
                  ticket_type: row.ticket_type,
                  amount: amount,
                  money_collected: moneyCollected,
                  is_verified: false
                }])
                .select()
                .single();

              if (teamError) {
                errors.push({ row, error: teamError.message });
                continue;
              }

              // Parse and insert members if provided
              const members = [];

              // Support multiple members in CSV (member1_name, member2_name, etc.) - max 4
              let memberIndex = 1;
              while (row[`member${memberIndex}_name`] && memberIndex <= 4) {
                // Validate required member fields
                if (!row[`member${memberIndex}_email`] || !row[`member${memberIndex}_phone`] || !row[`member${memberIndex}_prn`]) {
                  errors.push({ row, error: `Member ${memberIndex} missing required fields (email, phone, prn)` });
                  break;
                }
                
                const member = {
                  team_id: team.id,
                  name: row[`member${memberIndex}_name`],
                  email: row[`member${memberIndex}_email`],
                  phone: row[`member${memberIndex}_phone`],
                  prn: row[`member${memberIndex}_prn`],
                  year_of_study: row[`member${memberIndex}_year`] || '',
                  department: row[`member${memberIndex}_department`] || ''
                };
                members.push(member);
                memberIndex++;
              }
              
              // Enforce 4-member limit
              if (memberIndex > 5) {
                errors.push({ row, error: 'Team cannot have more than 4 members' });
                continue;
              }

              if (members.length > 0) {
                const { error: membersError } = await supabase
                  .from('members')
                  .insert(members);

                if (membersError) {
                  console.error('Members insert error:', membersError);
                }
              }

              successfulTeams.push(team);
            } catch (rowError) {
              errors.push({ row, error: rowError.message });
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            message: 'CSV processed',
            successful: successfulTeams.length,
            failed: errors.length,
            errors: errors.length > 0 ? errors : undefined
          });
        } catch (parseError) {
          fs.unlinkSync(req.file.path);
          res.status(500).json({ error: parseError.message });
        }
      },
      error: (error) => {
        fs.unlinkSync(req.file.path);
        res.status(400).json({ error: 'CSV parsing failed: ' + error.message });
      }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Manual team addition
router.post('/add-manual', authMiddleware, async (req, res) => {
  try {
    const { team, members } = req.body;

    // Validate required fields
    if (!team || !team.team_name || !team.leader_name || !team.leader_email || !team.ticket_type || !team.amount) {
      return res.status(400).json({ error: 'Missing required team fields' });
    }

    // Validate ticket_type
    const validTicketTypes = ['Early Bird', 'Proper Price', 'Late Lateef'];
    if (!validTicketTypes.includes(team.ticket_type)) {
      return res.status(400).json({ error: `Invalid ticket_type. Must be one of: ${validTicketTypes.join(', ')}` });
    }

    if (!members || members.length === 0) {
      return res.status(400).json({ error: 'At least one team member is required' });
    }

    // Enforce 4-member limit
    if (members.length > 4) {
      return res.status(400).json({ error: 'Team cannot have more than 4 members' });
    }

    // Validate all members have required fields
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member.name || !member.email || !member.phone || !member.prn) {
        return res.status(400).json({ 
          error: `Member ${i + 1} missing required fields (name, email, phone, prn)` 
        });
      }
    }

    // Insert team
    const amount = parseFloat(team.amount);
    const moneyCollected = team.money_collected ? parseFloat(team.money_collected) : amount;
    
    const { data: insertedTeam, error: teamError } = await supabase
      .from('teams')
      .insert([{
        team_name: team.team_name,
        leader_name: team.leader_name,
        leader_email: team.leader_email,
        ticket_type: team.ticket_type,
        amount: amount,
        money_collected: moneyCollected,
        is_verified: false
      }])
      .select()
      .single();

    if (teamError) {
      throw new Error(`Failed to insert team: ${teamError.message}`);
    }

    // Insert members
    const membersToInsert = members.map(member => ({
      team_id: insertedTeam.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      prn: member.prn,
      year_of_study: member.year_of_study || '',
      department: member.department || ''
    }));

    const { error: membersError } = await supabase
      .from('members')
      .insert(membersToInsert);

    if (membersError) {
      // If members insert fails, optionally delete the team
      await supabase.from('teams').delete().eq('id', insertedTeam.id);
      throw new Error(`Failed to insert members: ${membersError.message}`);
    }

    res.json({
      message: 'Team added successfully',
      team: insertedTeam
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify payment and send invoice
router.post('/:id/verify', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Starting verification for team ID: ${id}`);

    // Get team details
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (teamError) {
      console.error('❌ Error fetching team:', teamError.message);
      throw teamError;
    }

    console.log(`✅ Team found: ${team.team_name}`);

    if (team.is_verified) {
      console.log('⚠️ Team already verified');
      return res.status(400).json({ error: 'Team already verified' });
    }

    // Get team members for PDF
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('team_id', id);

    if (membersError) {
      console.error('❌ Error fetching members:', membersError.message);
      throw membersError;
    }

    console.log(`✅ Found ${members.length} team members`);

    // Update verification status
    console.log('📝 Updating verification status...');
    const { error: updateError } = await supabase
      .from('teams')
      .update({ is_verified: true })
      .eq('id', id);

    if (updateError) {
      console.error('❌ Error updating verification:', updateError.message);
      throw updateError;
    }

    console.log('✅ Team marked as verified');

    // Generate PDF invoice
    console.log('📄 Generating PDF invoice...');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Created uploads directory');
    }

    const pdfPath = path.join(uploadsDir, `invoice_${id}.pdf`);
    
    // Generate PDF invoice and wait for it to complete
    const teamWithMembers = { ...team, members };
    await generateInvoicePDF(teamWithMembers, pdfPath);
    console.log(`✅ PDF generated: ${pdfPath}`);
    
    // Add a small delay to ensure file is fully written to disk
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send email with invoice
    console.log(`📧 Preparing to send email to: ${team.leader_email}`);
    
    // Check if SMTP is configured
    if (!process.env.SMTP_PASS || process.env.SMTP_PASS.includes('YOUR_')) {
      console.error('❌ SMTP credentials not configured!');
      return res.status(500).json({ 
        error: 'Email service not configured. Please set SMTP_PASS in .env file.',
        verified: true,
        pdfGenerated: true
      });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #667eea; margin-bottom: 20px;">Payment Verified!</h2>
          <p style="color: #333; line-height: 1.6;">Dear ${team.leader_name},</p>
          <p style="color: #333; line-height: 1.6;">Congratulations! Your payment for <strong>${team.team_name}</strong> has been verified.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>Ticket Type:</strong> ${team.ticket_type}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Amount Paid:</strong> ₹${team.money_collected || team.amount}</p>
          </div>
          <p style="color: #333; line-height: 1.6;">Please find your invoice attached to this email.</p>
          <p style="color: #333; line-height: 1.6;">See you at Singularity Hackathon 2026! 🚀</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Developer Club</p>
        </div>
      </div>
    `;

    // Send email and wait for completion
    try {
      await sendEmail(
        team.leader_email,
        `Payment Confirmed - ${team.team_name}`,
        emailHtml,
        [{ filename: 'Singularity_Invoice.pdf', path: pdfPath, contentType: 'application/pdf' }]
      );
      console.log('✅ Email sent successfully!');
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError.message);
      // Clean up PDF
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
      return res.status(500).json({ 
        error: `Team verified but email failed: ${emailError.message}`,
        verified: true,
        emailSent: false
      });
    }

    // Clean up PDF file after email is sent successfully
    setTimeout(() => {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
        console.log('🗑️ Cleaned up PDF file');
      }
    }, 10000); // Increased to 10 seconds

    console.log('✅ Verification complete!');
    res.json({ message: 'Payment verified and invoice sent successfully' });
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    // Total teams
    const { count: totalTeams } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true });

    // Verified teams
    const { count: verifiedTeams } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true);

    // Total revenue (using money_collected field)
    const { data: revenueData } = await supabase
      .from('teams')
      .select('money_collected')
      .eq('is_verified', true);

    const totalRevenue = revenueData?.reduce((sum, team) => sum + parseFloat(team.money_collected), 0) || 0;

    // Total members
    const { count: totalMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });

    res.json({
      totalTeams,
      verifiedTeams,
      pendingTeams: totalTeams - verifiedTeams,
      totalRevenue,
      totalMembers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update team (allows manual override of any field)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate ticket_type if provided
    if (updates.ticket_type) {
      const validTicketTypes = ['Early Bird', 'Proper Price', 'Late Lateef'];
      if (!validTicketTypes.includes(updates.ticket_type)) {
        return res.status(400).json({ 
          error: `Invalid ticket_type. Must be one of: ${validTicketTypes.join(', ')}` 
        });
      }
    }

    // Parse numeric fields
    if (updates.amount) updates.amount = parseFloat(updates.amount);
    if (updates.money_collected) updates.money_collected = parseFloat(updates.money_collected);

    // Update team
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Team updated successfully', team: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update member (allows manual override of any field)
router.put('/member/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Update member
    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Member updated successfully', member: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete member
router.delete('/member/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add member to existing team
router.post('/:teamId/member', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const member = req.body;

    // Validate required fields
    if (!member.name || !member.email || !member.phone || !member.prn) {
      return res.status(400).json({ 
        error: 'Missing required member fields (name, email, phone, prn)' 
      });
    }

    // Check current member count
    const { count, error: countError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId);

    if (countError) throw countError;

    if (count >= 4) {
      return res.status(400).json({ error: 'Team already has 4 members (maximum limit)' });
    }

    // Insert member
    const { data, error } = await supabase
      .from('members')
      .insert([{
        team_id: teamId,
        name: member.name,
        email: member.email,
        phone: member.phone,
        prn: member.prn,
        year_of_study: member.year_of_study || '',
        department: member.department || ''
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Member added successfully', member: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
