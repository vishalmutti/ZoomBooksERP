import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertInvoiceSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });

  app.post("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const parsed = insertInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const invoice = await storage.createInvoice(parsed.data);
    res.status(201).json(invoice);
  });

  app.patch("/api/invoices/:id/mark-paid", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = parseInt(req.params.id);
    const invoice = await storage.getInvoice(id);
    if (!invoice) return res.status(404).send("Invoice not found");

    const updatedInvoice = await storage.updateInvoice(id, {
      isPaid: true,
      paymentDate: new Date(),
    });
    
    res.json(updatedInvoice);
  });

  const httpServer = createServer(app);
  return httpServer;
}
