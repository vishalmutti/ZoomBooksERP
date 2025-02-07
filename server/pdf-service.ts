import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Invoice, InvoiceItem, Supplier } from '@shared/schema';

interface PDFInvoiceData {
  invoice: Invoice & { items?: InvoiceItem[] };
  supplier: Supplier;
}

export async function generateInvoicePDF(data: PDFInvoiceData): Promise<string> {
  const doc = new PDFDocument({ margin: 50 });
  const fileName = `invoice-${data.invoice.invoiceNumber}-${Date.now()}.pdf`;
  const filePath = path.join(process.cwd(), 'uploads', fileName);
  const writeStream = fs.createWriteStream(filePath);

  // Company logo and header
  try {
    doc.image('attached_assets/Zoom Books Logo Final-02.png', 0, 0, { 
      width: 225
    });
  } catch (error) {
    console.warn('Could not load company logo:', error);
    // Continue without the logo
  }
  doc.fontSize(10)
     .text('Acirassi Books Ltd', 50, 200)
     .text('507/508-19055 Airport Way', 50, 215)
     .text('Pitt Meadows, BC V3Y 0G4', 50, 230)
     .fontSize(24)
     .text('INVOICE', 450, 45, { align: 'right' })
     .fontSize(10)
     .text(`Invoice Number: ${data.invoice.invoiceNumber}`, 350, 80, { align: 'right' })
     .text(`Date: ${new Date().toLocaleDateString()}`, 450, 95, { align: 'right' })
     .text(`Due Date: ${new Date(data.invoice.dueDate).toLocaleDateString()}`, 450, 110, { align: 'right' });

  // Supplier details
  doc.fontSize(12)
     .text('Bill To:', 50, 250)
     .fontSize(10)
     .text(data.supplier.name, 50, 270)
     .text(data.supplier.address || '', 50, 285)
     .text(`Contact: ${data.supplier.contactPerson || ''}`, 50, 300)
     .text(`Email: ${data.supplier.email || ''}`, 50, 315)
     .moveDown();

  // Items table
  const tableTop = 350;
  doc.font('Helvetica-Bold');

  // Table header
  doc.text('Description', 50, tableTop)
     .text('Quantity', 280, tableTop)
     .text('Unit Price', 350, tableTop)
     .text('Total', 450, tableTop);

  doc.font('Helvetica');
  let position = tableTop + 25;

  // Table rows
  data.invoice.items?.forEach(item => {
    doc.text(item.description, 50, position)
       .text(item.quantity?.toString() || "0", 280, position)
       .text(`$${Number(item.unitPrice).toFixed(2)}`, 350, position)
       .text(`$${Number(item.totalPrice).toFixed(2)}`, 450, position);
    position += 20;
  });

  // Total and Footer
  doc.font('Helvetica-Bold')
     .text('Total Amount:', 350, position + 20)
     .text(`$${Number(data.invoice.totalAmount).toFixed(2)}`, 450, position + 20)
     .fontSize(8)
     .font('Helvetica')
     .text('Thank you for your business!', 50, position + 50);

  return new Promise((resolve, reject) => {
    doc.pipe(writeStream);
    doc.end();
    writeStream.on('finish', () => resolve(fileName));
    writeStream.on('error', reject);
  });
}

export async function generateAccountStatementPDF(supplier: Supplier, invoices: Invoice[]): Promise<string> {
  const doc = new PDFDocument({ margin: 50 });
  const fileName = `account-statement-${supplier.id}-${Date.now()}.pdf`;
  const filePath = path.join(process.cwd(), 'uploads', fileName);
  const writeStream = fs.createWriteStream(filePath);

  // Filter for unpaid invoices only
  const outstandingInvoices = invoices.filter(inv => !inv.isPaid);

  // Company logo and header
  try {
    doc.image('attached_assets/Zoom Books Logo Final-02.png', 0, 0, { 
      width: 225
    });
  } catch (error) {
    console.warn('Could not load company logo:', error);
    // Continue without the logo
  }

  doc.fontSize(24)
     .text('OUTSTANDING BALANCE STATEMENT', 450, 45, { align: 'right' })
     .fontSize(10)
     .text(`Date: ${new Date().toLocaleDateString()}`, 450, 80, { align: 'right' });

  // Company details
  doc.fontSize(10)
     .text('Acirassi Books Ltd', 50, 120)
     .text('507/508-19055 Airport Way', 50, 135)
     .text('Pitt Meadows, BC V3Y 0G4', 50, 150);

  // Supplier details
  doc.fontSize(12)
     .text('Statement For:', 50, 200)
     .fontSize(10)
     .text(supplier.name, 50, 220)
     .text(supplier.address || '', 50, 235)
     .text(`Contact: ${supplier.contactPerson || ''}`, 50, 250)
     .text(`Email: ${supplier.email || ''}`, 50, 265)
     .moveDown();

  // Outstanding balance
  const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  doc.fontSize(12)
     .text(`Total Outstanding Balance: $${totalOutstanding.toFixed(2)}`, 50, 300, { bold: true })
     .moveDown();

  if (outstandingInvoices.length > 0) {
    // Invoices table
    const tableTop = 350;
    doc.font('Helvetica-Bold');

    // Table header
    doc.text('Invoice #', 50, tableTop)
       .text('Due Date', 200, tableTop)
       .text('Amount', 350, tableTop)
       .text('Days Overdue', 450, tableTop);

    doc.font('Helvetica');
    let position = tableTop + 25;

    // Table rows
    outstandingInvoices.forEach(invoice => {
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

      doc.text(invoice.invoiceNumber || `#${invoice.id}`, 50, position)
         .text(dueDate.toLocaleDateString(), 200, position)
         .text(`$${Number(invoice.totalAmount).toFixed(2)}`, 350, position)
         .text(daysOverdue.toString(), 450, position);
      position += 20;
    });

    // Payment instructions
    doc.fontSize(10)
       .text('Payment Instructions:', 50, position + 40)
       .text('Please reference invoice numbers when making payments.', 50, position + 60)
       .text('For questions about this statement, please contact accounts@acirassi.com', 50, position + 80);
  } else {
    doc.fontSize(12)
       .text('No outstanding invoices at this time.', 50, 350);
  }

  // Footer
  doc.fontSize(8)
     .text('This statement reflects all outstanding invoices as of the date shown above.', 50, doc.page.height - 50);

  return new Promise((resolve, reject) => {
    doc.pipe(writeStream);
    doc.end();
    writeStream.on('finish', () => resolve(fileName));
    writeStream.on('error', reject);
  });
}