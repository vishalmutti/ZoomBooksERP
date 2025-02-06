
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

  // Company logo
  doc.image('public/logo.png', 50, 45, { width: 100 })
     .fontSize(20)
     .text('Zoom Books Company', 200, 45)
     .fontSize(10)
     .text('Acirassi Books Ltd', 200, 65)
     .text('507/508-19055 Airport Way', 200, 80)
     .text('Pitt Meadows, BC V3Y 0G4', 200, 95)
     .moveDown();

  // Invoice details
  doc.fontSize(16)
     .text('INVOICE', 50, 150)
     .fontSize(10)
     .text(`Invoice Number: ${data.invoice.invoiceNumber}`, 50, 180)
     .text(`Due Date: ${new Date(data.invoice.dueDate).toLocaleDateString()}`, 50, 195);

  // Supplier details
  doc.fontSize(12)
     .text('Bill To:', 50, 230)
     .fontSize(10)
     .text(data.supplier.name, 50, 250)
     .text(data.supplier.address || '', 50, 265)
     .text(`Contact: ${data.supplier.contactPerson || ''}`, 50, 280)
     .text(`Email: ${data.supplier.email || ''}`, 50, 295)
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
       .text(item.quantity.toString(), 280, position)
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
