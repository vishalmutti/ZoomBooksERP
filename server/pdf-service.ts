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

  doc.fontSize(10)
     .text('Acirassi Books Ltd (Zoom Books Co)', 50, 80)
     .text('507/508-19055 Airport Way', 50, 95)
     .text('Pitt Meadows, BC V3Y 0G4', 50, 110)
     .fontSize(24)
     .text('INVOICE', 450, 45, { align: 'right' })
     .fontSize(10)
     .text(`Invoice Number: ${data.invoice.invoiceNumber}`, 350, 130, { align: 'right' })
     .text(`Date: ${new Date().toLocaleDateString()}`, 450, 145, { align: 'right' })
     .text(`Due Date: ${new Date(data.invoice.dueDate).toLocaleDateString()}`, 450, 160, { align: 'right' });

  // Supplier details
  doc.fontSize(12)
     .text('Bill To:', 50, 180)
     .fontSize(10)
     .text(data.supplier.name, 50, 200)
     .text(data.supplier.address || '', 50, 215)
     .text(`Contact: ${data.supplier.contactPerson || ''}`, 50, 230)
     .text(`Email: ${data.supplier.email || ''}`, 50, 245)
     .moveDown();

  // Items table
  const tableTop = 270;
  doc.font('Helvetica-Bold');
  doc.text('Description', 50, tableTop)
     .text('Quantity', 280, tableTop)
     .text('Unit Price', 350, tableTop)
     .text('Total', 450, tableTop);

  doc.font('Helvetica');
  let position = tableTop + 25;

  data.invoice.items?.forEach(item => {
    doc.text(item.description, 50, position)
       .text(item.quantity?.toString() || "0", 280, position)
       .text(`$${Number(item.unitPrice).toFixed(2)}`, 350, position)
       .text(`$${Number(item.totalPrice).toFixed(2)}`, 450, position);
    position += 20;
  });

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

  // Company and Statement Title
  doc.fontSize(24)
     .text('OUTSTANDING BALANCE STATEMENT', { align: 'center' })
     .moveDown(1);

  doc.fontSize(10)
     .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' })
     .moveDown(1);

  // Company details
  doc.fontSize(10)
     .text('Acirassi Books Ltd (Zoom Books Co)', 50, 80)
     .text('507/508-19055 Airport Way', 50, 95)
     .text('Pitt Meadows, BC V3Y 0G4', 50, 110)
     .moveDown(3);

  // Supplier details
  doc.fontSize(12)
     .text('Statement For:', { continued: true })
     .text(supplier.name, { align: 'left', underline: true })
     .moveDown(1)
     .fontSize(10)
     .text(supplier.address || '', { align: 'left' })
     .text(`Contact: ${supplier.contactPerson || ''}`, { align: 'left' })
     .text(`Email: ${supplier.email || ''}`, { align: 'left' })
     .moveDown(1); // Adjusted for less spacing

  // Outstanding balance
  const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  doc.fontSize(12)
     .text(`Total Outstanding Balance: $${totalOutstanding.toFixed(2)}`, 50, doc.y)
     .moveDown(1); // Less spacing before table

  if (outstandingInvoices.length > 0) {
    // Invoices table
    const tableTop = doc.y;
    doc.font('Helvetica-Bold');

    // Table header
    doc.text('Invoice #', 50, tableTop)
       .text('Due Date', 200, tableTop)
       .text('Amount', 350, tableTop)
       .text('Days Overdue', 450, tableTop);

    doc.font('Helvetica');
    let position = tableTop + 25;

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

    const pageHeight = doc.page.height;
    const currentY = doc.y;
    const footerHeight = 30;
    const remainingSpace = pageHeight - currentY - footerHeight;
    
    if (remainingSpace > 0) {
      // Footer positioned at the bottom with remaining space
      doc.fontSize(8)
         .text('This statement reflects all outstanding invoices as of the date shown above.', 50, currentY + remainingSpace);
    } else {
      // Footer right after the content if space is tight
      doc.fontSize(8)
         .text('This statement reflects all outstanding invoices as of the date shown above.', 50, currentY + 20);
    }
  } else {
    doc.fontSize(12)
       .text('No outstanding invoices at this time.', 50, doc.y);
  }

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(fileName));
    writeStream.on('error', reject);
    doc.pipe(writeStream);
    doc.end();
  });
}