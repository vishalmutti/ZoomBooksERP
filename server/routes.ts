import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertInvoiceSchema, insertSupplierSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  })
});

export function registerRoutes(app: Express): Server {
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

  app.post("/api/suppliers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parsed = insertSupplierSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const supplier = await storage.createSupplier(parsed.data);
    res.status(201).json(supplier);
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
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });

  app.post("/api/invoices", upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Log request information
      console.log('Request body:', req.body);
      console.log('Uploaded file:', req.file);

      // Ensure invoiceData exists in the request
      if (!req.body.invoiceData) {
        throw new Error('Missing invoice data');
      }

      // Parse the invoice data
      let invoiceData;
      try {
        invoiceData = JSON.parse(req.body.invoiceData);
        console.log('Parsed invoice data:', invoiceData);
      } catch (e) {
        console.error('Error parsing invoice data:', e);
        throw new Error('Invalid invoice data format');
      }

      // Validate the invoice data
      const parsed = insertInvoiceSchema.safeParse(invoiceData);
      if (!parsed.success) {
        console.error('Validation error:', parsed.error);
        return res.status(400).json({
          message: 'Invalid invoice data',
          errors: parsed.error.errors
        });
      }

      // Create the invoice
      const invoice = await storage.createInvoice({
        ...parsed.data,
        uploadedFile: req.file ? req.file.filename : undefined,
      });

      console.log('Created invoice:', invoice);
      res.status(201).json(invoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Failed to create invoice',
        error: error 
      });
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

  const httpServer = createServer(app);
  return httpServer;
}