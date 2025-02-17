import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { generateAccountStatementPDF, generateInvoicePDF } from "./pdf-service";
import multer from "multer";
import path from "path";
import fs from "fs";
import express, { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { carriers, carrierLoads } from "@shared/schema";
import { insertInvoiceSchema, insertPaymentSchema, insertSupplierSchema, invoiceItems } from "@shared/schema";
import { insertIncomingLoadSchema, insertFreightInvoiceSchema } from "@shared/schema";
import mime from 'mime-types';
import FormData from 'form-data';


// Type definitions for file uploads
interface UploadedFiles {
  file?: Express.Multer.File[];
  bolFile?: Express.Multer.File[];
  materialInvoiceFile?: Express.Multer.File[];
  freightInvoiceFile?: Express.Multer.File[];
  loadPerformanceFile?: Express.Multer.File[];
}

interface InvoiceData {
  items?: Array<{
    description: string;
    quantity: string;
    unitPrice: string;
  }>;
  supplierId: number;
  [key: string]: any;
}

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
  { name: 'bolFile', maxCount: 1 },
  { name: 'materialInvoiceFile', maxCount: 1 },
  { name: 'freightInvoiceFile', maxCount: 1 },
  { name: 'loadPerformanceFile', maxCount: 1 },
  { name: 'freightInvoice', maxCount: 1 },
  { name: 'pod', maxCount: 1 }
]);

async function generatePDFForInvoice(invoice: InvoiceData) {
  if (!invoice.supplierId) return null;

  const supplier = await storage.getSupplier(invoice.supplierId);
  if (!supplier) return null;

  return await generateInvoicePDF({
    invoice: {
      ...invoice,
      items: invoice.items?.map(item => ({
        id: 0,
        invoiceId: 0,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toString(),
      })),
    },
    supplier,
  });
}

export function registerRoutes(app: Express): Server {
  // Serve static files first with improved error handling and logging
  app.use('/uploads', (req, res, next) => {
    try {
      const decodedPath = decodeURIComponent(req.path).trim();
      const filename = path.basename(decodedPath);
      
      // Find the actual file in uploads directory that matches the name ignoring case
      const files = fs.readdirSync(uploadDir);
      const actualFile = files.find(f => f.toLowerCase() === filename.toLowerCase());
      
      if (!actualFile) {
        console.error('File not found:', filename);
        return res.status(404).json({
          error: 'File not found',
          path: decodedPath
        });
      }

      const filePath = path.join(uploadDir, actualFile);

      // Get MIME type
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';

      // Set proper headers
      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': mimeType === 'application/pdf' ? 'inline' : 'attachment',
        'Content-Security-Policy': "default-src 'self'",
        'X-Content-Type-Options': 'nosniff'
      });

      // Stream the file
      const stream = fs.createReadStream(filePath);
      stream.on('error', (err) => {
        console.error('Error streaming file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Error serving file',
            details: err.message
          });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error('Error in file serving middleware:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  const router = Router();
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

  // Add this route after the other supplier routes
  app.get("/api/suppliers/:id/contacts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const id = parseInt(req.params.id);
    const supplier = await storage.getSupplier(id);
    if (!supplier) return res.status(404).send("Supplier not found");

    const contacts = await storage.getSupplierContacts(id);
    res.json(contacts.filter(contact => contact.supplierId === id));
  });

  app.get("/api/suppliers/:id/loads/count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const id = parseInt(req.params.id);
    const loads = await storage.getLoads();
    const incomingLoads = loads.filter(load =>
      load.supplierId === id.toString() &&
      load.loadType === 'Incoming'
    );

    // Calculate average cost only for loads with both costs present
    const loadsWithBothCosts = incomingLoads.filter(load =>
      load.loadCost && load.freightCost &&
      Number(load.loadCost) > 0 && Number(load.freightCost) > 0 &&
      !isNaN(Number(load.loadCost)) && !isNaN(Number(load.freightCost))
    );

    const loadsWithRoi = incomingLoads.filter(load =>
      load.profitRoi &&
      Number(load.profitRoi) > 0 &&
      !isNaN(Number(load.profitRoi))
    );

    const averageCost = loadsWithBothCosts.length > 0
      ? loadsWithBothCosts.reduce((acc, load) =>
          acc + Number(load.loadCost) + Number(load.freightCost), 0
        ) / loadsWithBothCosts.length
      : 0;

    const averageRoi = loadsWithRoi.length > 0
      ? loadsWithRoi.reduce((acc, load) =>
          acc + Number(load.profitRoi), 0
        ) / loadsWithRoi.length
      : 0;

    res.json({
      count: incomingLoads.length,
      averageCost: averageCost,
      averageRoi: averageRoi
    });
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
      const invoiceData = JSON.parse(req.body.invoiceData) as InvoiceData;
      const parsed = insertInvoiceSchema.safeParse(invoiceData);

      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid invoice data', errors: parsed.error.errors });
      }

      const files = req.files as UploadedFiles;
      const uploadedFile = files?.file?.[0]?.filename;
      const bolFile = files?.bolFile?.[0]?.filename;
      const freightInvoiceFile = files?.freightInvoiceFile?.[0]?.filename;

      const invoice = await storage.createInvoice({
        ...parsed.data,
        uploadedFile: uploadedFile || null,
        bolFile: bolFile || null,
        freightInvoiceFile: freightInvoiceFile || null,
        amountCurrency: parsed.data.amountCurrency || 'USD'
      });

      if (!uploadedFile && invoiceData.items?.length) {
        const pdfFileName = await generatePDFForInvoice(parsed.data);
        if (pdfFileName) {
          await storage.updateInvoice(invoice.id, {
            uploadedFile: pdfFileName,
            bolFile: invoice.bolFile
          });
          invoice.uploadedFile = pdfFileName;

          const supplier = await storage.getSupplier(parsed.data.supplierId);
          if (supplier?.email) {
            const { sendInvoiceEmail } = await import('./email-service');
            const pdfPath = path.join(process.cwd(), 'uploads', pdfFileName);
            await sendInvoiceEmail(
              supplier.email,
              supplier.name,
              invoice.invoiceNumber || `#${invoice.id}`,
              pdfPath
            );
          }
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
        return res.status(400).json({ message: 'Invalid invoice data', errors: parsed.error.errors });
      }

      let existingInvoice = await storage.getInvoice(id);
      if (!existingInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Get uploaded files
      const files = req.files as UploadedFiles;
      console.log('Received files during update:', files);

      // Construct FormData similar to creation process
      const updateData = {
        ...parsed.data,
        uploadedFile: existingInvoice.uploadedFile,
        bolFile: existingInvoice.bolFile,
        freightInvoiceFile: existingInvoice.freightInvoiceFile,
        amountCurrency: parsed.data.amountCurrency || existingInvoice.amountCurrency
      };

      // Update file paths if new files are uploaded
      if (files?.file?.[0]) {
        updateData.uploadedFile = files.file[0].filename;
      }
      if (files?.bolFile?.[0]) {
        updateData.bolFile = files.bolFile[0].filename;
      }
      if (files?.freightInvoiceFile?.[0]) {
        updateData.freightInvoiceFile = files.freightInvoiceFile[0].filename;
      }

      console.log('Update data to be applied:', updateData);

      // Update invoice with new data
      const updatedInvoice = await storage.updateInvoice(id, updateData);
      console.log('Updated invoice result:', updatedInvoice);

      // Handle PDF generation for manual entries
      if (!files?.file?.[0] && (parsed.data.items?.length || existingInvoice.items?.length)) {
        const pdfFileName = await generatePDFForInvoice({
          ...updateData,
          supplierId: existingInvoice.supplierId,
          items: parsed.data.items || existingInvoice.items
        });

        if (pdfFileName) {
          // Update the invoice while preserving all other files
          const finalUpdate = await storage.updateInvoice(id, {
            uploadedFile: pdfFileName,
            bolFile: updateData.bolFile,
            freightInvoiceFile: updateData.freightInvoiceFile
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
              quantity: item.quantity,
              unitPrice: item.unitPrice,
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
      res.status(500).json({ 
        message: 'Failed to update invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
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

  // Add new load management routes
  app.get("/api/loads", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const loads = await storage.getLoads();
    res.json(loads);
  });

  app.get("/api/loads/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const load = await storage.getLoad(id);
    if (!load) return res.status(404).send("Load not found");
    res.json(load);
  });

  app.post("/api/loads", upload, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const loadData = req.body;
      const files = req.files as UploadedFiles;

      console.log('Received raw body:', loadData);
      console.log('Received files:', files);

      // Parse the loadData if it's a string
      const parsedLoadData = typeof loadData === 'string' ? JSON.parse(loadData) : loadData;
      console.log('Parsed load data:', parsedLoadData);

      // Extract file names from the uploaded files
      const fileData = {
        bolFile: files?.bolFile?.[0]?.filename,
        materialInvoiceFile: files?.materialInvoiceFile?.[0]?.filename,
        freightInvoiceFile: files?.freightInvoiceFile?.[0]?.filename,
        loadPerformanceFile: files?.loadPerformanceFile?.[0]?.filename,
      };

      console.log('Extracted file data:', fileData);
      console.log('Material Invoice File details:', files?.materialInvoiceFile?.[0]);

      const dataToValidate = {
        ...parsedLoadData,
        ...fileData
      };

      console.log('Data to validate:', dataToValidate);

      const parsed = insertIncomingLoadSchema.safeParse(dataToValidate);

      if (!parsed.success) {
        console.error('Validation error:', parsed.error);
        return res.status(400).json({ message: 'Invalid load data', error: parsed.error });
      }

      console.log('Parsed data before storage:', parsed.data);

      const load = await storage.createLoad(parsed.data);
      console.log('Created load:', load);

      res.status(201).json(load);
    } catch (error) {
      console.error('Error creating load:', error);
      res.status(500).json({ message: 'Failed to create load' });
    }
  });

  app.patch("/api/loads/:id", upload, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const existingLoad = await storage.getLoad(id);

      if (!existingLoad) {
        return res.status(404).json({ message: "Load not found" });
      }

      const files = req.files as UploadedFiles;
      const fileData = {
        bolFile: files?.bolFile?.[0]?.filename || existingLoad.bolFile,
        materialInvoiceFile: files?.materialInvoiceFile?.[0]?.filename || existingLoad.materialInvoiceFile,
        freightInvoiceFile: files?.freightInvoiceFile?.[0]?.filename || existingLoad.freightInvoiceFile,
        loadPerformanceFile: files?.loadPerformanceFile?.[0]?.filename || existingLoad.loadPerformanceFile,
      };

      const location = (req.body.location === "British Columbia" || req.body.location === "Ontario")
        ? req.body.location
        : existingLoad.location;

      const updateData = {
        ...req.body,
        ...fileData,
        location,
        loadType: existingLoad.loadType,
        freightCostCurrency: req.body.freightCostCurrency,
      };

      const parsed = insertIncomingLoadSchema.partial().safeParse(updateData);

      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid load data", errors: parsed.error.errors });
      }

      const updatedLoad = await storage.updateLoad(id, parsed.data);
      res.json(updatedLoad);
    } catch (error) {
      console.error('Error updating load:', error);
      res.status(500).json({ message: "Failed to update load" });
    }
  });

  app.delete("/api/loads/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const id = parseInt(req.params.id);
    const load = await storage.getLoad(id);
    if (!load) return res.status(404).send("Load not found");

    await storage.deleteLoad(id);
    res.sendStatus(200);
  });

  // Freight invoice routes
  app.get("/api/loads/:loadId/freight-invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const loadId = parseInt(req.params.loadId);
    const freightInvoices = await storage.getLoadFreightInvoices(loadId);
    res.json(freightInvoices);
  });

  app.post("/api/loads/:loadId/freight-invoices", upload, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const loadId = parseInt(req.params.loadId);
      const freightInvoiceData = JSON.parse(req.body.freightInvoiceData);
      const files = req.files as UploadedFiles;

      const parsed = insertFreightInvoiceSchema.safeParse({
        ...freightInvoiceData,
        loadId,
        attachmentFile: files?.file?.[0]?.filename,
      });

      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const freightInvoice = await storage.createFreightInvoice(parsed.data);
      res.status(201).json(freightInvoice);
    } catch (error) {
      console.error('Error creating freight invoice:', error);
      res.status(500).json({ message: 'Failed to create freight invoice' });
    }
  });

  app.patch("/api/loads/:loadId/freight-invoices/:id", upload, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const freightInvoiceData = JSON.parse(req.body.freightInvoiceData);
      const files = req.files as UploadedFiles;

      const parsed = insertFreightInvoiceSchema.partial().safeParse({
        ...freightInvoiceData,
        attachmentFile: files?.file?.[0]?.filename,
      });

      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const freightInvoice = await storage.updateFreightInvoice(id, parsed.data);
      res.json(freightInvoice);
    } catch (error) {
      console.error('Error updating freight invoice:', error);
      res.status(500).json({ message: 'Failed to update freight invoice' });
    }
  });

  app.delete("/api/loads/:loadId/freight-invoices/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const id = parseInt(req.params.id);
    await storage.deleteFreightInvoice(id);
    res.sendStatus(200);
  });

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


  // Carrier routes
  router.get("/api/carriers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const carriers = await db.query.carriers.findMany();
    return res.json(carriers);
  });

  router.post("/api/carriers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const result = await db.insert(carriers).values(req.body);
    return res.json(result);
  });

  router.put("/api/carriers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const result = await db.update(carriers)
      .set(req.body)
      .where(eq(carriers.id, parseInt(req.params.id)));
    return res.json(result);
  });

  router.delete("/api/carriers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await db.delete(carriers).where(eq(carriers.id, parseInt(req.params.id)));
    return res.json({ success: true });
  });

  router.get("/api/carrier-loads", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const loads = await db.query.carrierLoads.findMany();
    return res.json(loads);
  });

  router.post("/api/carrier-loads", upload, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const carrierData = JSON.parse(req.body.carrierData);
      const files = req.files as UploadedFiles;

      const result = await db.insert(carrierLoads).values({
        ...carrierData,
        freightInvoice: files?.freightInvoice?.[0]?.filename || files?.freightInvoiceFile?.[0]?.filename || null,
        pod: files?.pod?.[0]?.filename || null,
      }).returning();

      return res.json(result[0]);
    } catch (error) {
      console.error('Error creating carrier load:', error);
      res.status(500).json({ message: 'Failed to create carrier load' });
    }
  });

  router.patch("/api/carrier-loads/:id", upload, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const carrierData = JSON.parse(req.body.carrierData);
      const files = req.files as UploadedFiles;

      const result = await db.update(carrierLoads)
        .set({
          ...carrierData,
          freightInvoice: files?.freightInvoice?.[0]?.filename || undefined,
          pod: files?.pod?.[0]?.filename || undefined,
        })
        .where(eq(carrierLoads.id, id))
        .returning();

      return res.json(result[0]);
    } catch (error) {
      console.error('Error updating carrier load:', error);
      res.status(500).json({ message: 'Failed to update carrier load' });
    }
  });

  router.delete("/api/carrier-loads/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await db.delete(carrierLoads).where(eq(carrierLoads.id, parseInt(req.params.id)));
    return res.json({ success: true });
  });

  app.use(router);
  const httpServer = createServer(app);
  return httpServer;
}