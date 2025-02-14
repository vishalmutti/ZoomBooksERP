import { integer, pgEnum, pgTable, serial, text, timestamp, varchar, decimal, boolean, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const carriers = pgTable("carriers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  contact_name: varchar("contact_name", { length: 255 }),
  contact_email: varchar("contact_email", { length: 255 }),
  contact_phone: varchar("contact_phone", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCarrierSchema = createInsertSchema(carriers).omit({
  id: true,
  createdAt: true,
});

// Export types
export type InsertCarrier = z.infer<typeof insertCarrierSchema>;
export type Carrier = typeof carriers.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const carrierTransactions = pgTable("carrier_transactions", {
  id: serial("id").primaryKey(),
  carrierId: integer("carrier_id").references(() => carriers.id).notNull(),
  referenceNumber: varchar("reference_number", { length: 100 }).notNull(),
  sourceType: varchar("source_type", { length: 20 }).notNull().$type<'AR' | 'LOAD'>(),
  freightCost: decimal("freight_cost", { precision: 10, scale: 2 }),
  freightInvoiceFile: text("freight_invoice_file"),
  sourceDocument: text("source_document"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supplierContacts = pgTable("supplier_contacts", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const insertSupplierContactSchema = createInsertSchema(supplierContacts).omit({
  id: true,
  createdAt: true,
  supplierId: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    contacts: z.array(insertSupplierContactSchema).optional(),
  });

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  carrier: varchar("carrier", { length: 100 }),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  freightCost: decimal("freight_cost", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default('USD').notNull(),
  freightCostCurrency: varchar("freight_cost_currency", { length: 3 }).default('USD').notNull(),
  dueDate: date("due_date").notNull(),
  isPaid: boolean("is_paid").default(false).notNull(),
  paymentDate: date("payment_date"),
  notes: text("notes"),
  uploadedFile: text("uploaded_file"),
  bolFile: text("bol_file"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
});

export const incomingLoads = pgTable("incoming_loads", {
  id: serial("id").primaryKey(),
  loadType: varchar("load_type", { length: 50 }).notNull(),
  supplierId: varchar("supplier_id", { length: 255 }).notNull(),
  referenceNumber: varchar("reference_number", { length: 50 }).notNull(),
  location: varchar("location", { length: 50 }).notNull().$type<'British Columbia' | 'Ontario'>(),
  pickupLocation: varchar("pickup_location", { length: 255 }),
  deliveryLocation: varchar("delivery_location", { length: 255 }),
  scheduledPickup: date("scheduled_pickup"),
  scheduledDelivery: date("scheduled_delivery"),
  status: varchar("status", { length: 50 }).default('Pending').notNull(),
  carrier: varchar("carrier", { length: 100 }),
  notes: text("notes"),
  loadCost: decimal("load_cost", { precision: 10, scale: 2 }).notNull(),
  freightCost: decimal("freight_cost", { precision: 10, scale: 2 }).notNull(),
  profitRoi: decimal("profit_roi", { precision: 10, scale: 2 }).notNull(),
  bolFile: text("bol_file"),
  materialInvoiceFile: text("material_invoice_file"),
  freightInvoiceFile: text("freight_invoice_file"),
  loadPerformanceFile: text("load_performance_file"),
  materialInvoiceStatus: varchar("material_invoice_status", { length: 10 }).default('UNPAID').notNull().$type<'PAID' | 'UNPAID'>(),
  freightInvoiceStatus: varchar("freight_invoice_status", { length: 10 }).default('UNPAID').notNull().$type<'PAID' | 'UNPAID'>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loadStatusHistory = pgTable("load_status_history", {
  id: serial("id").primaryKey(),
  loadId: integer("load_id").references(() => incomingLoads.id).notNull(),
  status: varchar("status", { length: 30 }).notNull(),
  notes: text("notes"),
  location: text("location"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  updatedBy: varchar("updated_by", { length: 255 }).notNull(),
});

export const loadDocuments = pgTable("load_documents", {
  id: serial("id").primaryKey(),
  loadId: integer("load_id").references(() => incomingLoads.id).notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull().$type<'BOL' | 'Invoice' | 'POD' | 'Other'>(),
  fileName: text("file_name").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  notes: text("notes"),
});

export const freight = pgTable("freight", {
  id: serial("id").primaryKey(),
  referenceNumber: varchar("reference_number", { length: 100 }).notNull(),
  carrier: varchar("carrier", { length: 255 }),
  freightCost: decimal("freight_cost", { precision: 10, scale: 2 }),
  file: text("file"),
  freightInvoice: text("freight_invoice"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const freightInvoices = pgTable("freight_invoices", {
  id: serial("id").primaryKey(),
  loadId: integer("load_id").references(() => incomingLoads.id).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  truckingCompany: varchar("trucking_company", { length: 255 }),
  attachmentFile: text("attachment_file").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [invoices.supplierId],
    references: [suppliers.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const supplierRelations = relations(suppliers, ({ many }) => ({
  contacts: many(supplierContacts),
}));

export const supplierContactsRelations = relations(supplierContacts, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierContacts.supplierId],
    references: [suppliers.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices)
  .omit({
    id: true,
    createdAt: true,
    paymentDate: true,
  })
  .extend({
    items: z.array(insertInvoiceItemSchema).optional(),
  });

export const insertPaymentSchema = createInsertSchema(payments)
  .omit({
    id: true,
  });

export const insertLoadSchema = createInsertSchema(incomingLoads)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    scheduledPickup: z.string().nullable(),
    scheduledDelivery: z.string().nullable(),
  });

export const insertIncomingLoadSchema = insertLoadSchema;

export const insertLoadStatusHistorySchema = createInsertSchema(loadStatusHistory)
  .omit({
    id: true,
  });

export const insertLoadDocumentSchema = createInsertSchema(loadDocuments)
  .omit({
    id: true,
    uploadedAt: true,
  });

export const insertFreightInvoiceSchema = createInsertSchema(freightInvoices)
  .omit({
    id: true,
    createdAt: true,
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertIncomingLoad = z.infer<typeof insertLoadSchema>;
export type IncomingLoad = typeof incomingLoads.$inferSelect;
export type LoadStatusHistory = typeof loadStatusHistory.$inferSelect;
export type LoadDocument = typeof loadDocuments.$inferSelect;
export type InsertLoadStatusHistory = z.infer<typeof insertLoadStatusHistorySchema>;
export type InsertLoadDocument = z.infer<typeof insertLoadDocumentSchema>;
export type InsertFreightInvoice = z.infer<typeof insertFreightInvoiceSchema>;
export type FreightInvoice = typeof freightInvoices.$inferSelect;
export type Freight = typeof freight.$inferSelect;

export const insertFreightSchema = createInsertSchema(freight).omit({
  id: true,
  createdAt: true,
});

export type InsertSupplierContact = z.infer<typeof insertSupplierContactSchema>;
export type SupplierContact = typeof supplierContacts.$inferSelect;