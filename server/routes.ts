
import express, { type Request, Response } from "express";
import multer from "multer";
import { storage } from "./storage";
import { generateInvoicePDF } from "./pdf-service";
import path from "path";
import { setupAuth } from "./auth";
import { and, eq, sql } from "drizzle-orm";

const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: function (_, file, cb) {
      cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
  })
});

export function registerRoutes(app: express.Application) {
  setupAuth(app);

  app.get("/api/invoices", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const invoices = await storage.getAllInvoices();
    res.json(invoices);
  });

  app.post("/api/invoices", upload.single("pdf"), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const invoiceData = JSON.parse(req.body.invoiceData);
      
      if (invoiceData.dueDate) {
        invoiceData.dueDate = new Date(invoiceData.dueDate).toISOString();
      }

      const result = await storage.db.transaction(async (tx) => {
        const invoice = await tx
          .insert(storage.invoices)
          .values(invoiceData)
          .returning();

        if (req.body.items) {
          const items = JSON.parse(req.body.items);
          if (items.length > 0) {
            await tx
              .insert(storage.invoiceItems)
              .values(
                items.map((item: any) => ({
                  ...item,
                  invoiceId: invoice[0].id,
                }))
              );
          }
        }

        return invoice[0];
      });

      if (req.file) {
        await storage.db
          .update(storage.invoices)
          .set({ pdfPath: req.file.path })
          .where(eq(storage.invoices.id, result.id));
      }

      res.status(201).json(result);
    } catch (error) {
      console.error("Invoice creation error:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  app.get("/api/invoices/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = parseInt(req.params.id);
    console.log("Fetching invoice data for:", id);
    
    try {
      const invoice = await storage.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const items = await storage.getInvoiceItems(id);
      res.json({ ...invoice, items });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.patch("/api/invoices/:id", upload.single("pdf"), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = parseInt(req.params.id);
    try {
      const invoiceData = JSON.parse(req.body.invoiceData);
      
      if (invoiceData.dueDate) {
        invoiceData.dueDate = new Date(invoiceData.dueDate).toISOString();
      }

      console.log("Invoice update error: Attempting to update invoice", id);
      
      // Always update invoice items with the provided data
      // Update invoice and items in a single transaction
      const updatedInvoice = await storage.db.transaction(async (tx) => {
        // Delete existing items
        await tx.delete(storage.invoiceItems).where(eq(storage.invoiceItems.invoiceId, id));
        
        // Update invoice
        const [invoice] = await tx
          .update(storage.invoices)
          .set(invoiceData)
          .where(eq(storage.invoices.id, id))
          .returning();

        // Insert new items if provided
        if (req.body.items) {
          const items = JSON.parse(req.body.items);
          if (items.length > 0) {
            await tx
              .insert(storage.invoiceItems)
              .values(
                items.map((item: any) => ({
                  ...item,
                  invoiceId: id,
                }))
              );
          }
        }

        return invoice;
      });

      if (req.file) {
        await storage.db
          .update(storage.invoices)
          .set({ pdfPath: req.file.path })
          .where(eq(storage.invoices.id, id));
      }

      res.json(updatedInvoice);
    } catch (error) {
      console.error("Invoice update error:", error);
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = parseInt(req.params.id);
    try {
      await storage.db.transaction(async (tx) => {
        await tx.delete(storage.invoiceItems).where(eq(storage.invoiceItems.invoiceId, id));
        await tx.delete(storage.invoices).where(eq(storage.invoices.id, id));
      });
      
      res.sendStatus(200);
    } catch (error) {
      console.error("Invoice deletion error:", error);
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });

  app.get("/api/suppliers", async (_req: Request, res: Response) => {
    const suppliers = await storage.getAllSuppliers();
    res.json(suppliers);
  });

  app.post("/api/suppliers", async (req: Request, res: Response) => {
    try {
      const result = await storage.db
        .insert(storage.suppliers)
        .values(req.body)
        .returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Supplier creation error:", error);
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  app.patch("/api/suppliers/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    try {
      const [supplier] = await storage.db
        .update(storage.suppliers)
        .set(req.body)
        .where(eq(storage.suppliers.id, id))
        .returning();
      res.json(supplier);
    } catch (error) {
      console.error("Supplier update error:", error);
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    try {
      await storage.db.delete(storage.suppliers).where(eq(storage.suppliers.id, id));
      res.sendStatus(200);
    } catch (error) {
      console.error("Supplier deletion error:", error);
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  app.get("/api/suppliers/:id/invoices", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    try {
      const invoices = await storage.db.query.invoices.findMany({
        where: eq(storage.invoices.supplierId, id),
      });
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching supplier invoices:", error);
      res.status(500).json({ error: "Failed to fetch supplier invoices" });
    }
  });

  app.get("/api/summary", async (_req: Request, res: Response) => {
    try {
      const result = await storage.db
        .select({
          total: sql<number>`cast(sum(${storage.invoices.totalAmount}) as decimal(10,2))`,
          count: sql<number>`cast(count(*) as integer)`,
          overdue: sql<number>`cast(sum(case when ${storage.invoices.dueDate} < current_date and ${storage.invoices.status} != 'paid' then ${storage.invoices.totalAmount} else 0 end) as decimal(10,2))`,
          overdueCount: sql<number>`cast(count(case when ${storage.invoices.dueDate} < current_date and ${storage.invoices.status} != 'paid' then 1 end) as integer)`,
        })
        .from(storage.invoices);

      res.json(result[0]);
    } catch (error) {
      console.error("Error fetching summary:", error);
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  });

  app.get("/api/aging", async (_req: Request, res: Response) => {
    try {
      const result = await storage.db
        .select({
          range: sql<string>`
            case
              when ${storage.invoices.dueDate} >= current_date then '0'
              when ${storage.invoices.dueDate} >= current_date - interval '30 days' then '1-30'
              when ${storage.invoices.dueDate} >= current_date - interval '60 days' then '31-60'
              when ${storage.invoices.dueDate} >= current_date - interval '90 days' then '61-90'
              else '90+'
            end
          `,
          total: sql<number>`cast(sum(${storage.invoices.totalAmount}) as decimal(10,2))`,
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(storage.invoices)
        .where(
          and(
            sql`${storage.invoices.status} != 'paid'`,
            sql`${storage.invoices.dueDate} is not null`
          )
        )
        .groupBy(sql`range`)
        .orderBy(sql`
          case range
            when '0' then 1
            when '1-30' then 2
            when '31-60' then 3
            when '61-90' then 4
            when '90+' then 5
          end
        `);

      res.json(result);
    } catch (error) {
      console.error("Error fetching aging report:", error);
      res.status(500).json({ error: "Failed to fetch aging report" });
    }
  });

  app.post("/api/invoices/:id/generate-pdf", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    try {
      const invoice = await storage.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const items = await storage.getInvoiceItems(id);
      const supplier = await storage.getSupplierById(invoice.supplierId);
      
      const pdfPath = await generateInvoicePDF({ invoice: { ...invoice, items }, supplier });
      
      await storage.db
        .update(storage.invoices)
        .set({ pdfPath })
        .where(eq(storage.invoices.id, id));

      res.json({ pdfPath });
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  return app;
}
