import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateInvoicePDF = (team, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const writeStream = fs.createWriteStream(outputPath);

      doc.pipe(writeStream);

      // Header - Space theme
      doc.fillColor('#1a1a2e')
         .fontSize(32)
         .font('Helvetica-Bold')
         .text('SINGULARITY', 50, 50);

      doc.fillColor('#667eea')
         .fontSize(12)
         .font('Helvetica')
         .text('Hackathon 2026', 50, 85);

      // Draw top line
      doc.moveTo(50, 110)
         .lineTo(545, 110)
         .strokeColor('#667eea')
         .lineWidth(2)
         .stroke();

      // Invoice title
      doc.fillColor('#1a1a2e')
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('PAYMENT INVOICE', 50, 130);

      // Invoice details
      doc.fillColor('#666')
         .fontSize(10)
         .font('Helvetica')
         .text(`Invoice Date: ${new Date().toLocaleDateString()}`, 50, 165)
         .text(`Invoice ID: ${team.id.substring(0, 8).toUpperCase()}`, 50, 180);

      // Team details section
      doc.fillColor('#1a1a2e')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('TEAM INFORMATION', 50, 220);

      doc.fillColor('#333')
         .fontSize(11)
         .font('Helvetica')
         .text(`Team Name: ${team.team_name}`, 50, 245)
         .text(`Team Leader: ${team.leader_name}`, 50, 265)
         .text(`Email: ${team.leader_email}`, 50, 285)
         .text(`Ticket Type: ${team.ticket_type}`, 50, 305);

      // Payment details table
      doc.fillColor('#1a1a2e')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('PAYMENT DETAILS', 50, 345);

      // Table header
      const tableTop = 375;
      doc.rect(50, tableTop, 495, 30)
         .fillColor('#667eea')
         .fill();

      doc.fillColor('#ffffff')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('Description', 60, tableTop + 10, { width: 250 })
         .text('Amount', 445, tableTop + 10, { width: 90, align: 'right' });

      // Table row - Original price
      doc.rect(50, tableTop + 30, 495, 40)
         .strokeColor('#e0e0e0')
         .lineWidth(1)
         .stroke();

      doc.fillColor('#333')
         .fontSize(11)
         .font('Helvetica')
         .text(`${team.ticket_type} Registration Fee`, 60, tableTop + 43, { width: 250 })
         .text(`INR ${team.amount.toFixed(2)}`, 445, tableTop + 43, { width: 90, align: 'right' });

      // Show money_collected if different from amount
      let currentTop = tableTop + 70;
      const moneyCollected = team.money_collected || team.amount; // Fallback if money_collected is undefined
      
      if (moneyCollected !== team.amount) {
        doc.rect(50, currentTop, 495, 40)
           .strokeColor('#e0e0e0')
           .lineWidth(1)
           .stroke();

        doc.fillColor('#667eea')
           .fontSize(11)
           .font('Helvetica')
           .text('Amount Collected (Adjusted)', 60, currentTop + 13, { width: 250 })
           .text(`INR ${moneyCollected.toFixed(2)}`, 445, currentTop + 13, { width: 90, align: 'right' });
        
        currentTop += 40;
      }

      // Total
      const totalTop = currentTop;
      doc.rect(50, totalTop, 495, 35)
         .fillColor('#f5f5f5')
         .fill();

      doc.fillColor('#1a1a2e')
         .fontSize(13)
         .font('Helvetica-Bold')
         .text('TOTAL AMOUNT PAID', 60, totalTop + 10, { width: 250 })
         .text(`INR${moneyCollected.toFixed(2)}`, 445, totalTop + 10, { width: 90, align: 'right' });

      // Payment status
      doc.fillColor('#10b981')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('✓ PAYMENT VERIFIED', 50, totalTop + 60);

      // Footer
      doc.fillColor('#666')
         .fontSize(9)
         .font('Helvetica')
         .text('this is a computer-generated invoice and does not require a physical signature.', 50, 780, { align: 'center', width: 495 })
         .text('Thank you for registering for Singularity Hackathon 2026!', 50, 680, { align: 'center', width: 495 })
         .text('For queries, contact us at singularity@kccemsr.edu.in', 50, 695, { align: 'center', width: 495 });

      // Space-themed decorative element
      doc.circle(520, 750, 15)
         .fillColor('#667eea')
         .fill();

      doc.circle(490, 765, 8)
         .fillColor('#764ba2')
         .fill();

      doc.end();

      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};
