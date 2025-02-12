import { pgTable, text, serial, integer, boolean, date, decimal, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('USD').notNull(),
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

export const loads = pgTable("loads", {
  id: serial("id").primaryKey(),
  loadId: varchar("load_id", { length: 50 }).notNull().unique(), // Format: TYPE-YYYYMMDD-XXX
  loadType: varchar("load_type", { length: 20}).notNull().$type<'Incoming' | 'Wholesale' | 'Miscellaneous'>(),
  status: varchar("status", { length: 30}).notNull().default('Pending').$type<
    'Pending' | 'In Transit' | 'Delivered' | 'Freight Invoice Attached' | 'Paid' | 'Completed' |
    'Order Placed' | 'Scheduled' | 'Loading' | 'Customs' | 'Port Arrival' | 'Final Delivery'
  >(),
  notes: text("notes"),

  // Common fields for all load types
  pickupLocation: text("pickup_location").notNull(),
  deliveryLocation: text("delivery_location").notNull(),
  scheduledPickup: timestamp("scheduled_pickup").notNull(),
  scheduledDelivery: timestamp("scheduled_delivery").notNull(),
  actualPickup: timestamp("actual_pickup"),
  actualDelivery: timestamp("actual_delivery"),
  carrier: varchar("carrier", { length: 255 }),
  driverName: varchar("driver_name", { length: 255 }),
  driverPhone: varchar("driver_phone", { length: 50 }),
  equipment: varchar("equipment", { length: 100 }),
  freightCost: decimal("freight_cost", { precision: 10, scale: 2 }),

  // Wholesale specific fields
  poNumber: varchar("po_number", { length: 50 }),
  orderNumber: varchar("order_number", { length: 50 }),
  brokerName: varchar("broker_name", { length: 255 }),
  brokerContact: varchar("broker_contact", { length: 255 }),

  // Incoming specific fields
  containerNumber: varchar("container_number", { length: 50 }),
  bookingNumber: varchar("booking_number", { length: 50 }),
  vesselName: varchar("vessel_name", { length: 255 }),
  voyageNumber: varchar("voyage_number", { length: 50 }),
  estimatedPortArrival: timestamp("estimated_port_arrival"),
  actualPortArrival: timestamp("actual_port_arrival"),
  customsClearanceDate: timestamp("customs_clearance_date"),

  // Miscellaneous specific fields
  referenceNumber: varchar("reference_number", { length: 50 }),
  warehouseLocation: varchar("warehouse_location", { length: 100 }),
  handlingInstructions: text("handling_instructions"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loadStatusHistory = pgTable("load_status_history", {
  id: serial("id").primaryKey(),
  loadId: integer("load_id").references(() => loads.id).notNull(),
  status: varchar("status", { length: 30 }).notNull(),
  notes: text("notes"),
  location: text("location"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  updatedBy: varchar("updated_by", { length: 255 }).notNull(),
});

export const loadDocuments = pgTable("load_documents", {
  id: serial("id").primaryKey(),
  loadId: integer("load_id").references(() => loads.id).notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull().$type<'BOL' | 'Invoice' | 'POD' | 'Other'>(),
  fileName: text("file_name").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  notes: text("notes"),
});

export const freightInvoices = pgTable("freight_invoices", {
  id: serial("id").primaryKey(),
  loadId: integer("load_id").references(() => loads.id).notNull(),
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

export const loadsRelations = relations(loads, ({ many }) => ({
  statusHistory: many(loadStatusHistory),
  freightInvoices: many(freightInvoices),
  documents: many(loadDocuments),
}));

export const loadStatusHistoryRelations = relations(loadStatusHistory, ({ one }) => ({
  load: one(loads, {
    fields: [loadStatusHistory.loadId],
    references: [loads.id],
  }),
}));

export const loadDocumentsRelations = relations(loadDocuments, ({ one }) => ({
  load: one(loads, {
    fields: [loadDocuments.loadId],
    references: [loads.id],
  }),
}));

export const freightInvoicesRelations = relations(freightInvoices, ({ one }) => ({
  load: one(loads, {
    fields: [freightInvoices.loadId],
    references: [loads.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
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

export const insertLoadSchema = createInsertSchema(loads)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    scheduledPickup: z.coerce.date(),
    scheduledDelivery: z.coerce.date(),
    actualPickup: z.coerce.date().optional().nullable(),
    actualDelivery: z.coerce.date().optional().nullable(),
    estimatedPortArrival: z.coerce.date().optional().nullable(),
    actualPortArrival: z.coerce.date().optional().nullable(),
    customsClearanceDate: z.coerce.date().optional().nullable(),
    freightCost: z.string().optional().nullable(),

    // Make fields optional based on load type
    poNumber: z.string().optional().nullable(),
    orderNumber: z.string().optional().nullable(),
    brokerName: z.string().optional().nullable(),
    brokerContact: z.string().optional().nullable(),
    containerNumber: z.string().optional().nullable(),
    bookingNumber: z.string().optional().nullable(),
    vesselName: z.string().optional().nullable(),
    voyageNumber: z.string().optional().nullable(),
    referenceNumber: z.string().optional().nullable(),
    warehouseLocation: z.string().optional().nullable(),
    handlingInstructions: z.string().optional().nullable(),
  });

export const insertLoadStatusHistorySchema = createInsertSchema(loadStatusHistory)
  .omit({
    id: true,
  });

export const insertLoadDocumentSchema = createInsertSchema(loadDocuments)
  .omit({
    id: true,
    uploadedAt: true,
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

export type InsertLoad = z.infer<typeof insertLoadSchema>;
export type Load = typeof loads.$inferSelect;
export type LoadStatusHistory = typeof loadStatusHistory.$inferSelect;
export type LoadDocument = typeof loadDocuments.$inferSelect;
export type InsertLoadStatusHistory = z.infer<typeof insertLoadStatusHistorySchema>;
export type InsertLoadDocument = z.infer<typeof insertLoadDocumentSchema>;
export type InsertFreightInvoice = z.infer<typeof insertFreightInvoiceSchema>;
export type FreightInvoice = typeof freightInvoices.$inferSelect;

export const insertFreightInvoiceSchema = createInsertSchema(freightInvoices)
  .omit({
    id: true,
    createdAt: true,
  });