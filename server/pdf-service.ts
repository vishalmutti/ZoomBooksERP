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
  doc.image('attached_assets/Zoom Books Logo Final-02.jpg', 50, 45, { width: 450 })
     .fontSize(10)
     .text('Acirassi Books Ltd', 50, 200)
     .text('507/508-19055 Airport Way', 50, 215)
     .text('Pitt Meadows, BC V3Y 0G4', 50, 230)
     .fontSize(24)
     .text('INVOICE', 450, 45, { align: 'right' })
     .fontSize(10)
     .text(`Invoice Number: ${data.invoice.invoiceNumber}`, 450, 80, { align: 'right' })
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