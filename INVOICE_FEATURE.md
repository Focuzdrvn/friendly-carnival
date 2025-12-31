# Invoice Feature Documentation

## Overview
A complete invoicing system for creating, managing, and generating PDF invoices. Built with a similar architecture to the existing PDF service for team invoices.

## Features

### 1. **Invoice Management**
- Create, read, update, and delete invoices
- Track invoice status (pending, paid, overdue, cancelled)
- Automatic overdue status updates
- Multiple items per invoice with quantity, rate, and amount calculation

### 2. **Financial Calculations**
- Automatic subtotal calculation from line items
- Tax percentage and amount calculation
- Discount support
- Real-time total calculations in the UI

### 3. **PDF Generation**
- Professional invoice PDF generation
- Company branding (logo, name, address, contact)
- Customer information
- Itemized list with quantities and rates
- Tax and discount breakdowns
- Payment terms and notes
- Download invoices as PDF files

### 4. **Statistics & Analytics**
- Total invoices count
- Total revenue tracking
- Paid vs pending amounts
- Status-based filtering (paid, pending, overdue, cancelled)
- Date range filtering
- Customer name search

### 5. **Invoice Operations**
- Mark invoices as paid with payment date
- Send invoices via email (integration ready)
- Filter by status, customer, and date range
- Sort by various fields
- Pagination support

## Database Schema

### Invoices Table
```sql
- id (UUID, primary key)
- invoice_number (unique, required)
- customer_name (required)
- customer_email (required)
- customer_phone
- customer_address
- invoice_date (required)
- due_date (required)
- payment_date
- items (JSONB array)
- subtotal (decimal)
- tax_percentage (decimal)
- tax_amount (decimal)
- discount_amount (decimal)
- total_amount (decimal, required)
- currency (default: INR)
- status (pending/paid/overdue/cancelled)
- payment_method
- payment_terms (text)
- notes (text)
- company_name
- company_address
- company_email
- company_phone
- created_at (timestamp)
- updated_at (timestamp)
```

### Item Structure (JSONB)
```javascript
{
  description: "Service/Product name",
  quantity: 10,
  rate: 50.00,
  amount: 500.00
}
```

## API Endpoints

### GET /api/invoices
Get all invoices with filtering and pagination
**Query Parameters:**
- page (default: 1)
- limit (default: 50)
- status (pending/paid/overdue/cancelled)
- customer_name (search)
- startDate (YYYY-MM-DD)
- endDate (YYYY-MM-DD)
- sortBy (default: invoice_date)
- sortOrder (asc/desc, default: desc)

**Response:**
```json
{
  "invoices": [...],
  "total": 100,
  "page": 1,
  "totalPages": 2
}
```

### GET /api/invoices/stats
Get invoice statistics
**Query Parameters:**
- startDate
- endDate

**Response:**
```json
{
  "total": 150,
  "totalAmount": 75000.00,
  "paid": 100,
  "pending": 45,
  "overdue": 5,
  "cancelled": 0,
  "paidAmount": 50000.00,
  "pendingAmount": 25000.00
}
```

### GET /api/invoices/:id
Get a single invoice by ID

### POST /api/invoices
Create a new invoice
**Required fields:**
- invoice_number
- customer_name
- customer_email
- invoice_date
- due_date
- items (array, min 1 item)

**Optional fields:**
- customer_phone
- customer_address
- subtotal (auto-calculated if not provided)
- tax_percentage
- tax_amount (auto-calculated if not provided)
- discount_amount
- total_amount (auto-calculated if not provided)
- currency (default: INR)
- status (default: pending)
- payment_terms
- notes
- company_name
- company_address
- company_email
- company_phone

### PUT /api/invoices/:id
Update an invoice
- Supports partial updates
- Automatically recalculates totals if items change

### DELETE /api/invoices/:id
Delete an invoice

### GET /api/invoices/:id/pdf
Generate and download invoice PDF
- Creates a professional PDF document
- Returns file for download
- Automatically cleans up file after 10 seconds

### PATCH /api/invoices/:id/mark-paid
Mark an invoice as paid
**Body:**
```json
{
  "payment_date": "2024-12-30",
  "payment_method": "Bank Transfer"
}
```

### POST /api/invoices/:id/send
Send invoice via email (email service integration required)
**Body:**
```json
{
  "email": "customer@example.com",
  "message": "Optional custom message"
}
```

## Frontend Components

### Invoices Page (`/client/src/pages/Invoices.jsx`)
Complete invoice management interface with:
- Statistics dashboard showing totals and amounts
- Filter panel (status, customer name, date range)
- Invoice list table with actions
- Create/Edit modal with full invoice form
- Real-time calculations
- PDF download functionality
- Mark as paid functionality

### Form Features
- Dynamic item rows (add/remove)
- Automatic amount calculation per item
- Real-time subtotal, tax, and total calculations
- Comprehensive validation
- Separate sections for customer info, items, and company info
- Support for payment terms and notes

## File Structure

```
server/
  models/
    Invoice.js              # Invoice model with CRUD operations
  routes/
    invoices.js            # API routes for invoice operations
  services/
    invoiceService.js      # PDF generation service

client/
  src/
    pages/
      Invoices.jsx         # Main invoice management page

uploads/
  invoices/                # Directory for temporary PDF files
```

## Installation & Setup

### 1. Run Database Migration
```bash
# Run the migration in your Supabase dashboard or using psql
psql -U your_user -d your_database -f invoices_migration.sql
```

### 2. Create Uploads Directory
The server will automatically create the uploads/invoices directory, but you can create it manually:
```bash
mkdir -p uploads/invoices
```

### 3. Routes Already Integrated
The invoice routes are already added to [server/index.js](server/index.js), and the frontend route is added to [client/src/App.jsx](client/src/App.jsx) and [client/src/components/Layout.jsx](client/src/components/Layout.jsx).

### 4. Start the Application
```bash
# Backend
cd server
npm install
npm start

# Frontend
cd client
npm install
npm run dev
```

## Usage Examples

### Creating an Invoice
1. Click "Create Invoice" button
2. Fill in invoice details:
   - Invoice number (unique identifier)
   - Customer information
   - Invoice and due dates
3. Add line items:
   - Description, quantity, and rate
   - Amount is calculated automatically
4. Add tax percentage and discount (optional)
5. Fill in payment terms and notes (optional)
6. Add company information for PDF branding
7. Click "Create Invoice"

### Managing Invoices
- **View**: Browse all invoices in the table
- **Filter**: Use status, customer name, or date filters
- **Edit**: Click "Edit" to modify invoice details
- **Delete**: Click "Delete" to remove an invoice
- **Mark Paid**: Click "Mark Paid" to update status
- **Download PDF**: Click "PDF" to download a professional invoice

### PDF Invoice Features
- Company branding at the top
- Invoice details (number, date, due date, status)
- Customer information (Bill To section)
- Itemized table with quantities and rates
- Subtotal, tax, discount, and total
- Payment terms and notes
- Professional footer with decorative elements

## Customization

### Currency
Change the default currency in the form or update the database default:
```javascript
currency: 'USD' // or 'EUR', 'GBP', etc.
```

### Company Branding
Update company information in each invoice or set defaults in your environment:
```javascript
company_name: 'Your Company Name'
company_address: 'Your Address'
company_email: 'contact@company.com'
company_phone: '+1234567890'
```

### Tax Calculation
Modify tax percentage per invoice or set a default:
```javascript
tax_percentage: 18.0 // 18% tax
```

### PDF Styling
Customize the PDF appearance in [server/services/invoiceService.js](server/services/invoiceService.js):
- Colors (currently using purple/blue theme)
- Fonts and sizes
- Layout and spacing
- Logo/branding elements

## Email Integration (Future Enhancement)

The invoice sending feature is ready for email integration. To complete it:

1. Update the `/api/invoices/:id/send` endpoint in [server/routes/invoices.js](server/routes/invoices.js)
2. Use your existing email service from [server/services/emailService.js](server/services/emailService.js)
3. Attach the generated PDF to the email
4. Send to customer email

Example:
```javascript
import { sendEmail } from '../services/emailService.js';

// In the send endpoint
await sendEmail({
  to: email || invoice.customer_email,
  subject: `Invoice ${invoice.invoice_number}`,
  html: message || `Please find attached your invoice.`,
  attachments: [{
    filename: filename,
    path: outputPath
  }]
});
```

## Automatic Status Updates

A database function is included to automatically update overdue invoices:
```sql
CREATE OR REPLACE FUNCTION update_overdue_invoices()
```

You can schedule this to run daily using:
- Supabase Edge Functions
- Cron jobs
- Database triggers

## Security Considerations

1. **Authentication**: All routes use the `authMiddleware`
2. **RLS Policies**: Row Level Security enabled on invoices table
3. **File Cleanup**: PDFs are automatically deleted after download
4. **Validation**: Required fields enforced on both frontend and backend
5. **Sanitization**: Input validation prevents SQL injection

## Best Practices

1. **Unique Invoice Numbers**: Use a consistent numbering scheme (e.g., INV-2024-001)
2. **Regular Backups**: Backup your invoices table regularly
3. **Archive Old Invoices**: Consider archiving invoices older than 1 year
4. **Monitor Overdues**: Set up notifications for overdue invoices
5. **Audit Trail**: The updated_at timestamp tracks all changes

## Troubleshooting

### PDF Generation Fails
- Check if uploads/invoices directory exists and is writable
- Verify PDFKit is installed: `npm install pdfkit`
- Check server logs for specific errors

### Calculations Incorrect
- Verify all numeric values are properly parsed as floats
- Check item quantities and rates are valid numbers
- Ensure tax_percentage is between 0-100

### Status Not Updating
- Run the update_overdue_invoices function manually
- Check if due_date is properly formatted
- Verify database triggers are enabled

## Future Enhancements

1. **Recurring Invoices**: Auto-generate invoices on schedule
2. **Payment Gateway Integration**: Accept online payments
3. **Multi-currency Support**: Handle currency conversions
4. **Invoice Templates**: Multiple PDF template designs
5. **Client Portal**: Allow customers to view their invoices
6. **Reminders**: Auto-send payment reminders for overdue invoices
7. **Reporting**: Advanced analytics and reports
8. **Batch Operations**: Bulk invoice creation/updates
9. **Invoice History**: Track all changes to invoices
10. **Custom Fields**: Add custom fields per business needs

## Related Files

- [server/models/Invoice.js](server/models/Invoice.js) - Invoice model
- [server/routes/invoices.js](server/routes/invoices.js) - API routes
- [server/services/invoiceService.js](server/services/invoiceService.js) - PDF service
- [client/src/pages/Invoices.jsx](client/src/pages/Invoices.jsx) - Frontend UI
- [invoices_migration.sql](invoices_migration.sql) - Database schema
- [server/index.js](server/index.js) - Route registration
- [client/src/App.jsx](client/src/App.jsx) - Frontend routing
- [client/src/components/Layout.jsx](client/src/components/Layout.jsx) - Navigation

## Support

For issues or questions:
1. Check the error logs in browser console and server terminal
2. Verify all dependencies are installed
3. Ensure database migration has been run
4. Check that authentication is working properly
