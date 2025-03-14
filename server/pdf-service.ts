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

  // Create invoice first page content
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('Acirassi Books Ltd (Zoom Books Co)', 50, 70)
     .font('Helvetica')
     .fontSize(10)
     .text('507/508-19055 Airport Way', 50, 90)
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
     .font('Helvetica-Bold')
     .text(data.supplier.name, 50, 200)
     .font('Helvetica')
     .fontSize(10)
     .text(data.supplier.address || '', 50, 215)
     .text(`Contact: ${data.supplier.contactPerson || ''}`, 50, 230)
     .text(`Email: ${data.supplier.email || ''}`, 50, 245)
     .moveDown(2);

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
    position += 25; 
  });

  doc.font('Helvetica-Bold')
     .text('Total Amount:', 350, position + 20)
     .text(`$${Number(data.invoice.totalAmount).toFixed(2)} ${data.invoice.amountCurrency}`, 450, position + 20)
     .moveDown()
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('Notes:', 50, position + 50)
     .font('Helvetica')
     .text(data.invoice.notes || 'No notes provided', 50, position + 70)
     .moveDown()
     .fontSize(8)
     .text('Thank you for your business!', 50, position + 100)
     .moveDown();

  // Adding the logo
  const pageHeight = doc.page.height;
  const logoHeight = 300;
  const logoWidth = 600;
  const marginBottom = 50;
  doc.image(
    path.join(process.cwd(), 'attached_assets', 'Zoom Books Logo Final-01.png'),
    (doc.page.width - logoWidth) / 2,
    pageHeight - logoHeight - marginBottom,
    {
      fit: [logoWidth, logoHeight],
      align: 'center',
    }
  );

  // Handle BOL file
  let isBolPdf = false;
  if (data.invoice.bolFile) {
    const bolPath = path.join(process.cwd(), 'uploads', data.invoice.bolFile);
    if (fs.existsSync(bolPath)) {
      const ext = path.extname(bolPath).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        // For image BOLs, add one new page and embed the image
        doc.addPage();
        doc.fontSize(14)
           .text('Bill of Lading', { align: 'center' })
           .moveDown();
        doc.image(bolPath, {
          fit: [doc.page.width - 100, doc.page.height - 150],
          align: 'center',
          valign: 'center'
        });
      } else if (ext === '.pdf') {
        // For PDF BOLs, mark that we need to merge later
        isBolPdf = true;
      } else {
        doc.addPage();
        doc.fontSize(12)
           .text(`BOL file format ${ext} not supported. Please upload JPG, JPEG, PNG, or PDF files.`, {
             align: 'center'
           });
      }
    }
  }

  // Finalize the current document
  doc.pipe(writeStream);
  doc.end();

  // Wait for the PDF file to be fully written
  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  // If the BOL is a PDF, merge the generated invoice with the BOL using pdf-merger-js
  if (isBolPdf) {
    const PDFMerger = (await import('pdf-merger-js')).default;
    const merger = new PDFMerger();
    // Add the generated invoice PDF (first page)
    await merger.add(filePath);
    // Add the PDF BOL (all pages)
    const bolPath = path.join(process.cwd(), 'uploads', data.invoice.bolFile!);
    await merger.add(bolPath);
    // Create a new merged file
    const mergedFileName = fileName.replace('.pdf', '-merged.pdf');
    const mergedFilePath = path.join(process.cwd(), 'uploads', mergedFileName);
    await merger.save(mergedFilePath);

    // Remove the original unmerged file
    fs.unlinkSync(filePath);
    return mergedFileName;
  }

  return fileName;
}

export async function generateAccountStatementPDF(supplier: Supplier, invoices: Invoice[]): Promise<string> {
  const doc = new PDFDocument({ margin: 40 });
  const fileName = `account-statement-${supplier.id}-${Date.now()}.pdf`;
  const filePath = path.join(process.cwd(), 'uploads', fileName);
  const writeStream = fs.createWriteStream(filePath);

  // Filter for unpaid invoices only
  const outstandingInvoices = invoices.filter(inv => !inv.isPaid);

  // Get all unique currencies from outstanding invoices
  const currencies = [...new Set(outstandingInvoices
    .map(inv => inv.amountCurrency)
    .filter(Boolean))];
  
  // Use first currency found or default to USD
  const currency = currencies[0] || "USD";

  // Company and Statement Title
  doc.fontSize(20)
     .text('OUTSTANDING BALANCE STATEMENT', { align: 'center' });

  doc.fontSize(8)
     .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });

  // Company details
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('Acirassi Books Ltd (Zoom Books Co)', 40, 70)
     .font('Helvetica')
     .fontSize(10)
     .text('507/508-19055 Airport Way', 40, 85)
     .text('Pitt Meadows, BC V3Y 0G4', 40, 100);

  // Supplier details
  doc.fontSize(12)
     .text('Statement For: ', 40, 120, { continued: true })
     .font('Helvetica-Bold')
     .text(supplier.name)
     .font('Helvetica')
     .fontSize(10)
     .text(supplier.address || '', 40, 140)
     .text(`Contact: ${supplier.contactPerson || ''}`, 40, 155)
     .text(`Email: ${supplier.email || ''}`, 40, 170); 

  // Outstanding balance with currency
  const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  doc.fontSize(12)
     .font('Helvetica-Bold')  
     .text(`Total Outstanding Balance: $${totalOutstanding.toFixed(2)} ${currency}`, 40, 185, { continued: false })
     .font('Helvetica');

  if (outstandingInvoices.length > 0) {
    // Invoices table
    const tableTop = 210;
    doc.font('Helvetica-Bold')
       .fontSize(9);

    // Table header
    doc.text('Invoice #', 40, tableTop)
       .text('Due Date', 160, tableTop)
       .text('Amount', 280, tableTop)
       .text('Days Overdue', 400, tableTop);

    doc.font('Helvetica');
    let position = tableTop + 25; 

    outstandingInvoices.forEach(invoice => {
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

      doc.text(invoice.invoiceNumber || `#${invoice.id}`, 40, position)
         .text(dueDate.toLocaleDateString(), 160, position)
         .text(`$${Number(invoice.totalAmount).toFixed(2)} ${invoice.amountCurrency || currency}`, 280, position)
         .text(daysOverdue.toString(), 400, position);
      position += 30; 
    });
  } else {
    doc.fontSize(10)
       .text('No outstanding invoices at this time.', 40, doc.y);
  }

  // Adding the logo at the bottom of the page
  const pageHeight2 = doc.page.height;
  const logoHeight2 = 300;
  const logoWidth2 = 600;  
  const marginBottom2 = 50;

  doc.image(
    path.join(process.cwd(), 'attached_assets', 'Zoom Books Logo Final-01.png'),
    (doc.page.width - logoWidth2) / 2,  
    pageHeight2 - logoHeight2 - marginBottom2,
    {
      fit: [logoWidth2, logoHeight2],
      align: 'center',
    }
  );

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(fileName));
    writeStream.on('error', reject);
    doc.pipe(writeStream);
    doc.end();
  });
}
