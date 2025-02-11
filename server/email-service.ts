
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInvoiceEmail(
  supplierEmail: string,
  supplierName: string,
  invoiceNumber: string,
  pdfPath: string
) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'your-email@example.com',
      to: supplierEmail,
      subject: `Invoice ${invoiceNumber}`,
      text: `Dear ${supplierName},\n\nPlease find attached invoice ${invoiceNumber}.\n\nBest regards,\nZoom Books Co`,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          path: pdfPath
        }
      ]
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
