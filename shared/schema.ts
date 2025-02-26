import { pgTable, text, serial, integer, boolean, date, decimal, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Supplier contacts table
export const supplierContacts = pgTable("supplier_contacts", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alterSupplierContacts = sql`
  ALTER TABLE supplier_contacts 
  ADD COLUMN IF NOT EXISTS notes text;
`;

// Insert schema for supplier contacts (omitting fields managed by the DB)
export const insertSupplierContactSchema = createInsertSchema(supplierContacts).omit({
  id: true,
  createdAt: true,
  supplierId: true,
});

// Insert schema for suppliers, with optional contacts array
export const insertSupplierSchema = createInsertSchema(suppliers)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    contacts: z.array(insertSupplierContactSchema).optional(),
  });

// Invoices table  
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  carrier: varchar("carrier", { length: 100 }),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  freightCost: decimal("freight_cost", { precision: 10, scale: 2 }),
  // Renamed field: amountCurrency is now used for the invoice's total amount currency
  amountCurrency: varchar("amount_currency", { length: 3 }).default('USD').notNull(),
  freightCostCurrency: varchar("freight_cost_currency", { length: 3 }).default('USD').notNull(),
  dueDate: date("due_date").notNull(),
  isPaid: boolean("is_paid").default(false).notNull(),
  paymentDate: date("payment_date"),
  notes: text("notes"),
  uploadedFile: text("uploaded_file"),
  bolFile: text("bol_file"),
  freightInvoiceFile: text("freight_invoice_file"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoice items table
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
});

// Incoming loads table
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
  freightCostCurrency: varchar("freight_cost_currency", { length: 3 }).default('USD').notNull(),
  profitRoi: decimal("profit_roi", { precision: 10, scale: 2 }).notNull(),
  bolFile: text("bol_file"),
  materialInvoiceFile: text("material_invoice_file"),
  freightInvoiceFile: text("freight_invoice_file"),
  loadPerformanceFile: text("load_performance_file"),
  materialInvoiceStatus: varchar("material_invoice_status", { length: 10 }).default('UNPAID').notNull().$type<'PAID' | 'UNPAID'>(),
  freightInvoiceStatus: varchar("freight_invoice_status", { length: 10 }).default('UNPAID').notNull().$type<'PAID' | 'UNPAID'>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Load status history table
export const loadStatusHistory = pgTable("load_status_history", {
  id: serial("id").primaryKey(),
  loadId: integer("load_id").references(() => incomingLoads.id).notNull(),
  status: varchar("status", { length: 30 }).notNull(),
  notes: text("notes"),
  location: text("location"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  updatedBy: varchar("updated_by", { length: 255 }).notNull(),
});

// Load documents table
export const loadDocuments = pgTable("load_documents", {
  id: serial("id").primaryKey(),
  loadId: integer("load_id").references(() => incomingLoads.id).notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull().$type<'BOL' | 'Invoice' | 'POD' | 'Other'>(),
  fileName: text("file_name").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  notes: text("notes"),
});

// Freight invoices table
export const freightInvoices = pgTable("freight_invoices", {
  id: serial("id").primaryKey(),
  loadId: integer("load_id").references(() => incomingLoads.id).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  truckingCompany: varchar("trucking_company", { length: 255 }),
  attachmentFile: text("attachment_file").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations between tables
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

// Insert schemas for users, suppliers, invoices, payments, etc.
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

// Update the insertLoadSchema definition to properly handle date fields
export const insertLoadSchema = createInsertSchema(incomingLoads)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    scheduledPickup: z.string().nullable(),
    scheduledDelivery: z.string().optional().nullable(),
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

// Export types
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
export type InsertSupplierContact = z.infer<typeof insertSupplierContactSchema>;
export type SupplierContact = typeof supplierContacts.$inferSelect;

// Carrier and CarrierLoad tables
export const carriers = pgTable("carriers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const carrierLoads = pgTable("carrier_loads", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  referenceNumber: varchar("reference_number", { length: 255 }).notNull(),
  carrier: varchar("carrier", { length: 255 }).notNull(),
  freightCost: decimal("freight_cost", { precision: 10, scale: 2 }).notNull(),
  freightCostCurrency: varchar("freight_cost_currency", { length: 3 }).default('CAD').notNull(),
  freightInvoice: text("freight_invoice"),
  pod: text("pod"),
  status: varchar("status", { length: 10 }).notNull().$type<"PAID" | "UNPAID">(),
});

// Zod schemas for carriers and carrier loads
export const CarrierSchema = z.object({
  id: z.number(),
  name: z.string(),
  contactName: z.string(),
  email: z.string().email(),
  phone: z.string(),
});

export const CarrierLoadSchema = z.object({
  id: z.number(),
  date: z.string(),
  referenceNumber: z.string(),
  carrier: z.string(),
  freightCost: z.number(),
  freightInvoice: z.string().optional(),
  pod: z.string().optional(),
  status: z.enum(["PAID", "UNPAID"]),
});

export type Carrier = z.infer<typeof CarrierSchema>;
export type CarrierLoad = z.infer<typeof CarrierLoadSchema>;


// Employee Scheduling Tables
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetHours: decimal("target_hours", { precision: 10, scale: 2 }).notNull(),
  requiredStaffDay: integer("required_staff_day").default(0).notNull(),
  requiredStaffNight: integer("required_staff_night").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  position: varchar("position", { length: 100 }).notNull(),
  skills: text("skills").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employeeAvailability = pgTable("employee_availability", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 for Sunday-Saturday
  startTime: varchar("start_time", { length: 5 }).notNull(), // Format: "HH:mm"
  endTime: varchar("end_time", { length: 5 }).notNull(), // Format: "HH:mm"
  isPreferred: boolean("is_preferred").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timeOffRequests = pgTable("time_off_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  type: varchar("type", { length: 20 }).notNull().$type<'vacation' | 'sick' | 'personal'>(),
  status: varchar("status", { length: 20 }).default('pending').notNull().$type<'pending' | 'approved' | 'rejected'>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  date: date("date").notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(), // Format: "HH:mm"
  endTime: varchar("end_time", { length: 5 }).notNull(), // Format: "HH:mm"
  status: varchar("status", { length: 20 }).default('scheduled').notNull().$type<'scheduled' | 'completed' | 'cancelled'>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for scheduling tables
export const departmentRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
  shifts: many(shifts),
}));

export const employeeRelations = relations(employees, ({ one, many }) => ({
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  availability: many(employeeAvailability),
  timeOffRequests: many(timeOffRequests),
  shifts: many(shifts),
}));

// Insert schemas for scheduling tables
export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeAvailabilitySchema = createInsertSchema(employeeAvailability).omit({
  id: true,
  createdAt: true,
});

export const insertTimeOffRequestSchema = createInsertSchema(timeOffRequests).omit({
  id: true,
  createdAt: true,
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
});

// Export types for scheduling tables
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type EmployeeAvailability = typeof employeeAvailability.$inferSelect;
export type InsertEmployeeAvailability = z.infer<typeof insertEmployeeAvailabilitySchema>;

export type TimeOffRequest = typeof timeOffRequests.$inferSelect;
export type InsertTimeOffRequest = z.infer<typeof insertTimeOffRequestSchema>;

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;