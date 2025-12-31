import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateInvoicePDF = (invoice, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const writeStream = fs.createWriteStream(outputPath);

      doc.pipe(writeStream);

      // Header - Company branding
      doc.fillColor('#1a1a2e')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text(invoice.company_name || 'YOUR COMPANY', 50, 50);

      doc.fillColor('#667eea')
         .fontSize(10)
         .font('Helvetica')
         .text(invoice.company_address || 'Company Address', 50, 85)
         .text(invoice.company_email || 'contact@company.com', 50, 100)
         .text(invoice.company_phone || 'Phone: +1234567890', 50, 115);

      // Draw top line
      doc.moveTo(50, 140)
         .lineTo(545, 140)
         .strokeColor('#667eea')
         .lineWidth(2)
         .stroke();

      // Invoice title
      doc.fillColor('#1a1a2e')
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('INVOICE', 50, 160);

      // Invoice details - Left side
      doc.fillColor('#666')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Invoice Number:', 50, 195)
         .font('Helvetica')
         .text(invoice.invoice_number, 150, 195);

      doc.font('Helvetica-Bold')
         .text('Invoice Date:', 50, 210)
         .font('Helvetica')
         .text(new Date(invoice.invoice_date).toLocaleDateString(), 150, 210);

      doc.font('Helvetica-Bold')
         .text('Due Date:', 50, 225)
         .font('Helvetica')
         .text(new Date(invoice.due_date).toLocaleDateString(), 150, 225);

      doc.font('Helvetica-Bold')
         .text('Status:', 50, 240)
         .font('Helvetica')
         .fillColor(invoice.status === 'paid' ? '#10b981' : invoice.status === 'overdue' ? '#ef4444' : '#f59e0b')
         .text(invoice.status.toUpperCase(), 150, 240);

      // Customer details - Right side
      doc.fillColor('#1a1a2e')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('BILL TO:', 350, 195);

      doc.fillColor('#333')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(invoice.customer_name, 350, 215)
         .font('Helvetica')
         .text(invoice.customer_email, 350, 230, { width: 180 });

      if (invoice.customer_phone) {
        doc.text(invoice.customer_phone, 350, 245);
      }

      if (invoice.customer_address) {
        doc.text(invoice.customer_address, 350, invoice.customer_phone ? 260 : 245, { width: 180 });
      }

      // Items table
      const tableTop = 320;
      
      // Table header
      doc.rect(50, tableTop, 495, 25)
         .fillColor('#667eea')
         .fill();

      doc.fillColor('#ffffff')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Description', 60, tableTop + 8, { width: 220 })
         .text('Quantity', 290, tableTop + 8, { width: 60, align: 'center' })
         .text('Rate', 360, tableTop + 8, { width: 80, align: 'right' })
         .text('Amount', 450, tableTop + 8, { width: 85, align: 'right' });

      // Table rows
      let currentY = tableTop + 25;
      const items = invoice.items || [];

      items.forEach((item, index) => {
        const rowHeight = 30;
        
        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(50, currentY, 495, rowHeight)
             .fillColor('#f9fafb')
             .fill();
        }

        doc.rect(50, currentY, 495, rowHeight)
           .strokeColor('#e5e7eb')
           .lineWidth(0.5)
           .stroke();

        doc.fillColor('#333')
           .fontSize(10)
           .font('Helvetica')
           .text(item.description, 60, currentY + 10, { width: 220, lineBreak: false, ellipsis: true })
           .text(item.quantity.toString(), 290, currentY + 10, { width: 60, align: 'center' })
           .text(`${invoice.currency || 'INR'} ${parseFloat(item.rate).toFixed(2)}`, 360, currentY + 10, { width: 80, align: 'right' })
           .text(`${invoice.currency || 'INR'} ${parseFloat(item.amount).toFixed(2)}`, 450, currentY + 10, { width: 85, align: 'right' });

        currentY += rowHeight;
      });

      // Totals section
      currentY += 10;
      const totalsX = 350;

      // Subtotal
      doc.fillColor('#666')
         .fontSize(10)
         .font('Helvetica')
         .text('Subtotal:', totalsX, currentY)
         .text(`${invoice.currency || 'INR'} ${parseFloat(invoice.subtotal).toFixed(2)}`, totalsX + 100, currentY, { width: 95, align: 'right' });

      currentY += 20;

      // Tax
      if (invoice.tax_amount > 0) {
        doc.text(`Tax (${invoice.tax_percentage || 0}%):`, totalsX, currentY)
           .text(`${invoice.currency || 'INR'} ${parseFloat(invoice.tax_amount).toFixed(2)}`, totalsX + 100, currentY, { width: 95, align: 'right' });
        currentY += 20;
      }

      // Discount
      if (invoice.discount_amount > 0) {
        doc.fillColor('#10b981')
           .text(`Discount:`, totalsX, currentY)
           .text(`-${invoice.currency || 'INR'} ${parseFloat(invoice.discount_amount).toFixed(2)}`, totalsX + 100, currentY, { width: 95, align: 'right' });
        currentY += 20;
      }

      // Total
      doc.rect(totalsX - 10, currentY - 5, 205, 30)
         .fillColor('#1a1a2e')
         .fill();

      doc.fillColor('#ffffff')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('TOTAL:', totalsX, currentY + 5)
         .text(`${invoice.currency || 'INR'} ${parseFloat(invoice.total_amount).toFixed(2)}`, totalsX + 100, currentY + 5, { width: 95, align: 'right' });

      currentY += 50;

      // Payment information
      if (invoice.payment_terms) {
        doc.fillColor('#1a1a2e')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('Payment Terms:', 50, currentY);
        
        doc.fillColor('#333')
           .fontSize(10)
           .font('Helvetica')
           .text(invoice.payment_terms, 50, currentY + 18, { width: 495 });
        
        currentY += 55;
      }

      // Notes
      if (invoice.notes) {
        doc.fillColor('#1a1a2e')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('Notes:', 50, currentY);
        
        doc.fillColor('#333')
           .fontSize(10)
           .font('Helvetica')
           .text(invoice.notes, 50, currentY + 18, { width: 495 });
      }

      // Footer
      doc.fillColor('#666')
         .fontSize(9)
         .font('Helvetica')
         .text('This is a computer-generated invoice and does not require a physical signature.', 50, 750, { align: 'center', width: 495 })
         .text('Thank you for your business!', 50, 765, { align: 'center', width: 495 });

      // Decorative element
      doc.circle(520, 760, 12)
         .fillColor('#667eea')
         .fill();

      doc.circle(495, 772, 7)
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
