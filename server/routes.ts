
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertInvoiceSchema, insertPaymentSchema, insertSupplierSchema } from "@shared/schema";
import { generateInvoicePDF } from "./pdf-service";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express"; 

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
});

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

  app.post("/api/invoices", upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const invoiceData = JSON.parse(req.body.invoiceData);
      const parsed = insertInvoiceSchema.safeParse(invoiceData);

      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid invoice data' });
      }

      const invoice = await storage.createInvoice({
        ...parsed.data,
        uploadedFile: req.file ? req.file.filename : undefined,
      });

      // Generate PDF if it's a manual entry
      if (!req.file && parsed.data.items?.length) {
        const supplier = await storage.getSupplier(parsed.data.supplierId);
        if (supplier) {
          const pdfFileName = await generateInvoicePDF({ 
            invoice: { ...invoice, items: parsed.data.items },
            supplier 
          });
          await storage.updateInvoice(invoice.id, { uploadedFile: pdfFileName });
          invoice.uploadedFile = pdfFileName;
        }
      }

      res.status(201).json(invoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ message: 'Failed to create invoice' });
    }
  });

  app.patch("/api/invoices/:id", upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const invoiceData = JSON.parse(req.body.invoiceData);
      
      // Clean up the data before validation
      const cleanedData = {
        ...invoiceData,
        totalAmount: invoiceData.totalAmount?.toString() || "0",
        items: invoiceData.items?.map(item => ({
          description: item.description,
          quantity: item.quantity?.toString() || "0",
          unitPrice: item.unitPrice?.toString() || "0",
          totalPrice: (Number(item.quantity || 0) * Number(item.unitPrice || 0)).toString()
        }))
      };

      const parsed = insertInvoiceSchema.partial().safeParse(cleanedData);

      if (!parsed.success) {
        console.error('Validation error:', parsed.error);
        return res.status(400).json({ 
          message: 'Invalid invoice data',
          errors: parsed.error.errors 
        });
      }

      let existingInvoice = await storage.getInvoice(id);
      if (!existingInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      let uploadedFile = req.file ? req.file.filename : undefined;

      // Generate PDF if it's a manual entry
      if (!req.file && parsed.data.items?.length) {
        const supplier = await storage.getSupplier(parsed.data.supplierId || existingInvoice.supplierId);
        if (supplier) {
          const itemsForPDF = parsed.data.items.map(item => ({
            description: item.description,
            quantity: item.quantity?.toString() || "0",
            unitPrice: item.unitPrice?.toString() || "0",
            totalPrice: (Number(item.quantity || 0) * Number(item.unitPrice || 0)).toString()
          }));

          uploadedFile = await generateInvoicePDF({ 
            invoice: { 
              ...existingInvoice,
              ...parsed.data,
              items: itemsForPDF,
              id,
              invoiceNumber: existingInvoice.invoiceNumber
            },
            supplier 
          });
        }
      }

      const invoice = await storage.updateInvoice(id, {
        ...parsed.data,
        uploadedFile,
      });

      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Always update invoice items with the provided data
      await storage.db.transaction(async (tx) => {
        // Delete existing items
        await tx.delete(storage.invoiceItems).where(eq(storage.invoiceItems.invoiceId, id));
        
        // Insert new items if provided
        if (parsed.data.items?.length) {
          await tx.insert(storage.invoiceItems).values(
            parsed.data.items.map(item => ({
              invoiceId: id,
              description: item.description,
              quantity: item.quantity.toString(),
              unitPrice: item.unitPrice.toString(),
              totalPrice: (Number(item.quantity) * Number(item.unitPrice)).toString(),
            }))
          );
        }
      });

      res.json(invoice);
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
  return httpServer;
}
