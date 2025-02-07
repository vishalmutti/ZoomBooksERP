import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertInvoiceSchema, insertPaymentSchema, insertSupplierSchema, invoiceItems } from "@shared/schema";
import { generateAccountStatementPDF, generateInvoicePDF } from "./pdf-service";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { eq } from "drizzle-orm";
import { db } from "./db";

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  })
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'bolFile', maxCount: 1 }
]);

export function registerRoutes(app: Express): Server {
  app.use('/uploads', express.static(uploadDir));

  setupAuth(app);

  // Supplier routes
  app.get("/api/suppliers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const query = req.query.q as string;
    const suppliers = query
      ? await storage.searchSuppliers(query)
      : await storage.getSuppliers();

    res.json(suppliers);
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const id = parseInt(req.params.id);
    const supplier = await storage.getSupplier(id);

    if (!supplier) return res.status(404).send("Supplier not found");
    res.json(supplier);
  });

  app.get("/api/suppliers/:id/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const id = parseInt(req.params.id);
    const supplier = await storage.getSupplier(id);
    if (!supplier) return res.status(404).send("Supplier not found");

    const invoices = await storage.getSupplierInvoices(id);
    res.json(invoices);
  });

  app.post("/api/suppliers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parsed = insertSupplierSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const supplier = await storage.createSupplier(parsed.data);
    res.status(201).json(supplier);
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const id = parseInt(req.params.id);
    const parsed = insertSupplierSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const supplier = await storage.updateSupplier(id, parsed.data);
    if (!supplier) return res.status(404).send("Supplier not found");

    res.json(supplier);
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const id = parseInt(req.params.id);
    const supplier = await storage.getSupplier(id);
    if (!supplier) return res.status(404).send("Supplier not found");

    await storage.deleteSupplier(id);
    res.sendStatus(200);
  });

  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { startDate, endDate, isPaid, minAmount, maxAmount } = req.query;
    const filters = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      isPaid: isPaid === 'true' ? true : isPaid === 'false' ? false : undefined,
      minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
    };

    const invoices = await storage.getInvoices(filters);
    res.json(invoices);
  });

  app.post("/api/invoices", upload, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const invoiceData = JSON.parse(req.body.invoiceData);
      const parsed = insertInvoiceSchema.safeParse(invoiceData);

      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid invoice data' });
      }

      // Get uploaded files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const uploadedFile = files?.file?.[0]?.filename;
      const bolFile = files?.bolFile?.[0]?.filename;

      const invoice = await storage.createInvoice({
        ...parsed.data,
        uploadedFile: uploadedFile,
        bolFile: bolFile
      });

      // Generate PDF if it's a manual entry
      if (!uploadedFile && parsed.data.items?.length) {
        const supplier = await storage.getSupplier(parsed.data.supplierId);
        if (supplier) {
          const pdfFileName = await generateInvoicePDF({
            invoice: { ...invoice, items: parsed.data.items },
            supplier
          });
          await storage.updateInvoice(invoice.id, {
            uploadedFile: pdfFileName,
            bolFile: invoice.bolFile
          });
          invoice.uploadedFile = pdfFileName;
        }
      }

      res.status(201).json(invoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ message: 'Failed to create invoice' });
    }
  });

  app.patch("/api/invoices/:id", upload, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const invoiceData = JSON.parse(req.body.invoiceData);
      const parsed = insertInvoiceSchema.partial().safeParse(invoiceData);

      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid invoice data' });
      }

      let existingInvoice = await storage.getInvoice(id);
      if (!existingInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Get uploaded files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Only update file paths if new files are uploaded
      const updateData = {
        ...parsed.data,
        uploadedFile: files?.file?.[0]?.filename || existingInvoice.uploadedFile,
        bolFile: files?.bolFile?.[0]?.filename || existingInvoice.bolFile
      };

      // Update invoice with new data
      const updatedInvoice = await storage.updateInvoice(id, updateData);

      // If this is a manual entry and we have items, generate a new PDF
      if (!files?.file?.[0] && (parsed.data.items?.length || existingInvoice.items?.length)) {
        const supplier = await storage.getSupplier(parsed.data.supplierId || existingInvoice.supplierId);
        if (supplier) {
          const pdfFileName = await generateInvoicePDF({
            invoice: {
              ...updatedInvoice,
              items: parsed.data.items || existingInvoice.items,
            },
            supplier
          });

          // Update the invoice with the new PDF file name but preserve the BOL file
          await storage.updateInvoice(id, {
            uploadedFile: pdfFileName,
            bolFile: updateData.bolFile // Preserve the BOL file
          });

          updatedInvoice.uploadedFile = pdfFileName;
        }
      }

      // Handle invoice items update if needed
      if (parsed.data.items?.length) {
        const finalInvoice = await db.transaction(async (tx) => {
          // Delete existing items
          await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

          // Insert new items
          await tx.insert(invoiceItems).values(
            parsed.data.items.map(item => ({
              invoiceId: id,
              description: item.description,
              quantity: item.quantity || "0",
              unitPrice: item.unitPrice || "0",
              totalPrice: ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toString(),
            }))
          );

          // Get fresh invoice data with items
          return await storage.getInvoice(id);
        });

        res.json(finalInvoice);
      } else {
        // If no items to update, return the updated invoice
        const invoice = await storage.getInvoice(id);
        res.json(invoice);
      }
    } catch (error) {
      console.error('Invoice update error:', error);
      res.status(500).json({ message: 'Failed to update invoice' });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const id = parseInt(req.params.id);
    const invoice = await storage.getInvoice(id);
    if (!invoice) return res.status(404).send("Invoice not found");

    await storage.deleteInvoice(id);
    res.sendStatus(200);
  });

  app.patch("/api/invoices/:id/mark-paid", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const id = parseInt(req.params.id);
    const invoice = await storage.getInvoice(id);
    if (!invoice) return res.status(404).send("Invoice not found");

    const updatedInvoice = await storage.updateInvoice(id, {
      isPaid: true,
      paymentDate: new Date().toISOString(),
    });

    res.json(updatedInvoice);
  });

  // Payment routes
  app.post("/api/invoices/:id/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const invoiceId = parseInt(req.params.id);
    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) return res.status(404).send("Invoice not found");

    const parsed = insertPaymentSchema.safeParse({ ...req.body, invoiceId });
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const payment = await storage.createPayment(parsed.data);

    // Update invoice status if payment completes the total amount
    const payments = await storage.getInvoicePayments(invoiceId);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    if (totalPaid >= Number(invoice.totalAmount)) {
      await storage.updateInvoice(invoiceId, {
        isPaid: true,
        paymentDate: new Date().toISOString(),
      });
    }

    res.status(201).json(payment);
  });

  app.get("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log("Fetching invoice data for:", req.params.id);
    const id = parseInt(req.params.id);
    const invoice = await storage.getInvoice(id);
    if (!invoice) return res.status(404).send("Invoice not found");
    res.json(invoice);
  });

  app.get("/api/invoices/:id/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const invoiceId = parseInt(req.params.id);
    const payments = await storage.getInvoicePayments(invoiceId);
    res.json(payments);
  });

  const httpServer = createServer(app);
  app.get("/api/suppliers/:id/account-statement", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      if (!supplier) return res.status(404).send("Supplier not found");

      const invoices = await storage.getSupplierInvoices(id);

      // Generate the PDF
      const pdfFileName = await generateAccountStatementPDF(supplier, invoices);

      res.json({ fileName: pdfFileName });
    } catch (error) {
      console.error('Error generating account statement:', error instanceof Error ? error.stack : error);
      res.status(500).json({
        message: 'Failed to generate account statement: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  });

  return httpServer;
}