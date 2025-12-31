import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { generateInvoicePDF } from '../services/invoiceService.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Generate and download invoice PDF directly from form data
router.post('/generate-pdf', authMiddleware, async (req, res) => {
  try {
    const {
      invoice_number,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      invoice_date,
      due_date,
      items,
      subtotal,
      tax_percentage,
      tax_amount,
      discount_amount,
      total_amount,
      currency,
      status,
      payment_terms,
      notes,
      company_name,
      company_address,
      company_email,
      company_phone
    } = req.body;

    // Validate required fields
    if (!invoice_number || !customer_name || !customer_email || !invoice_date || !due_date || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate amounts if not provided
    let calculatedSubtotal = subtotal;
    let calculatedTaxAmount = tax_amount;
    let calculatedTotal = total_amount;

    if (!calculatedSubtotal) {
      calculatedSubtotal = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    }

    if (!calculatedTaxAmount && tax_percentage) {
      calculatedTaxAmount = (calculatedSubtotal * parseFloat(tax_percentage)) / 100;
    }

    if (!calculatedTotal) {
      calculatedTotal = calculatedSubtotal + (calculatedTaxAmount || 0) - (discount_amount || 0);
    }

    const invoiceData = {
      invoice_number,
      customer_name,
      customer_email,
      customer_phone: customer_phone || '',
      customer_address: customer_address || '',
      invoice_date,
      due_date,
      items,
      subtotal: calculatedSubtotal,
      tax_percentage: tax_percentage || 0,
      tax_amount: calculatedTaxAmount || 0,
      discount_amount: discount_amount || 0,
      total_amount: calculatedTotal,
      currency: currency || 'INR',
      status: status || 'pending',
      payment_terms: payment_terms || '',
      notes: notes || '',
      company_name: company_name || '',
      company_address: company_address || '',
      company_email: company_email || '',
      company_phone: company_phone || ''
    };

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `invoice-${invoice_number}-${Date.now()}.pdf`;
    const outputPath = path.join(uploadsDir, filename);

    // Generate PDF
    await generateInvoicePDF(invoiceData, outputPath);

    // Send file for download
    res.download(outputPath, filename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download PDF' });
        }
      }

      // Delete file after download
      setTimeout(() => {
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }, 10000); // Delete after 10 seconds
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

export default router;
